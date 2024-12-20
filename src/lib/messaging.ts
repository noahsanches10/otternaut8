import { supabase } from './supabase';
import { sendEmail } from './emailService';
import type { Message } from '../types/supabase';

interface SendMessageParams {
  contactId: string;
  contactType: 'lead' | 'customer';
  channel: 'email' | 'sms';
  content: string;
  subject?: string;
}

export async function sendMessage({ contactId, contactType, channel, content, subject }: SendMessageParams): Promise<Message> {
  let messageRecord: Message | null = null;

  try {
    // First create the message record
    const { data: message, error: dbError } = await supabase
      .from('messages').insert({
        user_id: (await supabase.auth.getSession()).data.session?.user.id,
        contact_id: contactId,
        contact_type: contactType,
        direction: 'outbound',
        channel,
        content,
        subject: subject || undefined,
        status: 'pending',
        metadata: {}
      })
      .select()
      .single();

    if (dbError) throw dbError;
    messageRecord = message;

    // Get the integration credentials
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('provider', channel === 'email' ? 'resend' : 'twilio')
      .eq('enabled', true)
      .single();

    if (integrationError) throw integrationError;
    if (!integrations) {
      throw new Error(`No enabled ${channel === 'email' ? 'Resend' : 'Twilio'} integration found`);
    }

    // Get the contact's details
    const { data: contact, error: contactError } = await supabase
      .from(contactType === 'lead' ? 'leads' : 'customers')
      .select('email, phone')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    // Send the message through the appropriate channel
    if (channel === 'sms') {
      const { accountSid, authToken, phoneNumber: fromNumber } = integrations.credentials;
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: contact.phone,
            Body: content,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      // Update message status
      await supabase
        .from('messages')
        .update({ status: 'sent' })
        .eq('id', message.id);

      return { ...message, status: 'sent' };
    } else {
      if (!contact.email) {
        throw new Error('Contact has no email address');
      }
      
      // Send email using the email service
      const emailResult = await sendEmail({
        to: contact.email || '',
        subject: subject || 'New message from Otternaut',
        html: content,
        fromEmail: integrations.credentials.fromEmail
      });

      if (!emailResult) {
        throw new Error('No response from email service');
      }

      // Update message status
      await supabase
        .from('messages')
        .update({ status: 'sent' })
        .eq('id', message.id);

      return { ...message, status: 'sent' };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while sending the message';
    
    // Update message status to failed
    if (messageRecord?.id) {
      await supabase
        .from('messages')
        .update({
          status: 'failed',
          metadata: { error: errorMessage }
        })
        .eq('id', messageRecord.id);
    }
    
    throw new Error(errorMessage);
  }
}
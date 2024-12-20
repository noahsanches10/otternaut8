import { supabase } from './supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  fromEmail?: string;
}

export async function sendEmail({ to, subject, html, fromEmail }: SendEmailParams) {
  try {
    console.log('Starting email send process...');

    // Get Resend credentials
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('provider', 'resend')
      .eq('enabled', true)
      .single();

    if (integrationError) {
      console.error('Failed to fetch Resend integration:', integrationError);
      throw new Error('Failed to fetch Resend integration settings');
    }

    if (!integration) {
      throw new Error('No enabled Resend integration found. Please configure Resend in Integrations.');
    }

    const { apiKey, fromEmail: defaultFromEmail } = integration.credentials;

    if (!apiKey) {
      throw new Error('Resend API key is missing. Please check your integration settings.');
    }

    if (!defaultFromEmail) {
      throw new Error('Default from email is missing. Please check your integration settings.');
    }

    const fromAddress = fromEmail || defaultFromEmail;

    console.log('Sending email via Resend API...', {
      from: fromAddress,
      to,
      subject,
      contentLength: html?.length || 0
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject,
        html
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error response:', data);
      throw new Error(data?.error?.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return data;

  } catch (error) {
    console.error('Email service error:', error);
    throw new Error(
      error instanceof Error 
        ? `Email sending failed: ${error.message}`
        : 'An unexpected error occurred while sending email'
    );
  }
}
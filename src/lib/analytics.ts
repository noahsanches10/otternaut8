import { supabase } from './supabase';

type MetricType = 'new_leads' | 'new_customers' | 'conversion_rate' | 'total_revenue' | 'recurring_revenue' | 'leads_by_source' | 'customers_by_type' | 'customers_by_frequency';

export type DateRange = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_12_months'
  | 'all_time'
  | 'custom';

export async function fetchMetric(
  type: MetricType,
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    if (type === 'conversion_rate') {
      return fetchConversionRate(userId, range, customRange);
    } else if (type === 'total_revenue') {
      return fetchTotalRevenue(userId, range, customRange);
    } else if (type === 'recurring_revenue') {
      return fetchRecurringRevenue(userId, range, customRange);
    } else if (type === 'leads_by_source') {
      return fetchLeadsBySource(userId, range, customRange);
    } else if (type === 'customers_by_type') {
      return fetchCustomersByType(userId, range, customRange);
    } else if (type === 'customers_by_frequency') {
      return fetchCustomersByFrequency(userId, range, customRange);
    }

    const table = type === 'new_leads' ? 'leads' : 'customers';
    
    let query = supabase
      .from(table)
      .select('created_at', { count: 'exact' })
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching new leads metric:', error);
    throw error;
  }
}

async function fetchConversionRate(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let leadsQuery = supabase
      .from('leads')
      .select('created_at', { count: 'exact' })
      .eq('user_id', userId);

    let customersQuery = supabase
      .from('customers')
      .select('created_at', { count: 'exact' })
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        const todayStart = new Date().toISOString().split('T')[0];
        const todayEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
        customersQuery = customersQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
        break;

      case 'yesterday':
        const yesterdayStart = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const yesterdayEnd = new Date().toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', yesterdayStart).lt('created_at', yesterdayEnd);
        customersQuery = customersQuery.gte('created_at', yesterdayStart).lt('created_at', yesterdayEnd);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];
        const thisWeekEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', thisWeekStartStr).lt('created_at', thisWeekEnd);
        customersQuery = customersQuery.gte('created_at', thisWeekStartStr).lt('created_at', thisWeekEnd);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        leadsQuery = leadsQuery.gte('created_at', lastWeekStart.toISOString().split('T')[0]).lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        customersQuery = customersQuery.gte('created_at', lastWeekStart.toISOString().split('T')[0]).lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const thirtyDaysEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', thirtyDaysAgo).lt('created_at', thirtyDaysEnd);
        customersQuery = customersQuery.gte('created_at', thirtyDaysAgo).lt('created_at', thirtyDaysEnd);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        const thisMonthEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', thisMonthStart.toISOString().split('T')[0]).lt('created_at', thisMonthEnd);
        customersQuery = customersQuery.gte('created_at', thisMonthStart.toISOString().split('T')[0]).lt('created_at', thisMonthEnd);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        leadsQuery = leadsQuery.gte('created_at', lastMonthStart.toISOString().split('T')[0]).lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        customersQuery = customersQuery.gte('created_at', lastMonthStart.toISOString().split('T')[0]).lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        const thisYearEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', thisYearStart.toISOString().split('T')[0]).lt('created_at', thisYearEnd);
        customersQuery = customersQuery.gte('created_at', thisYearStart.toISOString().split('T')[0]).lt('created_at', thisYearEnd);
        break;

      case 'last_12_months':
        const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
        const yearEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        leadsQuery = leadsQuery.gte('created_at', yearAgo).lt('created_at', yearEnd);
        customersQuery = customersQuery.gte('created_at', yearAgo).lt('created_at', yearEnd);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          const customEnd = new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0];
          leadsQuery = leadsQuery.gte('created_at', customRange.start).lt('created_at', customEnd);
          customersQuery = customersQuery.gte('created_at', customRange.start).lt('created_at', customEnd);
        }
        break;
    }

    const [{ count: leadsCount }, { count: customersCount }] = await Promise.all([
      leadsQuery,
      customersQuery
    ]);

    if (!leadsCount) return 0;
    return Number(((customersCount || 0) * 100 / leadsCount).toFixed(1));
  } catch (error) {
    console.error('Error fetching conversion rate:', error);
    throw error;
  }
}

async function fetchTotalRevenue(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let query = supabase
      .from('customers')
      .select('line_items, created_at')
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate total revenue from line items
    const totalRevenue = data?.reduce((sum, customer) => {
      const lineItems = customer.line_items || [];
      const customerTotal = lineItems.reduce((total, item) => total + (item.price || 0), 0);
      return sum + customerTotal;
    }, 0) || 0;

    return totalRevenue;
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    throw error;
  }
}

async function fetchRecurringRevenue(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let query = supabase
      .from('customers')
      .select('sale_value, created_at')
      .eq('user_id', userId)
      .neq('service_frequency', 'One-Time');

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate total recurring revenue
    const totalRecurringRevenue = data?.reduce((sum, customer) => sum + (customer.sale_value || 0), 0) || 0;

    return totalRecurringRevenue;
  } catch (error) {
    console.error('Error fetching recurring revenue:', error);
    throw error;
  }
}

async function fetchLeadsBySource(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let query = supabase
      .from('leads')
      .select('lead_source')
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process the data to get counts and percentages
    const sourceCounts = data.reduce((acc, { lead_source }) => {
      acc[lead_source] = (acc[lead_source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);

    const results = Object.entries(sourceCounts).map(([source, count]) => ({
      lead_source: source,
      lead_count: count,
      percentage: Number(((count / total) * 100).toFixed(2))
    })).sort((a, b) => b.lead_count - a.lead_count);

    return results;
  } catch (error) {
    console.error('Error fetching leads by source:', error);
    throw error;
  }
}

async function fetchCustomersByType(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let query = supabase
      .from('customers')
      .select('service_type')
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process the data to get counts and percentages
    const typeCounts = data.reduce((acc, { service_type }) => {
      acc[service_type] = (acc[service_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);

    const results = Object.entries(typeCounts).map(([type, count]) => ({
      service_type: type,
      customer_count: count,
      percentage: Number(((count / total) * 100).toFixed(2))
    })).sort((a, b) => b.customer_count - a.customer_count);

    return results;
  } catch (error) {
    console.error('Error fetching customers by type:', error);
    throw error;
  }
}

async function fetchCustomersByFrequency(
  userId: string,
  range: DateRange,
  customRange?: { start: string; end: string }
) {
  try {
    let query = supabase
      .from('customers')
      .select('service_frequency')
      .eq('user_id', userId);

    switch (range) {
      case 'today':
        query = query
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'yesterday':
        query = query
          .gte('created_at', new Date(Date.now() - 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]);
        break;

      case 'this_week':
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        query = query
          .gte('created_at', thisWeekStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        query = query
          .gte('created_at', lastWeekStart.toISOString().split('T')[0])
          .lt('created_at', lastWeekEnd.toISOString().split('T')[0]);
        break;

      case 'last_30_days':
        query = query
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'this_month':
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        query = query
          .gte('created_at', thisMonthStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_month':
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(1);
        query = query
          .gte('created_at', lastMonthStart.toISOString().split('T')[0])
          .lt('created_at', lastMonthEnd.toISOString().split('T')[0]);
        break;

      case 'this_year':
        const thisYearStart = new Date();
        thisYearStart.setMonth(0, 1);
        query = query
          .gte('created_at', thisYearStart.toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'last_12_months':
        query = query
          .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        break;

      case 'custom':
        if (customRange?.start && customRange?.end) {
          query = query
            .gte('created_at', customRange.start)
            .lt('created_at', new Date(new Date(customRange.end).getTime() + 86400000).toISOString().split('T')[0]);
        }
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process the data to get counts and percentages
    const frequencyCounts = data.reduce((acc, { service_frequency }) => {
      acc[service_frequency] = (acc[service_frequency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(frequencyCounts).reduce((sum, count) => sum + count, 0);

    const results = Object.entries(frequencyCounts).map(([frequency, count]) => ({
      service_frequency: frequency,
      customer_count: count,
      percentage: Number(((count / total) * 100).toFixed(2))
    })).sort((a, b) => b.customer_count - a.customer_count);

    return results;
  } catch (error) {
    console.error('Error fetching customers by frequency:', error);
    throw error;
  }
}
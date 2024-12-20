import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils';
import { fetchMetric, type DateRange } from '../../../lib/analytics';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../ui/toast';
import type { Metric } from '../../../types/analytics';

export const DATE_RANGES = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  last_30_days: 'Last 30 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  last_12_months: 'Last 12 Months',
  all_time: 'All Time',
  custom: 'Custom Range'
} as const;

interface MetricReportProps {
  metrics: Metric[];
  reportType: string;
  selectedRange: keyof typeof DATE_RANGES;
  shouldRun: boolean;
  onMetricRun: () => void;
  onRefresh: () => void;
}

export function MetricReport({ 
  metrics, 
  reportType, 
  selectedRange,
  customRange,
  shouldRun,
  onMetricRun,
  onRefresh 
}: MetricReportProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);
  const [sourceData, setSourceData] = useState<LeadSourceMetric[] | CustomerTypeMetric[] | CustomerFrequencyMetric[]>([]);

  useEffect(() => {
    if (shouldRun && session?.user?.id) {
      onMetricRun();
      fetchData();
    }
  }, [shouldRun]);

  const percentageChange = previousCount
    ? ((currentCount - previousCount) / previousCount) * 100
    : 0;

  async function fetchData() {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setSourceData([]);

    try {
      const count = await fetchMetric(
        reportType,
        session.user.id,
        selectedRange as DateRange,
        selectedRange === 'custom' ? customRange : undefined
      );
      
      let previousCount = 0;
      if (selectedRange !== 'all_time') {
        const prevCustomRange = getPreviousPeriodRange(selectedRange, customRange);
        previousCount = await fetchMetric(
          reportType,
          session.user.id,
          'custom',
          prevCustomRange
        );
      }

      if (reportType === 'leads_by_source' && Array.isArray(count)) {
        setSourceData(count);
        setCurrentCount(count.reduce((sum, item) => sum + item.lead_count, 0));
        return;
      }

      if (reportType === 'customers_by_type' && Array.isArray(count)) {
        setSourceData(count);
        setCurrentCount(count.reduce((sum, item) => sum + item.customer_count, 0));
        return;
      }

      if (reportType === 'customers_by_frequency' && Array.isArray(count)) {
        setSourceData(count);
        setCurrentCount(count.reduce((sum, item) => sum + item.customer_count, 0));
        return;
      }

      setCurrentCount(count);
      setPreviousCount(previousCount);
    } catch (error) {
      toast.error('Failed to fetch leads data');
    } finally {
      setIsLoading(false);
    }
  }

  function getPreviousPeriodRange(range: string, customRange?: { start: string; end: string }) {
    const now = new Date();
    let start: Date, end: Date;

    switch (range) {
      case 'today':
        start = new Date(now.getTime() - 86400000);
        end = now;
        break;
      case 'this_week':
        start = new Date(now.getTime() - 7 * 86400000);
        end = new Date(now.getTime());
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'custom':
        if (customRange?.start && customRange?.end) {
          const duration = new Date(customRange.end).getTime() - new Date(customRange.start).getTime();
          end = new Date(customRange.start);
          start = new Date(end.getTime() - duration);
        } else {
          start = new Date(now.getTime() - 30 * 86400000);
          end = now;
        }
        break;
      default:
        start = new Date(now.getTime() - 30 * 86400000);
        end = now;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
  
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {isLoading ? '...' : reportType === 'conversion_rate' 
              ? `${currentCount}%` 
              : (reportType === 'total_revenue' || reportType === 'recurring_revenue')
              ? `$${currentCount.toLocaleString()}`
              : currentCount.toLocaleString()
            }
          </h2>
          <p className="text-sm text-muted-foreground">
            {reportType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {percentageChange !== 0 && (
          <div className={cn(
            "flex items-center text-sm font-medium rounded-full px-2 py-1",
            percentageChange > 0
              ? "text-emerald-500 bg-emerald-500/10"
              : percentageChange < 0
              ? "text-red-500 bg-red-500/10"
              : "text-gray-500 bg-gray-500/10"
          )}>
            {percentageChange > 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : percentageChange < 0 ? (
              <TrendingDown className="w-4 h-4 mr-1" />
            ) : (
              <Minus className="w-4 h-4 mr-1" />
            )}
            {Math.abs(percentageChange).toFixed(1)}%
          </div>
        )}
      </div>
      
      {(reportType === 'leads_by_source' || reportType === 'customers_by_type') && sourceData.length > 0 && (
        <div className="mt-6 space-y-4">
          {sourceData.map(item => {
            let label: string;
            let count: number;
            let type: string;
            
            if ('lead_source' in item) {
              label = item.lead_source;
              count = item.lead_count;
              type = 'leads';
            } else if ('service_type' in item) {
              label = item.service_type;
              count = item.customer_count;
              type = 'customers';
            } else {
              label = item.service_frequency;
              count = item.customer_count;
              type = 'customers';
            }
            
            return (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                  <span className="text-sm">{label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {count} {type}
                  </span>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart will be added here in future updates */}
    </div>
  );
}
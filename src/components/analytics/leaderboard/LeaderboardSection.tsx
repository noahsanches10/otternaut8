import React from 'react';
import { Trophy, Medal, Target } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Metric } from '../../../types/analytics';

interface LeaderboardSectionProps {
  metrics: Metric[];
}

export function LeaderboardSection({ metrics }: LeaderboardSectionProps) {
  const getHighestValue = (type: string) => {
    const typeMetrics = metrics.filter(m => m.type === type);
    return Math.max(...typeMetrics.map(m => m.value), 0);
  };

  const getCurrentValue = (type: string) => {
    const typeMetrics = metrics.filter(m => m.type === type);
    return typeMetrics.length > 0 ? typeMetrics[0].value : 0;
  };

  const achievements = [
    {
      title: 'Highest Monthly Revenue',
      current: getCurrentValue('total_revenue'),
      best: getHighestValue('total_revenue'),
      icon: Trophy,
      format: (val: number) => `$${val.toLocaleString()}`
    },
    {
      title: 'Most Leads Added',
      current: getCurrentValue('total_leads'),
      best: getHighestValue('total_leads'),
      icon: Target,
      format: (val: number) => val.toString()
    },
    {
      title: 'Best Conversion Rate',
      current: getCurrentValue('conversion_rate'),
      best: getHighestValue('conversion_rate'),
      icon: Medal,
      format: (val: number) => `${val}%`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => (
          <div
            key={achievement.title}
            className={cn(
              "bg-card rounded-lg border border-border p-6",
              "transition-all duration-200 hover:shadow-lg"
            )}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <achievement.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">{achievement.title}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Current</div>
                <div className="text-2xl font-bold">
                  {achievement.format(achievement.current)}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Personal Best</div>
                <div className="text-2xl font-bold text-primary">
                  {achievement.format(achievement.best)}
                </div>
              </div>

              {achievement.current >= achievement.best && (
                <div className="flex items-center text-sm text-emerald-500">
                  <Trophy className="w-4 h-4 mr-1" />
                  New Record!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
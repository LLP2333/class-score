'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: string;
  value: number | string;
  label: string;
  color?: 'purple' | 'orange' | 'green' | 'blue';
}

const colorMap = {
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
};

export function StatsCard({ icon, value, label, color = 'purple' }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl', colorMap[color])}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

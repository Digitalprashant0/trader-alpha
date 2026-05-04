import React from 'react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';

interface MetricCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  loading?: boolean;
}

export function MetricCard({ 
  label, 
  value, 
  subLabel, 
  isCurrency = true, 
  trend, 
  className,
  loading = false
}: MetricCardProps) {
  const isPositive = trend === 'up' || (typeof value === 'number' && value > 0);
  const isNegative = trend === 'down' || (typeof value === 'number' && value < 0);

  return (
    <div className={cn("metric-card group", className)}>
      <p className="label-mono mb-2">{label}</p>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-border-subtle animate-pulse rounded w-3/4"></div>
          <div className="h-4 bg-border-subtle animate-pulse rounded w-1/2"></div>
        </div>
      ) : (
        <>
          <p className={cn(
            "value-large truncate",
            isPositive && "text-accent-green",
            isNegative && "text-accent-red"
          )}>
            {isCurrency && typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {subLabel && (
            <p className="text-[11px] text-text-muted mt-2 font-mono truncate">
              {subLabel}
            </p>
          )}
        </>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 bg-accent-gold/30 rounded-full"></div>
      </div>
    </div>
  );
}

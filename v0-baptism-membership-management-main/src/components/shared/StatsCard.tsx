import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  color = '#3B82F6',
  trend,
  onClick,
}: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-6 border-l-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
      </div>
    </div>
  );
}

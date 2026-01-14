'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  yoy?: number;
  yoyType?: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
}

export function KPICard({
  title,
  value,
  unit = '억원',
  yoy,
  yoyType = 'neutral',
  highlight = false,
}: KPICardProps) {
  const getYoyColor = () => {
    if (!yoy || yoy === 0) return 'text-gray-500';
    if (yoyType === 'positive') return yoy > 0 ? 'text-emerald-600' : 'text-red-600';
    if (yoyType === 'negative') return yoy < 0 ? 'text-emerald-600' : 'text-red-600';
    return yoy > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const TrendIcon = () => {
    if (!yoy || yoy === 0) return <Minus size={14} />;
    return yoy > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  const formatValue = () => {
    if (typeof value === 'string') return value;
    return value.toLocaleString('ko-KR');
  };

  return (
    <Card className={`${highlight ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-gray-500 mb-1 truncate">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${highlight ? 'text-blue-700' : 'text-slate-800'}`}>
            {formatValue()}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {yoy !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${getYoyColor()}`}>
            <TrendIcon />
            <span>{yoy > 0 ? '+' : ''}{yoy.toFixed(1)}% YoY</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

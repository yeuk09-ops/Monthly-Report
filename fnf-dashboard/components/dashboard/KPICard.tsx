'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  yoy: number;
  yoyType?: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
}

export function KPICard({
  title,
  value,
  unit = '억',
  yoy,
  yoyType = 'positive',
  highlight = false,
}: KPICardProps) {
  // YoY 색상 결정
  const getYoyColor = () => {
    if (yoy === 0) return 'text-gray-500';
    if (yoyType === 'positive') {
      return yoy > 0 ? 'text-emerald-600' : 'text-red-500';
    } else if (yoyType === 'negative') {
      return yoy > 0 ? 'text-red-500' : 'text-emerald-600';
    }
    return 'text-gray-500';
  };

  const YoyIcon = yoy > 0 ? TrendingUp : yoy < 0 ? TrendingDown : Minus;

  return (
    <div
      className={`
        bg-white rounded-xl p-5 shadow-sm border-l-4
        hover:shadow-md transition-shadow
        ${highlight
          ? 'border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50'
          : 'border-l-[#2a5298]'
        }
      `}
    >
      <div className="text-slate-600 text-xs font-medium mb-2">{title}</div>
      <div className="text-2xl font-bold text-slate-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${getYoyColor()}`}>
        <YoyIcon className="w-3 h-3" />
        <span>YoY {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}%</span>
      </div>
    </div>
  );
}

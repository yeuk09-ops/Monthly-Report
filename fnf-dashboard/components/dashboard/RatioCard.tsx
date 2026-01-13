'use client';

interface RatioCardProps {
  label: string;
  value: number;
  previousValue: number;
  format?: 'percent' | 'times' | 'days';
  positiveGood?: boolean;
}

export function RatioCard({
  label,
  value,
  previousValue,
  format = 'percent',
  positiveGood = true,
}: RatioCardProps) {
  const change = value - previousValue;
  const isImproved = positiveGood ? change > 0 : change < 0;

  const formatValue = (v: number) => {
    switch (format) {
      case 'percent':
        return `${v.toFixed(1)}%`;
      case 'times':
        return `${v.toFixed(1)}회`;
      case 'days':
        return `${Math.round(v)}일`;
      default:
        return v.toFixed(1);
    }
  };

  const formatChange = (c: number) => {
    const sign = c > 0 ? '+' : '';
    switch (format) {
      case 'percent':
        return `${sign}${c.toFixed(1)}%p`;
      case 'times':
        return `${sign}${c.toFixed(1)}회`;
      case 'days':
        return `${sign}${Math.round(c)}일`;
      default:
        return `${sign}${c.toFixed(1)}`;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="text-slate-500 text-xs mb-2">{label}</div>
      <div className={`text-xl font-bold ${isImproved ? 'text-emerald-600' : 'text-red-500'}`}>
        {formatValue(value)}
      </div>
      <div className="text-xs text-slate-400 mt-1">
        전년 {formatValue(previousValue)} → {formatChange(change)}
      </div>
    </div>
  );
}

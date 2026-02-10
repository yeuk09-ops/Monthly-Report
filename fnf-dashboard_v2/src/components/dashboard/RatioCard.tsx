'use client';

interface RatioCardProps {
  label: string;
  value: number;
  previousValue?: number;
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
  const formatValue = (val: number) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '-';
    }
    switch (format) {
      case 'times':
        return `${val.toFixed(1)}회`;
      case 'days':
        return `${Math.round(val)}일`;
      default:
        return `${val.toFixed(1)}%`;
    }
  };

  const getChangeColor = () => {
    if (previousValue === undefined) return '';
    const diff = value - previousValue;
    if (Math.abs(diff) < 0.1) return 'text-slate-500';
    if (positiveGood) {
      return diff > 0 ? 'text-emerald-500' : 'text-red-500';
    }
    return diff < 0 ? 'text-emerald-500' : 'text-red-500';
  };

  const diff = previousValue !== undefined ? value - previousValue : 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-800">{formatValue(value)}</p>
      {previousValue !== undefined && (
        <p className={`text-xs mt-1 font-medium ${getChangeColor()}`}>
          전년 {formatValue(previousValue)} → {diff > 0 ? '+' : ''}{format === 'days' ? Math.round(diff) : diff.toFixed(1)}
          {format === 'percent' ? '%p' : format === 'days' ? '일' : '회'}
        </p>
      )}
    </div>
  );
}

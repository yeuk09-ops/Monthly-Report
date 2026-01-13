'use client';

interface InsightCardProps {
  type: 'positive' | 'warning';
  title: string;
  items: string[];
}

export function InsightCard({ type, title, items }: InsightCardProps) {
  const isPositive = type === 'positive';

  return (
    <div
      className={`
        p-4 rounded-lg text-sm
        ${isPositive
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-orange-50 text-orange-800'
        }
      `}
    >
      <div className="font-semibold mb-2">
        {isPositive ? '✔' : '⚠️'} {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span>•</span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface InsightCardProps {
  type: 'positive' | 'warning';
  title: string;
  items: string[];
}

export function InsightCard({ type, title, items }: InsightCardProps) {
  const isPositive = type === 'positive';

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
      <div className={`h-1 ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <CardHeader className="pb-2 pt-4">
        <CardTitle className={`flex items-center gap-2 text-base font-semibold ${isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
          {isPositive ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-2.5">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-sm text-slate-600 leading-relaxed flex items-start gap-2"
            >
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPositive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReport } from '@/components/providers/ReportContext';

const navItems = [
  { href: '/', label: '경영요약' },
  { href: '/balance-sheet', label: '재무상태표' },
  { href: '/income-statement', label: '손익계산서' },
];

export function Header() {
  const pathname = usePathname();
  const { currentMonth, setCurrentMonth, availableMonths, reportData } = useReport();

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setCurrentMonth(year, month);
  };

  const currentValue = currentMonth
    ? `${currentMonth.year}-${currentMonth.month}`
    : '';

  const displayTitle = reportData?.meta
    ? `${reportData.meta.year % 100}년 ${reportData.meta.month}월 경영실적 대시보드`
    : '경영실적 대시보드';

  const lastUpdate = reportData?.meta?.updatedAt
    ? new Date(reportData.meta.updatedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-blue-800 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Navigation */}
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold">{displayTitle}</h1>
              {lastUpdate && (
                <p className="text-sm text-slate-300">
                  (최근 데이터 업데이트: {lastUpdate})
                </p>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Month Selector and Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">조회 기준:</span>
              <Select value={currentValue} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px] bg-white text-slate-800 border-0">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((m) => (
                    <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors">
              <LogOut size={16} />
              logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 mt-4 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === item.href
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

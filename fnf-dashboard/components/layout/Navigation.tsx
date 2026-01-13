'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: '경영요약', href: '/', icon: '📊' },
  { name: '재무상태표', href: '/balance-sheet', icon: '📋' },
  { name: '손익계산서(CO)', href: '/income-statement', icon: '📈' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-6 py-4 text-white text-sm font-medium
                  transition-all relative flex-1 text-center
                  hover:bg-white/10
                  ${isActive ? 'bg-white/25' : ''}
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// 숫자/날짜 포맷터 유틸리티

// 억원 단위 포맷 (예: 15210 -> "1.52조" or "15,210억")
export function formatBillion(value: number, useTrillionUnit = true): string {
  if (useTrillionUnit && Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(2)}조`;
  }
  return `${value.toLocaleString()}억`;
}

// 퍼센트 포맷 (예: 0.294 -> "29.4%")
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// 퍼센트 포인트 포맷 (예: 0.033 -> "+3.3%p")
export function formatPercentPoint(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%p`;
}

// 증감률 포맷 (예: 0.121 -> "+12.1%")
export function formatGrowthRate(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

// 증감액 포맷 (예: 1838 -> "+1,838억")
export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toLocaleString()}억`;
}

// 월수 환산 포맷 (예: 1.9 -> "1.9개월")
export function formatMonths(value: number): string {
  return `${value.toFixed(1)}개월`;
}

// 회전율 포맷 (예: 6.0 -> "6.0회")
export function formatTurnover(value: number): string {
  return `${value.toFixed(1)}회`;
}

// 일수 포맷 (예: 99 -> "99일")
export function formatDays(value: number): string {
  return `${Math.round(value)}일`;
}

// 날짜 포맷 (YYYY-MM -> "2025년 12월")
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}년 ${parseInt(month)}월`;
}

// 연도 포맷 (2025 -> "25년")
export function formatShortYear(year: number | string): string {
  const yearStr = year.toString();
  return `${yearStr.slice(-2)}년`;
}

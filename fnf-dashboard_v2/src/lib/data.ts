import { DataIndex, MonthlyReportData } from '@/types/financial';

// 사용 가능한 월 목록 가져오기
export async function getAvailableMonths(): Promise<DataIndex> {
  const index = await import('@/data/index.json');
  return index.default as DataIndex;
}

// 특정 월의 데이터 가져오기
export async function getMonthlyData(year: number, month: number): Promise<MonthlyReportData | null> {
  try {
    const fileName = `${year}-${month.toString().padStart(2, '0')}`;
    const data = await import(`@/data/${fileName}.json`);
    return data.default as MonthlyReportData;
  } catch (error) {
    console.error(`Failed to load data for ${year}-${month}:`, error);
    return null;
  }
}

// 기본 월 데이터 가져오기
export async function getDefaultMonthData(): Promise<MonthlyReportData | null> {
  const index = await getAvailableMonths();
  const { year, month } = index.defaultMonth;
  return getMonthlyData(year, month);
}

// 숫자 포맷팅 유틸리티
export function formatNumber(num: number): string {
  if (num < 0) return `△${Math.abs(num).toLocaleString('ko-KR')}`;
  return num.toLocaleString('ko-KR');
}

export function formatPercent(num: number): string {
  return num.toFixed(1);
}

// 성장률 계산
export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// 색상 클래스 반환
export function getChangeColor(change: number, isNegativeGood: boolean = false): string {
  if (change === 0) return 'text-gray-600';
  if (isNegativeGood) {
    return change < 0 ? 'text-emerald-600' : 'text-red-600';
  }
  return change > 0 ? 'text-emerald-600' : 'text-red-600';
}

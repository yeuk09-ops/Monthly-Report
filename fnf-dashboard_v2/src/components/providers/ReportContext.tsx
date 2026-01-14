'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MonthlyReportData, MonthOption } from '@/types/financial';

interface ReportContextType {
  currentMonth: { year: number; month: number } | null;
  setCurrentMonth: (year: number, month: number) => void;
  availableMonths: MonthOption[];
  reportData: MonthlyReportData | null;
  isLoading: boolean;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

interface ReportProviderProps {
  children: ReactNode;
  initialData: MonthlyReportData | null;
  availableMonths: MonthOption[];
  defaultMonth: { year: number; month: number };
}

export function ReportProvider({
  children,
  initialData,
  availableMonths,
  defaultMonth
}: ReportProviderProps) {
  const [currentMonth, setCurrentMonthState] = useState<{ year: number; month: number }>(defaultMonth);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const setCurrentMonth = async (year: number, month: number) => {
    if (currentMonth?.year === year && currentMonth?.month === month) return;

    setIsLoading(true);
    setCurrentMonthState({ year, month });

    try {
      const fileName = `${year}-${month.toString().padStart(2, '0')}`;
      const data = await import(`@/data/${fileName}.json`);
      setReportData(data.default as MonthlyReportData);
    } catch (error) {
      console.error(`Failed to load data for ${year}-${month}:`, error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReportContext.Provider value={{
      currentMonth,
      setCurrentMonth,
      availableMonths,
      reportData,
      isLoading,
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

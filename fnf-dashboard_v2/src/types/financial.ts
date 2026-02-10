// 월별 데이터 인덱스 타입
export interface MonthOption {
  year: number;
  month: number;
  label: string;
  file: string;
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface DataIndex {
  availableMonths: MonthOption[];
  defaultMonth: {
    year: number;
    month: number;
  };
}

// 재무 데이터 타입
export interface FinancialValue {
  current: number;
  previous: number;
  previousMonth?: number;
  previousYear?: number;
}

export interface FinancialData {
  revenue: FinancialValue;
  domesticRevenue: FinancialValue;
  exportRevenue: FinancialValue;
  cogs: FinancialValue;
  sga: FinancialValue;
  operatingProfit: FinancialValue;
  totalAssets: FinancialValue;
  currentAssets: FinancialValue;
  cash: FinancialValue;
  receivables: FinancialValue;
  inventory: FinancialValue;
  totalLiabilities: FinancialValue;
  currentLiabilities: FinancialValue;
  borrowings: FinancialValue;
  payables: FinancialValue;
  equity: FinancialValue;
  retainedEarnings: FinancialValue;
}

// 손익계산서 항목
export interface IncomeItem {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface IncomeStatement {
  revenue: IncomeItem[];
  costs: IncomeItem[];
  operatingProfit: IncomeItem;
  grossProfit?: IncomeItem;
}

// 채널별/수출/브랜드별 매출
export interface ChannelSale {
  channel: string;
  current: number;
  previous: number;
  yoy: number;
}

export interface ExportSale {
  region: string;
  current: number;
  previous: number;
  yoy: number;
}

export interface BrandSale {
  brand: string;
  code: string;
  current: number;
  previous: number;
  yoy: number;
  currentRatio: number;
  prevRatio: number;
}

// 재무상태표 항목
export interface BalanceSheetItem {
  label: string;
  jan25?: number;
  dec25: number;
  jan26?: number;
  dec24?: number;
  momChange?: number;
  momChangePercent?: number;
  yoyChange?: number;
  yoyChangePercent?: number;
  change?: number;
  changePercent?: number;
  isSubItem?: boolean;
  isAlwaysVisible?: boolean;
  highlight?: boolean;
}

export interface BalanceSheet {
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  totals: BalanceSheetItem[];
}

// 운전자본
export interface WorkingCapitalAR {
  label: string;
  jan25?: number;
  dec25: number;
  jan26?: number;
  dec24?: number;
  change: number;
  changePercent: number;
  warning?: boolean;
}

export interface WorkingCapitalInventoryItem {
  label: string;
  jan25?: number;
  dec25: number;
  jan26?: number;
  dec24?: number;
  change: number;
  changePercent: number;
}

export interface WorkingCapitalInventory {
  brand: string;
  items: WorkingCapitalInventoryItem[];
}

export interface WorkingCapital {
  ar: WorkingCapitalAR[];
  inventory: WorkingCapitalInventory[];
}

// 여신검증
export interface CreditVerificationItem {
  channel: string;
  oct?: number;
  nov: number;
  dec: number;
  jan?: number;
  arBalance: number;
  arRatio: number;
  months: number;
  prevMonths: number;
  status: 'normal' | 'warning' | 'danger';
  notes: string[];
}

// AI 인사이트
export interface AIInsights {
  positive: string[];
  warning: string[];
}

// 메타 데이터
export interface ReportMeta {
  year: number;
  month: number;
  reportDate: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

// 전체 월별 리포트 데이터
export interface MonthlyReportData {
  meta: ReportMeta;
  financialData: FinancialData;
  incomeStatement: IncomeStatement;
  channelSales: ChannelSale[];
  exportSales: ExportSale[];
  brandSales: BrandSale[];
  balanceSheet: BalanceSheet;
  workingCapital: WorkingCapital;
  creditVerification: CreditVerificationItem[];
  aiInsights: AIInsights;
}

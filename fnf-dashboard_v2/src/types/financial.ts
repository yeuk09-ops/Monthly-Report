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
  ratio?: number;
  isPercentage?: boolean;
  note?: string;
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

// 통합 AI 인사이트 (키워드 기반)
export interface InsightItem {
  keyword: string;
  analysis: string;
  action?: string;
}

export interface UnifiedInsights {
  positive: InsightItem[];
  warning: InsightItem[];
}

// 메타 데이터
export interface ReportMeta {
  year: number;
  month: number;
  reportDate: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

// 연환산 데이터
export interface AnnualizedData {
  note: string;
  revenue: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  operatingProfit: number;
  operatingMargin: number;
}

// 재무 비율
export interface RatioValue {
  current: number;
  previous: number;
  annualized: number;
}

export interface Ratios {
  profitability: {
    grossMargin: RatioValue;
    operatingMargin: RatioValue;
    roe: RatioValue;
    roa: RatioValue;
  };
}

// 외환 데이터 타입
export interface FXRateRange {
  currency: string;
  currencyName: string;
  min: number;
  max: number;
  avg: number;
  startRate: number; // 월초 환율
  endRate: number;   // 월말 환율
  change: number;
  changePercent: number;
}

export interface FXPosition {
  currency: string;
  currencyName: string;
  receivableFX: number;      // 채권 외화금액
  receivableKRW: number;     // 채권 원화금액 (억원)
  payableFX: number;         // 채무 외화금액
  payableKRW: number;        // 채무 원화금액 (억원)
  depositFX?: number;        // 예금 외화금액
  depositKRW?: number;       // 예금 원화금액 (억원)
  netFX: number;             // 순포지션 외화
  netKRW: number;            // 순포지션 원화 (억원)
  endRate: number;           // 기말 환율
  currentRate: number;       // 현재 환율 (조회시점)
  rateChange: number;        // 환율 변동
  rateChangePercent: number; // 환율 변동률
}

export interface FXSensitivity {
  currency: string;
  currencyName: string;
  netFX: number;             // 순포지션 외화
  baseRate: number;          // 기준 환율
  baseKRW: number;           // 기준 원화금액 (억원)
  plus5PercentRate: number;  // +5% 환율
  plus5PercentKRW: number;   // +5% 원화금액 (억원)
  plus5PercentImpact: number; // +5% 평가손익 (억원)
  minus5PercentRate: number;  // -5% 환율
  minus5PercentKRW: number;   // -5% 원화금액 (억원)
  minus5PercentImpact: number; // -5% 평가손익 (억원)
}

export interface FXRateTrend {
  date: string;              // YYYY-MM-DD
  displayMonth?: string;     // 차트 표시용 (MM월)
  CNY?: number;
  USD?: number;
  HKD?: number;
  EUR?: number;
  JPY?: number;
}

export interface FXTransaction {
  type: 'receivable' | 'payable';
  currency: string;
  currencyName: string;
  fxAmount: number;          // 외화 금액
  bookAmountKRW: number;     // 장부 금액 (KRW)
  settlementAmountKRW: number; // 결제 금액 (KRW)
  bookRate: number;          // 장부 환율
  settlementRate: number;    // 결제 환율
  fxGainLoss: number;        // 외환차손익 (실현)
  count: number;             // 거래 건수
}

export interface FXValuation {
  type: 'receivable' | 'payable';
  currency: string;
  currencyName: string;
  fxBalance: number;         // 외화 잔액
  bookAmountKRW: number;     // 장부 금액 (KRW)
  valuationAmountKRW: number; // 평가 금액 (KRW)
  bookRate: number;          // 장부 환율
  endRate: number;           // 기말 환율
  valuationGainLoss: number; // 외화평가손익 (미실현)
  rateVerified: boolean;     // 장부환율 검증 여부 (시장 범위 내)
  count: number;             // 잔액 건수
}

export interface FXSummary {
  transactionGainLoss: number;  // 외환차손익 합계 (실현)
  valuationGainLoss: number;    // 외화평가손익 합계 (미실현)
  totalGainLoss: number;        // 총 외환손익
  receivableTransaction: number; // 채권 거래 손익
  payableTransaction: number;    // 채무 거래 손익
  receivableValuation: number;   // 채권 평가 손익
  payableValuation: number;      // 채무 평가 손익
}

export interface FXReport {
  summary: FXSummary;
  positions: FXPosition[];        // 외화 포지션 현황
  rateRanges: FXRateRange[];      // 월간 환율 범위
  rateTrends: FXRateTrend[];      // 12개월 환율 추세
  sensitivity: FXSensitivity[];   // 민감도 분석 (±5%)
  transactions: FXTransaction[];  // 거래 외환손익 (실현)
  valuations: FXValuation[];      // 평가 외화손익 (미실현)
  insights: string[];             // AI 인사이트
  warnings: string[];             // 주의사항
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
  unifiedInsights?: UnifiedInsights;
  annualized?: AnnualizedData;
  ratios?: Ratios;
  fxReport?: FXReport;
}

// 재무 데이터 타입 정의

// 손익계산서 타입
export interface PLData {
  year: string;
  saleAmt: number;       // 실판매
  saleCms: number;       // 점수수료
  netSale: number;       // 출고매출
  actCogs: number;       // 매출원가
  grossProfit: number;   // 매출총이익
  sga: number;           // 판관비
  opProfit: number;      // 영업이익
  opMargin: number;      // 영업이익률
}

// 채널별 매출 타입
export interface ChannelSales {
  domestic: number;
  export: number;
  total: number;
}

// 브랜드별 매출 타입
export interface BrandSale {
  brdCd: string;
  brdName: string;
  totalSale: number;
  domesticSale: number;
  exportSale: number;
  yoyGrowth?: number;
}

// 재무상태표 타입
export interface BSData {
  period: string;

  // 자산
  totalAssets: number;
  currentAssets: number;
  cash: number;
  receivables: number;
  inventory: number;
  otherCurrentAssets: number;
  nonCurrentAssets: number;

  // 부채
  totalLiabilities: number;
  currentLiabilities: number;
  payables: number;
  shortTermDebt: number;
  otherCurrentLiabilities: number;
  nonCurrentLiabilities: number;

  // 자본
  equity: number;
  capital: number;
  retainedEarnings: number;
}

// 매출채권 연령분석 타입
export interface ARAgingData {
  calmonth: string;
  brdCd: string;
  channel: 'DOMESTIC' | 'EXPORT';
  total: number;
  under1m: number;
  under2m: number;
  under3m: number;
  over3m: number;
}

// 여신검증 데이터 타입
export interface CreditVerification {
  prevSale: number;      // 전월 매출
  currSale: number;      // 당월 매출
  ar: number;            // 채권 잔액
  avgSale: number;       // 월평균 매출
  ratio: number;         // 채권/매출 비율 (%)
  months: number;        // 월수 환산
}

// 재무비율 타입
export interface FinancialRatios {
  // 안정성
  debtRatio: number;           // 부채비율
  equityRatio: number;         // 자기자본비율
  netDebtRatio: number;        // 순차입금비율

  // 수익성
  opMargin: number;            // 영업이익률
  grossMargin: number;         // 매출총이익률
  roe: number;                 // ROE
  roa: number;                 // ROA

  // 활동성
  inventoryTurnover: number;   // 재고자산회전율
  receivablesTurnover: number; // 매출채권회전율
  dio: number;                 // 재고회전일수
  dso: number;                 // 매출채권회전일수
  dpo: number;                 // 매입채무회전일수
  ccc: number;                 // 현금전환주기
}

// KPI 메트릭 타입
export interface KPIMetric {
  current: number;
  previous: number;
  change?: number;
  growth?: number;
}

// KPI 데이터 타입
export interface KPIData {
  revenue: KPIMetric;
  opProfit: KPIMetric;
  opMargin: { current: number; previous: number };
  totalAssets: KPIMetric;
  totalLiabilities: KPIMetric;
  equity: KPIMetric;
  cash: KPIMetric;
  ratios: {
    debtRatio: { current: number; previous: number };
    equityRatio: { current: number; previous: number };
    netDebtRatio: { current: number; previous: number };
    roe: { current: number; previous: number };
  };
}

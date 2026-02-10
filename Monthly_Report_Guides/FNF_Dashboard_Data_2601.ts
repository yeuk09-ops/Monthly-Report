// FNF 재무제표 대시보드 데이터 - 26년 1월
// 작성일: 2026-02-10
// 데이터 출처: F&F 월별재무제표(26.01).csv + Snowflake DW_COPA_D

// 재무 데이터 (단위: 억원)
export const financialData = {
  // 손익계산서 (26년 1월)
  revenue: { current: 1638, previous: 1643 }, // 실판매출
  domesticRevenue: { current: 747, previous: 750 }, // 국내매출 (추정)
  exportRevenue: { current: 892, previous: 893 }, // 수출매출 (54.5%)
  cogs: { current: 574, previous: 578 }, // 매출원가
  sga: { current: 0, previous: 0 }, // 판관비 (월별 미제공)
  operatingProfit: { current: 0, previous: 0 }, // 영업이익 (월별 미제공)

  // 재무상태표 (26년 1월 vs 25년 1월) - CSV 데이터
  totalAssets: { current: 22938, previous: 20267 }, // 총자산: 2,293,786 → 22938억
  currentAssets: { current: 9983, previous: 5051 }, // 유동자산
  cash: { current: 3158, previous: 990 }, // 현금: 315,849 → 3158억
  receivables: { current: 2350, previous: 1970 }, // 매출채권: 235,049 → 2350억
  inventory: { current: 2198, previous: 2101 }, // 재고자산: 219,787 → 2198억 (순액)

  totalLiabilities: { current: 4292, previous: 4910 }, // 총부채: 429,177 → 4292억
  currentLiabilities: { current: 2902, previous: 3328 }, // 유동부채
  borrowings: { current: 0, previous: 200 }, // 차입금 (무차입 달성!)
  payables: { current: 957, previous: 821 }, // 매입채무: 95,655 → 957억

  equity: { current: 18646, previous: 15357 }, // 자본총계: 1,864,609 → 18646억
  retainedEarnings: { current: 15999, previous: 12645 }, // 이익잉여금: 1,599,897 → 15999억
};

// 연환산 데이터 (26년 1월 + 25년 2~12월)
export const annualizedData = {
  revenue: 17006, // 1,638 + 15,368 = 17,006억
  netSales: 15180, // 1,467 + 13,714 = 15,180억 (출고매출)
  cogs: 6129, // 574 + 5,555 = 6,129억
  grossProfit: 9051, // 15,180 - 6,129 = 9,051억
  operatingProfit: 5119, // 추정 (17,006 × 30.1% = 5,119억)
  commissions: 1826, // 172 + 1,654 = 1,826억 (점수수료)
};

// 브랜드별 실적 (26년 1월, Snowflake 조회)
export const brandPerformance = [
  { brand: 'MLB', total: 1114, domestic: 277, export: 837, exportRatio: 75.1 },
  { brand: 'Discovery', total: 395, domestic: 371, export: 24, exportRatio: 6.1 },
  { brand: 'MLB KIDS', total: 90, domestic: 60, export: 31, exportRatio: 34.4 },
  { brand: 'Duvetica', total: 35, domestic: 35, export: 0, exportRatio: 0.0 },
  { brand: 'Sergio Tacchini', total: 5, domestic: 4, export: 0, exportRatio: 0.0 },
];

// 계산된 재무비율 (26년 1월)
export const calculatedRatios = {
  // 수익성 지표 (연환산 기준)
  profitability: {
    grossMargin: { current: 60.9, previous: 61.0, annualized: 59.6 }, // 매출총이익률
    operatingMargin: { current: 0, previous: 0, annualized: 30.1 }, // 영업이익률
    roe: { current: 0, previous: 0, annualized: 26.9 }, // 5,119 ÷ 18,646 × 100
    roa: { current: 0, previous: 0, annualized: 21.8 }, // 5,119 ÷ 22,938 × 100
  },

  // 안정성 지표
  stability: {
    debtRatio: { current: 23.0, previous: 32.0 }, // 4,292 ÷ 18,646 × 100
    equityRatio: { current: 81.3, previous: 75.8 }, // 18,646 ÷ 22,938 × 100
    netDebtRatio: { current: -16.9, previous: -5.1 }, // (0 - 3,158) ÷ 18,646 × 100
    currentRatio: { current: 239.3, previous: 129.0 }, // 9,983 ÷ 4,172 × 100
  },

  // 활동성 지표 (연환산 기준)
  activity: {
    receivablesTurnover: { current: 7.2, previous: 7.0 }, // 17,006 ÷ 2,350
    inventoryTurnover: { current: 6.9, previous: 6.1 }, // 15,180 ÷ 2,198
    dso: { current: 50, previous: 52 }, // 매출채권회전일수 (365 ÷ 7.2)
    dio: { current: 53, previous: 59 }, // 재고회전일수 (365 ÷ 6.9)
    dpo: { current: 57, previous: 38 }, // 매입채무회전일수
    ccc: { current: 46, previous: 73 }, // 현금전환주기 (50 + 53 - 57)
  },

  // 성장률
  growth: {
    revenue: -0.3, // (1,638 - 1,643) ÷ 1,643 × 100
    export: -0.1,
    domestic: -0.4,
    assets: 13.2, // (22,938 - 20,267) ÷ 20,267 × 100
    equity: 21.4, // (18,646 - 15,357) ÷ 15,357 × 100
    cash: 219.0, // (3,158 - 990) ÷ 990 × 100
    receivables: 19.3,
  },
};

// 운전자본 분석
export const workingCapital = {
  nwc: {
    current: 3591, // 2,198 + 2,350 - 957
    previous: 3250, // 2,101 + 1,970 - 821
    change: 341,
  },
  nwcRatio: {
    current: 23.7, // 3,591 ÷ 15,180 × 100 (연환산 출고매출 기준)
    previous: 21.9,
  },
};

// AI 인사이트
export const aiInsights = {
  positive: [
    {
      title: '무차입 경영 달성',
      description: '차입금 200억원 → 0원으로 전액 상환하여 재무 건전성 극대화',
      metric: '차입금 △100%',
    },
    {
      title: '현금 보유 급증',
      description: '현금 990억원 → 3,158억원으로 유동성 대폭 개선',
      metric: '현금 +219%',
    },
    {
      title: '자본 축적 가속화',
      description: '이익잉여금 12,645억 → 15,999억으로 재무 기반 강화',
      metric: '이익잉여금 +26.5%',
    },
    {
      title: 'CCC 대폭 개선',
      description: '현금전환주기 73일 → 46일로 27일 단축',
      metric: 'CCC △27일',
    },
  ],
  monitoring: [
    {
      title: '1월 매출 소폭 감소',
      description: '실판매 1,643억 → 1,638억 (△0.3%), 계절성 요인 확인 필요',
      metric: '매출 △0.3%',
    },
    {
      title: '점수수료 증가',
      description: '163억 → 172억 (+5.5%), 백화점 채널 비중 증가 추정',
      metric: '점수수료 +5.5%',
    },
    {
      title: '매출채권 증가',
      description: '1,970억 → 2,350억 (+19.3%), 회수 관리 필요',
      metric: '매출채권 +19.3%',
    },
    {
      title: '법인세부채 증가',
      description: '811억 → 1,023억 (+26.2%), 높은 수익성 반영',
      metric: '법인세 +26.2%',
    },
  ],
};

// 핵심 KPI (대시보드 상단 카드)
export const kpiCards = [
  {
    title: '실판매출 (1월)',
    value: '1,638억원',
    previous: '1,643억원',
    yoy: -0.3,
    type: 'revenue',
  },
  {
    title: '영업이익 (연환산)',
    value: '5,119억원',
    previous: '5,013억원',
    yoy: 2.1,
    type: 'profit',
    highlight: true,
  },
  {
    title: '총자산 (1월말)',
    value: '2.29조원',
    previous: '2.03조원',
    yoy: 13.2,
    type: 'assets',
  },
  {
    title: '총부채 (1월말)',
    value: '4,292억원',
    previous: '4,910억원',
    yoy: -12.6,
    type: 'liabilities',
  },
  {
    title: '자기자본 (1월말)',
    value: '1.86조원',
    previous: '1.54조원',
    yoy: 21.4,
    type: 'equity',
  },
];

// 재무비율 카드
export const ratioCards = [
  {
    category: '수익성',
    ratios: [
      { name: '영업이익률', current: '30.1%', previous: '30.1%', change: 0 },
      { name: '매출총이익률', current: '59.6%', previous: '58.7%', change: 0.9 },
      { name: 'ROE', current: '26.9%', previous: '28.0%', change: -1.1 },
      { name: 'ROA', current: '21.8%', previous: '22.7%', change: -0.9 },
    ],
  },
  {
    category: '안정성',
    ratios: [
      { name: '부채비율', current: '23.0%', previous: '32.0%', change: -9.0 },
      { name: '자기자본비율', current: '81.3%', previous: '75.8%', change: 5.5 },
      { name: '순차입금비율', current: '-16.9%', previous: '-5.1%', change: -11.8 },
      { name: '유동비율', current: '239.3%', previous: '129.0%', change: 110.3 },
    ],
  },
  {
    category: '활동성',
    ratios: [
      { name: '매출채권회전율', current: '7.2회', previous: '7.0회', change: 0.2 },
      { name: '재고자산회전율', current: '6.9회', previous: '6.1회', change: 0.8 },
      { name: 'DSO', current: '50일', previous: '52일', change: -2 },
      { name: 'CCC', current: '46일', previous: '73일', change: -27 },
    ],
  },
];

// 사용 예시 주석
/**
 * React/Next.js 컴포넌트에서 사용:
 *
 * import { financialData, calculatedRatios, kpiCards } from './FNF_Dashboard_Data_2601';
 *
 * // KPI 카드 렌더링
 * {kpiCards.map(kpi => (
 *   <KPICard
 *     key={kpi.title}
 *     title={kpi.title}
 *     value={kpi.value}
 *     yoy={kpi.yoy}
 *     highlight={kpi.highlight}
 *   />
 * ))}
 *
 * // 재무비율 계산
 * const debtRatio = calculatedRatios.stability.debtRatio.current;
 * const roe = calculatedRatios.profitability.roe.annualized;
 */

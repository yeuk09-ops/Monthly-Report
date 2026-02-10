# FNF 재무제표 대시보드 API 전환 프로젝트 가이드

> **작성일:** 2025년 1월 13일  
> **목적:** HTML 단일 파일 대시보드를 Next.js + Snowflake API 구조로 전환하여 Vercel 배포  
> **작업 경로:** `C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\`

---

## 1. 프로젝트 개요

### 1.1 현재 상태
| 구분 | 현재 | 목표 |
|------|------|------|
| 프레임워크 | 단일 HTML (인라인 JS/CSS) | Next.js 14 (App Router) |
| 데이터 | 하드코딩 + CSV | Snowflake API 실시간 연동 |
| 배포 | 로컬 파일 | Vercel (서버리스) |
| 스타일링 | 인라인 CSS | Tailwind CSS |

### 1.2 데이터 소스 매핑

| 대시보드 탭 | 데이터 소스 | Snowflake 테이블/CSV |
|-------------|-------------|---------------------|
| 경영요약 (KPI) | Snowflake + CSV | `DW_COPA_D` + CSV 집계 |
| 손익계산서 (P/L) | Snowflake | `FNF.SAP_FNF.DW_COPA_D` |
| 재무상태표 (B/S) | CSV | `FNF별도_재무상태표_25_12_15_.csv` |
| 현금흐름표 (C/F) | CSV | `간접CF_25_12_15_.csv` |
| 매출채권 분석 | Snowflake | `FNF.SAP_FNF.DM_F_FI_AR_AGING` |

---

## 2. 프로젝트 구조

```
fnf-dashboard/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (네비게이션 포함)
│   ├── page.tsx                      # 경영요약 탭 (메인)
│   ├── globals.css                   # 전역 스타일
│   │
│   ├── api/                          # API Routes
│   │   ├── pl/
│   │   │   └── route.ts              # 손익계산서 API
│   │   ├── bs/
│   │   │   └── route.ts              # 재무상태표 API
│   │   ├── cf/
│   │   │   └── route.ts              # 현금흐름표 API
│   │   ├── ar-aging/
│   │   │   └── route.ts              # 매출채권 연령분석 API
│   │   └── kpi/
│   │       └── route.ts              # KPI 종합 API
│   │
│   ├── balance-sheet/
│   │   └── page.tsx                  # 재무상태표 탭
│   ├── cash-flow/
│   │   └── page.tsx                  # 현금흐름표 탭
│   └── income-statement/
│       └── page.tsx                  # 손익계산서(CO) 탭
│
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx            # 탭 네비게이션
│   │   └── Header.tsx                # 헤더
│   ├── dashboard/
│   │   ├── KPICard.tsx               # KPI 카드 컴포넌트
│   │   ├── KPIGrid.tsx               # KPI 카드 그리드
│   │   ├── FinancialTable.tsx        # 재무제표 테이블
│   │   ├── CollapsibleSection.tsx    # 접기/펴기 섹션
│   │   └── InsightCard.tsx           # 인사이트 카드
│   └── charts/
│       ├── RevenueChart.tsx          # 매출 추이 차트
│       ├── ProfitChart.tsx           # 수익성 차트
│       └── WCChart.tsx               # 운전자본 차트
│
├── lib/
│   ├── snowflake.ts                  # Snowflake 연결 설정
│   ├── queries/
│   │   ├── copa.ts                   # COPA 손익 쿼리
│   │   ├── ar-aging.ts               # 매출채권 쿼리
│   │   └── index.ts                  # 쿼리 export
│   └── utils/
│       ├── formatters.ts             # 숫자/날짜 포맷터
│       └── calculations.ts           # 재무비율 계산
│
├── data/
│   ├── bs_data.json                  # 재무상태표 데이터 (CSV 변환)
│   └── cf_data.json                  # 현금흐름표 데이터 (CSV 변환)
│
├── types/
│   ├── financial.ts                  # 재무 데이터 타입
│   └── api.ts                        # API 응답 타입
│
├── .env.local                        # 환경변수 (Snowflake 인증)
├── .env.example                      # 환경변수 예시
├── next.config.js                    # Next.js 설정
├── tailwind.config.js                # Tailwind 설정
├── tsconfig.json                     # TypeScript 설정
├── package.json
└── vercel.json                       # Vercel 배포 설정
```

---

## 3. 단계별 작업 계획

### Phase 1: 프로젝트 초기화 (Day 1)

#### 3.1.1 Next.js 프로젝트 생성
```bash
cd C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report
npx create-next-app@latest fnf-dashboard --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd fnf-dashboard
```

#### 3.1.2 필수 패키지 설치
```bash
npm install snowflake-sdk recharts lucide-react
npm install @tanstack/react-query
npm install -D @types/node
```

#### 3.1.3 환경변수 설정 (.env.local)
```env
# Snowflake 연결 정보
SNOWFLAKE_ACCOUNT=fnf_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=FNF
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_ROLE=PU_SQL_SAP

# API 설정
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

### Phase 2: Snowflake 연결 구현 (Day 2)

#### 3.2.1 Snowflake 클라이언트 (`lib/snowflake.ts`)

```typescript
import snowflake from 'snowflake-sdk';

// Snowflake 연결 설정
const connectionConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT!,
  username: process.env.SNOWFLAKE_USERNAME!,
  password: process.env.SNOWFLAKE_PASSWORD!,
  database: process.env.SNOWFLAKE_DATABASE!,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  role: process.env.SNOWFLAKE_ROLE!,
};

// 연결 생성 함수
export async function getConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(connectionConfig);
    connection.connect((err, conn) => {
      if (err) {
        console.error('Snowflake 연결 실패:', err);
        reject(err);
      } else {
        resolve(conn);
      }
    });
  });
}

// 쿼리 실행 함수
export async function executeQuery<T>(sql: string): Promise<T[]> {
  const connection = await getConnection();
  
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        connection.destroy((destroyErr) => {
          if (destroyErr) console.error('연결 종료 실패:', destroyErr);
        });
        
        if (err) {
          console.error('쿼리 실행 실패:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      }
    });
  });
}
```

---

### Phase 3: API 엔드포인트 구현 (Day 3-4)

#### 3.3.1 손익계산서 API (`app/api/pl/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

interface PLData {
  YR: string;
  MM: string;
  SALE_AMT: number;      // 실판매
  SALE_CMS: number;      // 점수수료
  NET_SALE: number;      // 출고매출
  ACT_COGS: number;      // 매출원가
  GROSS_PROFIT: number;  // 매출총이익
  SGA: number;           // 판관비
  OP_PROFIT: number;     // 영업이익
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025';
  const month = searchParams.get('month') || '11';

  const query = `
    SELECT 
      TO_CHAR(PST_DT, 'YYYY') AS YR,
      TO_CHAR(PST_DT, 'MM') AS MM,
      
      -- 실판매 (V-)
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
      
      -- 점수수료
      ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
      
      -- 출고매출 (실판매 - 점수수료)
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,
      
      -- 상품원가
      ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS

    FROM FNF.SAP_FNF.DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' 
      AND PST_DT <= '${year}-${month}-30'
      AND CORP_CD = '1000'
    GROUP BY TO_CHAR(PST_DT, 'YYYY'), TO_CHAR(PST_DT, 'MM')
    ORDER BY YR, MM
  `;

  try {
    const data = await executeQuery<PLData>(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PL API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PL data' },
      { status: 500 }
    );
  }
}
```

#### 3.3.2 브랜드별 매출 API (`app/api/pl/brand/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025';
  const month = searchParams.get('month') || '11';

  const query = `
    SELECT 
      LEFT(TO_CHAR(PST_DT, 'YYYYMM'), 4) AS YR,
      BRD_CD,
      
      -- 전체 매출
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS TOTAL_SALE,
      
      -- 수출 매출 (CHNL_CD = '9')
      ROUND(SUM(CASE WHEN CHNL_CD = '9' 
                THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE,
      
      -- 국내 매출 (수출 제외)
      ROUND(SUM(CASE WHEN CHNL_CD != '9' 
                THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOMESTIC_SALE

    FROM FNF.SAP_FNF.DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' 
      AND PST_DT <= '${year}-${month}-30'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0')
    GROUP BY LEFT(TO_CHAR(PST_DT, 'YYYYMM'), 4), BRD_CD
    ORDER BY YR, BRD_CD
  `;

  try {
    const data = await executeQuery(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand data' },
      { status: 500 }
    );
  }
}
```

#### 3.3.3 매출채권 연령분석 API (`app/api/ar-aging/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calmonth = searchParams.get('calmonth') || '2025-11';

  const query = `
    SELECT 
      CALMONTH,
      WWBND AS BRD_CD,
      CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END AS CHANNEL,
      
      -- 총 채권
      ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_TOTAL,
      
      -- 1개월 이내
      ROUND(SUM(TRY_TO_NUMBER(COL_2_1M)) / 100000000, 1) AS AR_1M,
      
      -- 1~2개월
      ROUND(SUM(TRY_TO_NUMBER(COL_2_2M)) / 100000000, 1) AS AR_2M,
      
      -- 2~3개월
      ROUND(SUM(TRY_TO_NUMBER(COL_2_3M)) / 100000000, 1) AS AR_3M,
      
      -- 3개월 초과
      ROUND(SUM(TRY_TO_NUMBER(COL_2_OVER3M)) / 100000000, 1) AS AR_OVER3M

    FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
    WHERE CALMONTH = '${calmonth}'
      AND ZARTYP = 'R1'
      AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
    GROUP BY CALMONTH, WWBND, 
             CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END
    ORDER BY CALMONTH, BRD_CD, CHANNEL
  `;

  try {
    const data = await executeQuery(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AR aging data' },
      { status: 500 }
    );
  }
}
```

#### 3.3.4 KPI 종합 API (`app/api/kpi/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025';
  const month = searchParams.get('month') || '11';

  // 손익 KPI 쿼리
  const plQuery = `
    SELECT 
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
      ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,
      ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS
    FROM FNF.SAP_FNF.DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' 
      AND PST_DT <= '${year}-${month}-30'
      AND CORP_CD = '1000'
  `;

  // 채권 KPI 쿼리
  const arQuery = `
    SELECT 
      ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_TOTAL
    FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
    WHERE CALMONTH = '${year}-${month}'
      AND ZARTYP = 'R1'
      AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  `;

  try {
    const [plData, arData] = await Promise.all([
      executeQuery(plQuery),
      executeQuery(arQuery)
    ]);

    // KPI 계산
    const pl = plData[0] as any;
    const ar = arData[0] as any;
    
    const grossProfit = pl.NET_SALE - pl.ACT_COGS;
    const sga = 3391; // 판관비 (CSV에서 가져오거나 별도 쿼리)
    const opProfit = grossProfit - sga;
    const opMargin = (opProfit / pl.SALE_AMT * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      data: {
        saleAmt: pl.SALE_AMT,           // 실판매
        netSale: pl.NET_SALE,           // 출고매출
        opProfit: opProfit,             // 영업이익
        opMargin: parseFloat(opMargin), // 영업이익률
        arTotal: ar.AR_TOTAL,           // 매출채권
        // 재무상태표 데이터는 CSV에서 로드
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: 프론트엔드 컴포넌트 (Day 5-6)

#### 3.4.1 KPI 카드 컴포넌트 (`components/dashboard/KPICard.tsx`)

```typescript
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  yoy: number;
  yoyType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export function KPICard({ 
  title, 
  value, 
  unit = '억', 
  yoy, 
  yoyType = 'positive',
  icon 
}: KPICardProps) {
  // YoY 색상 결정
  const getYoyColor = () => {
    if (yoy === 0) return 'text-gray-500';
    if (yoyType === 'positive') {
      return yoy > 0 ? 'text-emerald-600' : 'text-red-500';
    } else if (yoyType === 'negative') {
      return yoy > 0 ? 'text-red-500' : 'text-emerald-600';
    }
    return 'text-gray-500';
  };

  const YoyIcon = yoy > 0 ? TrendingUp : yoy < 0 ? TrendingDown : Minus;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-600 text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </span>
        <div className={`flex items-center gap-1 text-xs font-semibold ${getYoyColor()}`}>
          <YoyIcon className="w-3 h-3" />
          <span>YoY {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}
```

#### 3.4.2 네비게이션 컴포넌트 (`components/layout/Navigation.tsx`)

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: '📊 경영요약', href: '/' },
  { name: '📋 재무상태표', href: '/balance-sheet' },
  { name: '💰 현금흐름표', href: '/cash-flow' },
  { name: '📈 손익계산서(CO)', href: '/income-statement' },
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
```

#### 3.4.3 재무제표 테이블 (`components/dashboard/FinancialTable.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TableRow {
  label: string;
  values: (number | string)[];
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
  collapsible?: boolean;
  children?: TableRow[];
}

interface FinancialTableProps {
  headers: string[];
  rows: TableRow[];
  className?: string;
}

export function FinancialTable({ headers, rows, className = '' }: FinancialTableProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(label)) {
      newCollapsed.delete(label);
    } else {
      newCollapsed.add(label);
    }
    setCollapsedSections(newCollapsed);
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      if (value < 0) return `△${Math.abs(value).toLocaleString()}`;
      return value.toLocaleString();
    }
    return value;
  };

  const renderRow = (row: TableRow, index: number) => {
    const isCollapsed = collapsedSections.has(row.label);
    
    return (
      <>
        <tr
          key={index}
          className={`
            ${row.isHeader ? 'bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200' : ''}
            ${row.isTotal ? 'bg-gradient-to-r from-amber-50 to-amber-100 font-bold' : ''}
            ${!row.isHeader && !row.isTotal ? 'hover:bg-gray-50' : ''}
            transition-colors
          `}
          onClick={() => row.collapsible && toggleSection(row.label)}
        >
          <td 
            className="border border-slate-200 px-3 py-2 text-left"
            style={{ paddingLeft: `${(row.indent || 0) * 20 + 12}px` }}
          >
            <span className="flex items-center gap-2">
              {row.collapsible && (
                isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
              {row.label}
            </span>
          </td>
          {row.values.map((value, vIndex) => (
            <td key={vIndex} className="border border-slate-200 px-3 py-2 text-right">
              {formatValue(value)}
            </td>
          ))}
        </tr>
        {row.children && !isCollapsed && row.children.map((child, cIndex) => (
          renderRow({ ...child, indent: (row.indent || 0) + 1 }, index * 100 + cIndex)
        ))}
      </>
    );
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="bg-gradient-to-r from-[#2a5298] to-[#1e3c72] text-white px-3 py-3 text-center font-semibold border border-slate-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => renderRow(row, index))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Phase 5: 페이지 구현 (Day 7-8)

#### 3.5.1 경영요약 페이지 (`app/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { 
  TrendingUp, 
  Wallet, 
  Building2, 
  CreditCard, 
  PiggyBank 
} from 'lucide-react';

interface KPIData {
  saleAmt: number;
  opProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  yoy: {
    sale: number;
    opProfit: number;
    assets: number;
    liabilities: number;
    equity: number;
  };
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/kpi?year=2025&month=11');
        const json = await res.json();
        if (json.success) {
          setKpiData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch KPI:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">데이터 로딩 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-[#1e3c72] border-l-4 border-[#2a5298] pl-4">
        FNF 재무제표 대시보드 - 경영요약
      </h1>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="실판매출"
          value={kpiData?.saleAmt || 0}
          unit="억"
          yoy={kpiData?.yoy.sale || 0}
          yoyType="positive"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPICard
          title="영업이익"
          value={kpiData?.opProfit || 0}
          unit="억"
          yoy={kpiData?.yoy.opProfit || 0}
          yoyType="positive"
          icon={<Wallet className="w-4 h-4" />}
        />
        <KPICard
          title="총자산"
          value={kpiData?.totalAssets || 0}
          unit="억"
          yoy={kpiData?.yoy.assets || 0}
          yoyType="neutral"
          icon={<Building2 className="w-4 h-4" />}
        />
        <KPICard
          title="부채"
          value={kpiData?.totalLiabilities || 0}
          unit="억"
          yoy={kpiData?.yoy.liabilities || 0}
          yoyType="negative"
          icon={<CreditCard className="w-4 h-4" />}
        />
        <KPICard
          title="자기자본"
          value={kpiData?.equity || 0}
          unit="억"
          yoy={kpiData?.yoy.equity || 0}
          yoyType="positive"
          icon={<PiggyBank className="w-4 h-4" />}
        />
      </div>

      {/* 수익성 분석 섹션 */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4 border-l-4 border-orange-400 pl-3">
          📈 수익성 분석
        </h2>
        {/* 차트 및 상세 내용 */}
      </section>

      {/* 재무비율 KPI */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4 border-l-4 border-orange-400 pl-3">
          📊 재무비율
        </h2>
        {/* 재무비율 카드 그리드 */}
      </section>
    </div>
  );
}
```

---

### Phase 6: Vercel 배포 설정 (Day 9)

#### 3.6.1 vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "SNOWFLAKE_ACCOUNT": "@snowflake_account",
    "SNOWFLAKE_USERNAME": "@snowflake_username",
    "SNOWFLAKE_PASSWORD": "@snowflake_password",
    "SNOWFLAKE_DATABASE": "@snowflake_database",
    "SNOWFLAKE_WAREHOUSE": "@snowflake_warehouse",
    "SNOWFLAKE_ROLE": "@snowflake_role"
  }
}
```

#### 3.6.2 배포 명령어
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 환경변수 설정
vercel env add SNOWFLAKE_ACCOUNT
vercel env add SNOWFLAKE_USERNAME
vercel env add SNOWFLAKE_PASSWORD
vercel env add SNOWFLAKE_DATABASE
vercel env add SNOWFLAKE_WAREHOUSE
vercel env add SNOWFLAKE_ROLE

# 배포
vercel --prod
```

---

## 4. Snowflake 쿼리 레퍼런스

### 4.1 손익계산서 (COPA) 쿼리

```sql
-- 월별 손익 데이터 추출
SELECT 
    TO_CHAR(PST_DT, 'YYYY') AS YR,
    TO_CHAR(PST_DT, 'MM') AS MM,
    
    -- 매출액 (실판매 V-)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
    
    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
    
    -- 출고매출 (실판매 - 점수수료)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,
    
    -- 상품원가
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS

FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
GROUP BY TO_CHAR(PST_DT, 'YYYY'), TO_CHAR(PST_DT, 'MM')
ORDER BY YR, MM
```

### 4.2 브랜드별/채널별 매출

```sql
-- 브랜드별 국내/수출 매출 분리
SELECT 
    LEFT(TO_CHAR(PST_DT, 'YYYYMM'), 4) AS YR,
    BRD_CD,
    
    -- 전체 매출
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS TOTAL_SALE,
    
    -- 수출 매출 (CHNL_CD = '9')
    ROUND(SUM(CASE WHEN CHNL_CD = '9' 
              THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE,
    
    -- 국내 매출 (수출 제외)
    ROUND(SUM(CASE WHEN CHNL_CD != '9' 
              THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOMESTIC_SALE

FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY LEFT(TO_CHAR(PST_DT, 'YYYYMM'), 4), BRD_CD
ORDER BY YR, BRD_CD
```

### 4.3 매출채권 연령분석

```sql
-- 브랜드별/채널별 매출채권 집계
SELECT 
    CALMONTH,
    WWBND AS BRD_CD,
    CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END AS CHANNEL,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-11'
  AND ZARTYP = 'R1'  -- 외상매출금만
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY CALMONTH, WWBND, 
         CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END
ORDER BY CALMONTH, BRD_CD, CHANNEL
```

### 4.4 여신기준 검증 (9~11월 매출)

```sql
-- 월별 채널별 매출 (여신기준 검증용)
SELECT 
    TO_CHAR(PST_DT, 'MM') AS MM,
    CASE 
        WHEN CHNL_CD = '9' AND SUBSTR(SHOP_ID, 1, 2) = 'CN' THEN 'CHINA'
        WHEN CHNL_CD = '9' AND SUBSTR(SHOP_ID, 1, 2) IN ('HK', 'TW', 'MC') THEN 'HK_TW_MC'
        WHEN CHNL_CD = '9' THEN 'OTHER_EXPORT'
        ELSE 'DOMESTIC'
    END AS REGION,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-09-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY TO_CHAR(PST_DT, 'MM'),
         CASE 
             WHEN CHNL_CD = '9' AND SUBSTR(SHOP_ID, 1, 2) = 'CN' THEN 'CHINA'
             WHEN CHNL_CD = '9' AND SUBSTR(SHOP_ID, 1, 2) IN ('HK', 'TW', 'MC') THEN 'HK_TW_MC'
             WHEN CHNL_CD = '9' THEN 'OTHER_EXPORT'
             ELSE 'DOMESTIC'
         END
ORDER BY MM, REGION
```

---

## 5. 타입 정의

### 5.1 재무 데이터 타입 (`types/financial.ts`)

```typescript
// 손익계산서 타입
export interface PLData {
  year: string;
  month: string;
  saleAmt: number;      // 실판매
  saleCms: number;      // 점수수료
  netSale: number;      // 출고매출
  actCogs: number;      // 매출원가
  grossProfit: number;  // 매출총이익
  sga: number;          // 판관비
  opProfit: number;     // 영업이익
  opMargin: number;     // 영업이익률
}

// 브랜드별 매출 타입
export interface BrandSale {
  brdCd: string;
  brdName: string;
  totalSale: number;
  domesticSale: number;
  exportSale: number;
  yoyGrowth: number;
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

// 현금흐름표 타입
export interface CFData {
  quarter: string;
  ebitda: number;
  operatingCF: number;
  investingCF: number;
  financingCF: number;
  endingCash: number;
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

// KPI 데이터 타입
export interface KPIData {
  saleAmt: number;
  opProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  ratios: FinancialRatios;
  yoy: {
    sale: number;
    opProfit: number;
    assets: number;
    liabilities: number;
    equity: number;
  };
}
```

---

## 6. CSV 데이터 변환

### 6.1 재무상태표 CSV → JSON 변환 스크립트

```typescript
// scripts/convertBSData.ts
import fs from 'fs';
import path from 'path';

interface BSRow {
  account: string;
  value_2024_12: number;
  value_2025_11: number;
  value_2025_12e: number;
}

function convertBSData() {
  const csvPath = path.join(process.cwd(), 'data', 'FNF별도_재무상태표_25_12_15_.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  // CSV 파싱 로직
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const data: BSRow[] = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      account: values[0],
      value_2024_12: parseFloat(values[1]) || 0,
      value_2025_11: parseFloat(values[2]) || 0,
      value_2025_12e: parseFloat(values[3]) || 0,
    };
  });

  // JSON 저장
  const jsonPath = path.join(process.cwd(), 'data', 'bs_data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  
  console.log('BS data converted successfully!');
}

convertBSData();
```

---

## 7. 체크리스트

### 7.1 Phase 1: 프로젝트 초기화
- [ ] Next.js 프로젝트 생성
- [ ] 필수 패키지 설치 (snowflake-sdk, recharts, etc.)
- [ ] TypeScript 설정
- [ ] Tailwind CSS 설정
- [ ] 환경변수 파일 생성 (.env.local)

### 7.2 Phase 2: Snowflake 연결
- [ ] Snowflake 클라이언트 구현 (lib/snowflake.ts)
- [ ] 연결 테스트
- [ ] 쿼리 실행 함수 구현

### 7.3 Phase 3: API 구현
- [ ] /api/pl - 손익계산서 API
- [ ] /api/pl/brand - 브랜드별 매출 API
- [ ] /api/bs - 재무상태표 API
- [ ] /api/cf - 현금흐름표 API
- [ ] /api/ar-aging - 매출채권 연령분석 API
- [ ] /api/kpi - KPI 종합 API

### 7.4 Phase 4: 컴포넌트 개발
- [ ] Navigation 컴포넌트
- [ ] KPICard 컴포넌트
- [ ] KPIGrid 컴포넌트
- [ ] FinancialTable 컴포넌트
- [ ] CollapsibleSection 컴포넌트
- [ ] InsightCard 컴포넌트

### 7.5 Phase 5: 페이지 구현
- [ ] 경영요약 페이지 (app/page.tsx)
- [ ] 재무상태표 페이지 (app/balance-sheet/page.tsx)
- [ ] 현금흐름표 페이지 (app/cash-flow/page.tsx)
- [ ] 손익계산서 페이지 (app/income-statement/page.tsx)

### 7.6 Phase 6: 배포
- [ ] GitHub 리포지토리 생성
- [ ] Vercel 프로젝트 연결
- [ ] 환경변수 설정
- [ ] 배포 테스트
- [ ] 도메인 설정 (선택)

---

## 8. 참고 문서

| 문서명 | 용도 |
|--------|------|
| `FNF_재무제표_대시보드_작업정리_v7.md` | 대시보드 상세 스펙 |
| `FNF_Snowflake_Dashboard_Guide_Summary.md` | DB 검색 지침 |
| `fnf_sales_guide_v7.md` | 매출 분석 가이드 |
| `fnf_ar_analysis_guide_v1.md` | 매출채권 분석 가이드 |

---

## 9. 주의사항

### 9.1 Snowflake 연결
- Vercel 서버리스 환경에서 Snowflake 연결 시 Cold Start 시간 고려
- 연결 풀링 미지원으로 매 요청마다 새 연결 생성
- 쿼리 타임아웃 설정 필요 (기본 60초)

### 9.2 데이터 보안
- 환경변수로 모든 인증 정보 관리
- API 엔드포인트 접근 제어 고려
- CORS 설정 확인

### 9.3 성능 최적화
- React Query로 클라이언트 캐싱
- Vercel Edge Cache 활용
- 대용량 쿼리 분할 처리

---

*Generated: 2025-01-13*
*Project: FNF Financial Dashboard API Migration*

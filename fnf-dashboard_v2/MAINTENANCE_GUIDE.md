# FNF 대시보드 유지보수 가이드

시스템 유지보수 및 확장을 위한 기술 가이드입니다.

**Production URL**: https://fnf-dashboardv2.vercel.app

---

## 1. 시스템 아키텍처

### 1.1 기술 스택

| 구성요소 | 기술 | 버전 |
|:---|:---|:---|
| Framework | Next.js (App Router) | 16.x |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x |
| UI 컴포넌트 | shadcn/ui | latest |
| 차트 | Recharts | 3.x |
| 아이콘 | Lucide React | latest |
| 배포 | Vercel | - |

### 1.2 데이터 흐름

```
JSON 파일 (src/data/)
       ↓
ReportProvider (Context)
       ↓
각 페이지 컴포넌트
       ↓
UI 렌더링
```

### 1.3 월 선택 동작 원리

1. 사용자가 헤더의 드롭다운에서 월 선택
2. `ReportContext`의 `setCurrentMonth()` 호출
3. 해당 월의 JSON 파일 동적 import
4. `reportData` 상태 업데이트
5. 모든 페이지가 새 데이터로 리렌더링

---

## 2. 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx           # 루트 레이아웃 (Provider 설정)
│   ├── page.tsx             # 경영요약 페이지
│   ├── balance-sheet/
│   │   └── page.tsx         # 재무상태표 페이지
│   └── income-statement/
│       └── page.tsx         # 손익계산서 페이지
│
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── badge.tsx
│   ├── dashboard/           # 대시보드 전용 컴포넌트
│   │   ├── Header.tsx       # 헤더 + 월 선택
│   │   ├── KPICard.tsx      # KPI 카드
│   │   ├── InsightCard.tsx  # AI 인사이트 카드
│   │   ├── RatioCard.tsx    # 비율 지표 카드
│   │   └── index.ts         # 컴포넌트 export
│   └── providers/
│       └── ReportContext.tsx  # 전역 상태 관리
│
├── data/
│   ├── index.json           # 월 목록 + 기본 월 설정
│   └── 2025-12.json         # 월별 데이터 파일
│
├── types/
│   └── financial.ts         # TypeScript 타입 정의
│
└── lib/
    ├── data.ts              # 데이터 로드 유틸리티
    └── utils.ts             # cn() 등 공통 유틸리티
```

---

## 3. 페이지 네비게이션 순서

| 순서 | 페이지 | 경로 | 설명 |
|:---:|:---|:---|:---|
| 1 | 경영요약 | `/` | KPI, 재무비율, AI 인사이트 |
| 2 | 재무상태표 | `/balance-sheet` | 자산/부채/자본, 운전자본 분석 |
| 3 | 손익계산서 | `/income-statement` | 매출분석, 브랜드 믹스 차트 |

네비게이션 순서 변경: `src/components/dashboard/Header.tsx`의 `navItems` 배열 수정

```typescript
const navItems = [
  { href: '/', label: '경영요약' },
  { href: '/balance-sheet', label: '재무상태표' },
  { href: '/income-statement', label: '손익계산서' },
];
```

---

## 4. 주요 컴포넌트

### 4.1 ReportContext

전역 상태 관리 (Context API)

```typescript
interface ReportContextType {
  currentMonth: { year: number; month: number } | null;
  setCurrentMonth: (year: number, month: number) => void;
  availableMonths: MonthOption[];
  reportData: MonthlyReportData | null;
  isLoading: boolean;
}
```

### 4.2 Header

- 대시보드 제목 (동적)
- 페이지 네비게이션 (경영요약 → 재무상태표 → 손익계산서)
- 월 선택 드롭다운 (shadcn/ui Select)

### 4.3 KPICard

주요 지표 카드 (매출, 영업이익, 자산 등)

Props:
- `title`: 지표명
- `value`: 값
- `unit`: 단위
- `yoy`: 전년대비 증감률
- `yoyType`: 증감 색상 방향
- `highlight`: 강조 여부

### 4.4 RatioCard

비율 지표 카드 (영업이익률, ROE 등)

Props:
- `label`: 지표명
- `value`: 현재값
- `previousValue`: 전년값
- `format`: 'percent' | 'times' | 'days'
- `positiveGood`: 증가가 좋은지 여부

### 4.5 InsightCard

AI 인사이트 카드

Props:
- `type`: 'positive' | 'warning'
- `title`: 카드 제목
- `items`: 인사이트 문자열 배열 (HTML 지원)

---

## 5. 디자인 시스템

### 5.1 카드 스타일

```tsx
// 기본 카드
<Card className="shadow-sm border-0 bg-white overflow-hidden">
  <div className="h-1 bg-blue-500" />  {/* 상단 컬러 바 */}
  <CardContent>...</CardContent>
</Card>

// 어두운 배경 카드 (계산식 등)
<Card className="shadow-sm border-0 bg-slate-800 text-white">
```

### 5.2 색상 팔레트

| 용도 | 색상 | Tailwind 클래스 |
|:---|:---|:---|
| 긍정적 | 녹색 | `text-emerald-500`, `bg-emerald-500` |
| 부정적 | 빨강 | `text-red-500`, `bg-red-500` |
| 주의 | 주황/노랑 | `text-amber-500`, `bg-amber-500` |
| 기본 텍스트 | 회색 | `text-slate-600`, `text-slate-800` |
| 배경 | 밝은 회색 | `bg-slate-50`, `bg-white` |

### 5.3 브랜드 색상 (차트용)

```typescript
const BRAND_COLORS = {
  'MLB': '#3B82F6',        // blue-500
  'Discovery': '#F97316',  // orange-500
  'MLB Kids': '#06B6D4',   // cyan-500
  'Duvetica': '#8B5CF6',   // violet-500
  '기타': '#6B7280',       // gray-500
};
```

---

## 6. 재무비율 계산식

### 6.1 수익성 지표

- 매출총이익률 = (매출액-매출원가) ÷ 매출액 × 100
- 영업이익률 = 영업이익 ÷ 매출액 × 100
- ROE = 당기순이익 ÷ 평균자기자본 × 100
- ROA = 당기순이익 ÷ 평균총자산 × 100

### 6.2 안정성 지표

- 부채비율 = 총부채 ÷ 자기자본 × 100
- 자기자본비율 = 자기자본 ÷ 총자산 × 100
- 순차입금비율 = (차입금-현금) ÷ 자기자본 × 100

### 6.3 활동성 지표

- 매출채권회전율 = 매출액 ÷ 평균매출채권
- 재고자산회전율 = 매출원가 ÷ 평균재고자산
- 매입채무회전율 = 매출원가 ÷ 평균매입채무
- DSO = 365 ÷ 매출채권회전율
- DIO = 365 ÷ 재고자산회전율
- DPO = 365 ÷ 매입채무회전율
- CCC = DSO + DIO - DPO

---

## 7. 데이터 타입

### 7.1 MonthlyReportData

전체 월별 데이터 구조

```typescript
interface MonthlyReportData {
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
```

### 7.2 FinancialData

핵심 재무 데이터

```typescript
interface FinancialData {
  revenue: FinancialValue;         // 매출
  domesticRevenue: FinancialValue; // 국내매출
  exportRevenue: FinancialValue;   // 수출매출
  cogs: FinancialValue;            // 매출원가
  operatingProfit: FinancialValue; // 영업이익
  totalAssets: FinancialValue;     // 총자산
  cash: FinancialValue;            // 현금
  receivables: FinancialValue;     // 매출채권
  inventory: FinancialValue;       // 재고자산
  totalLiabilities: FinancialValue; // 총부채
  equity: FinancialValue;          // 자본
  // ...
}

interface FinancialValue {
  current: number;   // 당기
  previous: number;  // 전기
}
```

### 7.3 BrandSale (브랜드 믹스 차트용)

```typescript
interface BrandSale {
  brand: string;         // 브랜드명
  code: string;          // 브랜드 코드
  current: number;       // 당기 매출
  previous: number;      // 전기 매출
  yoy: number;           // YoY 증감률
  currentRatio: number;  // 당기 비중(%)
  prevRatio: number;     // 전기 비중(%)
}
```

---

## 8. 확장 가이드

### 8.1 새 페이지 추가

1. `src/app/[new-page]/page.tsx` 생성
2. `useReport()` 훅으로 데이터 접근
3. `Header.tsx`의 `navItems` 배열에 추가

```typescript
// src/app/new-page/page.tsx
'use client';

import { useReport } from '@/components/providers/ReportContext';

export default function NewPage() {
  const { reportData, isLoading } = useReport();

  if (isLoading) return <div>Loading...</div>;
  if (!reportData) return <div>No data</div>;

  return (
    <div>
      {/* 새 페이지 내용 */}
    </div>
  );
}
```

### 8.2 새 데이터 항목 추가

1. `src/types/financial.ts`에 타입 추가
2. `src/data/YYYY-MM.json`에 데이터 추가
3. 해당 페이지 컴포넌트에서 렌더링

### 8.3 새 UI 컴포넌트 추가

shadcn/ui 컴포넌트 추가:

```bash
npx shadcn@latest add [component-name]
```

커스텀 컴포넌트 추가:

```bash
# src/components/dashboard/NewComponent.tsx 생성
# src/components/dashboard/index.ts에 export 추가
```

### 8.4 차트 추가

Recharts 사용 예시 (도넛 차트):

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

<ResponsiveContainer width="100%" height={280}>
  <PieChart>
    <Pie
      data={chartData}
      innerRadius={70}
      outerRadius={110}
      paddingAngle={2}
      dataKey="value"
    >
      {chartData.map((entry, index) => (
        <Cell key={index} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']} />
  </PieChart>
</ResponsiveContainer>
```

---

## 9. 트러블슈팅

### 9.1 빌드 에러

**Dynamic import 에러**

```
Error: Cannot find module '@/data/...'
```

해결: JSON 파일명이 `index.json`의 `availableMonths`와 일치하는지 확인

**TypeScript 에러**

```
Property 'xxx' does not exist on type 'MonthlyReportData'
```

해결: `src/types/financial.ts`에 해당 타입 추가

**Recharts 타입 에러**

```
Type 'number | undefined' is not assignable to type 'number'
```

해결: `formatter={(value) => [`${Number(value).toFixed(1)}%`, '라벨']}`

### 9.2 데이터 로드 실패

1. JSON 파일 문법 오류 확인 (VS Code 등에서)
2. `index.json`의 `availableMonths` 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 9.3 스타일 깨짐

1. `npm run build` 후 확인
2. Tailwind CSS 클래스명 오타 확인
3. shadcn/ui 컴포넌트 버전 확인

---

## 10. 배포 관리

### 10.1 Vercel 배포

```bash
# 프로덕션 배포
vercel --prod --yes

# 미리보기 배포
vercel
```

### 10.2 환경 변수

현재 환경 변수 필요 없음 (JSON 기반)

향후 API 추가 시:
- Vercel Dashboard → Settings → Environment Variables

### 10.3 도메인 설정

Vercel Dashboard → Settings → Domains

---

## 11. 성능 최적화

### 11.1 현재 최적화

- Static Generation (SSG) 적용
- 동적 import로 JSON 로드
- React useMemo로 계산 결과 캐싱

### 11.2 추가 최적화 방안

1. **이미지 최적화**: Next.js Image 컴포넌트 사용
2. **번들 최적화**: dynamic import로 코드 스플리팅
3. **캐싱**: SWR 또는 React Query 도입 (API 사용 시)

---

## 12. 백업 및 복구

### 12.1 데이터 백업

```bash
# 데이터 폴더 백업
cp -r src/data/ backup/data_$(date +%Y%m%d)/
```

### 12.2 이전 버전 복구

```bash
# Git에서 이전 버전 복구
git checkout [commit-hash] -- src/data/
```

---

## 13. 연락처

- **프로젝트 관리**: Claude
- **v1 대시보드**: https://fnf-dashboard.vercel.app
- **v2 대시보드**: https://fnf-dashboardv2.vercel.app
- **코드 저장소**: 로컬 Git

---

*FNF Dashboard Maintenance Guide v2.0*

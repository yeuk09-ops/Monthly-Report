# FNF Dashboard Supabase - 구현 계획서

## 프로젝트 개요

**목표**: 월별 기준으로 재무 데이터를 관리하고, 드롭다운으로 기준월을 선택하여 해당 월의 대시보드를 조회할 수 있는 시스템 구축

**기술 스택**:
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + API)
- Vercel 배포

---

## 1. Supabase 테이블 스키마

### 1.1 monthly_reports (월별 리포트 메인)
```sql
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  report_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(year, month)
);
```

### 1.2 financial_summary (재무 요약 - KPI)
```sql
CREATE TABLE financial_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,

  -- 손익 데이터
  revenue DECIMAL(15, 2),           -- 매출
  revenue_prev DECIMAL(15, 2),      -- 전년 매출
  cogs DECIMAL(15, 2),              -- 매출원가
  cogs_prev DECIMAL(15, 2),
  operating_profit DECIMAL(15, 2),  -- 영업이익
  operating_profit_prev DECIMAL(15, 2),
  net_income DECIMAL(15, 2),        -- 당기순이익
  net_income_prev DECIMAL(15, 2),

  -- 재무상태 데이터
  total_assets DECIMAL(15, 2),      -- 총자산
  total_assets_prev DECIMAL(15, 2),
  total_liabilities DECIMAL(15, 2), -- 총부채
  total_liabilities_prev DECIMAL(15, 2),
  equity DECIMAL(15, 2),            -- 자기자본
  equity_prev DECIMAL(15, 2),
  cash DECIMAL(15, 2),              -- 현금
  cash_prev DECIMAL(15, 2),
  receivables DECIMAL(15, 2),       -- 매출채권
  receivables_prev DECIMAL(15, 2),
  inventory DECIMAL(15, 2),         -- 재고자산
  inventory_prev DECIMAL(15, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.3 brand_sales (브랜드별 매출)
```sql
CREATE TABLE brand_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  brand_code VARCHAR(10) NOT NULL,  -- M, X, I, V, ST
  brand_name VARCHAR(50) NOT NULL,  -- MLB, Discovery, etc.
  sales_amount DECIMAL(15, 2),
  sales_prev DECIMAL(15, 2),
  operating_profit DECIMAL(15, 2),
  op_prev DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.4 channel_sales (채널별 매출)
```sql
CREATE TABLE channel_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  channel_code VARCHAR(10) NOT NULL,
  channel_name VARCHAR(50) NOT NULL,
  channel_type VARCHAR(20) NOT NULL, -- DOMESTIC, EXPORT, SIB
  sales_amount DECIMAL(15, 2),
  sales_prev DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.5 export_sales (수출 지역별 매출)
```sql
CREATE TABLE export_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  region_code VARCHAR(20) NOT NULL,  -- CHINA, HK, TAIWAN, OTHER
  region_name VARCHAR(50) NOT NULL,
  sales_amount DECIMAL(15, 2),
  sales_prev DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.6 credit_verification (여신검증)
```sql
CREATE TABLE credit_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,      -- 국내, 수출-중국, 수출-홍콩, 수출-기타
  sales_oct DECIMAL(15, 2),
  sales_nov DECIMAL(15, 2),
  sales_dec DECIMAL(15, 2),
  ar_balance DECIMAL(15, 2),
  ar_ratio DECIMAL(10, 2),
  months DECIMAL(5, 1),
  prev_months DECIMAL(5, 1),
  status VARCHAR(20),                -- normal, warning, danger
  notes JSONB,                       -- 비고 내역 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.7 inventory_detail (재고 상세)
```sql
CREATE TABLE inventory_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  brand_code VARCHAR(10) NOT NULL,
  brand_name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,     -- 의류-당시즌, 의류-과시즌
  amount_current DECIMAL(15, 2),
  amount_prev DECIMAL(15, 2),
  change_amount DECIMAL(15, 2),
  change_percent DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.8 ai_insights (AI 분석 인사이트)
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  insight_type VARCHAR(20) NOT NULL, -- positive, warning
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 2. 프로젝트 구조

```
fnf-dashboard-supabase/
├── app/
│   ├── layout.tsx                 # 전역 레이아웃 (Header with 월 선택)
│   ├── page.tsx                   # 경영요약 (KPI, AI 인사이트)
│   ├── income-statement/
│   │   └── page.tsx               # 손익계산서
│   ├── balance-sheet/
│   │   └── page.tsx               # 재무상태표
│   ├── api/
│   │   ├── reports/
│   │   │   └── route.ts           # 월별 리포트 CRUD
│   │   └── data/
│   │       └── [reportId]/
│   │           └── route.ts       # 특정 월 데이터 조회
│   └── admin/
│       └── page.tsx               # 데이터 관리 페이지
├── components/
│   ├── ui/                        # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── Header.tsx             # 헤더 + 월 선택 드롭다운
│   │   ├── KPICard.tsx
│   │   ├── InsightCard.tsx
│   │   ├── RatioCard.tsx
│   │   └── DataTable.tsx
│   └── providers/
│       └── ReportProvider.tsx     # 선택된 월 Context
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # 브라우저용 클라이언트
│   │   └── server.ts              # 서버용 클라이언트
│   └── utils.ts
├── types/
│   └── database.ts                # Supabase 타입 정의
├── .env.local                     # 환경변수
├── README.md
├── MAINTENANCE_GUIDE.md           # 유지보수 가이드
└── DATA_MANAGEMENT_GUIDE.md       # 데이터 관리 가이드
```

---

## 3. 핵심 기능 구현

### 3.1 월 선택 드롭다운 (Header)
- shadcn/ui Select 컴포넌트 사용
- URL query parameter로 월 관리 (?year=2025&month=12)
- Context API로 전역 상태 관리

### 3.2 데이터 흐름
1. 사용자가 월 선택
2. URL 업데이트 → Server Component 리렌더링
3. Supabase에서 해당 월 데이터 조회
4. 각 페이지에 데이터 전달

### 3.3 관리자 페이지 (/admin)
- 새 월 데이터 추가
- 기존 데이터 수정
- 데이터 삭제 (soft delete)

---

## 4. 구현 순서

### Phase 1: 프로젝트 초기화
1. Next.js 프로젝트 생성
2. Tailwind CSS 설정
3. shadcn/ui 초기화 및 컴포넌트 추가
4. Supabase 클라이언트 설정

### Phase 2: Supabase 테이블 생성
1. Supabase Dashboard에서 테이블 생성
2. RLS 정책 설정 (읽기 전용 public)
3. 25년 12월 데이터 마이그레이션

### Phase 3: 핵심 UI 구현
1. 레이아웃 + 헤더 (월 선택)
2. 경영요약 페이지
3. 손익계산서 페이지
4. 재무상태표 페이지

### Phase 4: 관리 기능
1. Admin 페이지 구현
2. 데이터 CRUD API
3. 폼 유효성 검사

### Phase 5: 문서화 및 배포
1. README.md 작성
2. 유지보수 가이드 작성
3. 데이터 관리 가이드 작성
4. Vercel 배포

---

## 5. 기존 대시보드와의 관계

- **기존 fnf-dashboard**: 25년 12월 고정 버전으로 계속 유지
- **새 fnf-dashboard-supabase**: 월별 선택 가능한 동적 버전
- 두 프로젝트는 독립적으로 운영

---

## 6. 예상 작업 시간 구성

| Phase | 작업 내용 | 파일 수 |
|:---:|:---|:---:|
| 1 | 프로젝트 초기화 | 10+ |
| 2 | Supabase 설정 | SQL + 마이그레이션 |
| 3 | UI 구현 | 15+ |
| 4 | 관리 기능 | 5+ |
| 5 | 문서화 | 3 |

---

*이 계획서를 승인하시면 구현을 시작합니다.*

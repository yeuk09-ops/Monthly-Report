# FNF 재무제표 대시보드 월간 업데이트 가이드

**작성일**: 2026년 2월
**버전**: 9.0
**대시보드 URL**: https://fnf-dashboardv2.vercel.app

---

## 1. 대시보드 구조

### 1.1 페이지 구성

| 페이지 | 파일 경로 | 주요 내용 |
|:---|:---|:---|
| 경영요약 | `app/page.tsx` | KPI, 수익성/안정성/활동성 지표, AI 인사이트 |
| 손익계산서 | `app/income-statement/page.tsx` | 매출/비용 구조, 브랜드별 실적, 채널별 매출 |
| 재무상태표 | `app/balance-sheet/page.tsx` | 자산/부채/자본, 운전자본, 여신검증 |

### 1.2 프로젝트 위치

```
C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard\
├── app/
│   ├── page.tsx                 # 경영요약
│   ├── income-statement/
│   │   └── page.tsx             # 손익계산서
│   └── balance-sheet/
│       └── page.tsx             # 재무상태표
├── components/
│   └── dashboard/
│       ├── KPICard.tsx
│       ├── InsightCard.tsx
│       └── RatioCard.tsx
└── .env.local                   # Snowflake 연결 정보
```

---

## 2. 데이터 소스 구분

### 2.1 데이터 소스 원칙

| 구분 | 데이터 소스 | 비고 |
|:---|:---|:---|
| **손익계산서 (매출/원가/이익)** | Snowflake DW_COPA_D | **1~N월 누계 기준** |
| **재무상태표 (자산/부채/자본)** | CSV `F&F 월별재무제표(YY.MM).csv` | 월말 잔액 기준 |
| **채널별/브랜드별/수출지역별 매출** | Snowflake DW_COPA_D | 상세 분석용 |
| **매출채권 상세** | Snowflake DM_F_FI_AR_AGING | 여신검증용 |
| **재고자산 상세** | Snowflake DW_IVTR_HIST | 브랜드별/시즌별 |

**중요**: 손익 데이터는 CSV가 아닌 **Snowflake COPA 실적 데이터**를 사용합니다.
- CSV에는 재무상태표 항목만 있음 (손익 정보 없음)
- 매출/원가/영업이익은 Snowflake에서 직접 조회하여 사용

### 2.2 CSV에서 가져오는 항목 (재무상태표만)

**파일**: `F&F 월별재무제표(YY.MM).csv`

- 현금및현금성자산, 매출채권, 재고자산
- 투자자산, 유무형자산, 사용권자산, 기타채권, 기타자산
- 매입채무, 미지급금, 차입금, 법인세부채, 리스부채, 기타부채
- 자본금, 자본잉여금, 이익잉여금, 자기주식

### 2.3 Snowflake 직접 검색 데이터

| 데이터 | 테이블 | 업데이트 위치 | 쿼리 파일 |
|:---|:---|:---|:---|
| **손익 누계 (매출/원가/이익)** | `DW_COPA_D` | `financialData`, `incomeStatement` | `verify_dec.py` |
| **브랜드별 매출** | `DW_COPA_D` | `brandSales` 배열 | `verify_dec_channel.py` |
| **채널별 매출** | `DW_COPA_D` | `channelSales` 배열 | `verify_dec_channel.py` |
| **수출지역별 매출** | `DW_COPA_D` | `exportSales` 배열 | `verify_dec_channel.py` |
| **매출채권 (AR)** | `DM_F_FI_AR_AGING` | `creditVerification` 배열 | `credit_verify_v2.py` |
| **월별 수출매출** | `DW_COPA_D` | `creditVerification` (매출 컬럼) | `credit_verify_v2.py` |
| **재고자산 (브랜드별)** | `DW_IVTR_HIST` | `workingCapital.inventory` 배열 | `inventory_verify.py` |

---

## 3. 데이터 처리 흐름 (Data Pipeline)

### 3.1 전체 프로세스 개요

```
Step 1: 손익계산서 데이터 확인
   ↓
   Snowflake DW_COPA_D 조회
   → 매출/원가/이익 누계 데이터 추출
   → incomeStatement 섹션에 ratio 값 포함하여 저장

Step 2: 재무상태표 데이터 업데이트
   ↓
   CSV 파일 (F&F 월별재무제표) 읽기
   → 자산/부채/자본 항목 추출
   → balanceSheet 섹션 업데이트
   → 3개월 비교 (jan25, dec25, jan26)
   → MoM/YoY 증감 계산

Step 3: 재무비율 계산
   ↓
   손익계산서 + 재무상태표 데이터 결합
   → 수익성 지표: incomeStatement.*.ratio 값 직접 사용
   → 안정성 지표: 시점 잔액으로 비율 계산
   → 활동성 지표: 연환산 (× 12) 적용하여 계산

Step 4: 경영요약 및 인사이트 생성
   ↓
   calculatedMetrics 생성
   → 전년 대비(YoY) 성장률 계산
   → KPI 카드 표시
   → AI 인사이트 자동 생성
```

### 3.2 데이터 필드 구조

#### 3.2.1 financialData (기본 재무 데이터)

```typescript
{
  revenue: {
    current: 1639,           // 당월 (26.1월)
    previousMonth: 1644,     // 전월 (25.12월) - MoM 비교용
    previousYear: 1062       // 전년동월 (25.1월) - YoY 비교용
  },
  operatingProfit: { current, previousMonth, previousYear },
  totalAssets: { current, previousMonth, previousYear },
  // ... 기타 재무 항목
}
```

**사용 원칙**:
- `current`: 모든 페이지에서 당월 값 표시
- `previousMonth`: MoM 증감 계산 (전월 대비)
- `previousYear`: YoY 증감 계산 (전년 동월 대비)

#### 3.2.2 incomeStatement (손익계산서 - ratio 포함)

```typescript
{
  grossProfit: {
    label: "매출총이익",
    current: 1079,
    previous: 1088,          // 전월 (MoM)
    change: -9,
    changePercent: -0.8,
    ratio: 65.8              // ★ 이익률 (current / revenue.current × 100)
  },
  operatingProfit: {
    label: "영업이익",
    current: 658,
    previous: 679,
    change: -21,
    changePercent: -3.1,
    ratio: 40.2              // ★ 이익률 (직접 계산 필요 없음)
  }
}
```

**중요**: `ratio` 필드는 Snowflake에서 추출 시 이미 계산된 값입니다.
- 경영요약 페이지에서는 이 `ratio` 값을 직접 사용
- 재계산하면 소수점 오차로 불일치 발생 가능

#### 3.2.3 balanceSheet (재무상태표 - 3개월 비교)

```typescript
{
  totals: [
    {
      label: "총자산",
      jan25: 20267,          // 전년동월
      dec25: 22155,          // 전월
      jan26: 22938,          // 당월
      momChange: 783,        // jan26 - dec25
      momChangePercent: 3.5,
      yoyChange: 2671,       // jan26 - jan25
      yoyChangePercent: 13.2
    },
    // 총부채, 총자본
  ],
  assets: [...],
  liabilities: [...],
  equity: [...]
}
```

### 3.3 계산 로직 상세

#### 3.3.1 경영요약 페이지 (app/page.tsx)

**수익성 지표 - incomeStatement ratio 사용**:

```typescript
// ❌ 잘못된 방법 - 직접 계산하면 소수점 오차
const grossMargin = {
  current: (d.revenue.current - d.cogs.current) / d.revenue.current * 100
};

// ✅ 올바른 방법 - incomeStatement ratio 직접 사용
const grossMargin = {
  current: incomeStmt.grossProfit?.ratio ||
           (d.revenue.current - d.cogs.current) / d.revenue.current * 100,
  previousYear: d.revenue.previousYear && d.cogs.previousYear
    ? (d.revenue.previousYear - d.cogs.previousYear) / d.revenue.previousYear * 100
    : 0
};

const opMargin = {
  current: incomeStmt.operatingProfit?.ratio ||
           d.operatingProfit.current / d.revenue.current * 100,
  previousYear: d.operatingProfit.previousYear && d.revenue.previousYear
    ? d.operatingProfit.previousYear / d.revenue.previousYear * 100
    : 0
};
```

**안정성 지표 - 시점 잔액 사용**:

```typescript
// 부채비율: 당월 vs 전년동월
const debtRatio = {
  current: d.totalLiabilities.current / d.equity.current * 100,
  previousYear: d.totalLiabilities.previousYear / d.equity.previousYear * 100
};

// 자기자본비율
const equityRatio = {
  current: d.equity.current / d.totalAssets.current * 100,
  previousYear: d.equity.previousYear / d.totalAssets.previousYear * 100
};
```

**활동성 지표 - 연환산 (× 12)**:

```typescript
// 매출채권회전율
const avgReceivables = (d.receivables.current + d.receivables.previousMonth) / 2;
const avgReceivablesYoY = d.receivables.previousYear;  // 전년 1월만 사용

const receivablesTurnover = {
  current: (d.revenue.current * 12) / avgReceivables,      // ★ × 12 연환산
  previousYear: (d.revenue.previousYear * 12) / avgReceivablesYoY
};

const dso = {
  current: 365 / receivablesTurnover.current,
  previousYear: 365 / receivablesTurnover.previousYear
};

// 재고회전율, 매입채무회전율도 동일
```

#### 3.3.2 재무상태표 페이지 (app/balance-sheet/page.tsx)

**재무비율 카드**:

```typescript
// 부채비율
const debtRatio = balanceSheet.totals[1].jan26 && balanceSheet.totals[2].jan26
  ? (balanceSheet.totals[1].jan26 / balanceSheet.totals[2].jan26 * 100).toFixed(1) + '%'
  : '-';

// 전월 대비 변화
const prevDebtRatio = (balanceSheet.totals[1].dec25 / balanceSheet.totals[2].dec25 * 100);
const change = (currentDebtRatio - prevDebtRatio).toFixed(1);
```

### 3.4 데이터 일관성 체크리스트

월간 업데이트 시 다음 항목을 반드시 확인:

- [ ] **손익계산서 ratio 값이 경영요약과 일치하는가?**
  - incomeStatement.grossProfit.ratio === 경영요약 매출총이익률
  - incomeStatement.operatingProfit.ratio === 경영요약 영업이익률

- [ ] **전년 비교가 올바른가?**
  - 경영요약 YoY 성장률 = (current - previousYear) / previousYear × 100
  - previousMonth가 아닌 previousYear 사용 확인

- [ ] **재무상태표 3개월 비교가 정확한가?**
  - jan25 (전년동월), dec25 (전월), jan26 (당월)
  - momChange = jan26 - dec25
  - yoyChange = jan26 - jan25

- [ ] **연환산 적용이 올바른가?**
  - 매출/원가 관련 회전율: × 12 적용
  - ROE, ROA: 월 영업이익 × 0.8 × 12 (당기순이익 추정)

- [ ] **NaN 방지 처리가 되어 있는가?**
  - formatNumber/formatPercent에 null/undefined/NaN/Infinity 체크
  - optional chaining (?.) 사용
  - 조건부 렌더링으로 undefined 필드 보호

---

## 4. Snowflake 쿼리 가이드

### 4.1 연결 정보

```
Account: gv28284.ap-northeast-2.aws
Database: FNF
Schema: SAP_FNF (COPA, AR) / PRCS (재고, 매출)
Warehouse: dev_wh
Role: pu_sql_sap
```

### 4.2 브랜드별/채널별 매출 조회 (DW_COPA_D)

**핵심 원칙:**
- `FNF 매출 = 국내매출(직영/위탁) + 사입출고 + 수출출고`
- `SALE_TYPE IN ('N', 'T')` 필터 필수 (DW_SALE 사용 시)
- COPA는 실제 수익성 분석 데이터

**채널코드 (CHNL_CD):**
| CHNL_CD | 채널명 | 구분 |
|:---:|:---|:---|
| 1 | 백화점 | DOMESTIC |
| 2 | 면세점 | DOMESTIC |
| 3 | 대리점 | DOMESTIC |
| 4 | 할인점 | DOMESTIC |
| 5 | 직영점 | DOMESTIC |
| 6 | 아울렛 | DOMESTIC |
| 7 | 온라인(자사몰) | DOMESTIC |
| 8 | 사입 | SIB |
| 9 | 수출 | EXPORT |
| 11 | 온라인(입점몰) | DOMESTIC |
| 12 | 기타 | DOMESTIC |

```sql
-- 브랜드별 매출/영업이익 조회
SELECT
    BRD_CD,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_100M,
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS COGS_100M,
    ROUND((SUM(VAT_EXC_ACT_SALE_AMT) - SUM(ACT_COGS)) / 100000000, 0) AS OP_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT < '2026-01-01'
  AND CORP_CD = '1000'
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY BRD_CD;

-- 채널별 매출 조회 (국내+사입, 수출제외)
SELECT
    CASE
        WHEN CHNL_CD = '1' THEN '01.백화점'
        WHEN CHNL_CD = '3' THEN '02.대리점'
        WHEN CHNL_CD = '2' THEN '03.면세점'
        WHEN CHNL_CD = '5' THEN '04.직영점'
        WHEN CHNL_CD = '4' THEN '05.할인점'
        WHEN CHNL_CD = '6' THEN '06.아울렛'
        WHEN CHNL_CD = '7' THEN '07.온라인(자사몰)'
        WHEN CHNL_CD = '11' THEN '08.온라인(입점몰)'
        WHEN CHNL_CD = '8' THEN '09.사입'
        ELSE '99.기타'
    END AS CHANNEL,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS SALE_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT < '2026-01-01'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')  -- 수출 제외
GROUP BY CHANNEL
ORDER BY CHANNEL;

-- 수출 지역별 매출 조회 (DW_DELV 기준)
SELECT
    CASE
        WHEN SHOP_ID LIKE 'CN%' THEN '01.중국'
        WHEN SHOP_ID LIKE 'HK%' OR SHOP_ID LIKE 'MC%' THEN '02.홍콩/마카오'
        WHEN SHOP_ID LIKE 'TW%' OR SHOP_ID LIKE 'TX%' THEN '03.대만'
        ELSE '04.기타'
    END AS REGION,
    ROUND(SUM(SUPP_AMT) / 100000000, 0) AS SALE_100M
FROM FNF.PRCS.DW_DELV
WHERE DELV_DT >= '2025-01-01' AND DELV_DT < '2026-01-01'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND (SHOP_ID LIKE 'CN%' OR SHOP_ID LIKE 'HK%'
       OR SHOP_ID LIKE 'MC%' OR SHOP_ID LIKE 'TW%'
       OR SHOP_ID LIKE 'TH%' OR SHOP_ID LIKE 'MY%'
       OR SHOP_ID LIKE 'ID%' OR SHOP_ID LIKE 'VN%'
       OR SHOP_ID LIKE 'SG%' OR SHOP_ID LIKE 'AE%'
       OR SHOP_ID LIKE 'KH%' OR SHOP_ID LIKE 'TX%'
       OR SHOP_ID LIKE 'HX%')
GROUP BY REGION
ORDER BY REGION;

-- 브랜드별 매출 조회 (수출 제외, 국내+사입)
SELECT
    CASE
        WHEN BRD_CD = 'M' THEN '01.MLB'
        WHEN BRD_CD = 'X' THEN '02.Discovery'
        WHEN BRD_CD = 'I' THEN '03.MLB Kids'
        WHEN BRD_CD = 'V' THEN '04.Duvetica'
        ELSE '05.기타'
    END AS BRAND,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS SALE_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT < '2026-01-01'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0', '9')  -- 수출 제외!
GROUP BY BRAND
ORDER BY BRAND;
```

### 4.3 매출채권 (AR) 검증 쿼리

**테이블**: `FNF.SAP_FNF.DM_F_FI_AR_AGING`

**핵심 필터:**
- `ZARTYP = 'R1'` : 외상매출금만 (선수금, 미수금 제외)
- `WWDCH = '09'` : 수출만
- `COL_2_TOTAL` : 외상매출금 잔액

**고객코드 (CUST_CD):**
- 중국: 105787, 105798, 105864, 105807, 100888, 100495
- 홍콩: 100461, 105788, 105792, 105799, 105803, 105909, 106314, 100942

```sql
-- 수출 매출채권 지역별 집계
SELECT
    CASE
        WHEN CUST_CD IN ('105787','105798','105864','105807','100888','100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461','105788','105792','105799','105803','105909','106314','100942') THEN 'HK'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY REGION;
```

### 4.4 월별 수출매출 조회

```sql
-- 수출 월별 매출 (여신검증용)
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
    CASE
        WHEN CUST_CD IN ('105787','105798','105864','105807','100888','100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461','105788','105792','105799','105803','105909','106314','100942') THEN 'HK'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 1) AS SALE_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'  -- 수출
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'), REGION
ORDER BY MONTH, REGION;
```

### 4.5 재고자산 검증 쿼리

**테이블**: `FNF.SAP_FNF.DW_IVTR_HIST`

**핵심 필터:**
- `CORP_CD = '1000'` : 본사
- `BRD_CD IN ('M','I','X','V','ST','W')` : 6개 브랜드
- `CREATE_DT = MAX(CREATE_DT)` : 최신 스냅샷

**아이템코드 추출:**
```sql
CASE WHEN BRD_CD = 'ST'
     THEN SUBSTRING(PRDT_CD, 8, 2)
     ELSE SUBSTRING(PRDT_CD, 7, 2)
END AS ITEM_CD
```

**시즌 구분:**
- 당시즌 (25년 12월 기준): `SESN = '25F'`
- 과시즌: 그 외 모든 시즌

```sql
-- 브랜드별/시즌별 재고원가 (MLB, Discovery 의류)
WITH latest_dt AS (
    SELECT YYYYMM, MAX(CREATE_DT) AS MAX_DT
    FROM FNF.SAP_FNF.DW_IVTR_HIST
    WHERE YYYYMM IN ('202412', '202512') AND CORP_CD = '1000'
    GROUP BY YYYYMM
)
SELECT
    i.BRD_CD,
    CASE WHEN i.SESN = '25F' THEN '의류-당시즌' ELSE '의류-과시즌' END AS CATEGORY,
    i.YYYYMM,
    ROUND(SUM(i.END_STOCK_COST_AMT) / 100000000, 1) AS COST_100M
FROM FNF.SAP_FNF.DW_IVTR_HIST i
JOIN latest_dt l ON i.YYYYMM = l.YYYYMM AND i.CREATE_DT = l.MAX_DT
WHERE i.CORP_CD = '1000'
  AND i.BRD_CD IN ('M', 'X')
  -- 의류 아이템코드만 (WEAR)
  AND CASE WHEN i.BRD_CD = 'ST' THEN SUBSTRING(i.PRDT_CD, 8, 2)
           ELSE SUBSTRING(i.PRDT_CD, 7, 2) END
      IN ('MT','JK','JP','VT','CT','PT','OP','TS','SW','HD','BL','TR')
GROUP BY i.BRD_CD, CATEGORY, i.YYYYMM
ORDER BY i.BRD_CD, CATEGORY, i.YYYYMM;
```

### 4.6 매출채권 지역별 분류 원칙 ⭐ **중요**

**핵심 원칙**: 26년 1월부터 매출채권 지역별 분류 체계가 변경되었습니다.

#### 4.6.1 데이터 소스 구분

| 구분 | 데이터 소스 | 업데이트 시점 | 비고 |
|:---|:---|:---|:---|
| **매출채권 총액** | CSV `F&F 월별재무제표` | 월말 마감 | 2,350억 (26.1월 기준) |
| **지역별 AR 상세** | 재무팀 제공 또는 SAP ZFIR0580 | 월말 마감 | Snowflake 미반영 |
| **Snowflake AR** | `DM_F_FI_AR_AGING` | 약 1주일 지연 | 참고용, TP채권 미포함 |

**⚠️ 주의**: Snowflake DM_F_FI_AR_AGING는 **TP채권(FI전표) 211억이 누락**되어 있습니다.

#### 4.6.2 지역별 분류 체계

**26년 1월 기준 정확한 분류**:

```
전체 매출채권: 2,350억 (CSV 기준)
├─ 국내: 629억
├─ 수출-중국: 1,229억
├─ 수출-홍콩/마카오/대만: 440억 ⭐ TP채권 211억 포함
└─ 수출-기타: 52억 (동남아/유럽/미국)
```

**홍콩/마카오/대만 상세**:
- 실제 매출채권: 229억 (Snowflake 조회 가능)
- TP별도채권(FI전표): 211억 (Snowflake 미반영)
- **합계: 440억** (재무제표 반영 금액)

#### 4.6.3 대만 채권 분류 규칙

**대만은 홍콩에 포함됩니다**:
- DW_DELV 매출: `SHOP_ID LIKE 'TW%' OR SHOP_ID LIKE 'TX%'` → **홍콩/마카오/대만** 그룹
- DM_F_FI_AR_AGING 채권: `NAME1 LIKE '%TAIWAN BRANCH%'` → **홍콩/마카오/대만** 그룹

**쿼리 예시** (25년 12월):
```sql
-- 수출 지역별 매출 (대만 포함)
SELECT
    CASE
        WHEN SHOP_ID LIKE 'CN%' THEN '중국'
        WHEN SHOP_ID LIKE 'HK%' OR SHOP_ID LIKE 'MC%'
             OR SHOP_ID LIKE 'TW%' OR SHOP_ID LIKE 'TX%' THEN '홍콩/마카오/대만'
        ELSE '기타'
    END AS REGION,
    ROUND(SUM(SUPP_AMT) / 100000000, 1) AS SALE_100M_KRW
FROM FNF.PRCS.DW_DELV
WHERE DELV_DT >= '2025-11-01' AND DELV_DT < '2026-02-01'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY REGION;

-- 결과 (25년 11~26년 1월):
-- 중국: 11월 443억, 12월 1,093억, 1월 810억
-- 홍콩/마카오/대만: 11월 15억, 12월 29억, 1월 42억
-- 기타: 11월 16억, 12월 19억, 1월 38억
```

**매출채권 지역별** (NAME1 기준):
```sql
-- 25년 12월 AR 지역별 (대만 분리 확인)
SELECT
    NAME1,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M_KRW
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH = '09'  -- 수출
  AND NAME1 LIKE '%TAIWAN%'
GROUP BY NAME1;

-- 결과:
-- F&F HONG KONG LIMITED, TAIWAN BRANCH (105792): 58.1억
-- F&F HONG KONG LIMITED, TAIWAN BRANCH (105909): 11.7억
-- F&F HONG KONG LIMITED, TAIWAN BRANCH (105803): 1.3억
-- 대만 AR 합계: 71.1억
```

#### 4.6.4 매출채권 차이 조정 원칙

**Snowflake vs CSV 차이 조정**:

| 항목 | Snowflake | 조정 | 최종(CSV) |
|:---|---:|---:|---:|
| 국내 | 737억 | +9억 | 746억 |
| 중국 | 736억 | 0억 | 736억 |
| 홍콩/마카오/대만 | 234억 | **+211억** | 445억 |
| 기타 | 38억 | 0억 | 38억 |
| **합계** | 1,745억 | **+220억** | **1,965억** |

**조정 내역**:
1. **TP채권 211억**: 홍콩/마카오/대만에 추가 (FI전표, Snowflake 미반영)
2. **국내 9억**: 소액 차이를 국내로 반영

#### 4.6.5 여신검증 계산 공식

**채널별 기준**:

| 채널 | 계산 공식 | 정상 기준 | 비고 |
|:---|:---|:---|:---|
| 국내 | AR ÷ 1월 매출 | 1.5개월 | 최근 2개월 평균 가능 |
| 중국 | AR ÷ 1월 매출 | 1.0개월 | 수출 후 익월 송금 |
| 홍콩/대만 | AR ÷ [(11+12+1월)÷3] | 3.0개월 | 최근 3개월 평균 필수 |
| 기타 | AR ÷ [(12+1월)÷2] | 2.0개월 | 최근 2개월 평균 필수 |

**26년 1월 실제 계산**:
```json
{
  "channel": "국내",
  "jan": 748,
  "arBalance": 629,
  "months": 0.8,  // 629 ÷ 748 = 0.8개월
  "status": "excellent"
},
{
  "channel": "수출-중국",
  "jan": 810,
  "arBalance": 1229,
  "months": 1.5,  // 1,229 ÷ 810 = 1.5개월
  "status": "normal"
},
{
  "channel": "수출-홍콩/마카오/대만",
  "nov": 15, "dec": 29, "jan": 42,
  "arBalance": 440,
  "months": 10.5,  // 440 ÷ [(15+29+42)÷3] = 10.5개월
  "status": "danger",
  "notes": ["TP채권 211억 포함"]
},
{
  "channel": "수출-기타",
  "dec": 19, "jan": 38,
  "arBalance": 52,
  "months": 1.4,  // 52 ÷ 38 = 1.4개월
  "status": "normal"
}
```

#### 4.6.6 SAP ZFIR0580 조회 방법

**SAP 트랜잭션**: ZFIR0580 (거래처별 잔액 조회)

**출력 필드**:
- 사업영역, 브랜드, 유통구분, 고객코드, 고객코드명
- 계정코드 (예: 11070113 = 외상매출금_수출)
- 금액(KRW), 외화금액, 통화

**⚠️ Snowflake 미반영**:
- SAP ZFIR0580 데이터는 Snowflake에 테이블로 존재하지 않음
- 월말 재무팀에서 Excel 파일로 제공받거나 직접 조회 필요
- `EXPORT.XLSX` 형태로 받은 경우 Python pandas로 집계

**Python 집계 예시**:
```python
import pandas as pd

df = pd.read_excel('EXPORT.XLSX')
df_ar = df[df['계정코드'].str.contains('1107', na=False)]  # 외상매출금

# 지역별 집계
result = df_ar.groupby('고객코드명')['금액'].sum() / 100000000  # 억원 단위
print(result)
```

---

## 5. 계산 로직

### 5.1 여신검증 - 채권개월수 계산

| 채널 | 계산방식 | 정상채권 기준 |
|:---|:---|:---|
| **국내** | (채권 - 기준월매출) / 직전월매출 + 1 | 약 1개월 |
| **중국** | (채권 - 기준월매출) / 직전월매출 + 1 | 약 1개월 |
| **홍콩** | 채권 / (3개월매출합계 ÷ 3) | 3개월 (선적말일+3개월) |
| **기타** | 채권 / (2개월매출합계 ÷ 2) | 2개월 |

**예시 (국내):**
```
채권 980억, 12월 매출 850억, 11월 매출 1,055억
= 1개월 + (980-850)/1,055 = 1개월 + 0.1개월 = 1.1개월
```

**예시 (홍콩):**
```
채권 256억, 3개월 매출 61억 (10월17+11월18+12월26)
월평균 = 61÷3 = 20.3억
채권개월수 = 256÷20.3 = 12.6개월
정상채권 = 3개월 = 61억
지연채권 = 256 - 61 = 195억
```

### 4.2 손익계산서 영업이익 계산 로직

**FNF 영업이익 산출 공식:**

| 순서 | 항목 | 계산식 | 설명 |
|:---:|:---|:---|:---|
| 1 | **재무매출(V-)** | 실판매출(V+) / 1.1 | 부가세 제외 |
| 2 | **점수수료(V-)** | {실판매출(V+) - 출고매출(V+)} / 1.1 | 백화점 등 수수료 |
| 3 | **매출원가** | COGS | 제품원가 |
| 4 | **판관비** | SG&A | 판매비와관리비 |
| 5 | **영업이익** | 재무매출 - 점수수료 - 매출원가 - 판관비 | |

**Snowflake COPA 컬럼 매핑:**

| 항목 | COPA 컬럼 | 설명 |
|:---|:---|:---|
| 실판매출 | `ACT_SALE_AMT` | VAT 포함 실판가 |
| 재무매출 | `VAT_EXC_ACT_SALE_AMT` | VAT 제외 = ACT_SALE_AMT / 1.1 |
| 출고매출 | `SUPP_AMT` | 출고가 기준 |
| 점수수료 | `VAT_EXC_ACT_SALE_AMT - SUPP_AMT` | (실판-출고)/1.1 |
| 매출원가 | `ACT_COGS` | 실제 원가 |
| 영업이익 | `VAT_EXC_ACT_SALE_AMT - ACT_COGS` | COPA 기준 영업이익 |

**예시 (12월 누계):**
```
대시보드 표시: 실판매출(V-) = 17,820억 (VAT 제외, 재무매출 기준)
- 국내매출: 8,824억
- 수출매출: 8,996억

매출원가: 6,129억
판관비: 5,878억
영업이익: 5,813억 = 17,820 - 6,129 - 5,878 (COPA 기준)
```

**참고: V+/V- 구분**
- V+ (VAT 포함): ACT_SALE_AMT
- V- (VAT 제외): VAT_EXC_ACT_SALE_AMT = ACT_SALE_AMT / 1.1

### 4.3 수익성 지표

```javascript
// 매출총이익률
grossMargin = (매출액 - 매출원가) / 매출액 × 100

// 영업이익률
opMargin = 영업이익 / 매출액 × 100

// ROE (자기자본이익률)
roe = 당기순이익 / 평균자기자본 × 100

// ROA (총자산이익률)
roa = 당기순이익 / 평균총자산 × 100
```

### 4.4 안정성 지표

```javascript
// 부채비율
debtRatio = 총부채 / 자기자본 × 100

// 자기자본비율
equityRatio = 자기자본 / 총자산 × 100

// 순차입금비율
netDebtRatio = (차입금 - 현금) / 자기자본 × 100
```

### 4.5 활동성 지표

```javascript
// 매출채권회전율
receivablesTurnover = 매출액 / 평균매출채권

// DSO (매출채권회전일수)
dso = 365 / 매출채권회전율

// DIO (재고자산회전일수)
dio = 365 / (매출원가 / 평균재고)

// DPO (매입채무회전일수)
dpo = 365 / (매출원가 / 평균매입채무)

// CCC (현금전환주기)
ccc = DSO + DIO - DPO
```

---

## 6. 월간 업데이트 절차

### 5.1 Step 1: CSV 데이터 업데이트 (회계팀 제공)

**파일**: `F&F 월별재무제표(YY.MM).csv`

```javascript
// app/page.tsx, app/balance-sheet/page.tsx
const financialData = {
  revenue: { current: 신규값, previous: 전년값 },
  cogs: { current: 신규값, previous: 전년값 },
  operatingProfit: { current: 신규값, previous: 전년값 },
  cash: { current: 신규값, previous: 전년값 },
  receivables: { current: 신규값, previous: 전년값 },
  inventory: { current: 신규값, previous: 전년값 },
  // ... 기타 항목
};
```

### 4.2 Step 2: Snowflake 검증 스크립트 실행

```bash
cd C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report

# 1. 브랜드별/채널별 매출 조회
# → income-statement 브랜드별 실적, 채널별 매출 업데이트

# 2. 매출채권 검증
python credit_verify_v2.py
# → creditVerification 배열 업데이트

# 3. 재고자산 검증
python inventory_verify.py
# → workingCapitalInv 배열 업데이트
```

### 4.3 Step 3: 대시보드 코드 업데이트

**손익계산서 (income-statement/page.tsx):**
- 채널별 매출 분석 (국내+사입, 수출제외)
  - 백화점/대리점/면세점/직영점/할인점/아울렛/온라인(자사몰)/온라인(입점몰)/사입/기타
- 수출 지역별 매출 분석
  - 중국/홍콩/마카오/대만/기타
- 브랜드별 매출 분석 (수출 제외, 국내+사입)
  - MLB/Discovery/MLB Kids/Duvetica/기타
- 브랜드 믹스 변화 (원형 그래프)

**재무상태표 (balance-sheet/page.tsx):**
- `creditVerification` 배열 (여신검증)
- `workingCapitalInv` 배열 (재고 브랜드별)

### 4.4 Step 4: 배포

```bash
cd fnf-dashboard
git add .
git commit -m "Update: YYYY년 MM월 재무데이터"
git push origin main
vercel --prod --yes
```

---

## 7. AI 분석 항목 및 프롬프트

### 5.1 경영요약 탭 AI 분석 항목

**수익성 분석 (InsightCard - positive):**
- 매출 성장률 및 영업이익 증감
- 영업이익률 변동
- 수출 매출 성장세
- 현금 증감

**재무현황 분석:**
- 자산 구조 변화
- 무차입 경영 상태
- 부채비율 변동

**모니터링 항목 (InsightCard - warning):**
- 매출채권 증가율
- CCC(현금전환주기) 변동
- 국내 매출 역성장 여부
- 재고회전일수

### 4.2 AI 인사이트 생성 프롬프트

```
다음 재무데이터를 분석하여 경영요약 대시보드의 AI 인사이트를 작성해주세요.

[재무데이터]
- 매출: {전년}억 → {당기}억 ({증감률}%)
- 영업이익: {전년}억 → {당기}억 ({증감률}%)
- 영업이익률: {전년}% → {당기}%
- 수출매출: {전년}억 → {당기}억 ({증감률}%)
- 수출비중: {전년}% → {당기}%
- 현금: {전년}억 → {당기}억
- 매출채권: {전년}억 → {당기}억
- 재고자산: {전년}억 → {당기}억
- 부채비율: {전년}% → {당기}%
- 차입금: {금액}원

[작성 형식]
1. 긍정적 시그널 (4개)
   - <strong>핵심키워드</strong>: 구체적 수치와 함께 설명
   - 성장, 개선, 안정성 관련 항목

2. 모니터링 필요 (4개)
   - <strong>핵심키워드</strong>: 구체적 수치와 함께 설명
   - 증가 추세, 리스크, 점검 필요 항목

[분석 포인트]
- 수익성: 매출총이익률, 영업이익률, ROE, ROA
- 안정성: 부채비율, 자기자본비율, 순차입금비율
- 활동성: DSO, DIO, DPO, CCC
- 성장성: 매출성장률, 영업이익성장률, 수출비중
```

### 4.3 여신검증 분석 프롬프트

```
다음 매출채권 데이터를 분석하여 채권 건전성을 평가해주세요.

[Snowflake 검증 데이터]
- 중국: AR {금액}억, 월매출 평균 {금액}억, 채권개월수 {N}개월
  - 계산: ({채권} - {12월매출}) / {11월매출} + 1
- 홍콩: AR {금액}억, 월매출 평균 {금액}억, 채권개월수 {N}개월
  - 계산: {채권} / ({3개월매출} ÷ 3), 정상채권 3개월
- 기타: AR {금액}억, 월매출 평균 {금액}억, 채권개월수 {N}개월
  - 계산: {채권} / ({2개월매출} ÷ 2), 정상채권 2개월

[분석 요청]
1. 정상채권 vs 지연채권 구분
2. 지연 원인 분석 (TP정산, 결제조건 등)
3. 리스크 평가 (정상/경계/위험)
4. 비고 내용 작성
```

### 4.4 재고 분석 프롬프트

```
다음 Snowflake 재고 검증 데이터를 분석해주세요.

[DW_IVTR_HIST 검증 데이터]
- MLB 의류-당시즌: {전년}억 → {당기}억 ({증감률}%)
- MLB 의류-과시즌: {전년}억 → {당기}억 ({증감률}%)
- Discovery 의류-당시즌: {전년}억 → {당기}억 ({증감률}%)
- Discovery 의류-과시즌: {전년}억 → {당기}억 ({증감률}%)
- 전체 재고: {전년}억 → {당기}억 ({증감률}%)

[분석 요청]
1. 당시즌 재고 적정성 (FW 시즌 입고 고려)
2. 과시즌 소진율 평가
3. 브랜드별 재고 효율성 비교
4. 재고평가충당금 리스크
```

---

## 8. 사용자 요청 데이터 양식

### 5.1 월별 재무제표 CSV 양식 (유일한 CSV 입력)

| 계정과목 | 24년 12월 | 25년 12월(e) | 비고 |
|:---|---:|---:|:---|
| 실판매출 | 15,210 | 17,048 | 억원 |
| 매출원가 | 5,837 | 6,426 | 억원 |
| 판관비 | 5,408 | 5,609 | 억원 |
| 영업이익 | 3,965 | 5,013 | 억원 |
| 현금 | 615 | 2,708 | 억원 |
| 매출채권 | 1,324 | 2,180 | 억원 |
| 재고자산 | 2,253 | 2,303 | 억원 |
| 총자산 | 19,248 | 22,448 | 억원 |
| 총부채 | 4,309 | 4,144 | 억원 |
| 자기자본 | 14,939 | 18,304 | 억원 |

### 4.2 여신검증 비고 양식 (사용자 추가 정보)

| 채널 | 결제조건 | 지연내역 | 비고 |
|:---|:---|:---|:---|
| 중국 | 수출후 익월송금 | 2억위안 지연 (26년2월 예정) | 선급금 3.5억위안 |
| 홍콩 | 선적말일+3개월 | TP정산 211억 지연 | 총 지연채권 406억 |

---

## 8. 검증 스크립트 위치

| 스크립트 | 위치 | 용도 |
|:---|:---|:---|
| `credit_verify_v2.py` | `Monthly_Report/` | 매출채권 검증 (중국/홍콩/기타) |
| `inventory_verify.py` | `Monthly_Report/` | 재고자산 검증 (브랜드별/시즌별) |

---

## 9. 참고 가이드 문서

| 문서 | 위치 | 용도 |
|:---|:---|:---|
| Snowflake 통합 가이드 | `Monthly_Report_Guides/FNF_Snowflake_Dashboard_Guide_Summary.md` | DB 검색 + 대시보드 구현 |
| 매출 분석 가이드 | `Monthly_Report_Guides/fnf_sales_guide_v7.md` | 매출 쿼리 (COPA, SALE_TYPE 필터) |
| AR 분석 가이드 | `Monthly_Report_Guides/fnf_ar_analysis_guide_v1.md` | 매출채권 쿼리 |
| 재고 분석 가이드 | `Monthly_Report_Guides/fnf_inventory_cost_analysis_guide_v1.md` | 재고원가 쿼리 |
| AP 분석 | `Monthly_Report_Guides/fnf_ap_analysis_202511_final.md` | 매입채무 분석 |

---

## 9. 검증 체크리스트

### 5.1 데이터 정합성

```
□ 재무제표 합계 일치? (자산 = 부채 + 자본)
□ 손익계산서 합계 일치? (매출 - 비용 = 이익)
□ Snowflake 조회 결과와 CSV 데이터 비교?
□ 전년 동기 데이터 정확성?
```

### 4.2 Snowflake 여신검증

```
□ AR 쿼리 필터 정확? (ZARTYP='R1', WWDCH='09')
□ CUST_CD로 지역 구분 정확?
□ 월별 매출 합계와 채권개월수 계산 일치?
□ 정상채권 기준 적용? (국내/중국 1개월, 홍콩 3개월, 기타 2개월)
```

### 4.3 Snowflake 재고검증

```
□ CREATE_DT 최신값 필터?
□ 아이템코드 추출 로직 정확? (ST는 8번째, 나머지 7번째)
□ 시즌 구분 정확? (당시즌: 25F)
□ 브랜드 6개 모두 포함?
□ 의류 아이템코드 필터 적용?
```

### 4.4 Snowflake 매출검증

```
□ SALE_TYPE IN ('N','T') 필터 적용? (DW_SALE 사용 시)
□ CHNL_CD로 채널 구분 정확?
□ COPA vs Guide 일치도 확인? (DOMESTIC 97~99%, SIB/EXPORT 100%)
```

---

## 10. 기준월 변경 원칙 (v5.0 추가)

### 5.1 기준월 정의

**기준월**: 보고서 작성 대상 월 (예: 26년 1월)

대시보드는 기준월을 중심으로 전월 대비(MoM) 및 전년동월 대비(YoY) 비교를 수행합니다.

### 4.2 비교 기준 체계

| 페이지 | 비교 대상 | 증감 기준 | 비율 기준 | 예시 (기준월: 26년 1월) |
|:---|:---|:---|:---|:---|
| **재무상태표** | 전년동월 / 전월 / 당월 | 전월(MoM) | 전년동월(YoY) | 25.1월 / 25.12월 / 26.1월 |
| **여신검증** | 최근 3개월 매출 | 기준월 포함 | - | 11월, 12월, 1월 |
| **효율성 분석** | 전년 vs 당년 | 전년동월 | 전년동월 | 25년 vs 26년 |
| **경영요약** | 당월 vs 전월/전년 | 전월(MoM) | 전년동월(YoY) | 증감=MoM, 비율=YoY |
| **손익계산서** | 당기 vs 전기 | - | 전년동기 | 1~N월 누계 |

### 4.3 데이터 구조 확장

#### 10.3.1 FinancialValue 타입 (financialData 필드)

```typescript
interface FinancialValue {
  current: number;        // 당월 (기준월)
  previousMonth: number;  // 전월 (MoM 증감 계산용)
  previousYear: number;   // 전년동월 (YoY 비교용)
}
```

**예시** (기준월: 26년 1월):
```json
{
  "revenue": {
    "current": 1639,        // 26년 1월
    "previousMonth": 1644,  // 25년 12월
    "previousYear": 1062    // 25년 1월
  }
}
```

#### 10.3.2 BalanceSheetItem 타입 (balanceSheet 필드)

```typescript
interface BalanceSheetItem {
  label: string;
  jan25: number;           // 전년동월 (YoY 비교)
  dec25: number;           // 전월 (MoM 기준)
  jan26: number;           // 당월 (기준월)
  momChange: number;       // 월간 증감 (jan26 - dec25)
  momChangePercent: number;
  yoyChange: number;       // 연간 증감 (jan26 - jan25)
  yoyChangePercent: number;
}
```

**필드명 규칙**:
- `{월코드}{연도}` 형식: jan25, dec25, jan26 등
- 기준월이 바뀌면 필드명도 변경: feb26 기준 → jan26, jan25, feb26

#### 10.3.3 CreditVerification 타입 (여신검증)

```typescript
interface CreditVerificationItem {
  channel: string;
  nov: number;    // 기준월 -2개월 (11월)
  dec: number;    // 기준월 -1개월 (12월)
  jan: number;    // 기준월 (1월)
  arBalance: number;
  creditLimit: number;
  utilizationRate: number;
  status: string;
  notes: string[];
}
```

**원칙**: 기준월 포함 최근 3개월 매출 표시

### 4.4 재무비율 계산 원칙

#### 10.4.1 수익성 지표 (연환산)

```javascript
// 매출총이익률, 영업이익률: 월 데이터 그대로 사용
grossMargin = (매출액 - 매출원가) / 매출액 × 100
opMargin = 영업이익 / 매출액 × 100

// ROE, ROA: 월 데이터를 12배하여 연환산
avgEquity = (당월자기자본 + 전월자기자본) / 2
netIncome = 월영업이익 × 0.8 × 12  // 연환산 당기순이익
ROE = netIncome / avgEquity × 100

avgAssets = (당월총자산 + 전월총자산) / 2
ROA = netIncome / avgAssets × 100
```

**중요**:
- 1월 데이터는 1개월치이므로 연간 수익성을 추정하려면 12배 필요
- 전년동월 비교 시에도 동일하게 연환산 적용

#### 10.4.2 안정성 지표

```javascript
// 부채비율, 자기자본비율: 시점 잔액 기준 (연환산 불필요)
debtRatio = 총부채 / 자기자본 × 100
equityRatio = 자기자본 / 총자산 × 100

// 순차입금비율: 순차입금도 시점 잔액
netDebt = 차입금 - 현금
netDebtRatio = netDebt / 자기자본 × 100
```

#### 10.4.3 활동성 지표 (연환산)

```javascript
// 회전율: 월 매출/원가를 12배하여 연환산
avgReceivables = (당월매출채권 + 전월매출채권) / 2
receivablesTurnover = (월매출액 × 12) / avgReceivables

// 회전일수: 연환산 회전율 기준
DSO = 365 / receivablesTurnover

// 재고회전율, 매입채무회전율도 동일
inventoryTurnover = (월매출원가 × 12) / avgInventory
DIO = 365 / inventoryTurnover

payablesTurnover = (월매출원가 × 12) / avgPayables
DPO = 365 / payablesTurnover

// CCC (현금전환주기)
CCC = DSO + DIO - DPO
```

**전년동월 비교 시 평균 계산**:
- 당월: (26.1월 + 25.12월) / 2
- 전년: 25.1월 잔액 (24.12월 데이터 없으므로)

### 4.5 UI 표시 원칙

#### 10.5.1 경영요약 (page.tsx)

**KPI 카드**:
- 주 지표: 당월 값
- 부 지표: MoM 증감 + YoY 비율

```tsx
<p className="text-2xl">{formatNumber(d.totalAssets.current)}억</p>
<p className="text-xs">
  전월 대비 {formatNumber(assetMomChange)}억 ({assetMomChangePercent.toFixed(1)}%)
</p>
<p className="text-xs text-slate-400">
  전년 동기 대비 {assetYoyChangePercent.toFixed(1)}%
</p>
```

**수익성 분석**:
- 매출/영업이익: YoY 성장률 강조
- 영업이익률: 전년 → 당년 추이

#### 10.5.2 재무상태표 (balance-sheet/page.tsx)

**3개월 비교 테이블**:

| 항목 | 25년 1월 | 25년 12월 | 26년 1월 | 월간증감 | 연간증감 (YoY) |
|:---|---:|---:|---:|---:|---:|
| 현금 | 990 | 2,709 | 3,158 | +449 | +2,168 (219.0%) |

**증감 컬럼**:
- 월간증감: jan26 - dec25 (MoM)
- 연간증감: jan26 - jan25 (YoY)

#### 10.5.3 여신검증 (balance-sheet/page.tsx)

**테이블 헤더**: 기준월 포함 최근 3개월

| 채널 | 11월 | 12월 | 1월 | AR잔액 | 여신한도 | 이용률 |
|:---|---:|---:|---:|---:|---:|---:|

**기준월 변경 시**: oct/nov/dec → nov/dec/jan

#### 10.5.4 효율성 분석

**테이블 헤더**: 전년 vs 당년

| 지표 | 25년 1월 | 26년 1월 | 증감 |
|:---|---:|---:|---:|
| DSO | 56일 | 28일 | -28일 |

### 12.6 JSON 파일 작성 체크리스트

**기준월: 26년 1월 기준**

#### 2026-01.json 필수 필드:

```json
{
  "meta": {
    "year": 2026,
    "month": 1,
    "reportDate": "2026-01-31"
  },
  "financialData": {
    "revenue": {
      "current": 1639,        // 26.1월
      "previousMonth": 1644,  // 25.12월
      "previousYear": 1062    // 25.1월
    },
    // 모든 financialData 필드에 동일 구조
  },
  "balanceSheet": {
    "assets": [
      {
        "label": "현금및현금성자산",
        "jan25": 990,
        "dec25": 2709,
        "jan26": 3158,
        "momChange": 449,
        "momChangePercent": 16.6,
        "yoyChange": 2168,
        "yoyChangePercent": 219.0
      }
    ],
    "totals": [
      { "label": "총자산", "jan25": 20267, "dec25": 22155, "jan26": 22938, ... },
      { "label": "총부채", "jan25": 4910, "dec25": 3923, "jan26": 4292, ... },
      { "label": "총자본", "jan25": 15357, "dec25": 18232, "jan26": 18646, ... }
    ]
  },
  "creditVerification": [
    {
      "channel": "국내",
      "nov": 850,   // 11월
      "dec": 747,   // 12월
      "jan": 748,   // 1월
      ...
    }
  ]
}
```

#### 2025-01.json (전년동월 데이터):

```json
{
  "meta": { "year": 2025, "month": 1 },
  "financialData": {
    "revenue": { "current": 1062, "previous": 0 }
  },
  "balanceSheet": {
    "assets": [
      { "label": "현금및현금성자산", "current": 990, "previous": 0 }
    ]
  }
}
```

**필수**: 전년동월 JSON이 없으면 YoY 비교 불가

### 12.7 기준월 변경 시 작업 순서

1. **전년동월 JSON 확인/생성**
   - `2025-01.json` 존재 여부 확인
   - 없으면 CSV + Snowflake에서 생성

2. **당월 JSON 구조 확장**
   - `financialData`: `previous` → `previousMonth`, `previousYear`
   - `balanceSheet`: 3개월 필드 추가 (jan25, dec25, jan26)
   - `creditVerification`: 3개월 매출 업데이트 (nov, dec, jan)

3. **UI 컴포넌트 업데이트**
   - `page.tsx`: MoM/YoY 계산 로직 분리
   - `balance-sheet/page.tsx`: 3개월 비교 테이블
   - 모든 테이블 헤더: 월별 명시 (11월, 12월, 1월)

4. **연환산 계산 적용**
   - ROE, ROA: × 12
   - 회전율: × 12
   - 안정성 지표: 연환산 불필요 (시점 잔액)

5. **검증**
   - 합계 일치: 자산 = 부채 + 자본
   - 증감 계산: momChange = jan26 - dec25
   - YoY 계산: yoyChange = jan26 - jan25
   - NaN 체크: formatNumber/formatPercent에 null 처리

### 12.8 주의사항

1. **필드명 일관성**
   - 기준월이 바뀌면 JSON 필드명도 변경 (jan26 → feb26)
   - 하위 호환성 고려 시 기존 필드 유지 가능

2. **전년 데이터 부족 시**
   - 전년 12월 데이터 없으면 전년 1월만 사용
   - 평균 계산 불가 시 기말 잔액 사용

3. **연환산 주의**
   - 수익성/활동성 지표: 반드시 × 12
   - 안정성 지표: 시점 잔액이므로 × 12 불필요

4. **NaN 방지**
   - 모든 formatNumber, formatPercent에 null/NaN 체크
   - RatioCard 컴포넌트에 isNaN 처리

---

## 11. 버전 이력

| 날짜 | 버전 | 변경 내용 |
|:---|:---:|:---|
| 2025-01-14 | 1.0 | 초기 버전 작성 |
| 2025-01-14 | 2.0 | CSV는 월별 재무제표만, 나머지 Snowflake 검색으로 수정 |
| | | AI 분석 프롬프트 상세화 (경영요약 전체 항목) |
| | | 브랜드별/채널별 매출 쿼리 추가 |
| 2026-01-14 | 3.0 | 채널코드 상세화 (CHNL_CD 4,6,7,11,12 추가) |
| | | 채널별 매출 분석 테이블 형태로 변경 |
| | | 수출 지역별 매출 분석 추가 (중국/홍콩마카오/대만/기타) |
| | | 브랜드별 매출 분석 (수출 제외, 국내+사입) |
| | | 브랜드 믹스 원형 그래프 추가 |
| 2026-01-14 | 4.0 | **데이터 소스 원칙 명확화** |
| | | - 손익 데이터: Snowflake COPA 실적 사용 (CSV 아님) |
| | | - 재무상태표: CSV 월별재무제표 사용 |
| | | - 월별 JSON 파일 기반 대시보드 v2 구조 반영 |
| | | 검증 스크립트 추가 (verify_dec.py, verify_dec_channel.py) |
| 2026-02-10 | 5.0 | **기준월 변경 원칙 추가** |
| | | - MoM vs YoY 비교 체계 정립 |
| | | - 재무상태표 3개월 비교 구조 (전년동월/전월/당월) |
| | | - financialData 구조 확장 (previousMonth, previousYear) |
| | | - 연환산 계산 원칙 (수익성/활동성 지표 × 12) |
| | | - 여신검증 최근 3개월 매출 표시 |
| | | - JSON 필드명 규칙 및 작업 체크리스트 |
| 2026-02-11 | 6.0 | **데이터 처리 흐름 (Data Pipeline) 추가** |
| | | - 섹션 3: 손익계산서 → 재무상태표 → 재무비율 → 경영요약 프로세스 명시화 |
| | | - incomeStatement.ratio 값 사용 원칙 정립 (소수점 오차 방지) |
| | | - 경영요약 계산 로직 상세 설명 (수익성/안정성/활동성) |
| | | - previousMonth vs previousYear 구분 명확화 |
| | | - 데이터 일관성 체크리스트 추가 |
| | | - TypeScript optional 필드 처리 가이드 |
| 2026-02-11 | 7.0 | **매출채권 지역별 분류 체계 확립 (26.1월 업데이트)** ⭐ |
| | | - **섹션 4.6**: 매출채권 지역별 분류 원칙 추가 (데이터 소스 구분 명확화) |
| | | - **대만 분류 규칙**: 대만은 "홍콩/마카오/대만" 그룹에 포함 |
| | | - **TP채권 처리**: 홍콩/대만 AR에 FI전표 211억 별도 반영 (Snowflake 미반영) |
| | | - **Snowflake vs CSV 차이 조정**: 국내 +9억, 홍콩/대만 +211억 = 총 220억 조정 |
| | | - **여신검증 계산 공식**: 채널별 기준 (국내 1.5개월, 중국 1.0개월, 홍콩/대만 3개월, 기타 2개월) |
| | | - **SAP ZFIR0580**: 거래처별 잔액 조회 방법 및 Python 집계 스크립트 |
| | | - **데이터 신뢰도 우선순위**: CSV 총액 > 재무팀 제공 내역 > Snowflake 참고 |
| | | - 26년 1월 실제 적용 사례 및 계산 검증 결과 포함 |
| | | - 26.2월부터 즉시 적용 가능하도록 상세 가이드 작성 |

---

## 14. 자주 발생하는 오류 및 해결방법 (Troubleshooting Guide)

### 14.1 데이터 정합성 오류

#### 오류 1: 손익계산서 매출 ≠ 채널별 매출 합계

**증상**:
```
손익계산서 실판매출(V-): 1,638억
채널별 매출 합계: 736억 (국내만)
수출 매출 합계: 750억
총 합계: 1,486억 ← 152억 차이 발생
```

**원인**:
- 채널별/수출 매출 데이터를 이전 월 또는 잘못된 기간으로 조회
- 전년 데이터(25.1월)와 당기 데이터(26.1월) 혼용

**해결방법**:
```sql
-- 1단계: 당기 채널별 매출 (국내+사입) 정확히 조회
SELECT
    CASE
        WHEN CHNL_CD = '1' THEN '백화점'
        WHEN CHNL_CD = '3' THEN '대리점'
        WHEN CHNL_CD = '2' THEN '면세점'
        WHEN CHNL_CD = '5' THEN '직영점'
        WHEN CHNL_CD = '4' THEN '할인점'
        WHEN CHNL_CD = '6' THEN '아울렛'
        WHEN CHNL_CD = '7' THEN '온라인(자사몰)'
        WHEN CHNL_CD = '11' THEN '온라인(입점몰)'
        WHEN CHNL_CD = '8' THEN '사입'
        ELSE '기타'
    END AS CHANNEL,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT < '2026-02-01'  -- ★ 기간 정확히!
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')  -- 수출 제외
GROUP BY CHANNEL;

-- 2단계: 수출 매출 DW_DELV에서 조회
SELECT
    CASE
        WHEN SHOP_ID LIKE 'CN%' THEN '중국'
        WHEN SHOP_ID LIKE 'HK%' OR SHOP_ID LIKE 'MC%'
             OR SHOP_ID LIKE 'TW%' OR SHOP_ID LIKE 'TX%' THEN '홍콩/마카오/대만'
        ELSE '기타'
    END AS REGION,
    ROUND(SUM(SUPP_AMT) / 100000000, 0) AS SALE
FROM FNF.PRCS.DW_DELV
WHERE DELV_DT >= '2026-01-01' AND DELV_DT < '2026-02-01'  -- ★ 기간 정확히!
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND (SHOP_ID LIKE 'CN%' OR SHOP_ID LIKE 'HK%'
       OR SHOP_ID LIKE 'MC%' OR SHOP_ID LIKE 'TW%'
       OR SHOP_ID LIKE 'TH%' OR SHOP_ID LIKE 'MY%'
       OR SHOP_ID LIKE 'ID%' OR SHOP_ID LIKE 'VN%'
       OR SHOP_ID LIKE 'SG%' OR SHOP_ID LIKE 'AE%'
       OR SHOP_ID LIKE 'KH%' OR SHOP_ID LIKE 'TX%'
       OR SHOP_ID LIKE 'HX%')
GROUP BY REGION;

-- 3단계: 검증
-- 국내 합계 + 수출 합계 ≈ 손익계산서 실판매출(V-) (±1~2억 허용, 반올림 차이)
```

**예방책**:
- 손익 데이터 조회 후 즉시 채널별/수출 매출 조회하여 합계 일치 확인
- JSON 작성 전 엑셀에서 합계 검산

---

#### 오류 2: 영업이익 계산 누락 (0억 표시)

**증상**:
```json
"operatingProfit": {
  "current": 0,
  "previous": 0,
  "ratio": 0
}
```

손익계산서 탭에서 영업이익 0억, 영업이익률 0.0% 표시

**원인**:
- `financialData.operatingProfit` 업데이트 누락
- `incomeStatement.operatingProfit` 계산 누락

**해결방법**:
```javascript
// 2026-01.json 수정
{
  "financialData": {
    "operatingProfit": {
      "current": 642,        // ★ 계산: 1064(매출총이익) - 172(점수수료) - 250(직접비)
      "previousMonth": 679,  // 전월 값
      "previousYear": 656    // 전년 동월 값
    }
  },
  "incomeStatement": {
    "operatingProfit": {
      "current": 642,
      "previous": 656,       // 전년 동월
      "change": -14,
      "changePercent": -2.1,
      "ratio": 39.2,         // 642 ÷ 1638 × 100
      "note": "= 매출총이익 - 점수수료 - 직접비"
    }
  }
}
```

**계산 공식**:
```
영업이익 = 매출총이익 - 점수수료 - 직접비 - 간접비
        = 1,064 - 172 - 250 - 0
        = 642억

영업이익률 = 영업이익 ÷ 실판매출(V-) × 100
          = 642 ÷ 1,638 × 100
          = 39.2%
```

---

#### 오류 3: 수익성 지표 전년 값 오류 (previousMonth vs previousYear 혼동)

**증상**:
```
매출총이익률: 64.9% (전년 66.2% 표시) ← 실제 64.8%여야 함
영업이익률: 39.2% (전년 41.3% 표시) ← 실제 39.9%여야 함
```

**원인**:
- `income-statement/page.tsx`에서 `financialData.previousMonth` 사용
- 실제로는 `previousYear` (전년 동기) 사용해야 함

**해결방법**:
```typescript
// income-statement/page.tsx 수정
// ❌ 잘못된 코드
const prevGrossMargin = financialData.revenue.previousMonth && financialData.cogs.previousMonth
  ? ((financialData.revenue.previousMonth - financialData.cogs.previousMonth) / financialData.revenue.previousMonth * 100)
  : 0;

// ✅ 올바른 코드
const prevGrossMargin = financialData.revenue.previousYear && financialData.cogs.previousYear
  ? ((financialData.revenue.previousYear - financialData.cogs.previousYear) / financialData.revenue.previousYear * 100)
  : 0;
```

**체크리스트**:
- [ ] 손익계산서 페이지: YoY 비교 (previousYear)
- [ ] 경영요약 페이지: YoY 비교 (previousYear)
- [ ] 재무상태표 페이지: MoM/YoY 둘 다 표시

---

#### 오류 4: ROE/ROA 계산 오류 (× 0.8 임의 추정)

**증상**:
```
ROE: 26.9% (전년 0.0%)
ROA: 21.8% (전년 0.0%)
```

당기순이익 추정에 임의의 × 0.8 사용

**원인**:
- 법인세율을 고려하지 않은 임의 추정치 사용
- 전년 ROE/ROA 계산 누락

**정확한 계산방법**:
```
# 1단계: 25년 연환산 실적 확인
25년 매출(V-): 17,026억 (Snowflake 조회)
25년 영업이익: 5,013억 (가이드 참조)

# 2단계: 법인세율 적용 당기순이익 계산
25년 법인세율: 25.5%
25년 당기순이익 = 5,013 × (1 - 0.255) = 3,735억

26년 법인세율: 26.5%
26년 영업이익 연환산 = 642 (26.1월) + 4,357 (25.2~12월) = 4,999억
26년 당기순이익 = 4,999 × (1 - 0.265) = 3,674억

# 3단계: ROE/ROA 계산
25년 ROE = 3,735 ÷ 15,357 × 100 = 24.3%
25년 ROA = 3,735 ÷ 20,267 × 100 = 18.4%

26년 ROE = 3,674 ÷ 18,646 × 100 = 19.7%
26년 ROA = 3,674 ÷ 22,938 × 100 = 16.0%
```

**2025-01.json / 2026-01.json 업데이트**:
```json
{
  "ratios": {
    "profitability": {
      "roe": { "current": 0, "previous": 0, "annualized": 24.3 },
      "roa": { "current": 0, "previous": 0, "annualized": 18.4 }
    }
  }
}
```

---

#### 오류 5: 회전율 분석 전체 NaN 표시 (Activity Ratios)

**증상**:
```
재고회전일수 (DIO): NaN일
매출채권회전일수 (DSO): NaN일
매입채무회전일수 (DPO): NaN일
현금전환주기 (CCC): NaN일
```

모든 회전율 지표가 NaN으로 표시되어 분석 불가

**발생 원인 (3단계)**:

**1단계: 데이터 구조 불일치**
```typescript
// 문제: 2025-01.json이 구조가 다름
// 2026-01.json
"receivables": { "current": 2350, "previousMonth": 1966, "previousYear": 1970 }

// 2025-01.json (잘못됨)
"receivables": { "current": 1970, "previous": 0 }  // ❌ previousYear 필드 없음!
```

**해결**: 2025-01.json을 2026-01.json과 동일한 구조로 변경
```json
{
  "financialData": {
    "receivables": { "current": 1970, "previousMonth": 1970, "previousYear": 1970 },
    "inventory": { "current": 2101, "previousMonth": 2101, "previousYear": 2101 },
    "payables": { "current": 821, "previousMonth": 821, "previousYear": 821 }
  }
}
```

**2단계: 변수 선언 순서 오류 (ReferenceError)**
```typescript
// ❌ 잘못된 코드 (page.tsx)
console.log('prevD:', prevD);  // Line 82
...
const prevD = prevReport?.financialData;  // Line 98 - 나중에 선언!

// ✅ 올바른 코드
const prevD = prevReport?.financialData;  // 먼저 선언
...
console.log('prevD:', prevD);  // 이후 사용
```

**3단계: 단월 매출 사용 오류 (연환산 미적용)**
```typescript
// ❌ 잘못된 코드 (balance-sheet/page.tsx)
const receivablesTurnover = {
  current: d.revenue.current / avgReceivables,  // 1,638억 (단월) ÷ 2,158 = 잘못됨!
  previous: d.revenue.previous / avgReceivablesPrev
};

// ✅ 올바른 코드
const annualizedRevenue = reportData.annualized?.revenue || (d.revenue.current * 12);  // 17,006억
const receivablesTurnover = {
  current: avgReceivables > 0 ? annualizedRevenue / avgReceivables : 0,  // 17,006 ÷ 2,158 = 7.9회
  previous: avgReceivablesPrev > 0 ? prevAnnualizedRevenue / avgReceivablesPrev : 0
};
```

**완전한 해결 코드 (balance-sheet/page.tsx)**:
```typescript
const turnoverMetrics = useMemo(() => {
  if (!reportData) return null;
  const d = reportData.financialData;

  // 연환산 매출/원가 사용 (회전율은 연간 기준으로 계산)
  const annualizedRevenue = reportData.annualized?.revenue || (d.revenue.current * 12);
  const annualizedCogs = reportData.annualized?.cogs || (d.cogs.current * 12);

  // 전년 연환산 (25년 1~12월 실적)
  const prevAnnualizedRevenue = 17026;  // 25년 실적
  const prevAnnualizedCogs = 6158;      // 25년 실적

  // 26년 1월 기준 평균 (current + previousMonth) / 2
  const avgReceivables = d.receivables.previousMonth !== undefined
    ? (d.receivables.current + d.receivables.previousMonth) / 2
    : d.receivables.current;
  const avgInventory = d.inventory.previousMonth !== undefined
    ? (d.inventory.current + d.inventory.previousMonth) / 2
    : d.inventory.current;
  const avgPayables = d.payables.previousMonth !== undefined
    ? (d.payables.current + d.payables.previousMonth) / 2
    : d.payables.current;

  // 25년 1월 기준 평균 (전년 데이터)
  const avgReceivablesPrev = d.receivables.previousYear || 1970;
  const avgInventoryPrev = d.inventory.previousYear || 2101;
  const avgPayablesPrev = d.payables.previousYear || 821;

  // 회전율 계산 (연환산 기준)
  const receivablesTurnover = {
    current: avgReceivables > 0 ? annualizedRevenue / avgReceivables : 0,
    previous: avgReceivablesPrev > 0 ? prevAnnualizedRevenue / avgReceivablesPrev : 0
  };
  const inventoryTurnover = {
    current: avgInventory > 0 ? annualizedCogs / avgInventory : 0,
    previous: avgInventoryPrev > 0 ? prevAnnualizedCogs / avgInventoryPrev : 0
  };
  const payablesTurnover = {
    current: avgPayables > 0 ? annualizedCogs / avgPayables : 0,
    previous: avgPayablesPrev > 0 ? prevAnnualizedCogs / avgPayablesPrev : 0
  };

  // 회전일수 계산
  const dso = {
    current: receivablesTurnover.current > 0 ? 365 / receivablesTurnover.current : 0,
    previous: receivablesTurnover.previous > 0 ? 365 / receivablesTurnover.previous : 0
  };
  const dio = {
    current: inventoryTurnover.current > 0 ? 365 / inventoryTurnover.current : 0,
    previous: inventoryTurnover.previous > 0 ? 365 / inventoryTurnover.previous : 0
  };
  const dpo = {
    current: payablesTurnover.current > 0 ? 365 / payablesTurnover.current : 0,
    previous: payablesTurnover.previous > 0 ? 365 / payablesTurnover.previous : 0
  };
  const ccc = {
    current: dso.current + dio.current - dpo.current,
    previous: dso.previous + dio.previous - dpo.previous
  };

  return { dso, dio, dpo, ccc };
}, [reportData]);
```

**계산 예시 (26년 1월)**:
```
연환산 매출: 17,006억 (26.1월 + 25.2~12월)
연환산 원가: 6,129억
평균 매출채권: (2,350 + 1,966) / 2 = 2,158억
평균 재고자산: (2,198 + 2,300) / 2 = 2,249억
평균 매입채무: (957 + 905) / 2 = 931억

매출채권회전율 = 17,006 ÷ 2,158 = 7.9회
DSO = 365 ÷ 7.9 = 46일

재고자산회전율 = 6,129 ÷ 2,249 = 2.7회
DIO = 365 ÷ 2.7 = 134일

매입채무회전율 = 6,129 ÷ 931 = 6.6회
DPO = 365 ÷ 6.6 = 55일

CCC = 46 + 134 - 55 = 125일
```

**주요 체크포인트**:
- [ ] 2025-01.json에 receivables/inventory/payables의 previousMonth, previousYear 필드 존재
- [ ] page.tsx에서 prevD 선언이 사용보다 먼저
- [ ] balance-sheet/page.tsx에서 annualizedRevenue/Cogs 사용 (단월 아님!)
- [ ] 회전율 계산 시 0으로 나누기 방지 (조건문 사용)

**디버깅 방법**:
1. 브라우저 콘솔에서 에러 확인 (ReferenceError, NaN)
2. console.log로 중간 계산값 출력
3. 개발서버 재시작 (캐시 클리어: `rm -rf .next && npm run dev`)

---

### 14.2 월간 업데이트 정확한 작성 순서 (Critical Path)

#### Phase 1: 데이터 수집 (Snowflake + CSV)

```
1️⃣ 당기(26.1월) 손익 데이터 조회
   ├─ 실판매출(V+, V-)
   ├─ 매출원가
   ├─ 매출총이익 및 비율
   └─ 국내/수출 매출 구분

2️⃣ 전년(25.1월) 손익 데이터 조회
   ├─ 동일 쿼리, PST_DT만 변경
   └─ 비교 기준 확보

3️⃣ 채널별/수출 매출 조회 (당기 + 전년)
   ├─ 국내 채널별 (백화점, 대리점, 면세점 등)
   ├─ 수출 지역별 (중국, 홍콩/대만, 기타)
   └─ ★ 합계 검증: 국내+수출 = 손익 매출

4️⃣ 재무상태표 CSV 읽기
   ├─ 25년 1월 / 25년 12월 / 26년 1월 (3개월)
   ├─ 자산/부채/자본 항목별 추출
   └─ MoM/YoY 증감 계산

5️⃣ 매출채권 상세 조회 (Snowflake DM_F_FI_AR_AGING)
   ├─ 국내/수출 지역별 분류
   ├─ TP채권 별도 확인
   └─ CSV 총액과 일치 검증
```

#### Phase 2: JSON 파일 작성 (순서 중요!)

```
1️⃣ 2026-01.json 작성 시작

   Step 1: meta 섹션
   ├─ year: 2026, month: 1
   └─ updatedAt: 작성일자

   Step 2: financialData 섹션 (★ 가장 먼저!)
   ├─ revenue: { current, previousMonth, previousYear }
   ├─ cogs: { current, previousMonth, previousYear }
   ├─ operatingProfit: { current, previousMonth, previousYear } ← ★ 필수!
   ├─ totalAssets, cash, receivables, inventory, ...
   ├─ totalLiabilities, borrowings, ...
   └─ equity, retainedEarnings

   Step 3: incomeStatement 섹션
   ├─ revenue 배열 (택가, V+, V-, 국내, 수출, 할인율)
   ├─ costs 배열 (매출원가, 점수수료, 직접비, 간접비)
   ├─ grossProfit { current, previous, ratio } ← ratio 필수!
   └─ operatingProfit { current, previous, ratio } ← ratio 필수!

   Step 4: channelSales + exportSales 배열
   ├─ ★ 합계 검증: Σ channelSales + Σ exportSales ≈ revenue
   └─ YoY 증감율 계산

   Step 5: brandSales 배열
   └─ domestic/export 구분 포함

   Step 6: balanceSheet 섹션
   ├─ assets, liabilities, equity 배열
   ├─ 3개월 비교: jan25, dec25, jan26
   ├─ momChange, yoyChange 계산
   └─ totals 합계 검증

   Step 7: workingCapital 섹션
   ├─ creditVerification (여신검증)
   └─ ar (매출채권 지역별)

   Step 8: ratios 섹션
   ├─ profitability (법인세율 적용!)
   ├─ stability
   └─ activity

   Step 9: aiInsights 섹션
   └─ 재무분석가 관점 작성

2️⃣ 2025-01.json 작성 (전년 비교 기준)

   ├─ 25.1월 단월 실적 (누계 아님!)
   ├─ incomeStatement.grossProfit.ratio: 64.8%
   ├─ incomeStatement.operatingProfit.ratio: 39.9%
   ├─ ratios.profitability (25년 연환산)
   │   ├─ grossMargin: 63.8%
   │   ├─ operatingMargin: 29.4%
   │   ├─ roe: 24.3% (법인세율 25.5% 적용)
   │   └─ roa: 18.4%
   └─ meta.note: "25년 1월 단월 실적 (누계 아님)"
```

#### Phase 3: 검증 체크리스트 (Quality Assurance)

```
✅ 데이터 정합성
   □ 손익 매출 = 채널별 합계 + 수출 합계 (±1~2억 허용)
   □ 총자산 = 총부채 + 총자본 (완전 일치)
   □ 매출총이익 = 매출 - 매출원가
   □ 영업이익 = 매출총이익 - 점수수료 - 직접비 - 간접비

✅ 비율 계산
   □ 매출총이익률 = 매출총이익 ÷ 매출 × 100
   □ 영업이익률 = 영업이익 ÷ 매출 × 100
   □ ROE = 당기순이익 ÷ 자기자본 × 100 (법인세율 적용!)
   □ ROA = 당기순이익 ÷ 총자산 × 100 (법인세율 적용!)

✅ 전년 비교
   □ incomeStatement.previous = 25.1월 값
   □ financialData.previousYear = 25.1월 값
   □ income-statement/page.tsx: previousYear 사용 확인
   □ page.tsx: prevReport 정확히 import

✅ 영업이익 확인
   □ financialData.operatingProfit.current > 0
   □ incomeStatement.operatingProfit.current > 0
   □ incomeStatement.operatingProfit.ratio > 0
   □ KPI 카드 영업이익 표시 확인

✅ 브라우저 테스트
   □ http://localhost:3005 접속
   □ 경영요약: KPI 5개, 수익성 지표 5개 정상 표시
   □ 손익계산서: 매출/비용/영업이익 정상, 전년 비교 정확
   □ 재무상태표: 3개월 비교, MoM/YoY 증감 정확
   □ F12 개발자도구 Console 에러 없음
```

#### Phase 4: 캐시 이슈 대응

```
1️⃣ 개발 서버 재시작
   cd "C:\Users\AC1144\...\fnf-dashboard_v2"
   rm -rf .next
   npm run dev -- --port 3005

2️⃣ 브라우저 강력 새로고침
   - Windows: Ctrl + Shift + R 또는 Ctrl + F5
   - Mac: Cmd + Shift + R

3️⃣ 여전히 안 되면
   - 브라우저 개발자도구 (F12)
   - Application → Clear storage → Clear site data
   - 서버 재시작 + 브라우저 재시작
```

---

### 14.3 데이터 소스별 신뢰도 및 우선순위

| 순위 | 데이터 소스 | 신뢰도 | 용도 | 비고 |
|:---:|:---|:---:|:---|:---|
| 1 | **CSV 재무제표** | ⭐⭐⭐⭐⭐ | 재무상태표 총액 | 공식 재무팀 제공, 최종 확정 |
| 2 | **Snowflake DW_COPA_D** | ⭐⭐⭐⭐ | 손익계산서, 채널별 매출 | 실시간 업데이트, 상세 분석 |
| 3 | **Snowflake DW_DELV** | ⭐⭐⭐⭐ | 수출 지역별 매출 | 출고 기준, 정확도 높음 |
| 4 | **Snowflake DM_F_FI_AR_AGING** | ⭐⭐⭐ | 매출채권 상세 | TP채권 미포함, CSV 대조 필요 |
| 5 | **SAP ZFIR0580 (수동)** | ⭐⭐⭐⭐⭐ | TP채권 확인 | Snowflake 미반영 항목 |
| 6 | **가이드 연환산 추정** | ⭐⭐⭐ | ROE/ROA 참고 | 법인세율 25.5%/26.5% 적용 |

**불일치 발생 시 우선순위**:
```
1순위: CSV 총액 (재무팀 공식)
2순위: SAP ZFIR0580 수동 조회
3순위: Snowflake (참고/상세 분석)
```

**매출채권 예시 (26.1월)**:
```
CSV 총액: 2,350억
Snowflake DM_F_FI_AR_AGING: 2,139억
차이: 211억 (TP채권, FI전표)

→ CSV 2,350억을 기준으로 하고,
  211억을 홍콩/대만 지역에 별도 주석 표기
```

---

### 14.4 월간 업데이트 소요 시간 (예상)

| 단계 | 작업 내용 | 소요 시간 | 비고 |
|:---|:---|---:|:---|
| **Phase 1** | Snowflake 쿼리 (당기+전년) | 30분 | SQL 복사/수정, 결과 저장 |
| | CSV 파일 읽기 (3개월) | 10분 | 25.1, 25.12, 26.1 |
| | 데이터 검증 (합계 확인) | 15분 | 매출 일치, BS 균형 |
| **Phase 2** | 2026-01.json 작성 | 45분 | financialData → ratios 순서대로 |
| | 2025-01.json 업데이트 | 15분 | 전년 비교 기준 |
| **Phase 3** | JSON 검증 (계산 재확인) | 20분 | 엑셀 검산, 비율 확인 |
| | 브라우저 테스트 | 15분 | 3개 탭 모두 확인 |
| **Phase 4** | 오류 수정 (있을 경우) | 30분 | 캐시 삭제, 서버 재시작 |
| **합계** | | **약 3시간** | 숙련 시 2시간 이내 가능 |

**단축 팁**:
- SQL 쿼리 템플릿 저장 (날짜만 변경)
- 엑셀 검산 시트 미리 준비
- 이전 월 JSON 복사 후 값만 교체
- 개발 서버 미리 실행

---

## 15. Vercel 배포 프로세스

### 15.1 배포 전 체크리스트

**필수 확인 사항**:
- [ ] 로컬 개발 서버 정상 작동 (`npm run dev`)
- [ ] 로컬 프로덕션 빌드 성공 (`npm run build`)
- [ ] TypeScript 오류 없음
- [ ] 3개 페이지 모두 데이터 정상 표시
- [ ] Git 커밋 완료 및 푸시

---

### 15.2 배포 방법

#### 방법 1: Vercel CLI 수동 배포 (권장)

**이유**: Monorepo 구조로 인해 GitHub 자동 배포가 실패할 수 있음

```bash
# 1. 프로젝트 디렉토리로 이동
cd "C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard_v2"

# 2. 로컬 빌드 테스트
npm run build

# 3. 프로덕션 배포
vercel --prod
```

**배포 과정**:
```
✓ Compiled successfully in 10.2s
✓ Generating static pages using 1 worker (6/6)
✓ Build Completed in /vercel/output [20s]
Aliased: https://fnf-dashboardv2.vercel.app [35s]
```

**예상 소요 시간**: 약 35~60초

---

#### 방법 2: GitHub 자동 배포 (설정 필요)

**주의**: 현재 Monorepo 구조로 인해 자동 배포 실패 중

**해결 방법**:
1. Vercel 대시보드 접속
2. 프로젝트 설정 (fnf-dashboard_v2) → Settings
3. **Root Directory** 설정:
   ```
   AI_Fin_Analysis/Claude/Monthly_Report/fnf-dashboard_v2
   ```
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. 설정 저장 후 GitHub push 시 자동 배포

---

### 15.3 배포 확인

#### 배포 성공 확인
```bash
# 최근 배포 목록 확인
vercel ls

# 출력 예시:
# Age     Deployment                             Status      Environment
# 1m      https://fnf-dashboardv2-ok8l...        ● Ready     Production
```

#### 브라우저 테스트
1. **메인 도메인 접속**: https://fnf-dashboardv2.vercel.app
2. **3개 페이지 확인**:
   - ✅ 경영요약 (`/`)
   - ✅ 손익계산서 (`/income-statement`)
   - ✅ 재무상태표 (`/balance-sheet`)
3. **데이터 정합성 검증**:
   - 매출/영업이익 금액 일치
   - 전월/전년 대비 증감 정확성
   - 회전율 지표 (DIO, DSO, DPO) NaN 없음

---

### 15.4 자주 발생하는 배포 오류

#### 오류 1: GitHub 자동 배포 실패 (● Error 상태)

**증상**:
```bash
vercel ls
# Age     Deployment                             Status      Environment
# 17h     https://fnf-dashboardv2-ams5r...       ● Error     Production
```

**원인**: Monorepo 구조로 인해 프로젝트 루트를 찾지 못함

**해결**:
```bash
# Vercel CLI로 수동 배포
cd "C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard_v2"
vercel --prod
```

**근본 해결**: Vercel 대시보드에서 Root Directory 명시 (15.2 방법 2 참조)

---

#### 오류 2: 빌드 중 TypeScript 오류

**증상**:
```
Error: Type error: Property 'annualized' does not exist on type 'MonthlyReportData'
```

**해결**:
1. 로컬 빌드로 오류 확인:
   ```bash
   npm run build
   ```
2. `src/types/financial.ts`에 누락된 타입 추가
3. 또는 임시 우회: `tsconfig.json`에서 `strict: false` 설정

---

#### 오류 3: 404 NOT_FOUND 에러

**증상**: 배포는 성공했으나 브라우저에서 404 에러

**원인**:
- 잘못된 프로젝트 배포 (예: fnf-monthly-report.vercel.app)
- 정적 페이지 생성 실패

**해결**:
1. 올바른 도메인 확인: `fnf-dashboardv2.vercel.app`
2. 오류 프로젝트 삭제:
   - Vercel 대시보드 → Projects
   - 오류 프로젝트 (fnf-monthly-report) → Settings → Delete Project
3. 정상 프로젝트로 재배포

---

#### 오류 4: 환경 변수 누락

**증상**: Snowflake 연결 오류 (해당 시)

**해결**:
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. `.env.local` 파일의 변수 추가:
   ```
   SNOWFLAKE_ACCOUNT=xxx
   SNOWFLAKE_USERNAME=xxx
   SNOWFLAKE_PASSWORD=xxx
   SNOWFLAKE_WAREHOUSE=xxx
   SNOWFLAKE_DATABASE=xxx
   ```
3. 재배포

**참고**: 현재 프로젝트는 정적 JSON 사용으로 환경 변수 불필요

---

### 15.5 배포 URL 관리

**현재 배포 중인 프로젝트**:

| 프로젝트명 | 도메인 | 상태 | 용도 | 비고 |
|:---|:---|:---:|:---|:---|
| **fnf-dashboard_v2** | https://fnf-dashboardv2.vercel.app | ✅ Active | 26년 1월 대시보드 | 메인 사용 |
| fnf-dashboard | https://fnf-dashboard.vercel.app | ⚠️ Old | 25년 12월 대시보드 | 참고용 |
| ~~fnf-monthly-report~~ | ~~fnf-monthly-report.vercel.app~~ | ❌ Error | 삭제 권장 | 오류 프로젝트 |

**권장 조치**:
- ✅ **fnf-dashboard_v2**: 계속 사용, 매월 업데이트
- ⚠️ **fnf-dashboard**: 보존 (이전 버전 참조용)
- ❌ **fnf-monthly-report**: Vercel 대시보드에서 삭제

---

### 15.6 월간 업데이트 시 배포 워크플로우

```
Step 1: 로컬 작업
   ↓
   - src/data/YYYY-MM.json 업데이트
   - npm run dev로 확인
   - npm run build로 빌드 테스트

Step 2: Git 커밋
   ↓
   - git add .
   - git commit -m "Update: YYYY년 MM월 재무 데이터"
   - git push origin main

Step 3: Vercel 배포
   ↓
   - vercel --prod (수동 배포)
   - 또는 GitHub 자동 배포 (Root Directory 설정 후)

Step 4: 배포 확인
   ↓
   - https://fnf-dashboardv2.vercel.app 접속
   - 3개 페이지 데이터 정합성 확인
   - 오류 발생 시 15.4 참조
```

**예상 소요 시간**: 약 5분
- 로컬 빌드 테스트: 1분
- Git 커밋/푸시: 30초
- Vercel 배포: 1분
- 브라우저 확인: 2분

---

### 15.7 배포 문제 해결 흐름도

```
배포 실패?
   │
   ├─ 로컬 빌드 실패?
   │  ├─ YES → TypeScript 오류 수정 (15.4 오류 2)
   │  └─ NO → 다음 단계
   │
   ├─ Vercel CLI 배포 실패?
   │  ├─ YES → 인증 확인 (vercel login)
   │  └─ NO → 다음 단계
   │
   ├─ GitHub 자동 배포 실패?
   │  ├─ YES → Root Directory 설정 (15.2 방법 2)
   │  └─ NO → 다음 단계
   │
   └─ 배포는 성공했으나 404?
      └─ 올바른 URL 확인 (15.5)
```

---

### 15.8 배포 모니터링

#### Vercel CLI 명령어

```bash
# 배포 목록 확인
vercel ls

# 특정 배포 로그 확인
vercel logs [deployment-url]

# 현재 프로덕션 URL 확인
vercel inspect

# 이전 배포로 롤백
vercel rollback [deployment-url]
```

#### 배포 알림 설정 (선택)

1. Vercel 대시보드 → Settings → Notifications
2. **Deployment Created**: 배포 시작 시 알림
3. **Deployment Ready**: 배포 성공 시 알림
4. **Deployment Error**: 배포 실패 시 알림

---

## 16. 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|:---:|:---|:---|
| 9.0 | 2026-02-11 | • **Vercel 배포 프로세스 가이드 추가** (15장)<br>• 배포 전 체크리스트 및 워크플로우 정리<br>• Monorepo 구조 배포 문제 해결 방법<br>• GitHub 자동 배포 vs CLI 수동 배포<br>• 4가지 배포 오류 및 해결 방법 문서화<br>• 배포 URL 관리 및 모니터링 가이드 |
| 8.0 | 2026-02-11 | • **회전율 분석 NaN 오류 해결 가이드 추가** (오류 5)<br>• 단월 vs 연환산 매출 사용 원칙 명확화<br>• 데이터 구조 일관성 체크리스트 추가<br>• 변수 선언 순서 오류 사례 문서화<br>• balance-sheet/page.tsx 전면 수정 가이드<br>• ReferenceError 디버깅 방법 정리 |
| 7.0 | 2026-02-11 | • 자주 발생하는 오류 및 해결방법 추가 (14장)<br>• 월간 업데이트 정확한 작성 순서 가이드 추가<br>• ROE/ROA 법인세율 적용 계산법 정리<br>• 데이터 정합성 검증 체크리스트 추가<br>• 26.1월 실제 작업 중 발생한 4대 오류 사례 문서화 |
| 6.0 | 2026-02-10 | • 매출채권 지역별 분류 원칙 (4.6장)<br>• TP채권 처리 방법 추가<br>• 대만 → 홍콩/마카오/대만 그룹 분류 |
| 5.0 | 2026-02-09 | • 기준월 변경 원칙 (12장)<br>• MoM/YoY 비교 기준 명확화 |
| 4.0 | 2026-02-08 | • 재무상태표 3개월 비교 구조<br>• 여신검증 3개월 매출 기준 |

---

*Generated by Claude - FNF Dashboard Monthly Update Guide v9.0*

# FNF 재무제표 대시보드 월간 업데이트 가이드

**작성일**: 2026년 2월
**버전**: 5.0
**대시보드 URL**: https://fnf-dashboard.vercel.app

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

## 3. Snowflake 쿼리 가이드

### 3.1 연결 정보

```
Account: gv28284.ap-northeast-2.aws
Database: FNF
Schema: SAP_FNF (COPA, AR) / PRCS (재고, 매출)
Warehouse: dev_wh
Role: pu_sql_sap
```

### 3.2 브랜드별/채널별 매출 조회 (DW_COPA_D)

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

### 3.3 매출채권 (AR) 검증 쿼리

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

### 3.4 월별 수출매출 조회

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

### 3.5 재고자산 검증 쿼리

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

---

## 4. 계산 로직

### 4.1 여신검증 - 채권개월수 계산

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

## 5. 월간 업데이트 절차

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

### 5.2 Step 2: Snowflake 검증 스크립트 실행

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

### 5.3 Step 3: 대시보드 코드 업데이트

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

### 5.4 Step 4: 배포

```bash
cd fnf-dashboard
git add .
git commit -m "Update: YYYY년 MM월 재무데이터"
git push origin main
vercel --prod --yes
```

---

## 6. AI 분석 항목 및 프롬프트

### 6.1 경영요약 탭 AI 분석 항목

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

### 6.2 AI 인사이트 생성 프롬프트

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

### 6.3 여신검증 분석 프롬프트

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

### 6.4 재고 분석 프롬프트

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

## 7. 사용자 요청 데이터 양식

### 7.1 월별 재무제표 CSV 양식 (유일한 CSV 입력)

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

### 7.2 여신검증 비고 양식 (사용자 추가 정보)

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

## 10. 검증 체크리스트

### 10.1 데이터 정합성

```
□ 재무제표 합계 일치? (자산 = 부채 + 자본)
□ 손익계산서 합계 일치? (매출 - 비용 = 이익)
□ Snowflake 조회 결과와 CSV 데이터 비교?
□ 전년 동기 데이터 정확성?
```

### 10.2 Snowflake 여신검증

```
□ AR 쿼리 필터 정확? (ZARTYP='R1', WWDCH='09')
□ CUST_CD로 지역 구분 정확?
□ 월별 매출 합계와 채권개월수 계산 일치?
□ 정상채권 기준 적용? (국내/중국 1개월, 홍콩 3개월, 기타 2개월)
```

### 10.3 Snowflake 재고검증

```
□ CREATE_DT 최신값 필터?
□ 아이템코드 추출 로직 정확? (ST는 8번째, 나머지 7번째)
□ 시즌 구분 정확? (당시즌: 25F)
□ 브랜드 6개 모두 포함?
□ 의류 아이템코드 필터 적용?
```

### 10.4 Snowflake 매출검증

```
□ SALE_TYPE IN ('N','T') 필터 적용? (DW_SALE 사용 시)
□ CHNL_CD로 채널 구분 정확?
□ COPA vs Guide 일치도 확인? (DOMESTIC 97~99%, SIB/EXPORT 100%)
```

---

## 11. 기준월 변경 원칙 (v5.0 추가)

### 11.1 기준월 정의

**기준월**: 보고서 작성 대상 월 (예: 26년 1월)

대시보드는 기준월을 중심으로 전월 대비(MoM) 및 전년동월 대비(YoY) 비교를 수행합니다.

### 11.2 비교 기준 체계

| 페이지 | 비교 대상 | 증감 기준 | 비율 기준 | 예시 (기준월: 26년 1월) |
|:---|:---|:---|:---|:---|
| **재무상태표** | 전년동월 / 전월 / 당월 | 전월(MoM) | 전년동월(YoY) | 25.1월 / 25.12월 / 26.1월 |
| **여신검증** | 최근 3개월 매출 | 기준월 포함 | - | 11월, 12월, 1월 |
| **효율성 분석** | 전년 vs 당년 | 전년동월 | 전년동월 | 25년 vs 26년 |
| **경영요약** | 당월 vs 전월/전년 | 전월(MoM) | 전년동월(YoY) | 증감=MoM, 비율=YoY |
| **손익계산서** | 당기 vs 전기 | - | 전년동기 | 1~N월 누계 |

### 11.3 데이터 구조 확장

#### 11.3.1 FinancialValue 타입 (financialData 필드)

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

#### 11.3.2 BalanceSheetItem 타입 (balanceSheet 필드)

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

#### 11.3.3 CreditVerification 타입 (여신검증)

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

### 11.4 재무비율 계산 원칙

#### 11.4.1 수익성 지표 (연환산)

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

#### 11.4.2 안정성 지표

```javascript
// 부채비율, 자기자본비율: 시점 잔액 기준 (연환산 불필요)
debtRatio = 총부채 / 자기자본 × 100
equityRatio = 자기자본 / 총자산 × 100

// 순차입금비율: 순차입금도 시점 잔액
netDebt = 차입금 - 현금
netDebtRatio = netDebt / 자기자본 × 100
```

#### 11.4.3 활동성 지표 (연환산)

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

### 11.5 UI 표시 원칙

#### 11.5.1 경영요약 (page.tsx)

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

#### 11.5.2 재무상태표 (balance-sheet/page.tsx)

**3개월 비교 테이블**:

| 항목 | 25년 1월 | 25년 12월 | 26년 1월 | 월간증감 | 연간증감 (YoY) |
|:---|---:|---:|---:|---:|---:|
| 현금 | 990 | 2,709 | 3,158 | +449 | +2,168 (219.0%) |

**증감 컬럼**:
- 월간증감: jan26 - dec25 (MoM)
- 연간증감: jan26 - jan25 (YoY)

#### 11.5.3 여신검증 (balance-sheet/page.tsx)

**테이블 헤더**: 기준월 포함 최근 3개월

| 채널 | 11월 | 12월 | 1월 | AR잔액 | 여신한도 | 이용률 |
|:---|---:|---:|---:|---:|---:|---:|

**기준월 변경 시**: oct/nov/dec → nov/dec/jan

#### 11.5.4 효율성 분석

**테이블 헤더**: 전년 vs 당년

| 지표 | 25년 1월 | 26년 1월 | 증감 |
|:---|---:|---:|---:|
| DSO | 56일 | 28일 | -28일 |

### 11.6 JSON 파일 작성 체크리스트

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

### 11.7 기준월 변경 시 작업 순서

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

### 11.8 주의사항

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

## 12. 버전 이력

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

---

*Generated by Claude - FNF Dashboard Monthly Update Guide v5.0*

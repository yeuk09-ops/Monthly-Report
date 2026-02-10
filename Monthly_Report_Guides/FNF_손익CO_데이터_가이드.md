# FNF 재무제표 대시보드 - 손익(CO) 데이터 추출 가이드

> **작성일:** 2025년 1월 15일
> **최종수정:** 2025년 1월 15일
> **대상 파일:** FNF 재무제표 대시보드 (fnf-dashboard_v2)
> **참조 문서:** FNF_Dashboard_Monthly_Update_Guide.md, FNF_Snowflake_Dashboard_Guide_Summary.md

---

## 1. 개요

### 1.1 목적
FNF 재무제표 대시보드의 **손익계산서(CO) 탭**에서 매출액과 영업이익을 산출하기 위해 Snowflake에서 어떤 데이터를 조회하고 어떻게 계산했는지 정리

### 1.2 기준월 정의 (⚠️ 중요)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📅 기준월 변수 정의                                                │
│                                                                     │
│  BASE_YEAR = 현재 데이터 기준 연도 (예: 2025)                       │
│  BASE_MONTH = 현재 데이터 기준 월 (예: 12)                          │
│  PREV_YEAR = BASE_YEAR - 1 (예: 2024)                               │
│                                                                     │
│  ※ 쿼리 및 계산 시 아래 변수를 기준월에 맞게 치환하여 사용          │
│  ※ 본 가이드 예시는 25년 11월 기준으로 작성됨                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 데이터 소스

| 항목 | 내용 |
|------|------|
| **데이터베이스** | Snowflake |
| **스키마** | FNF.SAP_FNF |
| **테이블** | DW_COPA_D (CO-PA 수익성분석) |
| **기간** | {PREV_YEAR}년 1월 ~ {BASE_YEAR}년 {BASE_MONTH}월 (월별 누적) |
| **연환산** | 당해년도 1~{BASE_MONTH}월 + 전년도 (12-{BASE_MONTH}+1)~12월 |

---

## 2. 관리손익 vs 재무손익 개념

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ 중요: 관리손익과 재무손익의 차이                                 │
│                                                                     │
│  【관리손익 (CO 관점)】- 본 대시보드 기준                           │
│  ├── 매출액 (실판매 V-)                                             │
│  ├── (−) 점수수료           ← 매출에서 차감                         │
│  ├── = 출고매출 (V-)        ← 관리목적상 순매출 개념                 │
│  ├── (−) 매출원가                                                   │
│  ├── = 매출총이익                                                   │
│  ├── (−) 판관비 (점수수료 제외)                                     │
│  └── = 영업이익                                                     │
│                                                                     │
│  【재무손익 (외부보고 관점)】                                       │
│  ├── 매출액 = 실판매 (출고매출 개념 없음)                           │
│  ├── (−) 매출원가                                                   │
│  ├── = 매출총이익                                                   │
│  ├── (−) 판관비 (점수수료 포함)   ← 판관비로 이동                   │
│  └── = 영업이익                                                     │
│                                                                     │
│  ✅ 영업이익은 동일, 표시 방식만 다름                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 손익 구조 (예시: 25년 1~11월 기준)

> ⚠️ 아래 수치는 25년 11월 기준 예시입니다. 기준월 변경 시 Snowflake 쿼리로 재조회 필요

```
매출액 (실판매 V-)              {REVENUE}억
  ├── MLB (국내)                {MLB_DOM}억
  ├── Discovery (국내)          {DISC_DOM}억
  ├── MLB KIDS (국내)           {KIDS_DOM}억
  ├── 기타브랜드 (국내)          {OTHER_DOM}억
  ├── 수출                      {EXPORT}억  ← 핵심 성장 동력
  └── (기타조정)                  {ADJ}억
────────────────────────────────────────
(−) 점수수료                    {SALE_CMS}억
────────────────────────────────────────
출고매출 (V-)                   {NET_SALE}억
(−) 매출원가                    {COGS}억
────────────────────────────────────────
매출총이익                      {GROSS_PROFIT}억
(−) 판관비                      {SGA}억
────────────────────────────────────────
영업이익                        {OP}억
영업이익률                      {OP_MARGIN}%

【25년 1~11월 실적 참고값】
매출액: 14,911억 / 점수수료: 1,598억 / 출고매출: 13,313억
매출원가: 5,446억 / 판관비: 3,391억 / 영업이익: 4,476억 (30.0%)
```

---

## 4. COPA 테이블 주요 컬럼

### 4.1 금액 컬럼

| 컬럼명 | 설명 | 용도 |
|--------|------|------|
| **VAT_EXC_ACT_SALE_AMT** | VAT 제외 실판매액 | 매출액 |
| **TAG_SALE_AMT** | TAG 금액 | 정가 매출 |
| **ACT_COGS** | 실제 매출원가 | 원가 |
| **SALE_CMS** | 점수수료 | 백화점 등 판매수수료 |
| **SM_CMS** | SM 수수료 | 기타수수료 |
| **CARD_CMS** | 카드 수수료 | 기타수수료 |
| **ONLN_CNS_SALE_CMS** | 온라인 수수료 | 기타수수료 |

### 4.2 분류 컬럼

| 컬럼명 | 설명 | 주요값 |
|--------|------|--------|
| **PST_DT** | 전기일자 | 날짜 (필터 기준) |
| **BRD_CD** | 브랜드코드 | M, X, I, V, ST, W, C |
| **CHNL_CD** | 채널코드 | 1~11 (9=수출) |

### 4.3 채널코드 (CHNL_CD) 정의

| CHNL_CD | 채널명 | 구분 |
|:---:|--------|------|
| 1 | 백화점 | 국내 |
| 2 | 면세점 | 국내 |
| 3 | 대리점 | 국내 |
| 4 | 할인점 | 국내 |
| 5 | 직영점 | 국내 |
| 6 | 프랜차이즈 | 국내 |
| 8 | 사입출고 | 국내 |
| **9** | **수출** | **수출** |
| 11 | 온라인 | 국내 |

### 4.4 브랜드코드 (BRD_CD) 정의

| BRD_CD | 브랜드명 |
|:---:|--------|
| M | MLB |
| X | Discovery |
| I | MLB KIDS |
| V | Duvetica |
| ST | Sergio Tacchini |
| W | Supra |
| C | 기타 |

---

## 5. Snowflake 쿼리

### 5.1 월별 손익 데이터 추출

```sql
-- 월별 손익 데이터 추출
-- ※ 날짜 범위를 기준월에 맞게 수정: {PREV_YEAR}-01-01 ~ {BASE_YEAR}-{BASE_MONTH}-말일
-- ⚠️ 필수 필터: CORP_CD = '1000', BRD_CD IN ('M','I','X','V','ST')
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
WHERE PST_DT >= '{PREV_YEAR}-01-01' AND PST_DT <= '{BASE_YEAR}-{BASE_MONTH}-{LAST_DAY}'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY TO_CHAR(PST_DT, 'YYYY'), TO_CHAR(PST_DT, 'MM')
ORDER BY YR, MM

-- 예시 (25년 11월 기준): PST_DT >= '2024-01-01' AND PST_DT <= '2025-11-30'
-- 예시 (25년 12월 기준): PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
```

### 5.2 브랜드별 국내/수출 매출 분리

```sql
-- 브랜드별 국내/수출 매출 분리
-- ※ 기준월에 맞게 날짜 및 월 필터 수정
-- ⚠️ 필수 필터: CORP_CD = '1000', BRD_CD IN ('M','I','X','V','ST')
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
WHERE PST_DT >= '{PREV_YEAR}-01-01' AND PST_DT <= '{BASE_YEAR}-{BASE_MONTH}-{LAST_DAY}'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND TO_CHAR(PST_DT, 'MM') <= '{BASE_MONTH}'
GROUP BY LEFT(TO_CHAR(PST_DT, 'YYYYMM'), 4), BRD_CD
ORDER BY YR, TOTAL_SALE DESC

-- 예시 (25년 12월 기준): PST_DT <= '2025-12-31' AND MM <= '12'
```

### 5.3 판관비 상세 쿼리

```sql
-- 판관비 항목별 집계
-- ※ 기준월에 맞게 날짜 및 월 필터 수정
-- ⚠️ 필수 필터: CORP_CD = '1000', BRD_CD IN ('M','I','X','V','ST')
SELECT
    TO_CHAR(PST_DT, 'YYYY') AS YR,

    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,

    -- 기타수수료 (SM_CMS + CARD_CMS + ONLN_CNS_SALE_CMS)
    ROUND(SUM(SM_CMS + CARD_CMS + ONLN_CNS_SALE_CMS) / 100000000, 0) AS OTHER_CMS,

    -- 인건비
    ROUND(SUM(DMGMT_SALE_STFF_CNTRC_CST + DF_SALE_STFF_CNTRC_CST +
              DS_SALE_STFF_CNTRC_CST) / 100000000, 0) AS LABOR,

    -- 물류비
    ROUND(SUM(LGST_CST) / 100000000, 0) AS LGST,

    -- 임차료
    ROUND(SUM(SHOP_FXD_RNT + SHOP_VRBL_RNT) / 100000000, 0) AS RENT,

    -- 감가상각비
    ROUND(SUM(DEPR) / 100000000, 0) AS DEPR,

    -- 관리비
    ROUND(SUM(MGMT_CST) / 100000000, 0) AS MGMT

FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '{PREV_YEAR}-01-01' AND PST_DT <= '{BASE_YEAR}-{BASE_MONTH}-{LAST_DAY}'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND TO_CHAR(PST_DT, 'MM') <= '{BASE_MONTH}'
GROUP BY TO_CHAR(PST_DT, 'YYYY')
```

### 5.4 연환산용 전년 잔여월 데이터

```sql
-- 연환산용 전년 잔여월 데이터
-- ※ 기준월이 12월이 아닌 경우, 전년도 (기준월+1)~12월 데이터 조회
-- 예시: 기준월이 11월이면 전년도 12월만 조회
-- ⚠️ 필수 필터: CORP_CD = '1000', BRD_CD IN ('M','I','X','V','ST')

SELECT
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '{PREV_YEAR}-{BASE_MONTH+1}-01' AND PST_DT <= '{PREV_YEAR}-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')

-- 예시 (25년 11월 기준): PST_DT >= '2024-12-01' AND PST_DT <= '2024-12-31'
-- 예시 (25년 10월 기준): PST_DT >= '2024-11-01' AND PST_DT <= '2024-12-31'
-- ※ 기준월이 12월인 경우 연환산 불필요 (12개월 완료)
```

---

## 6. 계산 공식

### 6.1 손익 계산

```
출고매출 = 매출액(실판매) - 점수수료
매출총이익 = 출고매출 - 매출원가
영업이익 = 매출총이익 - 판관비
```

### 6.2 영업이익률 계산

```
영업이익률 = 영업이익 ÷ 매출액(실판매 V-) × 100

【예시: 25년 11월 기준】
25년 1~11월: 4,476 ÷ 14,911 = 30.0%
25년 연환산: 5,013 ÷ 16,662 = 30.1%
```

### 6.3 연환산 계산

```
{BASE_YEAR}년 연환산 매출 = {BASE_YEAR}년 1~{BASE_MONTH}월 매출 + {PREV_YEAR}년 ({BASE_MONTH+1})~12월 매출
{BASE_YEAR}년 연환산 영업이익 = {BASE_YEAR}년 1~{BASE_MONTH}월 영업이익 + {PREV_YEAR}년 ({BASE_MONTH+1})~12월 영업이익

【예시: 25년 11월 기준】
25년 연환산 매출 = 25년 1~11월 매출 + 24년 12월 매출
25년 연환산 영업이익 = 25년 1~11월 영업이익 + 24년 12월 영업이익

※ 기준월이 12월인 경우 연환산 = 해당년도 1~12월 실적 (전년도 데이터 불필요)
```

---

## 7. 수익성 지표 (연환산 기준)

> ⚠️ 아래 수치는 예시입니다. 기준월에 따라 Snowflake 재조회 필요

| 비율 | 산식 | {PREV_YEAR}년 | {BASE_YEAR}년 |
|------|------|-----:|-----:|
| **영업이익률** | 영업이익 ÷ 실판매 × 100 | - | - |
| **매출총이익률** | (매출총이익 + 점수수료) ÷ 실판매 × 100 | - | - |
| **ROE** | 영업이익(연환산) ÷ 자본 × 100 | - | - |
| **ROA** | 영업이익(연환산) ÷ 자산 × 100 | - | - |

【참고: 25년 11월 기준 실적】
| 비율 | 24년 | 25년 |
|------|-----:|-----:|
| 영업이익률 | 26.1% | 30.1% |
| 매출총이익률 | 64.8% | 63.9% |
| ROE | 27.2% | 29.5% |
| ROA | 20.2% | 24.5% |

---

## 8. 데이터 검증 체크리스트

```
□ 매출액 = Σ(VAT_EXC_ACT_SALE_AMT)
□ 출고매출 = 매출액 − 점수수료
□ 매출총이익 = 출고매출 − 매출원가
□ 영업이익 = 매출총이익 − 판관비
□ 영업이익률 = 영업이익 ÷ 매출액
□ 브랜드별 합계 = 전체 매출액 (조정 포함)
□ 국내 + 수출 = 전체 매출
□ 연환산 = 1~11월 + 전년 12월
```

---

## 9. 주의사항

### 9.1 데이터 정합성
- COPA 데이터와 Guide 데이터 차이 존재 (1~3% 허용)
- SALE_TYPE IN ('N', 'T') 필터 시 COPA와 일치도 향상
- 수출(CHNL_CD='9')은 100% 일치

### 9.2 판관비 중복 제거
- 제조간접비(코스트센터 F10000~F10700)는 매출원가에 이미 반영
- 판관비에서 제조간접비 차감 필수 (약 273억)

### 9.3 연환산 한계
- 전년 12월 데이터 사용으로 계절성 반영 불완전
- 실제 연간 실적과 차이 발생 가능

### 9.4 금액 단위
- COPA 원본: 원 단위
- 대시보드 표시: 억원 (÷ 100,000,000)

---

## 10. 참조 문서

| 문서명 | 용도 |
|--------|------|
| FNF_Dashboard_Monthly_Update_Guide.md | 대시보드 월간 업데이트 통합 가이드 |
| FNF_Snowflake_Dashboard_Guide_Summary.md | Snowflake 검색 기본 지침 |
| fnf_sales_guide_v7.md | 매출 데이터 추출 상세 가이드 |
| fnf_ar_analysis_guide_v1.md | 매출채권(AR) 분석 가이드 |
| fnf_inventory_cost_analysis_guide_v1.md | 재고원가 분석 가이드 |

---

## 11. 핵심 요약

### 11.1 데이터 추출 핵심
- **테이블:** `FNF.SAP_FNF.DW_COPA_D`
- **매출액:** `VAT_EXC_ACT_SALE_AMT` 컬럼 합계
- **원가:** `ACT_COGS` 컬럼 합계
- **점수수료:** `SALE_CMS` 컬럼 합계
- **수출 구분:** `CHNL_CD = '9'`

### 11.2 실적 요약 (기준월별 조회)

> ⚠️ 아래는 예시입니다. 기준월 변경 시 Snowflake 재조회 필요

| 항목 | {BASE_YEAR}년 1~{BASE_MONTH}월 | YoY |
|------|-----:|-----|
| 매출액 | - | - |
| 출고매출 | - | - |
| 영업이익 | - | - |
| 영업이익률 | - | - |

【참고: 25년 1~11월 실적】
| 항목 | 금액 | YoY |
|------|-----:|-----|
| 매출액 | 14,911억 | +11.0% |
| 출고매출 | 13,313억 | +14.4% |
| 영업이익 | 4,476억 | +30.6% |
| 영업이익률 | 30.0% | +4.0%p |

### 11.3 핵심 인사이트 (예시: 25년 11월 기준)
- ✅ 수출 매출 +36.6% 고성장 (7,861억)
- ✅ 영업이익률 4.0%p 개선 (26.1% → 30.1%)
- ⚠️ 국내 매출 △8.2% 역성장 (7,050억)

---

## 12. 기준월 변경 시 체크리스트

```
□ 1. 기준월 변수 설정
   - BASE_YEAR, BASE_MONTH, PREV_YEAR 확인
   - LAST_DAY 계산 (28/29/30/31)

□ 2. Snowflake 쿼리 실행
   - 5.1 월별 손익 데이터 추출
   - 5.2 브랜드별 국내/수출 매출 분리
   - 5.3 판관비 상세 쿼리
   - 5.4 연환산용 전년 잔여월 데이터 (12월 미만인 경우)

□ 3. 손익 구조 업데이트 (섹션 3)
   - 매출액, 점수수료, 출고매출, 원가, 판관비, 영업이익

□ 4. 수익성 지표 업데이트 (섹션 7)
   - 영업이익률, 매출총이익률, ROE, ROA

□ 5. JSON 데이터 파일 업데이트
   - fnf-dashboard_v2/src/data/{BASE_YEAR}-{BASE_MONTH}.json
```

---

*본 문서는 FNF 재무제표 대시보드의 손익(CO) 데이터 추출 및 계산 방법을 정리한 가이드입니다.*
*기준월이 변경되면 {변수} 부분을 해당 기준월에 맞게 치환하여 사용하세요.*

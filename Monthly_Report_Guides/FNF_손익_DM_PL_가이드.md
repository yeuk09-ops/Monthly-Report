# FNF 손익계산서 - DM_PL 테이블 기반 가이드

> **작성일:** 2026년 2월 10일
> **데이터 소스:** SAP_FNF.DM_PL_CHNL_M, SAP_FNF.DM_PL_CHNL_RPT
> **용도:** 월별 채널별 손익 분석

---

## 1. 개요

### 1.1 데이터 소스

| 항목 | 내용 |
|------|------|
| **테이블** | `SAP_FNF.DM_PL_CHNL_M` (월별 마트), `SAP_FNF.DM_PL_CHNL_RPT` (리포트) |
| **특징** | 채널별/브랜드별 사전 집계된 손익 데이터 |
| **장점** | 쿼리 성능 우수, 일관된 계산 로직 |
| **vs COPA** | DW_COPA_D는 원시 데이터, DM_PL은 집계 마트 |

### 1.2 기존 COPA 가이드와의 차이

| 구분 | COPA 기반 | **DM_PL 기반** |
|:---|:---|:---|
| 테이블 | `DW_COPA_D` | `DM_PL_CHNL_M` |
| 집계 수준 | 거래 단위 (직접 집계 필요) | 월별/채널별 집계 완료 |
| 영업이익 | 매출총이익 - 판관비 | `SALE_TTL_PRFT - DSTRB_CMS - DCST - IDCST` |
| 성능 | 느림 (대용량) | 빠름 (집계 완료) |

---

## 2. 핵심 정의

### 2.1 매출 항목

```sql
-- 실판매출(V+) = VAT 포함 실판가
ACT_SALE_AMT

-- 실판매출(V-) = VAT 제외 실판가
VAT_EXC_ACT_SALE_AMT

-- 택가 = 정가
TAG_SALE_AMT

-- 실판(사입제외) = 사입, 미지정, 기타 채널 제외
WHERE CHNL_CD NOT IN ('0', '8', '99')
```

### 2.2 손익 구조

```
┌──────────────────────────────────────────────┐
│  손익계산서 구조 (DM_PL 기준)                │
├──────────────────────────────────────────────┤
│  택가 (TAG_SALE_AMT)                         │
│  - 할인                                       │
│  = 실판(V+) (ACT_SALE_AMT)                   │
│  - VAT                                        │
│  = 실판(V-) (VAT_EXC_ACT_SALE_AMT)          │
│  - 원가                                       │
│  = 매출총이익 (SALE_TTL_PRFT)                │
│  - 유통수수료 (DSTRB_CMS)                     │
│  = 매출이익                                   │
│  - 직접비 (DCST)                              │
│  = 직접이익                                   │
│  - 영업비 (IDCST)                             │
│  = 영업이익 ⭐                                │
└──────────────────────────────────────────────┘
```

### 2.3 핵심 계산식

```sql
-- 매출이익
매출이익 = SALE_TTL_PRFT - DSTRB_CMS

-- 직접이익
직접이익 = SALE_TTL_PRFT - DSTRB_CMS - DCST

-- 영업이익 ⭐
영업이익 = SALE_TTL_PRFT - DSTRB_CMS - DCST - IDCST

-- 할인율
할인율(%) = (1 - (실판가 / 택가)) × 100

-- 비율 계산 (매출이익~영업이익)
비율(%) = 해당항목 / 실판가(V-) × 100
```

---

## 3. DM_PL_CHNL_M 테이블 구조

### 3.1 주요 컬럼

| 컬럼명 | 설명 | 단위 |
|--------|------|------|
| **PST_YYYYMM** | 전기년월 | YYYYMM |
| **BRD_CD** | 브랜드코드 | M, X, I, V, ST |
| **CHNL_CD** | 채널코드 | 1~11, 99 |
| **CHNL_TYPE** | 채널타입 | 내수, 수출 |
| **TAG_SALE_AMT** | 택가 매출 | 원 |
| **ACT_SALE_AMT** | 실판매출(V+) | 원 |
| **VAT_EXC_ACT_SALE_AMT** | 실판매출(V-) | 원 |
| **COGS** | 매출원가 | 원 |
| **DSTRB_CMS** | 유통수수료 | 원 |
| **SALE_TTL_PRFT** | 매출총이익 | 원 |
| **DCST** | 직접비 | 원 |
| **IDCST** | 영업비 (간접비) | 원 |

### 3.2 채널코드 (CHNL_CD)

| 코드 | 채널명 | 구분 | 비고 |
|:---:|--------|------|------|
| 1 | 백화점 | 내수 | 포함 |
| 2 | 면세점 | 내수 | 포함 |
| 3 | 대리점 | 내수 | 포함 |
| 4 | 할인점 | 내수 | 포함 |
| 5 | 직영점 | 내수 | 포함 |
| 6 | 프랜차이즈 | 내수 | 포함 |
| **0** | **미지정** | **내수** | **제외 ⚠️** |
| **8** | **사입출고** | **내수** | **제외 (사입제외 시)** |
| **9** | **수출** | **수출** | **제외 ⚠️** |
| 11 | 온라인 | 내수 | 포함 |
| **99** | **기타** | **내수** | **제외 (사입제외 시)** |

---

## 4. Snowflake 쿼리

### 4.1 월별 손익 요약 (기본)

```sql
-- 기준월 설정
WITH period AS (
    SELECT 'CY' AS div, '202601' AS start_yyyymm, '202601' AS end_yyyymm
    UNION ALL
    SELECT 'YTD_CY' AS div, '202601' AS start_yyyymm, '202601' AS end_yyyymm
    UNION ALL
    SELECT 'PY' AS div, '202501' AS start_yyyymm, '202501' AS end_yyyymm
    UNION ALL
    SELECT 'YTD_PY' AS div, '202501' AS start_yyyymm, '202501' AS end_yyyymm
)

SELECT
    a.pst_yyyymm AS 년월,
    a.brd_cd AS 브랜드,

    -- 매출
    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.tag_sale_amt ELSE 0 END) AS 택가,
    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.act_sale_amt ELSE 0 END) AS 실판_VT,
    SUM(CASE WHEN a.chnl_cd NOT IN ('0', '8', '99') THEN a.act_sale_amt ELSE 0 END) AS 실판_사입제외,
    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.vat_exc_act_sale_amt ELSE 0 END) AS 실판_V마이너스,

    -- 손익
    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.sale_ttl_prft ELSE 0 END)
        - SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dstrb_cms ELSE 0 END)
        AS 매출이익,

    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dcst ELSE 0 END) AS 직접비,

    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.sale_ttl_prft ELSE 0 END)
        - SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dstrb_cms ELSE 0 END)
        - SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dcst ELSE 0 END)
        AS 직접이익,

    SUM(a.idcst) AS 영업비,

    SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.sale_ttl_prft ELSE 0 END)
        - SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dstrb_cms ELSE 0 END)
        - SUM(CASE WHEN a.chnl_cd <> '99999999' THEN a.dcst ELSE 0 END)
        - SUM(a.idcst)
        AS 영업이익

FROM sap_fnf.dm_pl_chnl_m a
JOIN period b ON a.pst_yyyymm BETWEEN b.start_yyyymm AND b.end_yyyymm
WHERE 1=1
    AND a.chnl_type = '내수'
    AND a.brd_cd IN ('M', 'X', 'I', 'V', 'ST')
GROUP BY a.pst_yyyymm, a.brd_cd
ORDER BY a.pst_yyyymm, a.brd_cd
;
```

### 4.2 비율 계산 포함

```sql
-- 단위: 백만원 (÷ 1,000,000)
SELECT
    std AS 항목,

    -- 전년 (PY)
    ROUND(py / 1000000) AS PY_금액,
    CASE
        WHEN std = 'TAG가' THEN NULL
        WHEN std = '실판(v+)' THEN ROUND((1 - (py / NULLIF(py_tag_sale_amt, 0))) * 100, 1)
        WHEN std = '실판(사입제외)' THEN ROUND((1 - (py / NULLIF(py_tag_sale_amt, 0))) * 100, 1)
        ELSE ROUND(py / NULLIF(py_vat_exc_act_sale_amt, 0) * 100, 1)
    END AS PY_비율,

    -- 당년 (CY)
    ROUND(cy / 1000000) AS CY_금액,
    CASE
        WHEN std = 'TAG가' THEN NULL
        WHEN std = '실판(v+)' THEN ROUND((1 - (cy / NULLIF(cy_tag_sale_amt, 0))) * 100, 1)
        WHEN std = '실판(사입제외)' THEN ROUND((1 - (cy / NULLIF(cy_tag_sale_amt, 0))) * 100, 1)
        ELSE ROUND(cy / NULLIF(cy_vat_exc_act_sale_amt, 0) * 100, 1)
    END AS CY_비율,

    -- 전년비 (VSPY)
    ROUND((cy - py) / 1000000) AS 전년비_금액,

    -- YOY (%)
    ROUND(cy / NULLIF(py, 0) * 100) AS YOY_비율

FROM (
    -- 위 4.1 쿼리 결과를 PIVOT
)
;
```

---

## 5. 필터 조건

### 5.1 기본 필터

```sql
-- 필수 조건
WHERE 1=1
    AND chnl_type = '내수'           -- 내수만 (수출 제외)
    AND brd_cd IN ('M', 'X', 'I', 'V', 'ST')  -- 주요 브랜드
```

### 5.2 채널 제외 조건

```sql
-- 전체 집계 시 (수출, 미지정만 제외)
WHERE chnl_cd <> '99999999'  -- 더미값 제외
-- 또는
WHERE chnl_cd NOT IN ('9')   -- 수출 제외
```

```sql
-- 사입제외 집계 시
WHERE chnl_cd NOT IN ('0', '8', '99')
-- 0: 미지정, 8: 사입출고, 99: 기타
```

### 5.3 시즌 필터 (생산원가율 계산 시)

```sql
-- 당시즌만 (25F)
WHERE sesn = '25F'

-- 사입제외 + 당시즌
WHERE chnl_cd NOT IN ('0', '8', '99')
    AND sesn = '25F'
```

---

## 6. 계산 예시

### 6.1 26년 1월 손익 (예시)

```
택가:              2,000억
실판(V+):          1,800억  → 할인율 10.0%
실판(V-):          1,638억  (VAT 제외)
매출원가:            574억
──────────────────────────
매출총이익:        1,064억
유통수수료:          172억
──────────────────────────
매출이익:            892억  → 비율 54.5% (892/1,638)
직접비:              200억
──────────────────────────
직접이익:            692억  → 비율 42.2% (692/1,638)
영업비:              150억
──────────────────────────
영업이익:            542억  → 비율 33.1% (542/1,638) ⭐
```

---

## 7. DM_PL vs COPA 비교

| 구분 | COPA (DW_COPA_D) | **DM_PL (DM_PL_CHNL_M)** |
|:---|:---|:---|
| **데이터 레벨** | 거래 단위 (일별 거래) | 월별/채널별 집계 |
| **쿼리 속도** | 느림 (대용량 스캔) | 빠름 (집계 완료) |
| **영업이익 계산** | 수동 집계 필요 | 컬럼 제공 |
| **유통수수료** | SALE_CMS | DSTRB_CMS |
| **직접비** | 별도 계산 | DCST 컬럼 제공 |
| **영업비** | 별도 계산 | IDCST 컬럼 제공 |
| **추천 용도** | 상세 분석, 일별 트렌드 | **월별 손익 요약 ⭐** |

---

## 8. 대시보드 업데이트 가이드

### 8.1 현재 구조 (COPA 기반)

```typescript
// 현재: DW_COPA_D 기반
매출액 = SUM(VAT_EXC_ACT_SALE_AMT)
원가 = SUM(ACT_COGS)
점수수료 = SUM(SALE_CMS)
판관비 = 별도 계산 또는 0
영업이익 = 매출총이익 - 판관비
```

### 8.2 권장 구조 (DM_PL 기반)

```typescript
// 권장: DM_PL_CHNL_M 기반
실판V마이너스 = SUM(VAT_EXC_ACT_SALE_AMT)
매출이익 = SUM(SALE_TTL_PRFT - DSTRB_CMS)
직접비 = SUM(DCST)
직접이익 = SUM(SALE_TTL_PRFT - DSTRB_CMS - DCST)
영업비 = SUM(IDCST)
영업이익 = SUM(SALE_TTL_PRFT - DSTRB_CMS - DCST - IDCST) ⭐
```

### 8.3 JSON 구조 업데이트

```json
{
  "incomeStatement": {
    "revenue": [
      { "label": "택가", "current": 2000, "previous": 1950 },
      { "label": "실판매출(V+)", "current": 1800, "previous": 1760, "discountRate": 10.0 },
      { "label": "실판매출(V-)", "current": 1638, "previous": 1600 }
    ],
    "costs": [
      { "label": "매출원가", "current": 574, "previous": 578 },
      { "label": "유통수수료", "current": 172, "previous": 163 },
      { "label": "직접비", "current": 200, "previous": 190 },
      { "label": "영업비", "current": 150, "previous": 145 }
    ],
    "profitability": {
      "grossProfit": { "label": "매출총이익", "current": 1064, "previous": 1022 },
      "salesProfit": { "label": "매출이익", "current": 892, "previous": 859, "ratio": 54.5 },
      "directProfit": { "label": "직접이익", "current": 692, "previous": 669, "ratio": 42.2 },
      "operatingProfit": { "label": "영업이익", "current": 542, "previous": 524, "ratio": 33.1 }
    }
  }
}
```

---

## 9. 체크리스트

### 9.1 데이터 검증

```
□ 채널 필터 확인 (수출 9 제외, 미지정 0 제외)
□ 사입제외 필터 (0, 8, 99 제외)
□ 영업이익 = SALE_TTL_PRFT - DSTRB_CMS - DCST - IDCST
□ 비율 = 항목 / 실판(V-) × 100
□ 할인율 = (1 - 실판/택가) × 100
□ 단위: 억원 (÷ 100,000,000)
```

### 9.2 쿼리 성능

```
□ DM_PL_CHNL_M 사용 (COPA 대신)
□ 인덱스 활용 (PST_YYYYMM, BRD_CD, CHNL_TYPE)
□ 기간 필터 적절히 설정
□ 불필요한 집계 제거
```

---

## 10. 영업비(IDCST) 상세 분석

### 10.1 영업비 데이터 소스

| 항목 | 내용 |
|------|------|
| **테이블** | `SAP_FNF.DM_IDCST_CCTR_M` |
| **용도** | 코스트센터별 영업비(간접비) 상세 |
| **주요 컬럼** | `CTGR1` (대분류), `CTGR2` (중분류), `TTL_USE_AMT` (사용금액) |

### 10.2 영업비 분류 체계

| 순번 | 분류명 | 원천 컬럼 | 비고 |
|:---:|--------|----------|------|
| 1 | **인건비** | CTGR1 = '인건비' | 브랜드 영업비 |
| 2 | **광고비** | CTGR1 = '광고선전비' | 브랜드 영업비 |
| 3 | **지급수수료** | CTGR1 IN ('지급수수료', '제간비') | 브랜드 영업비 |
| 4 | **VMD/매장보수** | CTGR1 = 'VMD/ 매장보수대' | 브랜드 영업비 |
| 5 | **저장품** | CTGR2 = '저장품사용(쇼핑백/사은품)' | 브랜드 영업비 |
| 6 | **샘플비** | CTGR1 = '샘플대(제작/구입)' | 브랜드 영업비 |
| 7 | **감가상각비** | CTGR2 = '감가상각비(매장외)' | 브랜드 영업비 |
| 8 | **기타영업비** | CTGR1 = '기타영업비' | 브랜드 영업비 |
| 9 | **자가임차료** | CTGR1 = '자가임차료(사옥)' | 브랜드 영업비 |
| 901 | **공통비** | CTGR1 = '공통비' | 전사 공통 |
| 902 | **제조간접비** | MFC_DEPT_USE_AMT | **차감 항목 (-)** |

### 10.3 영업비 상세 쿼리 (월별)

```sql
-- 26년 1월 영업비 상세 (당월 기준)
WITH raw_idcst AS (
    SELECT
        CASE
            WHEN ctgr2 = '저장품사용(쇼핑백/사은품)' THEN '저장품'
            WHEN ctgr2 = '감가상각비(매장외)' THEN '감가상각비'
            WHEN ctgr1 = '자가임차료(사옥)' THEN '자가임차료'
            WHEN ctgr1 = 'VMD/ 매장보수대' THEN 'VMD/매장보수'
            WHEN ctgr1 = '광고선전비' THEN '광고비'
            WHEN ctgr1 = '샘플대(제작/구입)' THEN '샘플비'
            WHEN ctgr1 = '제간비' THEN '지급수수료'
            WHEN ctgr1 = '지급수수료' THEN '지급수수료'
            WHEN ctgr1 = '기타영업비' THEN '기타영업비'
            ELSE ctgr1
        END AS chnl_nm,
        SUM(CASE WHEN pst_yyyymm = '202601' THEN ttl_use_amt ELSE 0 END) AS sale_amt_cy,
        SUM(CASE WHEN pst_yyyymm = '202501' THEN ttl_use_amt ELSE 0 END) AS sale_amt_py
    FROM sap_fnf.dm_idcst_cctr_m
    WHERE brd_cd = 'M'
        AND pst_yyyymm IN ('202601', '202501')
    GROUP BY 1

    UNION ALL

    -- 제조간접비 (차감)
    SELECT
        '제조간접비' AS chnl_nm,
        ABS(SUM(CASE WHEN pst_yyyymm = '202601' THEN mfc_dept_use_amt ELSE 0 END)) * (-1) AS sale_amt_cy,
        ABS(SUM(CASE WHEN pst_yyyymm = '202501' THEN mfc_dept_use_amt ELSE 0 END)) * (-1) AS sale_amt_py
    FROM sap_fnf.dm_idcst_cctr_m
    WHERE brd_cd = 'M'
        AND pst_yyyymm IN ('202601', '202501')
    GROUP BY 1
),
raw_sale AS (
    SELECT
        SUM(CASE WHEN pst_yyyymm = '202601' THEN vat_exc_act_sale_amt ELSE 0 END) AS sale_amt_cy,
        SUM(CASE WHEN pst_yyyymm = '202501' THEN vat_exc_act_sale_amt ELSE 0 END) AS sale_amt_py
    FROM sap_fnf.dm_pl_chnl_m
    WHERE brd_cd = 'M'
        AND pst_yyyymm IN ('202601', '202501')
        AND chnl_cd <> '9'
),
main AS (
    SELECT
        a.chnl_nm,
        a.sale_amt_cy,
        a.sale_amt_py,
        b.sale_amt_cy AS act_sale_amt_cy,
        b.sale_amt_py AS act_sale_amt_py,
        a.sale_amt_ttl
    FROM (
        SELECT
            SUM(sale_amt_cy) OVER() AS sale_amt_ttl,
            chnl_nm,
            sale_amt_cy,
            sale_amt_py
        FROM raw_idcst
    ) a, raw_sale b
),
main_excp_comm AS (
    SELECT
        '브랜드 영업비' AS chnl_nm,
        SUM(sale_amt_cy) sale_amt_cy,
        SUM(sale_amt_py) sale_amt_py,
        SUM(act_sale_amt_cy) act_sale_amt_cy,
        SUM(act_sale_amt_py) act_sale_amt_py,
        SUM(sale_amt_ttl) sale_amt_ttl
    FROM main
    WHERE chnl_nm NOT IN ('제조간접비', '공통비')
),
total AS (
    SELECT
        SUM(sale_amt_cy) sale_amt_cy,
        SUM(sale_amt_py) sale_amt_py,
        MAX(act_sale_amt_cy) act_sale_amt_cy,
        MAX(act_sale_amt_py) act_sale_amt_py,
        SUM(sale_amt_ttl) sale_amt_ttl
    FROM main
)
SELECT
    CASE chnl_nm
        WHEN '인건비' THEN 1
        WHEN '광고비' THEN 2
        WHEN '지급수수료' THEN 3
        WHEN 'VMD/매장보수' THEN 4
        WHEN '저장품' THEN 5
        WHEN '샘플비' THEN 6
        WHEN '감가상각비' THEN 7
        WHEN '기타영업비' THEN 8
        WHEN '자가임차료' THEN 9
        WHEN '공통비' THEN 901
        WHEN '제조간접비' THEN 902
        ELSE 999
    END AS seq,
    chnl_nm AS 항목,
    ROUND(sale_amt_cy / 1000000) AS 당월_금액,
    ROUND((sale_amt_cy - sale_amt_py) / 1000000) AS 전년비_금액,
    CASE WHEN sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_cy / sale_amt_py * 100, 1) END AS YOY,
    CASE WHEN act_sale_amt_cy = 0 THEN 0 ELSE ROUND(sale_amt_cy / act_sale_amt_cy * 100, 1) END AS 당월_비율,
    CASE WHEN act_sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_py / act_sale_amt_py * 100, 1) END AS 전년_비율,
    sale_ratio_cy - sale_ratio_py AS 비율차이
FROM main

UNION ALL

-- 브랜드 영업비 소계
SELECT
    900 AS seq,
    chnl_nm,
    ROUND(sale_amt_cy / 1000000),
    ROUND((sale_amt_cy - sale_amt_py) / 1000000),
    CASE WHEN sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_cy / sale_amt_py * 100, 1) END,
    CASE WHEN act_sale_amt_cy = 0 THEN 0 ELSE ROUND(sale_amt_cy / act_sale_amt_cy * 100, 1) END,
    CASE WHEN act_sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_py / act_sale_amt_py * 100, 1) END,
    sale_ratio_cy - sale_ratio_py
FROM main_excp_comm

UNION ALL

-- 전체 합계
SELECT
    0 AS seq,
    '전체' AS chnl_nm,
    ROUND(sale_amt_cy / 1000000),
    ROUND((sale_amt_cy - sale_amt_py) / 1000000),
    CASE WHEN sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_cy / sale_amt_py * 100, 1) END,
    CASE WHEN act_sale_amt_cy = 0 THEN 0 ELSE ROUND(sale_amt_cy / act_sale_amt_cy * 100, 1) END,
    CASE WHEN act_sale_amt_py = 0 THEN 0 ELSE ROUND(sale_amt_py / act_sale_amt_py * 100, 1) END,
    sale_ratio_cy - sale_ratio_py
FROM total
ORDER BY seq;
```

### 10.4 영업비 상세 쿼리 (누적)

```sql
-- 26년 1~1월 누적 영업비
WITH raw_idcst AS (
    SELECT
        CASE
            WHEN ctgr2 = '저장품사용(쇼핑백/사은품)' THEN '저장품'
            WHEN ctgr2 = '감가상각비(매장외)' THEN '감가상각비'
            WHEN ctgr1 = '자가임차료(사옥)' THEN '자가임차료'
            WHEN ctgr1 = 'VMD/ 매장보수대' THEN 'VMD/매장보수'
            WHEN ctgr1 = '광고선전비' THEN '광고비'
            WHEN ctgr1 = '샘플대(제작/구입)' THEN '샘플비'
            WHEN ctgr1 = '제간비' THEN '지급수수료'
            WHEN ctgr1 = '지급수수료' THEN '지급수수료'
            WHEN ctgr1 = '기타영업비' THEN '기타영업비'
            ELSE ctgr1
        END AS chnl_nm,
        SUM(CASE WHEN pst_yyyymm BETWEEN '202601' AND '202601' THEN ttl_use_amt ELSE 0 END) AS sale_amt_cy,
        SUM(CASE WHEN pst_yyyymm BETWEEN '202501' AND '202501' THEN ttl_use_amt ELSE 0 END) AS sale_amt_py
    FROM sap_fnf.dm_idcst_cctr_m
    WHERE brd_cd = 'M'
        AND (
            pst_yyyymm BETWEEN '202501' AND '202501'
            OR pst_yyyymm BETWEEN '202601' AND '202601'
        )
    GROUP BY 1

    UNION ALL

    SELECT
        '제조간접비' AS chnl_nm,
        ABS(SUM(CASE WHEN pst_yyyymm BETWEEN '202601' AND '202601' THEN mfc_dept_use_amt ELSE 0 END)) * (-1) AS sale_amt_cy,
        ABS(SUM(CASE WHEN pst_yyyymm BETWEEN '202501' AND '202501' THEN mfc_dept_use_amt ELSE 0 END)) * (-1) AS sale_amt_py
    FROM sap_fnf.dm_idcst_cctr_m
    WHERE brd_cd = 'M'
        AND (
            pst_yyyymm BETWEEN '202501' AND '202501'
            OR pst_yyyymm BETWEEN '202601' AND '202601'
        )
    GROUP BY 1
),
raw_sale AS (
    SELECT
        SUM(CASE WHEN pst_yyyymm BETWEEN '202601' AND '202601' THEN act_sale_amt / 1.1 ELSE 0 END) AS sale_amt_cy,
        SUM(CASE WHEN pst_yyyymm BETWEEN '202501' AND '202501' THEN act_sale_amt / 1.1 ELSE 0 END) AS sale_amt_py
    FROM sap_fnf.dm_pl_chnl_m
    WHERE brd_cd = 'M'
        AND (
            pst_yyyymm BETWEEN '202501' AND '202501'
            OR pst_yyyymm BETWEEN '202601' AND '202601'
        )
        AND chnl_cd <> '9'
)
-- 이하 당월 쿼리와 동일
...
```

### 10.5 영업비 항목 설명

| 항목 | 설명 | 비율 기준 |
|------|------|----------|
| **인건비** | 브랜드 인건비 (매장 외) | 실판(V-) |
| **광고비** | 광고선전비 | 실판(V-) |
| **지급수수료** | 외부 용역비, 수수료 | 실판(V-) |
| **VMD/매장보수** | 매장 비주얼, 보수비 | 실판(V-) |
| **저장품** | 쇼핑백, 사은품 | 실판(V-) |
| **샘플비** | 샘플 제작/구입비 | 실판(V-) |
| **감가상각비** | 매장 외 감가상각비 | 실판(V-) |
| **기타영업비** | 기타 영업 관련 비용 | 실판(V-) |
| **자가임차료** | 사옥 임차료 | 실판(V-) |
| **공통비** | 전사 공통 비용 | 실판(V-) |
| **제조간접비** | 제조 간접비 (**차감**) | 실판(V-) |

### 10.6 제조간접비 처리

```sql
-- ⚠️ 중요: 제조간접비는 차감 항목
제조간접비 = ABS(SUM(mfc_dept_use_amt)) * (-1)

-- 최종 영업비
영업비(IDCST) = SUM(브랜드 영업비) + 공통비 - 제조간접비
```

**이유**: 제조간접비는 매출원가에 이미 반영되어 있으므로, 영업비에서 중복 제거

### 10.7 영업비 예시 (26년 1월)

```
인건비:              80억  (비율 4.9%)
광고비:              50억  (비율 3.1%)
지급수수료:          20억  (비율 1.2%)
VMD/매장보수:        15억  (비율 0.9%)
저장품:              10억  (비율 0.6%)
샘플비:               8억  (비율 0.5%)
감가상각비:           7억  (비율 0.4%)
기타영업비:           5억  (비율 0.3%)
자가임차료:           5억  (비율 0.3%)
─────────────────────────────
브랜드 영업비:       200억  (비율 12.2%)
공통비:              30억  (비율 1.8%)
제조간접비:        △20억  (비율 △1.2%) ⚠️ 차감
─────────────────────────────
영업비(IDCST):       210억  (비율 12.8%) ⭐
```

---

## 11. 참고 문서

| 문서명 | 용도 |
|--------|------|
| **FNF_손익CO_데이터_가이드.md** | COPA 기반 손익 (기존) |
| **FNF_손익_DM_PL_가이드.md** | DM_PL 기반 손익 ⭐ (이 문서) |
| **fnf_sales_guide_v7.md** | 매출 분석 |
| **FNF_Dashboard_Monthly_Update_Guide_v3.md** | 대시보드 업데이트 |

---

**작성자**: Claude AI
**최종 수정**: 2026년 2월 10일
**데이터 소스**: SAP_FNF.DM_PL_CHNL_M, SAP_FNF.DM_PL_CHNL_RPT

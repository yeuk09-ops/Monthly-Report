# FNF 재무제표 대시보드 월별 업데이트 지침

## 개요
본 문서는 FNF 재무제표 대시보드의 월별 데이터 업데이트를 위한 표준 절차를 정의합니다.

---

## 1. 데이터 소스 구분

### 1.1 사용자 제공 데이터 (CSV)
- **재무상태표 (B/S)**: 월별 재무제표 CSV 파일
- 파일명 형식: `F&F 월별재무제표(YY.MM).csv`
- 포함 데이터: 자산, 부채, 자본 계정별 잔액

### 1.2 Snowflake 조회 데이터
- **손익계산서 (P/L)**: DW_COPA_D 테이블 (CO-PA 기준)
- **매출채권 (AR)**: DM_F_FI_AR_AGING 테이블
- **여신기준 검증 데이터**: 매출/채권 비교 분석

---

## 2. Snowflake 연결 정보

```python
import snowflake.connector

conn = snowflake.connector.connect(
    user='ykjung',
    password='Fnfsnowflake2025!',
    account='gv28284.ap-northeast-2.aws',
    database='fnf',
    warehouse='dev_wh',
    role='pu_sql_sap',
    schema='sap_fnf'
)
```

---

## 3. 손익계산서 (CO-PA) 데이터 쿼리

### 3.1 연간 손익 합계 (채널별)
```sql
SELECT
    YEAR(PST_DT) as YR,
    CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END as CHANNEL,
    ROUND(SUM(TAG_SALE_AMT) / 100000000, 0) as TAG_100M,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) as ACT_SALE_100M,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
    ROUND(SUM(SALE_CMS) / 100000000, 0) as CMS_100M,
    ROUND(SUM(ACT_COGS) / 100000000, 0) as COGS_100M
FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY YEAR(PST_DT), CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END
ORDER BY YR, CHANNEL
```

### 3.2 필드 매핑
| Snowflake 필드 | 대시보드 항목 | 설명 |
|---------------|------------|------|
| VAT_EXC_ACT_SALE_AMT | 실판매출 | VAT 제외 실판매 |
| SALE_CMS | 점수수료 | 판매 커미션 |
| ACT_COGS | 매출원가 | 상품원가 |
| TAG_SALE_AMT | TAG 매출 | 정가 기준 |

### 3.3 채널 코드
| CHNL_CD | 구분 |
|---------|-----|
| 9 | 수출 |
| 1~8 | 국내 |
| 0, 99 | 제외 |

---

## 4. 여신기준 검증 데이터 쿼리

### 4.1 국내 매출 (최근 2개월)
```sql
SELECT
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '11' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '12' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DEC_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0', '9')
```

### 4.2 수출 매출 (지역별)
```sql
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '11' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '12' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DEC_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
    END
ORDER BY REGION
```

### 4.3 국내 채권 (당월말)
```sql
SELECT
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) as AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'  -- YYYY-MM 형식
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH != '09'
```

### 4.4 수출 채권 (지역별)
```sql
SELECT
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN 'HK_TW'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN 'HK_TW'
        ELSE 'OTHER'
    END
ORDER BY REGION
```

---

## 5. 고객코드 매핑 (수출 지역)

### 5.1 중국 (CHINA)
| 고객코드 | 고객명 |
|---------|-------|
| 105787 | 중국 법인 |
| 105798 | 중국 법인 |
| 105864 | 중국 법인 |
| 105807 | 중국 법인 |
| 100888 | 중국 법인 |
| 100495 | 중국 법인 |

### 5.2 홍콩/대만 (HK_TW)
| 고객코드 | 고객명 |
|---------|-------|
| 100461 | 홍콩/대만 법인 |
| 105788 | 홍콩/대만 법인 |
| 105792 | 홍콩/대만 법인 |
| 105799 | 홍콩/대만 법인 |
| 105803 | 홍콩/대만 법인 |
| 105909 | 홍콩/대만 법인 |
| 106314 | 홍콩/대만 법인 |
| 100942 | 홍콩/대만 법인 |

---

## 6. 여신기준 검증 계산식

### 6.1 월수 환산
```
월수 환산 = 당월말 채권 ÷ 월평균 매출
         = 당월말 채권 ÷ ((전월 매출 + 당월 매출) / 2)
```

### 6.2 채권/매출 비율
```
채권/매출(%) = 당월말 채권 ÷ (전월 매출 + 당월 매출) × 100
```

### 6.3 평가 기준
| 월수 환산 | 평가 |
|----------|-----|
| ≤ 1.0개월 | ✅ 정상 |
| 1.0 ~ 2.0개월 | 🟡 경계 |
| > 2.0개월 | 🔴 주의 |

---

## 7. 월별 업데이트 절차

### Step 1: 재무상태표 데이터 업데이트
1. 새로운 월별 재무제표 CSV 파일 수령
2. 재무상태표 탭 데이터 업데이트
3. 자산/부채/자본 증감 계산

### Step 2: Snowflake 데이터 조회
1. Python 스크립트 실행 (snowflake_full_data.py)
2. 손익계산서 데이터 추출
3. 여신기준 검증 데이터 추출

### Step 3: 대시보드 업데이트
1. **경영요약 탭**
   - KPI 카드 업데이트 (실판매출, 영업이익, 총자산, 부채, 자기자본)
   - 수익성 분석 섹션 업데이트
   - 재무비율 업데이트
   - 여신기준 검증표 업데이트

2. **손익계산서(CO) 탭**
   - 매출액 (실판매) - 국내/수출
   - 점수수료
   - 출고매출 (V-)
   - 매출원가
   - 매출총이익
   - 판관비
   - 영업이익 및 영업이익률
   - 브랜드별 매출
   - 연간 손익 요약

### Step 4: 검증
1. Snowflake 데이터와 대시보드 수치 일치 확인
2. 전년 대비 증감률 계산 검증
3. 여신기준 월수 환산 계산 검증

### Step 5: 배포
1. 파일명 업데이트: `FNF_재무제표_(YYMM)대시보드.html`
2. index.html 복사 업데이트
3. GitHub 커밋
4. Vercel 자동 배포 확인

---

## 8. 주의사항

### 8.1 CALMONTH 형식
- AR Aging 테이블: `YYYY-MM` 형식 (예: '2025-12')
- 반드시 형식 확인 필요

### 8.2 브랜드 코드
| BRD_CD | 브랜드 |
|--------|-------|
| M | MLB |
| I | Discovery |
| X | MLB Kids |
| V | Vans |
| ST | Stretton |
| W | 기타 |

### 8.3 데이터 단위
- Snowflake: 원 단위
- 대시보드: 억원 단위 (÷ 100,000,000)

---

## 9. 참고 문서
- `fnf_sales_guide_v7.md`: 매출 분석 가이드
- `fnf_ar_analysis_guide_v1.md`: 채권 분석 가이드
- `FNF_Snowflake_Dashboard_Guide_Summary.md`: Snowflake 쿼리 가이드

---

## 10. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|-----|------|---------|
| 2025-01 | v1.0 | 초안 작성 (12월 결산 기준) |

---

**작성일**: 2025년 1월
**작성자**: Claude Code (AI)

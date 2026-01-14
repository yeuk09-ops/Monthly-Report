# FNF 대시보드 월간 업데이트 가이드

매월 새로운 재무 데이터를 대시보드에 추가하는 절차입니다.

**Production URL**: https://fnf-dashboardv2.vercel.app

---

## 1. 데이터 준비

### 1.1 필요한 데이터 소스

| 데이터 | 소스 | 담당 |
|:---|:---|:---|
| 월별 재무제표 | `F&F 월별재무제표(YY.MM).csv` | 회계팀 |
| 브랜드/채널별 매출 | Snowflake `DW_COPA_D` | Claude 쿼리 |
| 수출 지역별 매출 | Snowflake `DW_DELV` | Claude 쿼리 |
| 매출채권 (AR) | Snowflake `DM_F_FI_AR_AGING` | Claude 쿼리 |
| 재고자산 | Snowflake `DW_IVTR_HIST` | Claude 쿼리 |

### 1.2 Snowflake 쿼리 실행

```bash
cd C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report

# 매출채권 검증
python credit_verify_v2.py

# 재고자산 검증
python inventory_verify.py
```

---

## 2. JSON 파일 생성

### 2.1 새 월 JSON 파일 생성

`src/data/` 폴더에 새 파일 생성 (예: `2026-01.json`)

```bash
cp src/data/2025-12.json src/data/2026-01.json
```

### 2.2 데이터 업데이트

JSON 파일의 각 섹션을 새 데이터로 업데이트:

```json
{
  "meta": {
    "year": 2026,
    "month": 1,
    "reportDate": "2026-01-31",
    "updatedAt": "2026-02-XX",
    "status": "published"
  },
  "financialData": {
    // CSV에서 추출한 재무제표 데이터
  },
  "incomeStatement": {
    // 손익계산서 항목
  },
  "channelSales": [
    // Snowflake 채널별 매출 쿼리 결과
  ],
  "exportSales": [
    // Snowflake 수출 지역별 매출 쿼리 결과
  ],
  "brandSales": [
    // Snowflake 브랜드별 매출 쿼리 결과
    // currentRatio, prevRatio 필드 포함 (브랜드 믹스 차트용)
  ],
  "balanceSheet": {
    // 재무상태표 항목
  },
  "workingCapital": {
    // AR, 재고 상세 (Snowflake 검증)
  },
  "creditVerification": [
    // 여신검증 데이터 (Snowflake AR + 월별 매출)
  ],
  "aiInsights": {
    // AI 분석 인사이트 (Claude 생성)
  }
}
```

### 2.3 brandSales 데이터 구조 (브랜드 믹스 차트용)

```json
"brandSales": [
  {
    "brand": "MLB",
    "code": "M",
    "current": 3660,
    "previous": 3775,
    "yoy": -3.0,
    "currentRatio": 41.4,
    "prevRatio": 39.2
  }
]
```

**주의**: `currentRatio`와 `prevRatio`는 손익계산서 페이지의 브랜드 믹스 도넛 차트에서 사용됩니다.

### 2.4 index.json 업데이트

`src/data/index.json` 수정:

```json
{
  "availableMonths": [
    {
      "year": 2026,
      "month": 1,
      "label": "2026년 1월",
      "file": "2026-01.json",
      "status": "published",
      "updatedAt": "2026-02-XX"
    },
    {
      "year": 2025,
      "month": 12,
      "label": "2025년 12월",
      "file": "2025-12.json",
      "status": "published",
      "updatedAt": "2026-01-14"
    }
  ],
  "defaultMonth": {
    "year": 2026,
    "month": 1
  }
}
```

---

## 3. AI 인사이트 생성

Claude에게 다음 프롬프트로 인사이트 생성 요청:

```
다음 재무데이터를 분석하여 AI 인사이트를 작성해주세요.

[재무데이터]
- 매출: {전년}억 → {당기}억 ({증감률}%)
- 영업이익: {전년}억 → {당기}억 ({증감률}%)
- 영업이익률: {전년}% → {당기}%
- 수출매출: {전년}억 → {당기}억 ({증감률}%)
- 현금: {전년}억 → {당기}억
- 매출채권: {전년}억 → {당기}억
- 재고자산: {전년}억 → {당기}억
- 부채비율: {전년}% → {당기}%
- 차입금: {금액}원

[작성 형식]
1. 긍정적 시그널 4개 (positive 배열)
2. 모니터링 필요 4개 (warning 배열)

각 항목은 <strong>핵심키워드</strong>: 설명 형식으로 작성
```

---

## 4. 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000

# 확인 항목:
# 1. 월 선택 드롭다운에서 새 월 선택 가능한지
# 2. 경영요약: KPI 카드, 재무비율 지표
# 3. 재무상태표: 자산/부채/자본, 운전자본 분석
# 4. 손익계산서: 매출분석, 브랜드 믹스 도넛 차트
```

---

## 5. 배포

### 5.1 Git 커밋

```bash
git add .
git commit -m "Update: 2026년 1월 재무데이터 추가"
git push origin main
```

### 5.2 Vercel 배포

```bash
vercel --prod --yes
```

---

## 6. 체크리스트

### 데이터 정합성
- [ ] 재무제표 합계 일치 (자산 = 부채 + 자본)
- [ ] 손익계산서 합계 일치 (매출 - 비용 = 이익)
- [ ] Snowflake 쿼리 결과와 CSV 비교 검증
- [ ] 전년 동기 데이터 정확성
- [ ] brandSales의 currentRatio/prevRatio 합계 = 100%

### Snowflake 여신검증
- [ ] AR 쿼리 필터 확인 (ZARTYP='R1', WWDCH='09')
- [ ] CUST_CD 지역 구분 정확
- [ ] 월별 매출 합계와 채권개월수 계산 일치

### Snowflake 재고검증
- [ ] CREATE_DT 최신값 필터
- [ ] 아이템코드 추출 로직 (ST는 8번째, 나머지 7번째)
- [ ] 시즌 구분 (당시즌: 현재 시즌 코드)

### 배포 확인
- [ ] 월 선택 드롭다운 동작 확인
- [ ] 모든 페이지 데이터 표시 확인
- [ ] 브랜드 믹스 차트 정상 표시
- [ ] 모바일 반응형 확인

---

## 7. Snowflake 쿼리 참고

### 채널별 매출 (국내+사입)

```sql
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
WHERE PST_DT >= '2026-01-01' AND PST_DT < '2026-02-01'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')
GROUP BY CHANNEL
ORDER BY CHANNEL;
```

### 수출 지역별 매출

```sql
SELECT
    CASE
        WHEN SHOP_ID LIKE 'CN%' THEN '01.중국'
        WHEN SHOP_ID LIKE 'HK%' OR SHOP_ID LIKE 'MC%' THEN '02.홍콩/마카오'
        WHEN SHOP_ID LIKE 'TW%' OR SHOP_ID LIKE 'TX%' THEN '03.대만'
        ELSE '04.기타'
    END AS REGION,
    ROUND(SUM(SUPP_AMT) / 100000000, 0) AS SALE_100M
FROM FNF.PRCS.DW_DELV
WHERE DELV_DT >= '2026-01-01' AND DELV_DT < '2026-02-01'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY REGION
ORDER BY REGION;
```

### 브랜드별 매출 (국내+사입, 수출제외)

```sql
SELECT
    CASE
        WHEN BRD_CD = 'M' THEN 'MLB'
        WHEN BRD_CD = 'X' THEN 'Discovery'
        WHEN BRD_CD = 'I' THEN 'MLB Kids'
        WHEN BRD_CD = 'V' THEN 'Duvetica'
        ELSE '기타'
    END AS BRAND,
    BRD_CD,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS SALE_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT < '2026-02-01'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')
GROUP BY BRAND, BRD_CD
ORDER BY SALE_100M DESC;
```

**비중 계산**: 쿼리 결과의 합계를 기준으로 각 브랜드의 currentRatio 계산

---

## 8. 페이지 네비게이션 순서

| 순서 | 페이지 | 경로 |
|:---:|:---|:---|
| 1 | 경영요약 | `/` |
| 2 | 재무상태표 | `/balance-sheet` |
| 3 | 손익계산서 | `/income-statement` |

---

*FNF Dashboard Update Guide v2.0*

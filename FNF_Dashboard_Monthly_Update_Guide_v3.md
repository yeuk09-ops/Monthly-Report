# FNF 재무제표 대시보드 월간 업데이트 가이드 v3

**작성일**: 2026년 2월 10일
**버전**: 3.0
**대시보드 프로젝트**: `fnf-dashboard_v2`
**Production URL**: https://fnf-dashboardv2.vercel.app

---

## 📋 개요

### 핵심 변경사항 (v3)
- ✅ **월별 데이터 파일 관리**: JSON 파일로 각 월 데이터 분리
- ✅ **메인 프로젝트**: `fnf-dashboard_v2` (이전 `fnf-dashboard` 삭제)
- ✅ **데이터 구조 표준화**: TypeScript 타입 정의 기반
- ✅ **자동 월 선택**: 헤더 드롭다운으로 월 선택

### 프로젝트 위치
```
C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard_v2\
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 경영요약
│   │   ├── balance-sheet/
│   │   │   └── page.tsx             # 재무상태표
│   │   ├── income-statement/
│   │   │   └── page.tsx             # 손익계산서
│   │   └── layout.tsx               # 공통 레이아웃 + 헤더
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 기본 컴포넌트
│   │   ├── dashboard/
│   │   │   ├── Header.tsx           # 월 선택 헤더
│   │   │   ├── KPICard.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── RatioCard.tsx
│   │   └── providers/
│   │       └── ReportContext.tsx    # 전역 상태 관리
│   ├── data/
│   │   ├── index.json               # 사용 가능한 월 목록
│   │   ├── 2026-01.json             # 26년 1월 데이터
│   │   ├── 2025-12.json             # 25년 12월 데이터
│   │   └── 2025-11.json             # 25년 11월 데이터
│   ├── types/
│   │   └── financial.ts             # TypeScript 타입 정의
│   └── lib/
│       └── utils.ts                 # 유틸리티 함수
└── package.json
```

---

## 1️⃣ 월간 업데이트 절차

### Step 1: 데이터 수집

#### 1.1 재무상태표 (CSV)
```
파일: F&F 월별재무제표(YY.MM).csv
위치: 회계팀 제공
```

**필수 항목:**
- 총자산, 유동자산, 현금, 매출채권, 재고자산
- 총부채, 유동부채, 차입금, 매입채무
- 자기자본, 이익잉여금

#### 1.2 손익계산서 (Snowflake)
```sql
-- 월별 손익 데이터
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT <= '2026-01-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
```

#### 1.3 브랜드별 매출 (Snowflake)
```sql
-- 브랜드별 국내/수출 매출
SELECT
    BRD_CD,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS TOTAL_SALE,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE,
    ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOMESTIC_SALE
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT <= '2026-01-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY BRD_CD
```

### Step 2: JSON 파일 작성

#### 2.1 새 월 JSON 파일 생성
```bash
cd fnf-dashboard_v2/src/data
# 예: 2026-01.json 생성
```

#### 2.2 JSON 구조 (표준 템플릿)
```json
{
  "meta": {
    "year": 2026,
    "month": 1,
    "reportDate": "2026-01-31",
    "updatedAt": "2026-02-10",
    "status": "published"
  },
  "financialData": {
    "revenue": { "current": 1638, "previous": 1643 },
    "domesticRevenue": { "current": 747, "previous": 750 },
    "exportRevenue": { "current": 892, "previous": 893 },
    "cogs": { "current": 574, "previous": 578 },
    "sga": { "current": 0, "previous": 0 },
    "operatingProfit": { "current": 0, "previous": 0 },
    "totalAssets": { "current": 22938, "previous": 20267 },
    "currentAssets": { "current": 9983, "previous": 5051 },
    "cash": { "current": 3158, "previous": 990 },
    "receivables": { "current": 2350, "previous": 1970 },
    "inventory": { "current": 2198, "previous": 2101 },
    "totalLiabilities": { "current": 4292, "previous": 4910 },
    "currentLiabilities": { "current": 2902, "previous": 3328 },
    "borrowings": { "current": 0, "previous": 200 },
    "payables": { "current": 957, "previous": 821 },
    "equity": { "current": 18646, "previous": 15357 },
    "retainedEarnings": { "current": 15999, "previous": 12645 }
  },
  "incomeStatement": { ... },
  "brandSales": [ ... ],
  "channelSales": [ ... ],
  "exportSales": [ ... ],
  "balanceSheet": { ... },
  "workingCapital": { ... },
  "creditVerification": [ ... ],
  "insights": { ... },
  "ratios": { ... }
}
```

**📌 주요 섹션 설명:**

| 섹션 | 설명 | 데이터 출처 |
|:---|:---|:---|
| `meta` | 메타데이터 (연/월/날짜) | 수동 입력 |
| `financialData` | 핵심 재무 데이터 | CSV + Snowflake |
| `incomeStatement` | 손익계산서 상세 | Snowflake COPA |
| `brandSales` | 브랜드별 실적 | Snowflake COPA |
| `channelSales` | 채널별 매출 | Snowflake COPA |
| `exportSales` | 수출 지역별 | Snowflake COPA |
| `balanceSheet` | 재무상태표 상세 | CSV |
| `workingCapital` | 운전자본 분석 | 계산 (재고+매출채권-매입채무) |
| `creditVerification` | 여신 검증 | Snowflake AR + 매출 |
| `insights` | AI 인사이트 | AI 분석 |
| `ratios` | 재무비율 | 계산 |

### Step 3: index.json 업데이트

```json
{
  "availableMonths": [
    {
      "year": 2026,
      "month": 1,
      "label": "2026년 1월",
      "file": "2026-01.json",
      "status": "published",
      "updatedAt": "2026-02-10"
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

**⚠️ 중요:**
- 최신 월을 배열 맨 위에 추가
- `defaultMonth`를 최신 월로 업데이트
- `label`은 "YYYY년 MM월" 형식 사용

### Step 4: 로컬 테스트

```bash
cd fnf-dashboard_v2
npm run dev
# http://localhost:3000 접속하여 확인
```

**체크리스트:**
- ✅ 헤더 드롭다운에서 새 월 선택 가능
- ✅ KPI 카드 값 정확성 확인
- ✅ 재무비율 계산 검증
- ✅ 차트 데이터 표시 확인
- ✅ AI 인사이트 적절성 검토

### Step 5: 배포

```bash
git add .
git commit -m "Update: 2026년 1월 재무데이터"
git push origin main

# Vercel 자동 배포 (main 브랜치 push 시)
# 또는 수동 배포:
vercel --prod --yes
```

---

## 2️⃣ 데이터 항목 상세 가이드

### 2.1 financialData (핵심 KPI)

```json
"financialData": {
  "revenue": { "current": 1638, "previous": 1643 },
  "domesticRevenue": { "current": 747, "previous": 750 },
  "exportRevenue": { "current": 892, "previous": 893 },
  "cogs": { "current": 574, "previous": 578 },
  "sga": { "current": 0, "previous": 0 },
  "operatingProfit": { "current": 0, "previous": 0 },
  "totalAssets": { "current": 22938, "previous": 20267 },
  "cash": { "current": 3158, "previous": 990 },
  "receivables": { "current": 2350, "previous": 1970 },
  "inventory": { "current": 2198, "previous": 2101 },
  "totalLiabilities": { "current": 4292, "previous": 4910 },
  "borrowings": { "current": 0, "previous": 200 },
  "payables": { "current": 957, "previous": 821 },
  "equity": { "current": 18646, "previous": 15357 }
}
```

**단위**: 억원 (백만원 ÷ 100)

### 2.2 brandSales (브랜드별 실적)

```json
"brandSales": [
  {
    "brand": "MLB",
    "code": "M",
    "current": 1114,
    "previous": 1143,
    "yoy": -2.5,
    "currentRatio": 68.0,
    "prevRatio": 69.6,
    "domestic": 277,
    "export": 837
  }
]
```

**계산:**
- `yoy` = (current - previous) / previous × 100
- `currentRatio` = current / 전체매출 × 100
- `domestic` + `export` = `current`

### 2.3 balanceSheet (재무상태표)

```json
"balanceSheet": {
  "assets": [
    {
      "label": "현금및현금성자산",
      "jan25": 990,
      "jan26": 3158,
      "change": 2168,
      "changePercent": 219.0,
      "isAlwaysVisible": true
    }
  ],
  "totals": {
    "assets": { "jan25": 20267, "jan26": 22938 },
    "liabilities": { "jan25": 4910, "jan26": 4292 },
    "equity": { "jan25": 15357, "jan26": 18646 }
  }
}
```

**키 속성:**
- `isAlwaysVisible`: true면 항상 표시
- `isSubItem`: true면 들여쓰기
- `highlight`: true면 강조 표시

### 2.4 creditVerification (여신 검증)

```json
"creditVerification": [
  {
    "region": "중국",
    "ar": 913,
    "advance": 350,
    "netAr": 563,
    "salesDec": 693,
    "salesNov": 349,
    "arMonths": 0.8,
    "normalAr": 693,
    "delayedAr": 0,
    "status": "정상",
    "note": "선급금 3.5억위안 보유"
  }
]
```

**채권개월수 계산:**
- 국내/중국: `(ar - salesDec) / salesNov + 1`
- 홍콩: `ar / ((salesOct + salesNov + salesDec) / 3)`
- 기타: `ar / ((salesNov + salesDec) / 2)`

### 2.5 insights (AI 인사이트)

```json
"insights": {
  "positive": [
    {
      "title": "무차입 경영 달성",
      "description": "차입금 200억원 → 0원으로 전액 상환",
      "metric": "차입금 △100%",
      "impact": "high"
    }
  ],
  "monitoring": [
    {
      "title": "매출채권 증가",
      "description": "1,970억 → 2,350억 (+19.3%)",
      "metric": "매출채권 +19.3%",
      "impact": "medium"
    }
  ]
}
```

**impact 레벨:**
- `high`: 매우 중요
- `medium`: 보통
- `low`: 참고 사항

### 2.6 ratios (재무비율)

```json
"ratios": {
  "profitability": {
    "grossMargin": { "current": 60.9, "previous": 61.0, "annualized": 59.6 },
    "operatingMargin": { "current": 0, "previous": 0, "annualized": 30.1 },
    "roe": { "current": 0, "previous": 0, "annualized": 26.9 },
    "roa": { "current": 0, "previous": 0, "annualized": 21.8 }
  },
  "stability": {
    "debtRatio": { "current": 23.0, "previous": 32.0 },
    "equityRatio": { "current": 81.3, "previous": 75.8 },
    "netDebtRatio": { "current": -16.9, "previous": -5.1 },
    "currentRatio": { "current": 239.3, "previous": 129.0 }
  },
  "activity": {
    "dso": { "current": 50, "previous": 52 },
    "dio": { "current": 53, "previous": 59 },
    "dpo": { "current": 57, "previous": 38 },
    "ccc": { "current": 46, "previous": 73 }
  }
}
```

**계산 공식:**
- **부채비율** = 총부채 ÷ 자기자본 × 100
- **자기자본비율** = 자기자본 ÷ 총자산 × 100
- **순차입금비율** = (차입금 - 현금) ÷ 자기자본 × 100
- **유동비율** = 유동자산 ÷ 유동부채 × 100
- **ROE** = 영업이익(연환산) ÷ 자기자본 × 100
- **ROA** = 영업이익(연환산) ÷ 총자산 × 100
- **DSO** = 매출채권 ÷ (실판매 ÷ 365)
- **DIO** = 재고자산 ÷ (출고매출 ÷ 365)
- **DPO** = 매입채무 ÷ (매출원가 ÷ 365)
- **CCC** = DSO + DIO - DPO

---

## 3️⃣ Snowflake 데이터 조회

### 3.1 연결 정보
```
Account: gv28284.ap-northeast-2.aws
Database: FNF
Schema: SAP_FNF (COPA, AR) / PRCS (재고, 매출)
Warehouse: dev_wh
Role: pu_sql_sap
```

### 3.2 주요 쿼리

#### 월별 손익 데이터
```sql
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT <= '2026-01-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
```

#### 브랜드별 매출
```sql
SELECT
    BRD_CD,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS TOTAL_SALE,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE,
    ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOMESTIC_SALE
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2026-01-01' AND PST_DT <= '2026-01-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY BRD_CD
ORDER BY TOTAL_SALE DESC
```

---

## 4️⃣ 검증 체크리스트

### 데이터 정합성
```
□ 자산 = 부채 + 자본 (재무상태표 균형)
□ 국내 + 수출 = 전체 매출
□ 브랜드별 매출 합계 = 전체 매출
□ 전년 동월 대비 증감률 계산 정확성
□ 단위 통일 (억원)
```

### JSON 파일 검증
```
□ meta 정보 정확성 (year, month, reportDate)
□ financialData current/previous 값 입력
□ brandSales domestic + export = current
□ balanceSheet totals 합계 일치
□ creditVerification arMonths 계산 검증
□ insights positive/monitoring 각 4개씩
□ ratios 계산 공식 적용 확인
```

### 대시보드 UI 검증
```
□ 헤더 드롭다운에서 새 월 선택 가능
□ KPI 카드 값 및 YoY 표시 정확
□ 차트 데이터 정상 표시
□ 재무상태표 펼치기/접기 동작
□ AI 인사이트 카드 표시
□ 모바일 반응형 확인
```

---

## 5️⃣ 트러블슈팅

### 문제: 새 월이 드롭다운에 표시 안됨
**해결:**
- `index.json`에 월 추가 확인
- 파일명이 `YYYY-MM.json` 형식인지 확인
- 브라우저 캐시 삭제 (Ctrl+Shift+R)

### 문제: 데이터가 표시 안됨
**해결:**
- JSON 문법 오류 확인 (콤마, 괄호)
- 브라우저 개발자 도구 Console 확인
- `npm run dev` 재시작

### 문제: 계산값이 이상함
**해결:**
- `ratios` 섹션 계산 공식 재확인
- `annualized` 값 확인 (연환산 = 당월 + 전년 잔여월)
- 단위 확인 (억원 vs 백만원)

---

## 6️⃣ 참고 문서

| 문서명 | 위치 | 용도 |
|:---|:---|:---|
| **손익CO 데이터 가이드** | `Monthly_Report_Guides/FNF_손익CO_데이터_가이드.md` | COPA 쿼리, 영업이익 계산 |
| **매출 분석 가이드** | `Monthly_Report_Guides/fnf_sales_guide_v7.md` | 매출 쿼리, SALE_TYPE 필터 |
| **AR 분석 가이드** | `Monthly_Report_Guides/fnf_ar_analysis_guide_v1.md` | 매출채권 여신 검증 |
| **재고 분석 가이드** | `Monthly_Report_Guides/fnf_inventory_cost_analysis_guide_v1.md` | 재고 원가 분석 |
| **MAINTENANCE_GUIDE** | `fnf-dashboard_v2/MAINTENANCE_GUIDE.md` | 프로젝트 구조, 컴포넌트 설명 |

---

## 7️⃣ 버전 히스토리

| 날짜 | 버전 | 변경 내용 |
|:---|:---:|:---|
| 2026-01-14 | 1.0 | 초기 버전 (fnf-dashboard) |
| 2026-01-14 | 2.0 | CSV/Snowflake 분리, AI 프롬프트 추가 |
| 2026-02-10 | **3.0** | **fnf-dashboard_v2로 이전, 월별 JSON 관리** |
| | | **26년 1월 데이터 추가** |
| | | **index.json 기반 월 선택 구조** |

---

## 📌 빠른 시작 (Quick Start)

### 새 월 데이터 추가 (5분 완료)

```bash
# 1. 기존 JSON 복사
cd fnf-dashboard_v2/src/data
cp 2025-12.json 2026-02.json

# 2. 새 파일 편집
# - meta 정보 업데이트 (year, month, reportDate, updatedAt)
# - financialData 값 업데이트 (CSV + Snowflake)
# - brandSales 업데이트 (Snowflake)
# - balanceSheet 업데이트 (CSV)
# - insights 재작성 (AI 분석)

# 3. index.json 업데이트
# - availableMonths 배열 맨 위에 새 월 추가
# - defaultMonth 업데이트

# 4. 테스트
npm run dev
# http://localhost:3000 접속

# 5. 배포
git add .
git commit -m "Update: 2026년 2월 재무데이터"
git push origin main
```

---

**작성자**: Claude AI
**최종 수정**: 2026년 2월 10일
**프로젝트**: fnf-dashboard_v2

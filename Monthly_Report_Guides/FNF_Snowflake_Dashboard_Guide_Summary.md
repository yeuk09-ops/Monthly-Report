# FNF Snowflake 검색 및 대시보드 구현 통합 가이드

**작성일**: 2025년 12월 11일  
**용도**: 스노우플레이크 DB 검색 기본 지침 + 대시보드 구현 일반 사항 정리

---

## 제1부: Snowflake DB 검색 기본 지침

### 1. 핵심 원칙

| 원칙 | 설명 |
|:---|:---|
| **FNF 매출 정의** | 국내매출(직영/위탁) + 사입출고 + 수출출고 |
| **SALE_TYPE 필터** | DW_SALE 조회 시 `SALE_TYPE IN ('N', 'T')` 필수 |
| **DW_DELV.PRICE 주의** | PRICE는 출고가(원가), TAG금액은 DW_PRDT.TAG_PRICE 사용 |
| **영문 컬럼명** | CSV 출력 시 영문 컬럼명 사용 |
| **출력 경로** | `C:\export\` 통일 |

---

### 2. 스키마 및 주요 테이블

#### 2.1 스키마 구조

| 스키마 | 용도 |
|:---|:---|
| `FNF.PRCS` | 주요 운영 데이터 (DW_SALE, DW_DELV, DW_IVTR_HIST 등) |
| `FNF.SAP_FNF` | SAP 연동 데이터 (DW_COPA_D 등) |
| `FNF.FNCO` | FNCO 마스터 |

#### 2.2 핵심 테이블

| 테이블 | 용도 | 주의사항 |
|:---|:---|:---|
| `DW_SALE` | 매출 (POS) | **SALE_TYPE IN ('N','T') 필터 필수!** |
| `DW_DELV` | 출고 | PRICE는 출고가(원가)! |
| `DW_COPA_D` | COPA 수익성분석 | 실제 원가 분석용 (ACT_COGS) |
| `DW_PRDT` | 제품 마스터 | TAG_PRICE로 TAG금액 계산 |
| `DW_IVTR_HIST` | 재고 스냅샷 | CREATE_DT 최신 필터 필요 |
| `DW_STOR` | 입고 | |
| `DW_SHOP` | 매장 마스터 | DIST_TYPE으로 채널 식별 |

---

### 3. 채널 유형별 매출 인식

#### 3.1 FNF 매출 구성

```
FNF 매출 = 국내매출(직영/위탁) + 사입출고 + 수출출고

✅ 국내매출(직영/위탁): DW_SALE (국내 SHOP_ID, 사입 제외)
   → SALE_TYPE IN ('N', 'T') 필터 필수!
   
✅ 사입출고: DW_DELV (DIST_TYPE='D' 매장)
   → SUPP_AMT × 1.1 (VAT 포함)
   
✅ 수출출고: DW_DELV (해외 PREFIX)
   → SUPP_AMT (영세율)
```

#### 3.2 해외 SHOP_ID PREFIX (13개)

```
CN, HK, MC, TW, TH, MY, ID, VN, SG, AE, KH, TX, HX
```

#### 3.3 SALE_TYPE 코드

| 코드 | 설명 | COPA 포함 |
|:---:|:---|:---:|
| **N** | 일반매출 | ✅ |
| **T** | 면세점매출 | ✅ |
| R | 재판매 | ❌ |
| A | 조정 | ❌ |
| E | 교환 | ❌ |

---

### 4. 브랜드 및 시즌 코드

#### 4.1 브랜드 코드 (6개)

| 브랜드명 | 코드 | 사입 매장 |
|:---|:---:|:---:|
| MLB | M | ✅ 35개 |
| MLB KIDS | I | ✅ 35개 |
| Discovery | X | ✅ 12개 |
| Duvetica | V | ❌ |
| Sergio_Tacchini | ST | ❌ |
| Supra | W | ❌ |

#### 4.2 시즌 정의

| 시즌 | 월 범위 | 코드 예시 |
|:---|:---|:---|
| SS (Spring-Summer) | 3월~8월 | 25S, 24S |
| FW (Fall-Winter) | 9월~2월 | 24F, 23F |

#### 4.3 당시즌 의류 분석 기간

| 시즌 | 분석 기간 | 기말 기준월 |
|:---|:---|:---|
| 23FW | 2023.03 ~ 2024.02 | 202402 |
| 24SS | 2023.09 ~ 2024.08 | 202408 |
| 24FW | 2024.03 ~ 2025.02 | 202502 |
| 25SS | 2024.09 ~ 2025.08 | 202508 |
| 25FW | 2025.03 ~ 2026.02 | 202602 |

---

### 5. 아이템 분류 체계

#### 5.1 아이템코드 추출

```sql
-- ST 브랜드: 8번째부터 2자리
-- 기타 브랜드: 7번째부터 2자리
CASE WHEN BRD_CD = 'ST' 
     THEN SUBSTRING(PRDT_CD, 8, 2) 
     ELSE SUBSTRING(PRDT_CD, 7, 2) 
END AS ITEM_CODE
```

#### 5.2 아이템 분류

| 분류 | 아이템코드 |
|:---|:---|
| **CAP** | CP, LP, CH, BC, NC |
| **SHOES** | SH, SS, SL, SD |
| **BAG** | BG, SB, BB, BP, PB, EB, CB, WB, AB, HB, FB, TB, MB |
| **WEAR** | MT, JK, JP, JM, VT, SK, CT, PT, OP, TS, KN, SW, HD, BL, JS, SU |
| **ETC** | 기타 |

---

### 6. COPA vs Guide 비교

#### 6.1 데이터 특성 비교

| 구분 | COPA (DW_COPA_D) | Guide (DW_SALE+DW_DELV) |
|:---|:---|:---|
| **소스** | SAP CO-PA | POS + 출고시스템 |
| **VAT** | 포함 (ACT_SALE_AMT) | 제외 |
| **원가** | 실제 원가 (ACT_COGS) | 출고가 (SUPP_AMT) |
| **채널** | CHNL_CD (1~11) | SHOP_ID 기반 |

#### 6.2 채널코드 매핑 (CHNL_CD)

| CHNL_CD | 채널명 | 데이터 매칭 |
|:---:|:---|:---|
| 1 | 백화점 | DOMESTIC |
| 2 | 면세점 | DOMESTIC (SALE_TYPE='T') |
| 3 | 대리점 | DOMESTIC |
| 4 | 할인점 | DOMESTIC |
| 5 | 직영점 | DOMESTIC |
| 6 | 프랜차이즈 | DOMESTIC |
| 8 | 사입 | SIB (DW_DELV) |
| 9 | 수출 | EXPORT (DW_DELV) |
| 11 | 온라인 | DOMESTIC |

#### 6.3 일치도 기대치

| 채널 | 일치도 | 비고 |
|:---|:---:|:---|
| SIB (사입) | **100%** | SUPP_AMT × 1.1 = COPA |
| EXPORT (수출) | **100%** | 동일 |
| DOMESTIC | **97~99%** | SALE_TYPE 필터 후 |

---

### 7. 금액 계산 방법

#### 7.1 TAG금액 계산

```sql
-- ❌ 잘못된 방법 (DW_DELV.PRICE는 원가!)
SELECT SUM(d.PRICE * d.QTY) AS WRONG_AMT

-- ✅ 올바른 방법
SELECT SUM(p.TAG_PRICE * d.QTY) AS TAG_AMT
FROM FNF.PRCS.DW_DELV d
JOIN FNF.PRCS.DW_PRDT p ON d.PRDT_CD = p.PRDT_CD AND d.BRD_CD = p.BRD_CD
```

#### 7.2 소진율 계산

```
FNF 소진율 = (국내매출 + 수출출고) / 입고 × 100
국내 소진율 = 국내매출 / (입고 - 수출출고) × 100
```

---

### 8. 필수 검증 체크리스트

```
□ FNF 매출 = 직영/위탁 + 사입출고 + 수출출고?
□ DW_SALE에서 SALE_TYPE IN ('N','T') 필터 적용?
□ 사입 매장(DIST_TYPE='D') DW_SALE에서 제외?
□ 해외 매장(13개 PREFIX) 제외?
□ TAG금액 = DW_PRDT.TAG_PRICE × QTY?
□ 사입출고 = SUPP_AMT × 1.1 (VAT)?
□ 재고 수불 공식: 기초 + 입고 - 출고 = 기말?
□ COPA 비교 완료?
```

---

## 제2부: 대시보드 구현 가이드

### 1. 기술 스택

| 항목 | 내용 |
|:---|:---|
| **프레임워크** | React (함수형 컴포넌트 + Hooks) |
| **차트 라이브러리** | Recharts |
| **스타일링** | Tailwind CSS |
| **아이콘** | Lucide React |

---

### 2. 대시보드 레이아웃 구성

#### 2.1 기본 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  헤더: 제목 + 버전 + 필터 버튼                                   │
├─────────────────────────────────────────────────────────────────┤
│  KPI 카드 1행 (4개 가로 배치)                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ 총재고   │ 의류재고  │ 용품재고  │ FNF매출  │                  │
│  │ YoY %   │ YoY %    │ YoY %    │ YoY %    │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
├─────────────────────────────────────────────────────────────────┤
│  KPI 카드 2행 (시즌별 소진율)                                    │
├─────────────────────────────────────────────────────────────────┤
│  그래프 영역 1행 (2열)                                           │
│  ┌────────────────────┬────────────────────┐                    │
│  │ 분기별 재고 추이    │ 분기별 매출 추이    │                    │
│  └────────────────────┴────────────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│  그래프 영역 2행 (2열)                                           │
│  ┌────────────────────┬────────────────────┐                    │
│  │ 당시즌 소진율       │ 과시즌 소진 추이    │                    │
│  └────────────────────┴────────────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│  푸터: 데이터 기준일 + 금액 단위                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 탭 기반 레이아웃 (복잡한 대시보드)

| 탭 | 이름 | 주요 내용 |
|:---|:---|:---|
| 1 | 📊 Overview | KPI 카드, 추이 그래프, 구성비 |
| 2 | 🔄 회전율분석 | 법인별 회전일수, CCC 추이, 레이더 차트 |
| 3 | 📈 추세분석 | 법인/브랜드 선택, YoY 비교 |
| 4 | 🎯 액션플랜 | 우선순위 이슈, 개선 방향 |

---

### 3. KPI 카드 컴포넌트

#### 3.1 기본 구조

```jsx
const KPICard = ({ title, value, yoy, icon, color }) => (
  <div className="bg-white/90 rounded-xl p-4 border border-slate-200">
    <div className="flex items-center justify-between">
      <span className="text-slate-600 text-sm">{icon} {title}</span>
      <span className={`text-xs font-semibold ${yoy >= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
        YoY {yoy >= 0 ? '+' : ''}{yoy}%
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800 mt-2">
      {value.toLocaleString()}억
    </div>
  </div>
);
```

#### 3.2 YoY 색상 규칙

| 지표 | 증가 시 | 감소 시 |
|:---|:---|:---|
| 매출 | 🟢 초록 (긍정) | 🔴 빨강 (부정) |
| 재고/채권 | 🔴 빨강 (부정) | 🟢 초록 (긍정) |
| 채무(DPO) | 🟢 초록 (긍정) | 🔴 빨강 (부정) |
| CCC | 🔴 빨강 (부정) | 🟢 초록 (긍정) |

---

### 4. 그래프 유형 및 활용

#### 4.1 차트 유형별 용도

| 차트 유형 | 용도 | Recharts 컴포넌트 |
|:---|:---|:---|
| 세로 막대 | 구성 비교, 기간별 추이 | `<BarChart>` |
| 선 그래프 | 추세, 회전일수 | `<LineChart>` |
| 영역 그래프 | 누적 추이 | `<AreaChart>` |
| 복합 차트 | 막대 + 선 조합 | `<ComposedChart>` |
| 원형 차트 | 구성비 | `<PieChart>` |
| 레이더 차트 | 다차원 비교 | `<RadarChart>` |

#### 4.2 복합 차트 예시

```jsx
<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
  <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
  <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} />
  <Tooltip />
  
  {/* 매출 - Bar */}
  <Bar yAxisId="left" dataKey="saleTag" fill="#3b82f6" barSize={16} />
  
  {/* 기말재고 - Line */}
  <Line yAxisId="left" dataKey="endTag" stroke="#10b981" strokeWidth={2} />
  
  {/* 할인율 - Line (점선) */}
  <Line yAxisId="right" dataKey="discountRate" stroke="#ef4444" 
        strokeDasharray="5 5" strokeWidth={2} />
</ComposedChart>
```

---

### 5. 인터랙티브 기능

#### 5.1 브랜드/항목 토글 버튼

```jsx
const ToggleBtn = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded-full transition-all ${
      active 
        ? `${color} text-white` 
        : 'bg-slate-200 text-slate-500'
    }`}
  >
    {label}
  </button>
);

// 사용 예시
<div className="flex gap-1">
  <ToggleBtn label="전체" active={showAll} onClick={toggleAll} />
  <ToggleBtn label="MLB" active={brands.M} color="bg-blue-500" onClick={() => toggle('M')} />
  <ToggleBtn label="Disc" active={brands.X} color="bg-emerald-500" onClick={() => toggle('X')} />
</div>
```

#### 5.2 드롭다운 필터

```jsx
<select 
  value={selected} 
  onChange={(e) => setSelected(e.target.value)}
  className="text-xs border rounded-lg px-2 py-1"
>
  <option value="전체">전체</option>
  {brands.map(b => <option key={b} value={b}>{b}</option>)}
</select>
```

#### 5.3 상세 확장 패널

```jsx
const [expanded, setExpanded] = useState(false);

{expanded && (
  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
    {/* 상세 내용 */}
  </div>
)}
```

---

### 6. 데이터 파일 설계

#### 6.1 파일 저장 규칙

| 항목 | 규칙 |
|:---|:---|
| **경로** | `C:\export\Dashboard_{유형}_{YYYY}_{Q}Q\` |
| **인코딩** | UTF-8 |
| **컬럼명** | 영문 대문자 + 언더스코어 |

#### 6.2 금액 컬럼 명명 규칙

| 구분 | 컬럼 접미사 | 단위 |
|:---|:---|:---|
| TAG 금액 | `_TAG_100M` | 억원 |
| 실판 금액 | `_SALE_100M` | 억원 |
| 원가 금액 | `_COST_100M` | 억원 |
| 수량 | `_QTY` | 개 또는 천 개 |

#### 6.3 필수 분류 컬럼

| 컬럼 | 값 | 설명 |
|:---|:---|:---|
| BRD_CD | M, I, X, V, ST, W | 브랜드 코드 |
| BRAND | MLB, MLB_KIDS, ... | 브랜드명 |
| SESN | 23F, 24S, 24F, 25S, 25F | 시즌 코드 |
| SESN_TYPE | CURRENT, PAST | 당시즌/과시즌 |
| ITEM_GRP | WEAR, ACC | 의류/용품 |

---

### 7. 스타일 가이드

#### 7.1 색상 팔레트

```javascript
const colors = {
  // 브랜드 색상
  MLB: '#3b82f6',        // blue-500
  MLB_KIDS: '#ec4899',   // pink-500
  Discovery: '#10b981',  // emerald-500
  Duvetica: '#8b5cf6',   // violet-500
  ST: '#f59e0b',         // amber-500
  Supra: '#6366f1',      // indigo-500
  
  // 지표 색상
  inventory: '#f97316',  // orange-500
  receivables: '#3b82f6', // blue-500
  payables: '#10b981',   // emerald-500
  wc: '#6366f1',         // indigo-500
  
  // 상태 색상
  positive: '#10b981',   // emerald-500
  negative: '#ef4444',   // red-500
};
```

#### 7.2 폰트 크기

| 용도 | 크기 | Tailwind 클래스 |
|:---|:---|:---|
| 제목 | 20-24px | `text-xl`, `text-2xl` |
| 섹션 헤더 | 14-16px | `text-sm`, `text-base` |
| 본문/라벨 | 12px | `text-xs` |
| 차트 tick | 9-10px | `fontSize: 9` |

---

### 8. 유틸리티 함수

#### 8.1 단위 변환

```javascript
// 백만원 → 억원 (소수점 1자리)
const toOk = (val) => Math.round(val / 10) / 10;

// 천원 → 억원
const wonToOk = (val) => Math.round(val / 100000000 * 10) / 10;

// 숫자 포맷 (천 단위 콤마)
const fmt = (val) => val?.toLocaleString() ?? '-';
```

#### 8.2 회전율 계산

```javascript
const calcTurnover = (d) => {
  const annRev = d.revenue_q * 4;  // 연환산매출
  const dso = d.receivables > 0 ? Math.round(365 / (annRev / d.receivables)) : 0;
  const dio = d.inventory > 0 ? Math.round(365 / (annRev / d.inventory)) : 0;
  const dpo = d.payables > 0 ? Math.round(365 / (annRev / d.payables)) : 0;
  return { ...d, dso, dio, dpo, ccc: dso + dio - dpo };
};
```

#### 8.3 CSV 파일 로드

```javascript
const loadCSV = async (filename) => {
  const response = await fetch(`/data/${filename}`);
  const text = await response.text();
  const rows = text.split('\n');
  const headers = rows[0].split(',');
  
  return rows.slice(1).filter(row => row.trim()).map(row => {
    const values = row.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header.trim()] = isNaN(values[i]) ? values[i]?.trim() : parseFloat(values[i]);
      return obj;
    }, {});
  });
};
```

---

### 9. 대시보드 구현 체크리스트

```
□ React + Recharts 환경 설정 완료?
□ CSV 데이터 파일 UTF-8 인코딩?
□ KPI 카드 YoY 색상 규칙 적용?
□ 브랜드/시즌 필터 기능 구현?
□ 그래프 툴팁 한글 표시?
□ 반응형 레이아웃 (ResponsiveContainer)?
□ 범례 표시 및 색상 일관성?
□ 데이터 기준일 푸터 표시?
```

---

## 참고 문서

| 문서명 | 용도 |
|:---|:---|
| `fnf_db_guide_v7.md` | 기본 DB 검색 지침 |
| `fnf_sales_guide_v7.md` | 매출 분석 가이드 |
| `fnf_copa_guide_v1.md` | COPA 분석 가이드 |
| `fnf_재고수불_가이드_v6.md` | 재고수불부 가이드 |
| `fnf_inventory_dashboard_guide_v3.md` | 재고 대시보드 가이드 |
| `fnf_dashboard_data_guide_v1.md` | 대시보드 데이터 가이드 |
| `fnf_wc_dashboard_guide.md` | 운전자본 대시보드 가이드 |

---

*Generated: 2025-12-11*

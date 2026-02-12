# 재무제표 대시보드 데이터 입력 가이드

## 📋 개요
이 가이드는 동일한 형식의 재무제표 대시보드를 다른 회사에 적용하기 위해 필요한 데이터 항목을 정리한 것입니다.

---

## 1️⃣ 기본 정보

| 항목 | 설명 | 예시 |
|------|------|------|
| 회사명 | 대시보드 제목에 표시될 회사명 | F&F CHINA |
| 기준연도 | 비교 대상 연도 (전년/당년) | 2024년 / 2025년 |
| 기준월 | 당년 실적 마감 기준월 | 11월 |
| 통화단위 | 금액 표시 단위 | 천위안, 백만원 등 |
| 브랜드 목록 | 매출 세분화할 브랜드명 | MLB, KIDS, Discovery 등 |

---

## 2️⃣ 손익계산서 (P/L) 데이터

### 2-1. 매출 데이터
```
[연간 비교]
| 계정 | 전년 연간 | 당년 누적(~11월) | 당년 연간(예상) |
|------|-----------|------------------|-----------------|
| Tag매출 (총계) | | | |
| - 브랜드1 | | | |
| - 브랜드2 | | | |
| - 브랜드3 | | | |
| 실판매출 | | | |

[분기 비교 (선택)]
| 계정 | 전년 4Q | 당년 4Q |
|------|---------|---------|
| Tag매출 | | |
| 실판매출 | | |
```

### 2-2. 매출원가
```
| 계정 | 전년 연간 | 당년 누적 | 당년 연간(예상) |
|------|-----------|-----------|-----------------|
| 매출원가 (순수) | | | |
| 재고평가손 | | | |
| (Tag 대비 원가율) | | | |
```

### 2-3. 직접비 (판매비)
```
| 계정 | 전년 연간 | 당년 누적 | 당년 연간(예상) |
|------|-----------|-----------|-----------------|
| 급여 | | | |
| 복리후생비 | | | |
| 플랫폼 수수료 | | | |
| TP 수수료 | | | |
| 직접광고비 | | | |
| 대리상지원금 | | | |
| 물류비 | | | |
| 매장임차료 | | | |
| 감가상각비 | | | |
| 기타 | | | |
```

### 2-4. 영업비 (관리비)
```
| 계정 | 전년 연간 | 당년 누적 | 당년 연간(예상) |
|------|-----------|-----------|-----------------|
| 급여 | | | |
| 복리후생비 | | | |
| 광고비 | | | |
| 수주회 | | | |
| 지급수수료 | | | |
| 임차료 | | | |
| 감가상각비 | | | |
| 세금과공과 | | | |
| 기타 | | | |
```

---

## 3️⃣ 재무상태표 (B/S) 데이터

### 3-1. 자산
```
| 계정 | 전년말 | 당월말 | 당년말(예상) |
|------|--------|--------|--------------|
| [유동자산] | | | |
| 현금 및 현금성자산 | | | |
| 매출채권-직영 | | | |
| 매출채권-대리상 | | | |
| 재고자산 | | | |
| 본사 선급금 | | | |
| 기타 유동자산 | | | |
| [비유동자산] | | | |
| 사용권자산 | | | |
| 이연법인세자산 | | | |
| 유형/무형자산 | | | |
```

### 3-2. 부채
```
| 계정 | 전년말 | 당월말 | 당년말(예상) |
|------|--------|--------|--------------|
| [유동부채] | | | |
| 본사 AP (매입채무) | | | |
| 제품 AP | | | |
| 차입금 | | | |
| 선수금/보증금 | | | |
| 기타 유동부채 | | | |
| [비유동부채] | | | |
| 리스부채 | | | |
| 기타비유동부채 | | | |
```

### 3-3. 자본
```
| 계정 | 전년말 | 당월말 | 당년말(예상) |
|------|--------|--------|--------------|
| 자본금 | | | |
| 이익잉여금 | | | |
```

### 3-4. 차입금 현황 (은행별)
```
| 은행명 | 현재 사용액 | 총 한도 |
|--------|-------------|---------|
| 은행1 | | |
| 은행2 | | |
| 은행3 | | |
```

---

## 4️⃣ 현금흐름표 (CF) 데이터

### 4-1. 영업활동
```
[입금]
| 계정 | 전년 | 당년 1~11월 | 당년 12월 |
|------|------|-------------|-----------|
| 매출수금-브랜드1 | | | |
| 매출수금-브랜드2 | | | |
| 대리상선금 | | | |
| 대리상보증금 | | | |
| 정부보조금 | | | |
| 기타수익 | | | |

[출금]
| 계정 | 전년 | 당년 1~11월 | 당년 12월 |
|------|------|-------------|-----------|
| 상품대-본사 | | | |
| 상품대-위탁생산 | | | |
| 본사선급금 | | | |
| 운영비 | | | |
```

### 4-2. 재무활동
```
| 계정 | 전년 | 당년 1~11월 | 당년 12월 |
|------|------|-------------|-----------|
| 차입금 입금 | | | |
| 차입금 상환 | | | |
```

### 4-3. 투자활동
```
| 계정 | 전년 | 당년 1~11월 | 당년 12월 |
|------|------|-------------|-----------|
| 자산성지출 | | | |
```

---

## 5️⃣ 여신사용현황 데이터

### 5-1. 총괄
```
| 항목 | 금액 |
|------|------|
| 총 외상매출금 | |
| 총 선수금 | |
| 순여신 (=외상-선수) | |
```

### 5-2. 거래처별 상세 (Top 15~20개)
```
| 거래처명 | 외상매출금 | 선수금 | 순여신 | 비고 |
|----------|------------|--------|--------|------|
| 거래처1 | | | | |
| 거래처2 | | | | |
| ... | | | | |
| 기타 N개 | | | | |
```

### 5-3. 회수계획 (선택)
```
| 월 | 회수예정액 | 실적 |
|----|------------|------|
| 11월 | | |
| 12월 | | |
| 1월 | | |
```

---

## 6️⃣ 경영 요약 (자동 계산 항목)

다음 항목들은 위 데이터를 기반으로 자동 계산됩니다:

| 지표 | 산식 |
|------|------|
| 매출 성장률 | (당년 매출 - 전년 매출) / 전년 매출 × 100 |
| 영업이익률 | 영업이익 / Tag매출 × 100 |
| 부채비율 | 총부채 / 총자본 × 100 |
| 차입금비율 | 차입금 / 총자본 × 100 |
| 유동비율 | 유동자산 / 유동부채 × 100 |
| ROE | 당기순이익 / 평균자본 × 100 |

---

## 📝 데이터 제출 방법

**방법 1: 표 형식으로 직접 입력**
위 템플릿을 복사하여 숫자만 채워서 제출

**방법 2: 엑셀 파일 업로드**
위 구조에 맞게 작성된 엑셀 파일 업로드

**방법 3: 기존 재무제표 업로드**
원본 재무제표 파일(엑셀/PDF)을 업로드하면 데이터 추출 지원

---

---

## 7️⃣ 외환리포트 (FX Report) 데이터

### 7-1. Summary (총괄)

외환손익의 전체 요약 정보입니다.

```json
{
  "transactionGainLoss": -596435884,      // 실현손익 합계 (외환차손익)
  "valuationGainLoss": 225590592,         // 미실현손익 합계 (외화평가손익)
  "totalGainLoss": -370845292,            // 총 외환손익
  "receivableTransaction": -804654492,    // 채권 거래손익
  "payableTransaction": 208218608,        // 채무 거래손익
  "receivableValuation": -1377901048,     // 채권 평가손익
  "payableValuation": 1603491640          // 채무+예금 평가손익
}
```

**검증 규칙**:
- ✅ `totalGainLoss` = `transactionGainLoss` + `valuationGainLoss`
- ✅ `transactionGainLoss` = `receivableTransaction` + `payableTransaction`
- ✅ `valuationGainLoss` = `receivableValuation` + `payableValuation`
- ✅ 모든 세부 거래/평가 항목의 fxGainLoss/valuationGainLoss 합계와 일치해야 함

### 7-2. Transactions (거래 손익 - 실현)

외화 채권/채무 결제 시 발생하는 외환차손익입니다.

```json
{
  "type": "receivable",                   // receivable: 채권, payable: 채무
  "currency": "CNY",
  "currencyName": "위안화",
  "fxAmount": 2778241015,                 // 외화 금액 (원화 환산 전)
  "bookAmountKRW": 575718640772,          // 장부금액 (원화)
  "settlementAmountKRW": 574944894445,    // 결제금액 (원화)
  "bookRate": 207.22,                     // 장부환율
  "settlementRate": 206.95,               // 결제환율
  "fxGainLoss": -773746327,               // 외환차손익 (음수=손실, 양수=이익)
  "rateVerified": true,                   // 환율 검증 여부
  "count": 437                            // 거래 건수
}
```

**계산 규칙**:

1. **25년말 환율 보정 (중요!)**
   - 거래일이 2026-01-01 이전인 채권/채무는 25년말 환율 적용
   - 25년말 환율: CNY 208.36, USD 1441.1, HKD 184.41
   - 이유: 회계 연도 마감 시점 환율로 재평가

2. **외환차손익 계산**:
   - 채권: `fxGainLoss = settlementAmountKRW - bookAmountKRW`
   - 채무: `fxGainLoss = bookAmountKRW - settlementAmountKRW`

3. **부호 규칙 (GL → Display)**:
   - **GL 외환차손(S차변)**: +금액 → **Display: -금액** (손실)
   - **GL 외환차익(H대변)**: -금액 → **Display: +금액** (이익)
   - **⚠️ 중요**: JSON에는 Display용 부호로 저장 (손실=음수, 이익=양수)

**필수 검증**:
- [ ] 원본 CSV 파일과 fxAmount, bookAmountKRW, settlementAmountKRW 일치
- [ ] bookRate = bookAmountKRW / fxAmount
- [ ] settlementRate = settlementAmountKRW / fxAmount
- [ ] settlementRate가 해당 월 시장 환율 범위(min~max) 내에 있는지 확인
- [ ] 범위 밖이면 25년말 환율 보정 누락 또는 데이터 오류
- [ ] 모든 fxGainLoss의 합 = summary.transactionGainLoss

### 7-3. Valuations (평가 손익 - 미실현)

기말 시점의 외화 채권/채무/예금 잔액 평가손익입니다.

```json
{
  "type": "receivable",                   // receivable: 채권, payable: 채무, deposit: 예금
  "currency": "CNY",
  "currencyName": "위안화",
  "fxBalance": 444870302,                 // 외화 잔액
  "bookAmountKRW": 92388554031,           // 장부금액 (원화)
  "valuationAmountKRW": 91403052345,      // 평가금액 (원화)
  "bookRate": 207.6753,                   // 장부환율
  "endRate": 205.46,                      // 기말환율
  "valuationGainLoss": -985501686,        // 평가손익 (음수=손실, 양수=이익)
  "rateVerified": true,                   // 환율 검증 여부
  "count": 699                            // 잔액 건수
}
```

**계산 규칙**:

1. **25년말 환율 보정 (중요!)**
   - 발생일이 2026-01-01 이전인 채권/채무는 25년말 환율 적용
   - 25년말 환율: CNY 208.36, USD 1441.1, HKD 184.41

2. **평가손익 계산**:
   - `valuationAmountKRW = fxBalance × endRate`
   - `valuationGainLoss = valuationAmountKRW - bookAmountKRW`

3. **외화예금 포함 필수**:
   - type="deposit"으로 별도 항목 추가
   - 예금도 기말환율로 평가하여 평가손익 계산

**필수 검증**:
- [ ] 원본 CSV 파일과 fxBalance, bookAmountKRW 일치
- [ ] bookRate = bookAmountKRW / fxBalance (소수점 오차 허용)
- [ ] endRate가 해당 월 기말 시장 환율과 일치
- [ ] bookRate가 환율 범위 내에 있는지 확인
- [ ] 범위 밖이면 25년말 환율 보정 누락 또는 데이터 오류
- [ ] 외화예금(deposit)이 포함되어 있는지 확인
- [ ] 모든 valuationGainLoss의 합 = summary.valuationGainLoss

### 7-4. Rate Trends (환율 추세)

최근 12개월간 일별 환율 데이터입니다.

```json
{
  "date": "2025-02-03",
  "displayMonth": "2월",                  // 각 월 첫 거래일만 표시, 나머지는 null
  "CNY": 208.5,
  "USD": 1434.9,
  "HKD": 184.4
}
```

**데이터 규칙**:
- 최근 12개월간 일별 환율 데이터 (약 250~300개 레코드)
- 각 월의 첫 거래일만 displayMonth에 "X월" 값 입력 (차트 X축 레이블용)
- 나머지 날짜는 displayMonth: null
- 주요 통화(CNY, USD, HKD) 포함, 필요시 EUR, JPY 추가

### 7-5. Rate Ranges (환율 범위)

해당 월의 시장 환율 최저/최고/평균 값입니다.

```json
{
  "currency": "CNY",
  "currencyName": "위안화",
  "min": 203.91,                          // 해당 월 최저 환율
  "max": 208.79,                          // 해당 월 최고 환율
  "avg": 206.12                           // 해당 월 평균 환율
}
```

**검증 규칙**:
- [ ] 장부환율과 결제환율이 min~max 범위 내에 있는지 확인
- [ ] 범위 밖이면 25년말 환율 보정 누락 또는 데이터 오류
- [ ] 환율 범위는 외부 환율 API 또는 Snowflake 환율정보 테이블에서 조회

---

## ⚠️ 외환리포트 필수 검증 체크리스트

### 데이터 입력 전

- [ ] Snowflake에서 최신 데이터 조회 (또는 CSV 파일 확인)
- [ ] 해당 월의 환율 범위(min/max) 확인
- [ ] 25년말 환율 확인 (CNY: 208.36, USD: 1441.1, HKD: 184.41)

### Transactions 입력 후

- [ ] 각 통화별 fxAmount 합계가 원본 CSV와 일치
- [ ] 각 통화별 bookAmountKRW 합계가 원본과 일치
- [ ] 각 통화별 settlementAmountKRW 합계가 원본과 일치
- [ ] settlementRate가 환율 범위(min~max) 내에 있는지 확인
- [ ] 범위 밖이면: 25년말 환율 보정 적용 필요
- [ ] 모든 fxGainLoss 합계 = summary.transactionGainLoss

### Valuations 입력 후

- [ ] 각 통화별 fxBalance 합계가 원본 CSV와 일치
- [ ] 각 통화별 bookAmountKRW 합계가 원본과 일치
- [ ] bookRate가 환율 범위 내에 있는지 확인 (채권/채무)
- [ ] 범위 밖이면: 25년말 환율 보정 적용 필요
- [ ] **외화예금(deposit) 데이터가 포함되었는지 확인** ⚠️
- [ ] 모든 valuationGainLoss 합계 = summary.valuationGainLoss

### Summary 입력 후

- [ ] transactionGainLoss = Σ(transactions.fxGainLoss)
- [ ] valuationGainLoss = Σ(valuations.valuationGainLoss)
- [ ] totalGainLoss = transactionGainLoss + valuationGainLoss
- [ ] receivableTransaction = Σ(transactions[type=receivable].fxGainLoss)
- [ ] payableTransaction = Σ(transactions[type=payable].fxGainLoss)
- [ ] receivableValuation = Σ(valuations[type=receivable].valuationGainLoss)
- [ ] payableValuation = Σ(valuations[type=payable,deposit].valuationGainLoss)

### 최종 검증 (대시보드 확인)

- [ ] "외환차손익 (실현)" 합계 = summary.transactionGainLoss / 100000000 (억원)
- [ ] "외화평가손익 (미실현)" 합계 = summary.valuationGainLoss / 100000000 (억원)
- [ ] "총 외환손익" 합계 = summary.totalGainLoss / 100000000 (억원)
- [ ] KPI 카드의 통화별 세부 내역과 합계가 일치하는지 확인
- [ ] 환율 추세 차트에서 X축 월 레이블이 정상 표시되는지 확인
- [ ] 장부환율 검증 카드에서 환율이 범위 내에 있는지 확인

---

## 📊 외환리포트 데이터 소스

### Snowflake 테이블
- **거래 데이터**: `변제채권`, `변제채무`, `외환차손익` 테이블
- **평가 데이터**: `외화채권`, `외화채무`, `외화예금` 테이블
- **환율 데이터**: `환율정보` 테이블 또는 외부 환율 API

### CSV 파일 (수동 업데이트 시)
- `변제채권_YYYY-MM.csv`
- `변제채무_YYYY-MM.csv`
- `외환차손익_YYYY-MM.csv`
- `외화채권_YYYY-MM.csv`
- `외화채무_YYYY-MM.csv`
- `외화예금_YYYY-MM.csv`

### Python 스크립트
- `RawData/update_fx_dashboard_data.py`: Snowflake 연동 자동 업데이트
- `RawData/update_fx_dashboard_manual.py`: CSV 기반 수동 업데이트
- `RawData/analyze_fx_corrected.py`: 외환 분석 및 검증

### 예시: 완전한 fxReport JSON 구조

```json
{
  "fxReport": {
    "summary": {
      "transactionGainLoss": -596435884,
      "valuationGainLoss": 225590592,
      "totalGainLoss": -370845292,
      "receivableTransaction": -804654492,
      "payableTransaction": 208218608,
      "receivableValuation": -1377901048,
      "payableValuation": 1603491640
    },
    "transactions": [
      {
        "type": "receivable",
        "currency": "CNY",
        "currencyName": "위안화",
        "fxAmount": 2778241015,
        "bookAmountKRW": 575718640772,
        "settlementAmountKRW": 574944894445,
        "bookRate": 207.22,
        "settlementRate": 206.95,
        "fxGainLoss": -773746327,
        "rateVerified": true,
        "count": 437
      },
      {
        "type": "payable",
        "currency": "USD",
        "currencyName": "달러",
        "fxAmount": -47088406,
        "bookAmountKRW": -68404393373,
        "settlementAmountKRW": -68828169621,
        "bookRate": 1452.5,
        "settlementRate": 1461.5,
        "fxGainLoss": 423776248,
        "rateVerified": true,
        "count": 233
      }
    ],
    "valuations": [
      {
        "type": "receivable",
        "currency": "CNY",
        "currencyName": "위안화",
        "fxBalance": 444870302,
        "bookAmountKRW": 92388554031,
        "valuationAmountKRW": 91403052345,
        "bookRate": 207.6753,
        "endRate": 205.46,
        "valuationGainLoss": -985501686,
        "rateVerified": true,
        "count": 699
      },
      {
        "type": "deposit",
        "currency": "CNY",
        "currencyName": "위안화 예금",
        "fxBalance": 66000000,
        "bookAmountKRW": 13560360000,
        "valuationAmountKRW": 13560360000,
        "bookRate": 205.46,
        "endRate": 205.46,
        "valuationGainLoss": 0,
        "rateVerified": true,
        "count": 1
      },
      {
        "type": "deposit",
        "currency": "USD",
        "currencyName": "달러 예금",
        "fxBalance": 69355965,
        "bookAmountKRW": 98437508059,
        "valuationAmountKRW": 98970962055,
        "bookRate": 1419.31,
        "endRate": 1427.00,
        "valuationGainLoss": 533453996,
        "rateVerified": true,
        "count": 1
      }
    ],
    "rateTrends": [
      { "date": "2025-02-03", "displayMonth": "2월", "CNY": 208.5, "USD": 1434.9, "HKD": 184.4 },
      { "date": "2025-02-04", "displayMonth": null, "CNY": 209.2, "USD": 1438.2, "HKD": 184.6 },
      { "date": "2025-02-05", "displayMonth": null, "CNY": 209.8, "USD": 1441.5, "HKD": 185.1 },
      { "date": "2025-03-03", "displayMonth": "3월", "CNY": 207.1, "USD": 1429.3, "HKD": 183.2 }
    ],
    "rateRanges": [
      {
        "currency": "CNY",
        "currencyName": "위안화",
        "min": 203.91,
        "max": 208.79,
        "avg": 206.12
      },
      {
        "currency": "USD",
        "currencyName": "달러",
        "min": 1419.25,
        "max": 1477.32,
        "avg": 1449.58
      },
      {
        "currency": "HKD",
        "currencyName": "홍콩달러",
        "min": 182.16,
        "max": 189.44,
        "avg": 185.94
      }
    ],
    "insights": [
      "모든 주요 통화(CNY, USD, HKD)의 장부환율이 1월 시장 환율 범위 내 존재 확인 ✅",
      "CNY 거래 손익 -7.7억원: 1월 중 CNY 약세로 채권 회수액 감소",
      "USD 예금 평가이익 +5.3억원: USD 강세로 예금 가치 상승"
    ],
    "warnings": [
      "USD 채무 평가이익 +10.7억원: USD 강세 영향으로 채무 평가이익 발생"
    ]
  }
}
```

---

## 📝 외환리포트 Insights & Warnings 작성 가이드

### Insights (주요 인사이트)
**목적**: 경영진에게 긍정적인 결과 또는 중요한 검증 사항 전달

**작성 원칙**:
- ✅ 경영 관점의 분석과 해석
- ✅ 구체적인 금액과 환율 변동 수치 포함
- ✅ 원인과 결과를 명확히 연결
- ❌ 실무적/기술적 세부사항 제외 (Snowflake, 데이터베이스, 스크립트 등)

**예시**:
```json
"insights": [
  "모든 주요 통화(CNY, USD, HKD)의 장부환율이 1월 시장 환율 범위 내 존재 확인 ✅",
  "CNY 거래 손익 -7.7억원: 1월 중 CNY 약세로 채권 회수액 감소",
  "USD 예금 평가이익 +5.3억원: USD 강세(1,419→1,427)로 예금 가치 상승"
]
```

### Warnings (주의사항)
**목적**: 경영진에게 리스크 요인 및 관리 필요 사항 전달

**작성 원칙**:
- ✅ 재무 리스크, 시장 리스크 중심
- ✅ 경영진이 의사결정할 수 있는 수준의 정보
- ✅ 리스크 관리 제안 포함 가능
- ❌ 실무적/기술적 문제 제외 (데이터 부재, 시스템 오류, 보정 로직 등)

**예시**:
```json
"warnings": [
  "CNY 변동성 주의: 1월 변동률 3.77% (최고 212.48까지 상승 후 급락)",
  "대규모 CNY 채권 잔액: 980억 위안 보유 중 → 환율 변동 시 평가손익 민감도 높음",
  "환헤지 전략 검토 필요: CNY 채권 규모 고려 시 선물환·옵션 등 헤지 수단 검토 권장"
]
```

**제외해야 할 내용 (작성자용 코멘트)**:
- ❌ "TWD 데이터 부재: Snowflake에 1월 TWD 환율 데이터 없음"
- ❌ "환율 보정 로직 적용: 25년 이전 전표 71.8%에 25년말 환율 적용"
- ❌ "데이터베이스 연동 오류", "스크립트 실행 실패" 등

### 작성자용 체크리스트

**데이터 작성 완료 후**:
- [ ] Insights에 실무적/기술적 내용이 포함되지 않았는지 확인
- [ ] Warnings가 경영진 관점의 리스크 요인인지 확인
- [ ] 모든 금액과 환율에 구체적 수치가 포함되었는지 확인
- [ ] 원인과 결과가 명확히 연결되어 있는지 확인

**작성자 본인을 위한 실무 코멘트**:
작성 과정에서 발견한 실무적 이슈는 별도로 기록하되, 대시보드에는 포함하지 않습니다:
- 데이터 소스 문제 (Snowflake 데이터 부재, CSV 파일 누락 등)
- 보정 로직 적용 사항 (25년말 환율 보정 범위 등)
- 시스템 오류 및 예외 처리 내역
- 다음 월 작성 시 주의사항

이러한 실무 코멘트는 작성 가이드 문서나 개인 메모에만 기록하고, 경영분석 보고서(대시보드)에는 **절대 포함하지 않습니다**.

---

## 🎨 외환리포트 UI 최적화 및 레이아웃 가이드

### 공간 효율성 최적화 (2026-02-12 업데이트)

외환리포트 페이지의 공간 효율성과 가독성을 극대화하기 위해 다음 원칙이 적용되었습니다.

#### 1. 카드 여백 최소화

**주요 인사이트 & 주의사항 카드**:
```tsx
// CardHeader 패딩
className="pb-0 pt-1 px-2"  // 제목 하단 여백 제거 (pb-0)

// CardContent 패딩
className="pb-1 pt-0 px-2"  // 내용 상단 여백 제거 (pt-0)
```

**효과**: 제목과 내용 사이 여백이 완전히 제거되어 카드 높이 최소화

#### 2. 글자 크기 최적화

**세부내역 리스트**:
```tsx
// 리스트 아이템
className="text-sm text-slate-700 flex items-start gap-1.5 leading-tight"
```

- `text-sm` (14px): 가독성 확보하면서 적절한 크기 유지
- `leading-tight`: 줄간격 최소화
- `space-y-0`: 항목 간 여백 제거

#### 3. 그리드 간격 최소화

**메인 그리드** (인사이트 & 차트):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
```

**왼쪽 컬럼** (인사이트/주의사항/민감도):
```tsx
<div className="space-y-1">
```

- `gap-1` (4px): 좌우 간격 최소화
- `space-y-1` (4px): 세로 간격 최소화

#### 4. 차트 영역 최적화

**환율 추세 그래프**:
```tsx
<CardHeader className="pb-2 pt-2">  // 헤더 패딩 축소
<CardContent className="pb-1">       // 하단 여백 최소화

<ResponsiveContainer width="100%" height={320}>  // 그래프 높이 증가
  <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
```

**효과**:
- 카드 높이는 유지하면서 그래프 영역 확대 (280px → 320px)
- 하단 여백 감소로 X축 레이블과의 간격 최적화

#### 5. 민감도 카드 최적화

**환율 민감도 분석 (±5%)**:
```tsx
// 4개 카드 그리드
<div className="grid grid-cols-4 gap-1.5">

// 개별 카드 패딩
<CardContent className="pt-1 pb-1 px-2">
  <div className="text-[13px] text-slate-700 font-semibold mb-0.5">
    {curr} -5%
  </div>
  <div className="text-sm font-bold">
    {impact}억
  </div>
</CardContent>
```

- 제목: `text-[13px]` 크기로 명확하게 표시
- 금액: `text-sm font-bold`로 강조
- 패딩: `pt-1 pb-1`로 최소화

### ❌ 피해야 할 패턴

**CSS Transform 사용 금지**:
```tsx
// ❌ 절대 사용하지 말 것
<Card className="scale-90 origin-top-left">
```

**문제점**:
- 카드는 90%로 축소되지만 그리드 셀 높이는 유지됨
- 빈 공간만 증가하여 오히려 비효율적
- 텍스트가 흐릿하게 보일 수 있음

**올바른 방법**:
```tsx
// ✅ 실제 패딩과 간격을 조정
<Card className="border-l-4 border-l-emerald-500">
  <CardHeader className="pb-0 pt-1 px-2">
  <CardContent className="pb-1 pt-0 px-2">
```

### 레이아웃 구조

```
외환리포트 페이지
├── KPI 카드 (5개, grid-cols-5)
│   ├── 외화 잔액 현황
│   ├── 외환차손익 (실현)
│   ├── 외화평가손익 (미실현)
│   ├── 총 외환손익
│   └── 장부환율 검증
│
└── 인사이트 & 차트 (grid-cols-2, gap-1)
    ├── 왼쪽 컬럼 (space-y-1)
    │   ├── 주요 인사이트 (pb-0, pt-0)
    │   ├── 주의사항 (pb-0, pt-0)
    │   └── 민감도 분석 (grid-cols-4)
    │
    └── 오른쪽: 환율 추세 그래프 (height: 320px)
```

### 반응형 디자인

- **모바일** (< 1024px): 1열 레이아웃 (grid-cols-1)
- **데스크톱** (≥ 1024px): 2열 레이아웃 (lg:grid-cols-2)

### 유지보수 체크리스트

새로운 카드나 섹션 추가 시:
- [ ] CSS transform (scale, rotate 등) 사용 금지
- [ ] 패딩은 `p-0` ~ `p-2` 범위 내에서 최소화
- [ ] 그리드 간격은 `gap-1` ~ `gap-2` 사용
- [ ] 글자 크기는 `text-xs` (12px) ~ `text-sm` (14px) 사용
- [ ] 줄간격은 `leading-tight` 또는 `leading-snug` 사용
- [ ] 항목 간격은 `space-y-0` ~ `space-y-1` 사용

---

## ⚠️ 일반 주의사항

1. **단위 통일**: 모든 금액은 동일한 단위로 입력 (천원, 백만원 등)
2. **부호 규칙**: 비용/부채는 양수로 입력 (대시보드에서 자동으로 표시 처리)
3. **외환 부호 규칙**: 외환손익은 Display용 부호로 입력 (손실=음수, 이익=양수)
4. **예상치**: 당년말 예상치가 없으면 당월 실적으로 대체 가능
5. **선택항목**: 분기별 데이터, 회수계획 등은 없으면 생략 가능

# FNF 재고 원가 분석 가이드

**작성일**: 2025년 12월 12일  
**버전**: 1.0  
**용도**: 아이템 마스터 기준 재고 원가 분류 및 분석 표준 지침  
**관련문서**: FNF_재무제표_대시보드_작업정리_v4.md, Item_Master_25_11_.csv

---

## 1. 분석 개요

### 1.1 목적
- 아이템 마스터 기준으로 재고자산을 정확하게 분류
- 브랜드별/카테고리별 재고 원가 현황 분석
- 당시즌/과시즌 재고 관리 효율성 평가

### 1.2 핵심 원칙

| 원칙 | 설명 |
|:---|:---|
| **아이템 마스터 기준 분류** | Item_Master_25_11_.csv 계층 구조 기반 |
| **원가 기준 집계** | END_STOCK_COST_AMT (기말재고원가) 사용 |
| **본사 창고 기준** | CORP_CD = '1000', PLANT_CD = '1000' |
| **시즌 구분** | 당시즌(Current) vs 과시즌(Past) |

---

## 2. 아이템 분류 체계

### 2.1 아이템 마스터 계층 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│  아이템 마스터 계층 구조 (Item_Master_25_11_.csv)                    │
│                                                                     │
│  L0100 (Clothing) ─┬─ L0110 Outer (아우터)                          │
│                    ├─ L0120 Inner (이너)                            │
│                    ├─ L0130 Bottom (하의)                           │
│                    └─ L0160 Wear_etc (의류기타)                      │
│                                                                     │
│  A0100 (ACC) ──────┬─ A0120 Acc_etc (기타소품)                      │
│                    ├─ A0130 Bag (가방)                              │
│                    ├─ A0140 Headwear (모자)                         │
│                    └─ A0150 Shoes (신발)                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 카테고리별 아이템코드 매핑

#### 2.2.1 의류 (WEAR)

| 서브카테고리 | 아이템코드 | 설명 |
|:---|:---|:---|
| **Outer** | BD, BY, CD, CT, DJ, DK, DV, FD, FR, FU, HC, HM, JK, JP, KT, LE, PD, SF, SI, SJ, SS, VT, WC, WJ, WV, DM, DH, BJ, KC | 다운점퍼, 방풍자켓, 코트, 점퍼 등 |
| **Inner** | BL, BS, HD, KO, KP, KV, MT, OP, RL, RS, RT, SW, TK, TL, TR, TS, TT, WS, WT, ZT, DO, S2, PQ, S6, S5, S4, S3, S1, BV, DR, DD, KU | 맨투맨, 티셔츠, 후드티 등 |
| **Bottom** | BB, BP, CU, DP, DS, DT, KS, LG, PT, SB, SK, SM, SN, SP, TB, TP, WP, WU, DI, DB, DN | 팬츠, 스커트, 트레이닝하의 등 |
| **Wear_etc** | AZ, SZ, BF, BR, BX, CA, DW, ES, GP, PJ, PM, PN, PP, SL, SY | 세트, 언더웨어, 기타 |

**주요 의류 아이템코드:**
- DJ: 다운점퍼 (가장 고가)
- WJ: 방풍자켓
- MT: 맨투맨
- TR: 트레이닝(상의)
- TS: 반팔카라티셔츠
- PT: 팬츠
- TP: 트레이닝(하의)

#### 2.2.2 모자 (CAP)

| 아이템코드 | 설명 |
|:---|:---|
| BN | 비니 |
| CB | 여성 베레모 |
| CP | 운동모 |
| HL | 헬멧 |
| HT | 햇 |
| MC | 메시캡 |
| SA | 수영모자 |
| SC | 선캡 |
| WM | 방한모 |
| WR | 와이어캡 |

#### 2.2.3 가방 (BAG)

| 아이템코드 | 설명 |
|:---|:---|
| BG | 가방 |
| BK | 백팩 |
| BM | 버킷백 |
| BQ | 숄더백 |
| BW | 보스톤백 |
| BZ | 바디백 |
| CL | 클러치 |
| CR | 크로스백 |
| EB | 기타가방 |
| EC | 에코백 |
| HS | 힙색 |
| MR | 메신저백 |
| OR | 쇼퍼백 |
| SG | 슬링백 |
| TA | 벨트백 |
| TG | 토드백 |
| UB | 보조가방 |
| RB | 라켓백 |

#### 2.2.4 신발 (SHOES)

| 아이템코드 | 설명 |
|:---|:---|
| CV | 캔버스화 |
| LP | 슬리퍼 |
| MU | 뮬 |
| RN | 런닝화 |
| SD | 샌들 |
| SH | 신발 |
| SQ | 아쿠아 슈즈 |
| SX | 스니커즈 |
| WB | 방한화 |

#### 2.2.5 기타소품 (ACC_ETC)

| 아이템코드 | 설명 |
|:---|:---|
| AC | 기타소품류 |
| AG, GL | 장갑 |
| AM, MF | 머플러 |
| BT | 벨트 |
| GA | 선글라스 |
| GG | 고글 |
| JA, JB, JC, JD | 목걸이, 팔찌, 귀걸이, 반지 |
| MK | 마스크 |
| SO | 양말 |
| UM | 우산 |
| WL | 지갑 |
| 기타 | 위 분류에 해당하지 않는 코드 |

---

## 3. 시즌 구분 기준

### 3.1 시즌 코드 정의

| 시즌 | 월 범위 | 코드 예시 |
|:---|:---|:---|
| SS (Spring-Summer) | 3월~8월 | 25S, 24S |
| FW (Fall-Winter) | 9월~2월 | 25F, 24F |

### 3.2 당시즌/과시즌 구분

| 분석 기준월 | 당시즌 | 과시즌 |
|:---|:---|:---|
| 24년 11월 | 24F | 24S, 23F, 23S 이전 |
| 25년 11월 | 25F | 25S, 24F, 24S 이전 |

### 3.3 의류 시즌 구분 원칙

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⭐ 의류만 당시즌/과시즌 구분                                        │
│                                                                     │
│  - 의류(WEAR): 당시즌/과시즌으로 분리 분석                          │
│  - 용품(CAP, BAG, SHOES, ACC_ETC): 시즌 구분 없이 합산              │
│                                                                     │
│  이유: 의류는 계절성이 강하지만, 용품은 상대적으로 시즌 영향 적음   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. 데이터 소스

### 4.1 주요 테이블

| 테이블 | 스키마 | 용도 |
|:---|:---|:---|
| DW_IVTR_HIST | FNF.SAP_FNF | 재고 스냅샷 (월별 기말재고) |
| DW_PRDT | FNF.PRCS | 제품 마스터 |

### 4.2 DW_IVTR_HIST 주요 컬럼

| 컬럼 | 설명 | 필터 조건 |
|:---|:---|:---|
| YYYYMM | 기준년월 | '202411', '202511' |
| CORP_CD | 법인코드 | '1000' (본사) |
| PLANT_CD | 창고코드 | '1000' (본사창고, 선택적) |
| BRD_CD | 브랜드코드 | M, I, X, V, ST, W |
| PRDT_CD | 제품코드 | 아이템코드 추출용 |
| SESN | 시즌코드 | 24F, 25F 등 |
| END_STOCK_COST_AMT | 기말재고원가 | 분석 대상 금액 |
| CREATE_DT | 생성일시 | MAX 값 사용 (최신 스냅샷) |

### 4.3 아이템코드 추출 규칙

```sql
-- ST 브랜드: 제품코드 8번째부터 2자리
-- 기타 브랜드: 제품코드 7번째부터 2자리
CASE WHEN BRD_CD = 'ST' 
     THEN SUBSTRING(PRDT_CD, 8, 2) 
     ELSE SUBSTRING(PRDT_CD, 7, 2) 
END AS ITEM_CD
```

---

## 5. SQL 쿼리 템플릿

### 5.1 브랜드별/카테고리별 재고 원가 분석

```sql
-- 아이템 마스터 기준 재고 원가 분석
-- 모자: BN, CB, CP, HL, HT, MC, SA, SC, WM, WR
-- 가방: BG, BK, BM, BQ, BW, BZ, CL, CR, EB, EC, HS, MR, OR, SG, TA, TG, UB, RB
-- 신발: CV, LP, MU, RN, SD, SH, SQ, SX, WB
-- 의류: Outer + Inner + Bottom + Wear_etc 아이템코드

WITH latest_dt AS (
    SELECT 
        YYYYMM,
        MAX(CREATE_DT) AS MAX_DT 
    FROM FNF.SAP_FNF.DW_IVTR_HIST 
    WHERE YYYYMM IN ('202411', '202511') 
      AND CORP_CD = '1000'
    GROUP BY YYYYMM
),
inventory AS (
    SELECT 
        i.YYYYMM,
        i.BRD_CD,
        CASE WHEN i.BRD_CD = 'ST' THEN SUBSTRING(i.PRDT_CD, 8, 2) 
             ELSE SUBSTRING(i.PRDT_CD, 7, 2) END AS ITEM_CD,
        i.SESN,
        i.END_STOCK_COST_AMT
    FROM FNF.SAP_FNF.DW_IVTR_HIST i
    JOIN latest_dt l ON i.YYYYMM = l.YYYYMM AND i.CREATE_DT = l.MAX_DT
    WHERE i.CORP_CD = '1000' 
      AND i.BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
),
classified AS (
    SELECT 
        YYYYMM,
        BRD_CD,
        -- 카테고리 분류
        CASE 
            WHEN ITEM_CD IN ('BN', 'CB', 'CP', 'HL', 'HT', 'MC', 'SA', 'SC', 'WM', 'WR') THEN 'CAP'
            WHEN ITEM_CD IN ('BG', 'BK', 'BM', 'BQ', 'BW', 'BZ', 'CL', 'CR', 'EB', 'EC', 'HS', 'MR', 'OR', 'SG', 'TA', 'TG', 'UB', 'RB') THEN 'BAG'
            WHEN ITEM_CD IN ('CV', 'LP', 'MU', 'RN', 'SD', 'SH', 'SQ', 'SX', 'WB') THEN 'SHOES'
            -- 의류 Outer
            WHEN ITEM_CD IN ('BD', 'BY', 'CD', 'CT', 'DJ', 'DK', 'DV', 'FD', 'FR', 'FU', 'HC', 'HM', 'JK', 'JP', 'KT', 'LE', 'PD', 'SF', 'SI', 'SJ', 'SS', 'VT', 'WC', 'WJ', 'WV', 'DM', 'DH', 'BJ', 'KC') THEN 'WEAR'
            -- 의류 Inner
            WHEN ITEM_CD IN ('BL', 'BS', 'HD', 'KO', 'KP', 'KV', 'MT', 'OP', 'RL', 'RS', 'RT', 'SW', 'TK', 'TL', 'TR', 'TS', 'TT', 'WS', 'WT', 'ZT', 'DO', 'S2', 'PQ', 'S6', 'S5', 'S4', 'S3', 'S1', 'BV', 'DR', 'DD', 'KU') THEN 'WEAR'
            -- 의류 Bottom
            WHEN ITEM_CD IN ('BB', 'BP', 'CU', 'DP', 'DS', 'DT', 'KS', 'LG', 'PT', 'SB', 'SK', 'SM', 'SN', 'SP', 'TB', 'TP', 'WP', 'WU', 'DI', 'DB', 'DN') THEN 'WEAR'
            -- 의류 기타
            WHEN ITEM_CD IN ('AZ', 'SZ', 'BF', 'BR', 'BX', 'CA', 'DW', 'ES', 'GP', 'PJ', 'PM', 'PN', 'PP', 'SL', 'SY') THEN 'WEAR'
            ELSE 'ACC_ETC'
        END AS ITEM_GRP,
        -- 당시즌/과시즌 구분 (25년 11월 기준)
        CASE 
            WHEN YYYYMM = '202411' AND SESN = '24F' THEN 'CURRENT'
            WHEN YYYYMM = '202511' AND SESN = '25F' THEN 'CURRENT'
            ELSE 'PAST'
        END AS SESN_TYPE,
        END_STOCK_COST_AMT / 100000000 AS COST_100M
    FROM inventory
)
SELECT 
    BRD_CD,
    CASE 
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'CURRENT' THEN '1_의류_당시즌'
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'PAST' THEN '2_의류_과시즌'
        WHEN ITEM_GRP = 'CAP' THEN '3_모자'
        WHEN ITEM_GRP = 'SHOES' THEN '4_신발'
        WHEN ITEM_GRP = 'BAG' THEN '5_가방'
        ELSE '6_기타소품'
    END AS CATEGORY,
    ROUND(SUM(CASE WHEN YYYYMM = '202411' THEN COST_100M ELSE 0 END), 1) AS COST_2411,
    ROUND(SUM(CASE WHEN YYYYMM = '202511' THEN COST_100M ELSE 0 END), 1) AS COST_2511,
    ROUND(SUM(CASE WHEN YYYYMM = '202511' THEN COST_100M ELSE 0 END) 
        - SUM(CASE WHEN YYYYMM = '202411' THEN COST_100M ELSE 0 END), 1) AS CHG,
    ROUND((SUM(CASE WHEN YYYYMM = '202511' THEN COST_100M ELSE 0 END) 
         - SUM(CASE WHEN YYYYMM = '202411' THEN COST_100M ELSE 0 END)) 
         / NULLIF(SUM(CASE WHEN YYYYMM = '202411' THEN COST_100M ELSE 0 END), 0) * 100, 1) AS CHG_PCT
FROM classified
GROUP BY BRD_CD, 
    CASE 
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'CURRENT' THEN '1_의류_당시즌'
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'PAST' THEN '2_의류_과시즌'
        WHEN ITEM_GRP = 'CAP' THEN '3_모자'
        WHEN ITEM_GRP = 'SHOES' THEN '4_신발'
        WHEN ITEM_GRP = 'BAG' THEN '5_가방'
        ELSE '6_기타소품'
    END
ORDER BY BRD_CD, CATEGORY;
```

### 5.2 전체 요약 쿼리

```sql
-- 위 쿼리에서 BRD_CD를 '전체'로 고정하고 GROUP BY에서 BRD_CD 제외
SELECT 
    '전체' AS BRD_CD,
    CATEGORY,
    SUM(COST_2411) AS COST_2411,
    SUM(COST_2511) AS COST_2511,
    SUM(CHG) AS CHG,
    ROUND(SUM(CHG) / NULLIF(SUM(COST_2411), 0) * 100, 1) AS CHG_PCT
FROM (브랜드별 쿼리 결과)
GROUP BY CATEGORY
ORDER BY CATEGORY;
```

---

## 6. 브랜드 코드 정의

| 코드 | 브랜드명 | 주요 상품군 |
|:---|:---|:---|
| M | MLB | 모자, 가방, 신발, 스트릿웨어 |
| I | MLB KIDS | 아동 의류, 신발 |
| X | Discovery | 아웃도어 의류, 신발 |
| V | Duvetica | 프리미엄 다운자켓 |
| ST | Sergio Tacchini | 테니스/스포츠웨어 |
| W | Supra | 스니커즈, 스트릿웨어 |

---

## 7. 분석 결과 해석 가이드

### 7.1 평가 기준

| 지표 | 긍정적 | 부정적 |
|:---|:---|:---|
| 의류-과시즌 | 감소 (재고 소진) | 증가 (재고 누적) |
| 의류-당시즌 | 적정 증가 (FW 입고) | 과다 증가 (과잉 입고) |
| 용품 | 안정적 유지 또는 소폭 감소 | 급격한 증가 |
| 전체 재고 | 매출 성장률 이내 증가 | 매출 대비 과다 증가 |

### 7.2 주요 모니터링 포인트

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ 주의 신호                                                       │
│                                                                     │
│  1. 의류 과시즌 증가: 시즌오프 소진 부진                            │
│  2. 당시즌 과다 증가: 판매 대비 입고 과잉                           │
│  3. 브랜드별 편차 확대: 특정 브랜드 재고 집중                       │
│  4. 기타소품 증가: 분류 오류 가능성 점검                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 재무제표 연계

```
재무상태표 재고자산 2,416억 (25년 11월)
├── 패션 상품원가: 2,252억 (DB 집계)
├── 재고평가충당금: △289억
├── 원부자재 등: 약 453억
└── 차이: 약 164억 (상품 외 재고)
```

---

## 8. 검증 체크리스트

### 8.1 데이터 정합성

```
□ CREATE_DT 최신값으로 필터링?
□ CORP_CD = '1000' (본사) 필터?
□ 브랜드 6개 모두 포함? (M, I, X, V, ST, W)
□ 아이템코드 추출 로직 (ST는 8번째, 나머지 7번째)?
□ 시즌 구분 기준월 정확?
```

### 8.2 분류 검증

```
□ '기타소품' 금액이 전체의 5% 이내?
□ 의류 비중 65~75% 범위?
□ 주요 아이템코드(DJ, MT, PT, SH, BK, CP) 정상 분류?
□ 전체 합계 = 시산표 패션상품원가와 일치?
```

### 8.3 분석 결과 검증

```
□ YoY 증감률 합리적 범위 (±30% 이내)?
□ 브랜드별 합계 = 전체 합계?
□ 당시즌+과시즌 = 의류 소계?
```

---

## 9. 버전 이력

| 날짜 | 버전 | 변경 내용 |
|:---|:---:|:---|
| 2025-12-12 | 1.0 | 초기 버전 - 아이템 마스터 기준 분류 체계 정립 |

---

## 10. 참고 문서

| 문서명 | 용도 |
|:---|:---|
| `Item_Master_25_11_.csv` | 아이템 마스터 원본 |
| `FNF_재무제표_대시보드_작업정리_v4.md` | 재무제표 작성 지침 |
| `FNF_Snowflake_Dashboard_Guide_Summary.md` | DB 검색 지침 |

---

*Generated by Claude - FNF Inventory Cost Analysis Guide*

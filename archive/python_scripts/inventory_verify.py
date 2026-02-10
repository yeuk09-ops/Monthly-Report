#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
재고자산 검증 - 가이드 기반 Snowflake 쿼리
브랜드별/카테고리별 재고원가 분석 (25년 12월 기준)
"""

import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv('fnf-dashboard/.env.local')

conn = snowflake.connector.connect(
    user=os.getenv('SNOWFLAKE_USERNAME'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
    database=os.getenv('SNOWFLAKE_DATABASE'),
    schema=os.getenv('SNOWFLAKE_SCHEMA'),
    role=os.getenv('SNOWFLAKE_ROLE')
)

cursor = conn.cursor()

print("=" * 80)
print("재고자산 검증 - 브랜드별/카테고리별 분석 (24년 12월 vs 25년 12월)")
print("=" * 80)

# 가이드 기반 쿼리 - 브랜드별, 카테고리별 재고원가
query = """
WITH latest_dt AS (
    SELECT
        YYYYMM,
        MAX(CREATE_DT) AS MAX_DT
    FROM FNF.SAP_FNF.DW_IVTR_HIST
    WHERE YYYYMM IN ('202412', '202512')
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
        -- 당시즌/과시즌 구분 (25년 12월 기준: 25F가 당시즌)
        CASE
            WHEN YYYYMM = '202412' AND SESN = '24F' THEN 'CURRENT'
            WHEN YYYYMM = '202512' AND SESN = '25F' THEN 'CURRENT'
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
    ROUND(SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 1) AS COST_2412,
    ROUND(SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END), 1) AS COST_2512,
    ROUND(SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END)
        - SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 1) AS CHG,
    ROUND((SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END)
         - SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END))
         / NULLIF(SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 0) * 100, 1) AS CHG_PCT
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
ORDER BY BRD_CD, CATEGORY
"""

cursor.execute(query)
results = cursor.fetchall()

print("\n[브랜드별/카테고리별 재고원가] (단위: 억원)")
print("-" * 80)
print(f"{'브랜드':<8} {'카테고리':<15} {'24.12':>10} {'25.12':>10} {'증감':>10} {'증감률':>10}")
print("-" * 80)

brand_totals = {}
for row in results:
    brd, cat, cost24, cost25, chg, pct = row
    print(f"{brd:<8} {cat:<15} {cost24:>10.1f} {cost25:>10.1f} {chg:>10.1f} {pct:>9.1f}%")

    if brd not in brand_totals:
        brand_totals[brd] = {'cost24': 0, 'cost25': 0}
    brand_totals[brd]['cost24'] += cost24 or 0
    brand_totals[brd]['cost25'] += cost25 or 0

print("-" * 80)
print("\n[브랜드별 합계]")
print("-" * 60)
total24 = 0
total25 = 0
for brd, vals in sorted(brand_totals.items()):
    chg = vals['cost25'] - vals['cost24']
    pct = (chg / vals['cost24'] * 100) if vals['cost24'] else 0
    print(f"{brd:<8} {vals['cost24']:>10.1f} {vals['cost25']:>10.1f} {chg:>10.1f} {pct:>9.1f}%")
    total24 += vals['cost24']
    total25 += vals['cost25']

print("-" * 60)
chg = total25 - total24
pct = (chg / total24 * 100) if total24 else 0
print(f"{'전체합계':<8} {total24:>10.1f} {total25:>10.1f} {chg:>10.1f} {pct:>9.1f}%")

# MLB(M) 상세 분석
print("\n" + "=" * 80)
print("MLB(M) 브랜드 상세")
print("=" * 80)

query_mlb = """
WITH latest_dt AS (
    SELECT
        YYYYMM,
        MAX(CREATE_DT) AS MAX_DT
    FROM FNF.SAP_FNF.DW_IVTR_HIST
    WHERE YYYYMM IN ('202412', '202512')
      AND CORP_CD = '1000'
    GROUP BY YYYYMM
),
inventory AS (
    SELECT
        i.YYYYMM,
        CASE WHEN i.BRD_CD = 'ST' THEN SUBSTRING(i.PRDT_CD, 8, 2)
             ELSE SUBSTRING(i.PRDT_CD, 7, 2) END AS ITEM_CD,
        i.SESN,
        i.END_STOCK_COST_AMT
    FROM FNF.SAP_FNF.DW_IVTR_HIST i
    JOIN latest_dt l ON i.YYYYMM = l.YYYYMM AND i.CREATE_DT = l.MAX_DT
    WHERE i.CORP_CD = '1000'
      AND i.BRD_CD = 'M'
),
classified AS (
    SELECT
        YYYYMM,
        CASE
            WHEN ITEM_CD IN ('BN', 'CB', 'CP', 'HL', 'HT', 'MC', 'SA', 'SC', 'WM', 'WR') THEN 'CAP'
            WHEN ITEM_CD IN ('BG', 'BK', 'BM', 'BQ', 'BW', 'BZ', 'CL', 'CR', 'EB', 'EC', 'HS', 'MR', 'OR', 'SG', 'TA', 'TG', 'UB', 'RB') THEN 'BAG'
            WHEN ITEM_CD IN ('CV', 'LP', 'MU', 'RN', 'SD', 'SH', 'SQ', 'SX', 'WB') THEN 'SHOES'
            WHEN ITEM_CD IN ('BD', 'BY', 'CD', 'CT', 'DJ', 'DK', 'DV', 'FD', 'FR', 'FU', 'HC', 'HM', 'JK', 'JP', 'KT', 'LE', 'PD', 'SF', 'SI', 'SJ', 'SS', 'VT', 'WC', 'WJ', 'WV', 'DM', 'DH', 'BJ', 'KC') THEN 'WEAR'
            WHEN ITEM_CD IN ('BL', 'BS', 'HD', 'KO', 'KP', 'KV', 'MT', 'OP', 'RL', 'RS', 'RT', 'SW', 'TK', 'TL', 'TR', 'TS', 'TT', 'WS', 'WT', 'ZT', 'DO', 'S2', 'PQ', 'S6', 'S5', 'S4', 'S3', 'S1', 'BV', 'DR', 'DD', 'KU') THEN 'WEAR'
            WHEN ITEM_CD IN ('BB', 'BP', 'CU', 'DP', 'DS', 'DT', 'KS', 'LG', 'PT', 'SB', 'SK', 'SM', 'SN', 'SP', 'TB', 'TP', 'WP', 'WU', 'DI', 'DB', 'DN') THEN 'WEAR'
            WHEN ITEM_CD IN ('AZ', 'SZ', 'BF', 'BR', 'BX', 'CA', 'DW', 'ES', 'GP', 'PJ', 'PM', 'PN', 'PP', 'SL', 'SY') THEN 'WEAR'
            ELSE 'ACC_ETC'
        END AS ITEM_GRP,
        CASE
            WHEN YYYYMM = '202412' AND SESN = '24F' THEN 'CURRENT'
            WHEN YYYYMM = '202512' AND SESN = '25F' THEN 'CURRENT'
            ELSE 'PAST'
        END AS SESN_TYPE,
        END_STOCK_COST_AMT / 100000000 AS COST_100M
    FROM inventory
)
SELECT
    CASE
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'CURRENT' THEN '의류-당시즌'
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'PAST' THEN '의류-과시즌'
        WHEN ITEM_GRP = 'CAP' THEN '모자'
        WHEN ITEM_GRP = 'SHOES' THEN '신발'
        WHEN ITEM_GRP = 'BAG' THEN '가방'
        ELSE '기타소품'
    END AS CATEGORY,
    ROUND(SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 1) AS COST_2412,
    ROUND(SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END), 1) AS COST_2512,
    ROUND(SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END)
        - SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 1) AS CHG,
    ROUND((SUM(CASE WHEN YYYYMM = '202512' THEN COST_100M ELSE 0 END)
         - SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END))
         / NULLIF(SUM(CASE WHEN YYYYMM = '202412' THEN COST_100M ELSE 0 END), 0) * 100, 1) AS CHG_PCT
FROM classified
GROUP BY
    CASE
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'CURRENT' THEN '의류-당시즌'
        WHEN ITEM_GRP = 'WEAR' AND SESN_TYPE = 'PAST' THEN '의류-과시즌'
        WHEN ITEM_GRP = 'CAP' THEN '모자'
        WHEN ITEM_GRP = 'SHOES' THEN '신발'
        WHEN ITEM_GRP = 'BAG' THEN '가방'
        ELSE '기타소품'
    END
ORDER BY CATEGORY
"""

cursor.execute(query_mlb)
results = cursor.fetchall()
print(f"\n{'카테고리':<15} {'24.12':>10} {'25.12':>10} {'증감':>10} {'증감률':>10}")
print("-" * 60)
for row in results:
    cat, cost24, cost25, chg, pct = row
    print(f"{cat:<15} {cost24:>10.1f} {cost25:>10.1f} {chg:>10.1f} {pct:>9.1f}%")


# Discovery(X) 상세 분석
print("\n" + "=" * 80)
print("Discovery(X) 브랜드 상세")
print("=" * 80)

query_disc = query_mlb.replace("i.BRD_CD = 'M'", "i.BRD_CD = 'X'")
cursor.execute(query_disc)
results = cursor.fetchall()
print(f"\n{'카테고리':<15} {'24.12':>10} {'25.12':>10} {'증감':>10} {'증감률':>10}")
print("-" * 60)
for row in results:
    cat, cost24, cost25, chg, pct = row
    print(f"{cat:<15} {cost24:>10.1f} {cost25:>10.1f} {chg:>10.1f} {pct:>9.1f}%")


# 전체 재고 총액 확인
print("\n" + "=" * 80)
print("전체 재고자산 총액 확인")
print("=" * 80)

query_total = """
WITH latest_dt AS (
    SELECT
        YYYYMM,
        MAX(CREATE_DT) AS MAX_DT
    FROM FNF.SAP_FNF.DW_IVTR_HIST
    WHERE YYYYMM IN ('202412', '202512')
      AND CORP_CD = '1000'
    GROUP BY YYYYMM
)
SELECT
    i.YYYYMM,
    ROUND(SUM(i.END_STOCK_COST_AMT) / 100000000, 1) AS TOTAL_COST
FROM FNF.SAP_FNF.DW_IVTR_HIST i
JOIN latest_dt l ON i.YYYYMM = l.YYYYMM AND i.CREATE_DT = l.MAX_DT
WHERE i.CORP_CD = '1000'
  AND i.BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY i.YYYYMM
ORDER BY i.YYYYMM
"""

cursor.execute(query_total)
results = cursor.fetchall()
print(f"\n{'기준월':<10} {'재고원가(억)':>15}")
print("-" * 30)
for row in results:
    yyyymm, total = row
    print(f"{yyyymm:<10} {total:>15.1f}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("검증 완료")
print("=" * 80)

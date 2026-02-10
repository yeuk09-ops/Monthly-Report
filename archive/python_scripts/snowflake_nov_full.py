# -*- coding: utf-8 -*-
"""
25년 11월 대시보드 데이터 조회 (1~11월 누계 기준)
12월 기준과 동일한 형식으로 조회
"""
import snowflake.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = snowflake.connector.connect(
    user='ykjung',
    password='Fnfsnowflake2025!',
    account='gv28284.ap-northeast-2.aws',
    database='fnf',
    warehouse='dev_wh',
    role='pu_sql_sap',
    schema='sap_fnf'
)

cursor = conn.cursor()

print("=" * 80)
print("【1】 손익계산서: 25년 1~11월 vs 24년 1~11월 누계")
print("=" * 80)

query_pl = """
SELECT
    -- 국내매출 (CHNL_CD 1~8, 11)
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' AND CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_25,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' AND CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_24,
    -- 수출매출 (CHNL_CD = 9)
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' AND CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP_25,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' AND CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP_24,
    -- 매출원가
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' AND CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS_25,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' AND CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS_24
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
"""

cursor.execute(query_pl)
row = cursor.fetchone()
dom_25, dom_24 = row[0], row[1]
exp_25, exp_24 = row[2], row[3]
cogs_25, cogs_24 = row[4], row[5]
total_25 = dom_25 + exp_25
total_24 = dom_24 + exp_24

print(f"{'항목':<15} | {'25년 1~11월':>12} | {'24년 1~11월':>12} | {'증감':>10} | {'증감률':>8}")
print("-" * 70)
print(f"{'국내매출':<15} | {dom_25:>10,}억 | {dom_24:>10,}억 | {dom_25-dom_24:>+8,}억 | {(dom_25-dom_24)/dom_24*100:>+6.1f}%")
print(f"{'수출매출':<15} | {exp_25:>10,}억 | {exp_24:>10,}억 | {exp_25-exp_24:>+8,}억 | {(exp_25-exp_24)/exp_24*100:>+6.1f}%")
print(f"{'실판매출 합계':<15} | {total_25:>10,}억 | {total_24:>10,}억 | {total_25-total_24:>+8,}억 | {(total_25-total_24)/total_24*100:>+6.1f}%")
print(f"{'매출원가':<15} | {cogs_25:>10,}억 | {cogs_24:>10,}억 | {cogs_25-cogs_24:>+8,}억 | {(cogs_25-cogs_24)/cogs_24*100:>+6.1f}%")

print()
print("=" * 80)
print("【2】 채널별 매출 (국내+사입): 25년 1~11월 vs 24년 1~11월")
print("=" * 80)

query_channel = """
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
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')
GROUP BY CASE
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
    END
ORDER BY CHANNEL
"""

cursor.execute(query_channel)
print(f"{'채널':<20} | {'25년1~11월':>10} | {'24년1~11월':>10} | {'YoY':>8}")
print("-" * 55)
total_cy, total_py = 0, 0
for row in cursor.fetchall():
    cy, py = row[1], row[2]
    total_cy += cy
    total_py += py
    yoy = (cy - py) / py * 100 if py != 0 else 0
    print(f"{row[0]:<20} | {cy:>8,}억 | {py:>8,}억 | {yoy:>+6.1f}%")
print("-" * 55)
print(f"{'합계':<20} | {total_cy:>8,}억 | {total_py:>8,}억 | {(total_cy-total_py)/total_py*100:>+6.1f}%")

print()
print("=" * 80)
print("【3】 수출 지역별 매출: 25년 1~11월 vs 24년 1~11월")
print("=" * 80)

query_export = """
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '01.중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '02.홍콩/마카오'
        ELSE '03.기타'
    END AS REGION,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD = '9'
GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '01.중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '02.홍콩/마카오'
        ELSE '03.기타'
    END
ORDER BY REGION
"""

cursor.execute(query_export)
print(f"{'지역':<20} | {'25년1~11월':>10} | {'24년1~11월':>10} | {'YoY':>8}")
print("-" * 55)
total_cy, total_py = 0, 0
for row in cursor.fetchall():
    cy, py = row[1], row[2]
    total_cy += cy
    total_py += py
    yoy = (cy - py) / py * 100 if py != 0 else 0
    print(f"{row[0]:<20} | {cy:>8,}억 | {py:>8,}억 | {yoy:>+6.1f}%")
print("-" * 55)
print(f"{'합계':<20} | {total_cy:>8,}억 | {total_py:>8,}억 | {(total_cy-total_py)/total_py*100:>+6.1f}%")

print()
print("=" * 80)
print("【4】 브랜드별 매출 (국내+사입): 25년 1~11월 vs 24년 1~11월")
print("=" * 80)

query_brand = """
SELECT
    CASE
        WHEN BRD_CD = 'M' THEN 'MLB'
        WHEN BRD_CD = 'X' THEN 'Discovery'
        WHEN BRD_CD = 'I' THEN 'MLB Kids'
        WHEN BRD_CD = 'V' THEN 'Duvetica'
        WHEN BRD_CD = 'ST' THEN 'Sergio Tacchini'
        ELSE '기타'
    END AS BRAND,
    BRD_CD,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')
GROUP BY CASE
        WHEN BRD_CD = 'M' THEN 'MLB'
        WHEN BRD_CD = 'X' THEN 'Discovery'
        WHEN BRD_CD = 'I' THEN 'MLB Kids'
        WHEN BRD_CD = 'V' THEN 'Duvetica'
        WHEN BRD_CD = 'ST' THEN 'Sergio Tacchini'
        ELSE '기타'
    END, BRD_CD
ORDER BY CY_AMT DESC
"""

cursor.execute(query_brand)
results = cursor.fetchall()
total_cy = sum(r[2] for r in results)
total_py = sum(r[3] for r in results)

print(f"{'브랜드':<20} | {'25년1~11월':>10} | {'24년1~11월':>10} | {'YoY':>8} | {'25비중':>6} | {'24비중':>6}")
print("-" * 75)
for row in results:
    cy, py = row[2], row[3]
    yoy = (cy - py) / py * 100 if py != 0 else 0
    ratio_cy = cy / total_cy * 100 if total_cy != 0 else 0
    ratio_py = py / total_py * 100 if total_py != 0 else 0
    print(f"{row[0]:<20} | {cy:>8,}억 | {py:>8,}억 | {yoy:>+6.1f}% | {ratio_cy:>5.1f}% | {ratio_py:>5.1f}%")
print("-" * 75)
print(f"{'합계':<20} | {total_cy:>8,}억 | {total_py:>8,}억 | {(total_cy-total_py)/total_py*100:>+6.1f}% | {100:>5.1f}% | {100:>5.1f}%")

print()
print("=" * 80)
print("【5】 월별 매출 (여신검증용): 9~11월")
print("=" * 80)

query_monthly = """
SELECT
    '국내' as CHANNEL,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-09-01' AND PST_DT <= '2025-09-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS SEP,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-10-01' AND PST_DT <= '2025-10-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS OCT,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-11-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS NOV
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0', '9')
UNION ALL
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '홍콩'
        ELSE '기타'
    END as CHANNEL,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-09-01' AND PST_DT <= '2025-09-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS SEP,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-10-01' AND PST_DT <= '2025-10-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS OCT,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-11-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS NOV
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD = '9'
GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '홍콩'
        ELSE '기타'
    END
ORDER BY CHANNEL
"""

cursor.execute(query_monthly)
print(f"{'채널':<10} | {'9월':>8} | {'10월':>8} | {'11월':>8}")
print("-" * 45)
for row in cursor.fetchall():
    print(f"{row[0]:<10} | {row[1]:>6}억 | {row[2]:>6}억 | {row[3]:>6}억")

print()
print("=" * 80)
print("【6】 AR 채권 잔액 (25년 11월말)")
print("=" * 80)

query_ar = """
SELECT
    '국내' as CHANNEL,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 0) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-11'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH != '09'
UNION ALL
SELECT
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '홍콩'
        ELSE '기타'
    END AS CHANNEL,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 0) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-11'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH = '09'
GROUP BY CASE
         WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국'
         WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '홍콩'
         ELSE '기타'
     END
ORDER BY CHANNEL
"""

cursor.execute(query_ar)
print(f"{'채널':<10} | {'AR 잔액':>10}")
print("-" * 25)
for row in cursor.fetchall():
    if row[1]:
        print(f"{row[0]:<10} | {row[1]:>8}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

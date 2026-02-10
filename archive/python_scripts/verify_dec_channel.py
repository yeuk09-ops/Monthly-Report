# -*- coding: utf-8 -*-
"""12월 채널별/브랜드별 매출 검증"""
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
print("【1】 25년 1~12월 채널별 매출 vs 24년 1~12월")
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
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
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
print(f"{'채널':<20} | {'25년1~12월':>10} | {'24년1~12월':>10} | {'YoY':>8}")
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
print("【2】 25년 1~12월 수출지역별 매출 vs 24년 1~12월")
print("=" * 80)

query_export = """
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '01.중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '02.홍콩/마카오'
        ELSE '03.기타'
    END AS REGION,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
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
print(f"{'지역':<20} | {'25년1~12월':>10} | {'24년1~12월':>10} | {'YoY':>8}")
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
print("【3】 25년 1~12월 브랜드별 매출 vs 24년 1~12월")
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
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-12-31' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
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
    END
ORDER BY CY_AMT DESC
"""

cursor.execute(query_brand)
results = cursor.fetchall()
total_cy = sum(r[1] for r in results)
total_py = sum(r[2] for r in results)

print(f"{'브랜드':<20} | {'25년1~12월':>10} | {'24년1~12월':>10} | {'YoY':>8} | {'25비중':>6} | {'24비중':>6}")
print("-" * 75)
for row in results:
    cy, py = row[1], row[2]
    yoy = (cy - py) / py * 100 if py != 0 else 0
    ratio_cy = cy / total_cy * 100 if total_cy != 0 else 0
    ratio_py = py / total_py * 100 if total_py != 0 else 0
    print(f"{row[0]:<20} | {cy:>8,}억 | {py:>8,}억 | {yoy:>+6.1f}% | {ratio_cy:>5.1f}% | {ratio_py:>5.1f}%")
print("-" * 75)
print(f"{'합계':<20} | {total_cy:>8,}억 | {total_py:>8,}억 | {(total_cy-total_py)/total_py*100:>+6.1f}% | {100:>5.1f}% | {100:>5.1f}%")

conn.close()
print()
print("=" * 80)
print("검증 완료")
print("=" * 80)

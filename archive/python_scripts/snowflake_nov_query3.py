# -*- coding: utf-8 -*-
import snowflake.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Snowflake 연결
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
print("【1】 AR Aging 테이블 최근 CALMONTH 확인")
print("=" * 80)

query_recent = """
SELECT DISTINCT CALMONTH
FROM DM_F_FI_AR_AGING
ORDER BY CALMONTH DESC
LIMIT 10
"""

cursor.execute(query_recent)
print("가용 CALMONTH (최근):")
for row in cursor.fetchall():
    print(f"  - {row[0]}")

print()
print("=" * 80)
print("【2】 가장 최신 CALMONTH의 수출 AR")
print("=" * 80)

query_latest = """
SELECT
    CALMONTH,
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = (SELECT MAX(CALMONTH) FROM DM_F_FI_AR_AGING)
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH = '09'
GROUP BY CALMONTH, CASE
         WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
         WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
         ELSE 'OTHER'
     END
ORDER BY REGION
"""

cursor.execute(query_latest)
print(f"{'기준월':^10} | {'지역':^15} | {'채권(억원)':^12}")
print("-" * 45)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:<15} | {row[2]:>10.1f}억")

print()
print("=" * 80)
print("【3】 대만 수출 상세 (고객별)")
print("=" * 80)

query_taiwan_detail = """
SELECT
    c.CUST_CD,
    a.NAME1 as CUST_NM,
    ROUND(SUM(CASE WHEN c.PST_DT >= '2025-01-01' AND c.PST_DT <= '2025-11-30' THEN c.ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS CY_AMT,
    ROUND(SUM(CASE WHEN c.PST_DT >= '2024-01-01' AND c.PST_DT <= '2024-11-30' THEN c.ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS PY_AMT
FROM DW_COPA_D c
LEFT JOIN (SELECT DISTINCT KUNNR, NAME1 FROM DM_F_FI_AR_AGING) a ON c.CUST_CD = a.KUNNR
WHERE c.CORP_CD = '1000'
  AND c.CHNL_CD = '9'
  AND c.BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND c.CUST_CD NOT IN ('105787', '105798', '105864', '105807', '100888', '100495')
  AND c.CUST_CD NOT IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
GROUP BY c.CUST_CD, a.NAME1
HAVING SUM(c.ACT_SALE_AMT) <> 0
ORDER BY CY_AMT DESC
"""

cursor.execute(query_taiwan_detail)
print(f"{'고객코드':^10} | {'고객명':^35} | {'25년1~11월':^10} | {'24년1~11월':^10}")
print("-" * 75)
total_cy = 0
total_py = 0
for row in cursor.fetchall():
    cust_nm = (row[1] or row[0])[:30]
    total_cy += (row[2] or 0)
    total_py += (row[3] or 0)
    print(f"{row[0]:^10} | {cust_nm:<35} | {(row[2] or 0):>8.1f}억 | {(row[3] or 0):>8.1f}억")
print("-" * 75)
print(f"{'합계':^10} | {'':<35} | {total_cy:>8.1f}억 | {total_py:>8.1f}억")

print()
print("=" * 80)
print("【4】 수출 고객별 총 매출 상세")
print("=" * 80)

query_all_export = """
SELECT
    c.CUST_CD,
    MAX(a.NAME1) as CUST_NM,
    ROUND(SUM(CASE WHEN c.PST_DT >= '2025-01-01' AND c.PST_DT <= '2025-11-30' THEN c.ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS CY_AMT,
    ROUND(SUM(CASE WHEN c.PST_DT >= '2024-01-01' AND c.PST_DT <= '2024-11-30' THEN c.ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS PY_AMT
FROM DW_COPA_D c
LEFT JOIN (SELECT DISTINCT KUNNR, NAME1 FROM DM_F_FI_AR_AGING) a ON c.CUST_CD = a.KUNNR
WHERE c.CORP_CD = '1000'
  AND c.CHNL_CD = '9'
  AND c.BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY c.CUST_CD
HAVING SUM(c.ACT_SALE_AMT) <> 0
ORDER BY CY_AMT DESC
"""

cursor.execute(query_all_export)
print(f"{'고객코드':^10} | {'고객명':^40} | {'25년1~11월':^10} | {'24년1~11월':^10}")
print("-" * 80)
total_cy = 0
total_py = 0
for row in cursor.fetchall():
    cust_nm = (row[1] or row[0])[:35]
    total_cy += (row[2] or 0)
    total_py += (row[3] or 0)
    print(f"{row[0]:^10} | {cust_nm:<40} | {(row[2] or 0):>8.1f}억 | {(row[3] or 0):>8.1f}억")
print("-" * 80)
print(f"{'합계':^10} | {'':<40} | {total_cy:>8.1f}억 | {total_py:>8.1f}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

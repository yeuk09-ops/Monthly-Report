# -*- coding: utf-8 -*-
"""
2024년 12월 중국 매출채권 조회
"""
import snowflake.connector

conn = snowflake.connector.connect(
    account='gv28284.ap-northeast-2.aws',
    user='ykjung',
    password='Fnfsnowflake2025!',
    database='fnf',
    warehouse='dev_wh',
    role='pu_sql_sap',
    schema='sap_fnf'
)

cursor = conn.cursor()

print('=' * 80)
print('2024년 12월 중국 매출채권 조회')
print('=' * 80)

# 2024년 12월 전체 수출 AR 상세
query_all = '''
SELECT
    KUNNR,
    NAME1,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2024-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY KUNNR, NAME1
ORDER BY AR_100M DESC
'''
cursor.execute(query_all)
all_results = cursor.fetchall()
print("2024년 12월 수출 매출채권 전체 고객:")
print("-" * 80)
for row in all_results:
    cust_nm = row[1][:40] if row[1] else 'N/A'
    ar = row[2] if row[2] else 0
    print(f"{row[0]:10s} | {cust_nm:40s} | {ar:>10.1f}")
print()

# 2024년 12월 중국 매출채권 조회 (KUNNR = 고객코드)
query = '''
SELECT
    CALMONTH,
    KUNNR AS CUST_CD,
    NAME1 AS CUST_NM,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2024-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
  AND KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495')
GROUP BY CALMONTH, KUNNR, NAME1
ORDER BY AR_100M DESC
'''

cursor.execute(query)
results = cursor.fetchall()

print(f"{'CUST_CD':10s} | {'고객명':40s} | {'AR(억원)':>12s}")
print('-' * 80)

total = 0
for row in results:
    cust_nm = row[2][:35] if row[2] else 'N/A'
    ar = row[3] if row[3] else 0
    print(f"{row[1]:10s} | {cust_nm:40s} | {ar:>10.1f}")
    total += ar

print('-' * 80)
print(f"{'중국 합계':10s} | {'':40s} | {total:>10.1f}")
print('=' * 80)

# 전체 수출 매출채권 비교
print('\n전체 수출 매출채권 비교 (2024.12 vs 2025.12)')
print('-' * 60)

query2 = '''
SELECT
    CALMONTH,
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH IN ('2024-12', '2025-12')
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY CALMONTH, REGION
ORDER BY CALMONTH, REGION
'''

cursor.execute(query2)
results2 = cursor.fetchall()

print(f"{'CALMONTH':10s} | {'REGION':12s} | {'AR(억원)':>12s}")
print('-' * 40)
for row in results2:
    print(f"{row[0]:10s} | {row[1]:12s} | {row[2]:>10.1f}")

cursor.close()
conn.close()

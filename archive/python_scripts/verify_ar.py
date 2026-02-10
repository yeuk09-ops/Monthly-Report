# -*- coding: utf-8 -*-
"""AR 잔액 검증"""
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

print("=" * 60)
print("【1】 12월말 AR 잔액 (DM_F_FI_AR_AGING)")
print("=" * 60)

query = """
SELECT
    CASE
        WHEN WWDCH != '09' THEN 'DOM'
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_BAL
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
GROUP BY CASE
        WHEN WWDCH != '09' THEN 'DOM'
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK'
        ELSE 'OTHER'
    END
ORDER BY REGION
"""
cursor.execute(query)
print(f"{'지역':<10} | {'AR잔액':>8}")
print("-" * 25)
for row in cursor.fetchall():
    print(f"{row[0]:<10} | {row[1]:>6}억")

print()
print("=" * 60)
print("【2】 11월말 AR 잔액 (DM_F_FI_AR_AGING)")
print("=" * 60)

query2 = """
SELECT
    CASE
        WHEN WWDCH != '09' THEN 'DOM'
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_BAL
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-11'
  AND ZARTYP = 'R1'
GROUP BY CASE
        WHEN WWDCH != '09' THEN 'DOM'
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK'
        ELSE 'OTHER'
    END
ORDER BY REGION
"""
cursor.execute(query2)
print(f"{'지역':<10} | {'AR잔액':>8}")
print("-" * 25)
for row in cursor.fetchall():
    print(f"{row[0]:<10} | {row[1]:>6}억")

conn.close()
print()
print("=" * 60)
print("검증 완료")
print("=" * 60)

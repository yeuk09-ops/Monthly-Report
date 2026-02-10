# -*- coding: utf-8 -*-
"""국내 AR 잔액 검증"""
import snowflake.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

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

print("=" * 60)
print("【1】 국내 AR 잔액 (11월, 12월)")
print("=" * 60)

cursor.execute("""
SELECT
    CALMONTH,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_BAL
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH IN ('2025-11', '2025-12')
  AND ZARTYP = 'R1'
  AND WWDCH != '09'
GROUP BY CALMONTH
ORDER BY CALMONTH
""")

print(f"{'월':>10} | {'AR잔액':>8}")
print("-" * 25)
for row in cursor.fetchall():
    print(f"{row[0]:>10} | {row[1]:>6}억")

print()
print("=" * 60)
print("【2】 전년동월 AR 잔액 (24년 11월, 12월)")
print("=" * 60)

cursor.execute("""
SELECT
    CALMONTH,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_BAL
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH IN ('2024-11', '2024-12')
  AND ZARTYP = 'R1'
  AND WWDCH != '09'
GROUP BY CALMONTH
ORDER BY CALMONTH
""")

print(f"{'월':>10} | {'AR잔액':>8}")
print("-" * 25)
for row in cursor.fetchall():
    print(f"{row[0]:>10} | {row[1]:>6}억")

conn.close()
print()
print("=" * 60)
print("검증 완료")
print("=" * 60)

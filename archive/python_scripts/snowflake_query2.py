# -*- coding: utf-8 -*-
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

# CALMONTH 형식 확인
print("【CALMONTH 형식 확인】")
cursor.execute("SELECT DISTINCT CALMONTH FROM DM_F_FI_AR_AGING ORDER BY CALMONTH DESC LIMIT 5")
for row in cursor.fetchall():
    print(f"  {row[0]}")

print()

# 최근 데이터 확인
print("【최근 AR Aging 데이터 확인】")
cursor.execute("""
SELECT CALMONTH, COUNT(*) as CNT
FROM DM_F_FI_AR_AGING
WHERE ZARTYP = 'R1' AND WWDCH = '09'
GROUP BY CALMONTH
ORDER BY CALMONTH DESC
LIMIT 5
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}건")

print()

# 수출 채권 컬럼 확인
print("【수출 채권 컬럼 값 확인 (최신월)】")
cursor.execute("""
SELECT CALMONTH, KUNNR, NAME1, COL_2_TOTAL, COL_1_TOTAL
FROM DM_F_FI_AR_AGING
WHERE ZARTYP = 'R1' AND WWDCH = '09'
ORDER BY CALMONTH DESC
LIMIT 10
""")
print(f"{'CALMONTH':^12} | {'KUNNR':^10} | {'NAME1':^30} | {'COL_2_TOTAL':^15} | {'COL_1_TOTAL':^15}")
print("-" * 95)
for row in cursor.fetchall():
    name = (row[2] or '')[:25]
    print(f"{row[0]:^12} | {row[1]:^10} | {name:<30} | {str(row[3]):^15} | {str(row[4]):^15}")

conn.close()

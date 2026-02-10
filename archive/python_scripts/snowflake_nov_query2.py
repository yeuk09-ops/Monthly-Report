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
print("【1】 수출 지역별 25년 1~11월 vs 24년 1~11월 (대만 포함)")
print("=" * 80)

# 먼저 대만 CUST_CD 확인
query_taiwan = """
SELECT DISTINCT
    c.CUST_CD,
    MAX(a.NAME1) as CUST_NM,
    ROUND(SUM(c.ACT_SALE_AMT) / 100000000, 1) AS SALE_100M
FROM DW_COPA_D c
LEFT JOIN (SELECT DISTINCT KUNNR, NAME1 FROM DM_F_FI_AR_AGING WHERE CALMONTH = '202512') a ON c.CUST_CD = a.KUNNR
WHERE c.PST_DT >= '2025-01-01' AND c.PST_DT <= '2025-11-30'
  AND c.CORP_CD = '1000'
  AND c.CHNL_CD = '9'
  AND c.BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND c.CUST_CD NOT IN ('105787', '105798', '105864', '105807', '100888', '100495')
  AND c.CUST_CD NOT IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
GROUP BY c.CUST_CD
HAVING SUM(c.ACT_SALE_AMT) > 0
ORDER BY SALE_100M DESC
"""

cursor.execute(query_taiwan)
print("기타 수출 고객 (중국/홍콩 제외):")
print(f"{'고객코드':^12} | {'고객명':^40} | {'매출':^10}")
print("-" * 70)
for row in cursor.fetchall():
    cust_nm = (row[1] or row[0])[:35]
    print(f"{row[0]:^12} | {cust_nm:<40} | {row[2]:>8.1f}억")

print()
print("=" * 80)
print("【2】 수출 지역별 매출 (대만 고객 포함)")
print("=" * 80)

# 대만 고객 코드 포함하여 재조회
query_export_fix = """
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '01.중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '02.홍콩/마카오'
        WHEN CUST_CD IN ('101099', '100944', '106152', '106171', '100895') THEN '03.대만'
        ELSE '04.기타'
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
        WHEN CUST_CD IN ('101099', '100944', '106152', '106171', '100895') THEN '03.대만'
        ELSE '04.기타'
    END
ORDER BY REGION
"""

cursor.execute(query_export_fix)
print(f"{'지역':^20} | {'25년 1~11월':^12} | {'24년 1~11월':^12}")
print("-" * 50)
total_cy = 0
total_py = 0
for row in cursor.fetchall():
    total_cy += row[1]
    total_py += row[2]
    print(f"{row[0]:<20} | {row[1]:>10,}억 | {row[2]:>10,}억")
print("-" * 50)
print(f"{'합계':<20} | {total_cy:>10,}억 | {total_py:>10,}억")

print()
print("=" * 80)
print("【3】 AR Aging 테이블 CALMONTH 확인")
print("=" * 80)

query_calmonth = """
SELECT DISTINCT CALMONTH
FROM DM_F_FI_AR_AGING
WHERE CALMONTH >= '202501'
ORDER BY CALMONTH
"""

cursor.execute(query_calmonth)
print("사용 가능한 CALMONTH:")
for row in cursor.fetchall():
    print(f"  - {row[0]}")

print()
print("=" * 80)
print("【4】 25년 11월말 국내 AR 채권 (WWDCH != '09')")
print("=" * 80)

query_ar_domestic = """
SELECT
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '202511'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH != '09'
"""

cursor.execute(query_ar_domestic)
for row in cursor.fetchall():
    print(f"국내 AR: {row[0]}억")

print()
print("=" * 80)
print("【5】 25년 11월말 수출 AR 채권 (WWDCH = '09')")
print("=" * 80)

query_ar_export = """
SELECT
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '202511'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH = '09'
GROUP BY CASE
         WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
         WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
         ELSE 'OTHER'
     END
ORDER BY REGION
"""

cursor.execute(query_ar_export)
print(f"{'지역':^15} | {'채권(억원)':^12}")
print("-" * 35)
for row in cursor.fetchall():
    print(f"{row[0]:<15} | {row[1]:>10.1f}억")

print()
print("=" * 80)
print("【6】 가용 CALMONTH에서 최신 데이터 확인")
print("=" * 80)

# 202512 데이터로 11월 시점 시뮬레이션은 어려우므로 202511이 없으면 202510 확인
query_ar_oct = """
SELECT
    CALMONTH,
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH IN ('202510', '202511', '202512')
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH = '09'
GROUP BY CALMONTH, CASE
         WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
         WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
         ELSE 'OTHER'
     END
ORDER BY CALMONTH, REGION
"""

cursor.execute(query_ar_oct)
print(f"{'기준월':^10} | {'지역':^15} | {'채권(억원)':^12}")
print("-" * 45)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:<15} | {row[2]:>10.1f}억")

print()
print("=" * 80)
print("【7】 국내 AR 잔액 (월별)")
print("=" * 80)

query_ar_domestic_monthly = """
SELECT
    CALMONTH,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH IN ('202510', '202511', '202512')
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST')
  AND WWDCH != '09'
GROUP BY CALMONTH
ORDER BY CALMONTH
"""

cursor.execute(query_ar_domestic_monthly)
print(f"{'기준월':^10} | {'국내 AR(억원)':^15}")
print("-" * 30)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:>12.1f}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

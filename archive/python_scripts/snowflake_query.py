# -*- coding: utf-8 -*-
import snowflake.connector
import sys
import os

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
print("【1】 25년 11월-12월 수출 매출 (지역별) - COPA 기준")
print("=" * 80)

# 수출 매출 쿼리 (중국/홍콩/기타 구분)
query_sale = """
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') as MONTH,
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 1) AS SALE_100M
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'),
         CASE
             WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
             WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
             ELSE 'OTHER'
         END
ORDER BY MONTH, REGION
"""

cursor.execute(query_sale)
print(f"{'월':^10} | {'지역':^12} | {'매출(억원)':^12}")
print("-" * 40)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:^12} | {row[2]:>10.1f}억")

print()
print("=" * 80)
print("【2】 25년 12월말 수출 채권 (AR Aging) - 지역별")
print("=" * 80)

# 채권 쿼리
query_ar = """
SELECT
    CALMONTH,
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '202512'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH = '09'
GROUP BY CALMONTH,
         CASE
             WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
             WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
             ELSE 'OTHER'
         END
ORDER BY REGION
"""

cursor.execute(query_ar)
print(f"{'기준월':^10} | {'지역':^12} | {'채권(억원)':^12}")
print("-" * 40)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:^12} | {row[2]:>10.1f}억")

print()
print("=" * 80)
print("【3】 25년 12월 수출 매출 상세 (고객별)")
print("=" * 80)

query_detail = """
SELECT
    c.CUST_CD,
    MAX(a.NAME1) as CUST_NM,
    ROUND(SUM(CASE WHEN TO_CHAR(c.PST_DT, 'MM') = '11' THEN c.VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(c.PST_DT, 'MM') = '12' THEN c.VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 1) AS DEC_SALE
FROM DW_COPA_D c
LEFT JOIN (SELECT DISTINCT KUNNR, NAME1 FROM DM_F_FI_AR_AGING WHERE CALMONTH = '202512') a ON c.CUST_CD = a.KUNNR
WHERE c.PST_DT >= '2025-11-01' AND c.PST_DT <= '2025-12-31'
  AND c.CORP_CD = '1000'
  AND c.CHNL_CD = '9'
  AND c.BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY c.CUST_CD
HAVING SUM(c.VAT_EXC_ACT_SALE_AMT) > 0
ORDER BY DEC_SALE DESC
"""

cursor.execute(query_detail)
print(f"{'고객코드':^10} | {'고객명':^45} | {'11월':^8} | {'12월':^8}")
print("-" * 80)
for row in cursor.fetchall():
    cust_nm = (row[1] or row[0])[:40]
    print(f"{row[0]:^10} | {cust_nm:<45} | {row[2]:>6.1f}억 | {row[3]:>6.1f}억")

print()
print("=" * 80)
print("【4】 25년 12월말 수출 채권 상세 (고객별)")
print("=" * 80)

query_ar_detail = """
SELECT
    KUNNR,
    NAME1,
    ROUND(SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '202512'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH = '09'
GROUP BY KUNNR, NAME1
HAVING SUM(TRY_TO_NUMBER(REPLACE(COL_2_TOTAL, ',', ''))) > 0
ORDER BY AR_100M DESC
"""

cursor.execute(query_ar_detail)
print(f"{'고객코드':^10} | {'고객명':^45} | {'채권(억원)':^12}")
print("-" * 75)
for row in cursor.fetchall():
    cust_nm = (row[1] or row[0])[:40]
    print(f"{row[0]:^10} | {cust_nm:<45} | {row[2]:>10.1f}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

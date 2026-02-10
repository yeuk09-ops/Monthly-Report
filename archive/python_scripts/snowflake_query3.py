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

print("=" * 100)
print("【1】 25년 12월말 수출 채권 상세 (고객별) - AR Aging")
print("=" * 100)

# 수출 채권 고객별 조회
cursor.execute("""
SELECT
    KUNNR,
    NAME1,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY KUNNR, NAME1
ORDER BY AR_100M DESC
""")

print(f"{'고객코드':^12} | {'고객명':^50} | {'채권(억원)':^12}")
print("-" * 80)
total_ar = 0
for row in cursor.fetchall():
    ar = row[2] if row[2] else 0
    total_ar += ar
    name = (row[1] or row[0])[:45]
    print(f"{row[0]:^12} | {name:<50} | {ar:>10.1f}억")
print("-" * 80)
print(f"{'합계':^12} | {'':<50} | {total_ar:>10.1f}억")

print()
print("=" * 100)
print("【2】 25년 12월말 수출 채권 (지역별 집계)")
print("=" * 100)

# 지역별 집계
cursor.execute("""
SELECT
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국(CHINA)'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN '홍콩/대만(HK/TW)'
        ELSE '기타(OTHER)'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국(CHINA)'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN '홍콩/대만(HK/TW)'
        ELSE '기타(OTHER)'
    END
ORDER BY REGION
""")

print(f"{'지역':^20} | {'채권(억원)':^15}")
print("-" * 40)
for row in cursor.fetchall():
    ar = row[1] if row[1] else 0
    print(f"{row[0]:<20} | {ar:>13.1f}억")

print()
print("=" * 100)
print("【3】 25년 11월-12월 수출 매출 (지역별) - 대시보드 검증용")
print("=" * 100)

# 수출 매출 지역별 (11월, 12월)
cursor.execute("""
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국(CHINA)'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
        THEN '홍콩/대만(HK/TW)'
        ELSE '기타(OTHER)'
    END AS REGION,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '11' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '12' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DEC_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '중국(CHINA)'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
        THEN '홍콩/대만(HK/TW)'
        ELSE '기타(OTHER)'
    END
ORDER BY REGION
""")

print(f"{'지역':^20} | {'11월 매출':^12} | {'12월 매출':^12}")
print("-" * 50)
for row in cursor.fetchall():
    print(f"{row[0]:<20} | {row[1]:>10.0f}억 | {row[2]:>10.0f}억")

conn.close()

print()
print("=" * 100)
print("분석 완료")
print("=" * 100)

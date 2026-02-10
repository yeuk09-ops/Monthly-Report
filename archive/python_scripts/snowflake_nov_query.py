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
print("【1】 25년 1~11월 누계 손익계산서 (COPA 기준) vs 24년 동기")
print("=" * 80)

query_pl = """
SELECT
    '매출' as ITEM,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS PY_AMT
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0')
UNION ALL
SELECT
    '매출원가' as ITEM,
    ROUND(SUM(CASE WHEN PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30' THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS CY_AMT,
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS PY_AMT
FROM DW_COPA_D
WHERE CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0')
"""

cursor.execute(query_pl)
print(f"{'항목':^15} | {'25년 1~11월':^15} | {'24년 1~11월':^15}")
print("-" * 50)
for row in cursor.fetchall():
    print(f"{row[0]:^15} | {row[1]:>12,}억 | {row[2]:>12,}억")

print()
print("=" * 80)
print("【2】 25년 1~11월 누계 채널별 매출 (국내+사입) vs 24년 동기")
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
    ROUND(SUM(CASE WHEN PST_DT >= '2024-01-01' AND PST_DT <= '2024-11-30' THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS PY_AMT
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
print(f"{'채널':^20} | {'25년 1~11월':^12} | {'24년 1~11월':^12}")
print("-" * 50)
for row in cursor.fetchall():
    print(f"{row[0]:<20} | {row[1]:>10,}억 | {row[2]:>10,}억")

print()
print("=" * 80)
print("【3】 25년 1~11월 누계 수출 지역별 매출 vs 24년 동기")
print("=" * 80)

query_export = """
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN '01.중국'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN '02.홍콩/마카오'
        WHEN CUST_CD IN ('101099', '100944', '106152', '106171') THEN '03.대만'
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
        WHEN CUST_CD IN ('101099', '100944', '106152', '106171') THEN '03.대만'
        ELSE '04.기타'
    END
ORDER BY REGION
"""

cursor.execute(query_export)
print(f"{'지역':^20} | {'25년 1~11월':^12} | {'24년 1~11월':^12}")
print("-" * 50)
for row in cursor.fetchall():
    print(f"{row[0]:<20} | {row[1]:>10,}억 | {row[2]:>10,}억")

print()
print("=" * 80)
print("【4】 25년 1~11월 누계 브랜드별 매출 (국내+사입) vs 24년 동기")
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
print(f"{'브랜드':^20} | {'코드':^5} | {'25년 1~11월':^12} | {'24년 1~11월':^12}")
print("-" * 60)
for row in cursor.fetchall():
    print(f"{row[0]:<20} | {row[1]:^5} | {row[2]:>10,}억 | {row[3]:>10,}억")

print()
print("=" * 80)
print("【5】 25년 11월말 AR 채권 잔액 (지역별)")
print("=" * 80)

query_ar = """
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
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH = '09'
GROUP BY CASE
         WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
         WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
         ELSE 'OTHER'
     END
ORDER BY REGION
"""

cursor.execute(query_ar)
print(f"{'지역':^15} | {'채권(억원)':^12}")
print("-" * 35)
for row in cursor.fetchall():
    print(f"{row[0]:<15} | {row[1]:>10.1f}억")

print()
print("=" * 80)
print("【6】 25년 9~11월 월별 수출 매출 (여신검증용)")
print("=" * 80)

query_monthly_export = """
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') as MONTH,
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS SALE_100M
FROM DW_COPA_D
WHERE PST_DT >= '2025-09-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'),
         CASE
             WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
             WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
             ELSE 'OTHER'
         END
ORDER BY REGION, MONTH
"""

cursor.execute(query_monthly_export)
print(f"{'월':^10} | {'지역':^12} | {'매출(억원)':^12}")
print("-" * 40)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:^12} | {row[2]:>10}억")

print()
print("=" * 80)
print("【7】 25년 9~11월 월별 국내 매출 (여신검증용)")
print("=" * 80)

query_monthly_domestic = """
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') as MONTH,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS SALE_100M
FROM DW_COPA_D
WHERE PST_DT >= '2025-09-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND CHNL_CD NOT IN ('99', '0', '9')
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
ORDER BY MONTH
"""

cursor.execute(query_monthly_domestic)
print(f"{'월':^10} | {'국내매출(억원)':^15}")
print("-" * 30)
for row in cursor.fetchall():
    print(f"{row[0]:^10} | {row[1]:>12}억")

print()
print("=" * 80)
print("【8】 채널별 매출 수정 (24년 동기 ACT_SALE_AMT 기준)")
print("=" * 80)

query_channel_fix = """
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

cursor.execute(query_channel_fix)
print(f"{'채널':^20} | {'25년 1~11월':^12} | {'24년 1~11월':^12}")
print("-" * 50)
total_cy = 0
total_py = 0
for row in cursor.fetchall():
    total_cy += row[1]
    total_py += row[2]
    print(f"{row[0]:<20} | {row[1]:>10,}억 | {row[2]:>10,}억")
print("-" * 50)
print(f"{'합계':<20} | {total_cy:>10,}억 | {total_py:>10,}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

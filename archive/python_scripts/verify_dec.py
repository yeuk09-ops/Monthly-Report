# -*- coding: utf-8 -*-
"""12월 단월 데이터 검증"""
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
print("【1】 12월 단월 매출 검증")
print("=" * 80)

query = """
SELECT
    '25년 12월' as PERIOD,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS TOTAL,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS
FROM DW_COPA_D
WHERE PST_DT >= '2025-12-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
UNION ALL
SELECT
    '24년 12월' as PERIOD,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS TOTAL,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS
FROM DW_COPA_D
WHERE PST_DT >= '2024-12-01' AND PST_DT <= '2024-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
"""

cursor.execute(query)
print(f"{'기간':<12} | {'국내':>8} | {'수출':>8} | {'합계':>8} | {'원가':>8}")
print("-" * 55)
for row in cursor.fetchall():
    print(f"{row[0]:<12} | {row[1]:>6}억 | {row[2]:>6}억 | {row[3]:>6}억 | {row[4]:>6}억")

print()
print("=" * 80)
print("【2】 25년 1~12월 누계 vs 1~11월 누계 검증")
print("=" * 80)

query2 = """
SELECT
    '1~12월 누계' as PERIOD,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS TOTAL,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
UNION ALL
SELECT
    '1~11월 누계' as PERIOD,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM,
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS TOTAL,
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99','0') THEN ACT_COGS ELSE 0 END) / 100000000, 0) AS COGS
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
"""

cursor.execute(query2)
results = cursor.fetchall()
print(f"{'기간':<12} | {'국내':>8} | {'수출':>8} | {'합계':>8} | {'원가':>8}")
print("-" * 55)
for row in results:
    print(f"{row[0]:<12} | {row[1]:>6}억 | {row[2]:>6}억 | {row[3]:>6}억 | {row[4]:>6}억")

# 차이 계산
if len(results) == 2:
    r12, r11 = results[0], results[1]
    print("-" * 55)
    print(f"{'12월 단월':<12} | {r12[1]-r11[1]:>6}억 | {r12[2]-r11[2]:>6}억 | {r12[3]-r11[3]:>6}억 | {r12[4]-r11[4]:>6}억")

conn.close()
print()
print("=" * 80)
print("검증 완료")
print("=" * 80)

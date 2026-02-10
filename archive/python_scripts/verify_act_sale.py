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

print("=" * 80)
print("【1】 25년 1~12월 국내매출 ACT_SALE_AMT 확인")
print("=" * 80)

query = """
SELECT
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) AS DOM_ACT_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('9', '99', '0')
"""

cursor.execute(query)
row = cursor.fetchone()
print(f"국내매출 ACT_SALE_AMT (V+): {row[0]}억")

print()
print("=" * 80)
print("【2】 25년 1~12월 국내/수출 매출 비교")
print("=" * 80)

query2 = """
SELECT
    -- 국내 ACT_SALE_AMT (V+)
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_ACT,
    -- 국내 VAT_EXC_ACT_SALE_AMT (V-)
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9','99','0') THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_VAT_EXC,
    -- 수출 ACT_SALE_AMT
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP_ACT,
    -- 수출 VAT_EXC_ACT_SALE_AMT
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP_VAT_EXC
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
"""

cursor.execute(query2)
row = cursor.fetchone()

dom_act = row[0]
dom_vat_exc = row[1]
exp_act = row[2]
exp_vat_exc = row[3]

print(f"국내 ACT_SALE_AMT (V+):      {dom_act:>8}억")
print(f"국내 VAT_EXC (V-):           {dom_vat_exc:>8}억")
print(f"국내 ACT/1.1 계산:           {round(dom_act/1.1):>8}억")
print()
print(f"수출 ACT_SALE_AMT:           {exp_act:>8}억")
print(f"수출 VAT_EXC:                {exp_vat_exc:>8}억")

print()
print("=" * 80)
print("【3】 대시보드 원본값 8824억 검증")
print("=" * 80)
print(f"현재 Snowflake 국내 ACT_SALE_AMT: {dom_act}억")
print(f"대시보드에서 사용했던 값:          8824억")
print(f"차이:                            {dom_act - 8824}억")

conn.close()
print()
print("=" * 80)
print("완료")
print("=" * 80)

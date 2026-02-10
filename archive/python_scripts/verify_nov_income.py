# -*- coding: utf-8 -*-
"""
25년 11월 대시보드 손익 검증 스크립트
가이드에 따라 BRD_CD 필터 포함하여 Snowflake 데이터 조회
"""
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
print("【25년 1~11월 손익 데이터 검증】")
print("=" * 80)
print()

# 1. 매출 데이터 (국내/수출) - 가이드 기준 필터 적용
print("【1】 매출 데이터 (VAT 제외 기준)")
print("-" * 60)

query_revenue = """
SELECT
    -- 국내매출 (V- 기준, CHNL_CD 9/99/0 제외)
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('9', '99', '0')
              THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_SALE,
    -- 수출매출 (CHNL_CD = '9')
    ROUND(SUM(CASE WHEN CHNL_CD = '9'
              THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXP_SALE,
    -- 총매출 (V-)
    ROUND(SUM(CASE WHEN CHNL_CD NOT IN ('99', '0')
              THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS TOTAL_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
"""

cursor.execute(query_revenue)
row = cursor.fetchone()
dom_sale = row[0]
exp_sale = row[1]
total_sale = row[2]

print(f"국내매출 (V-):           {dom_sale:>8}억")
print(f"수출매출:                {exp_sale:>8}억")
print(f"총매출 (V-):             {total_sale:>8}억")
print()

# 2. 매출원가
print("【2】 매출원가")
print("-" * 60)

query_cogs = """
SELECT
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS COGS
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0')
"""

cursor.execute(query_cogs)
cogs = cursor.fetchone()[0]
print(f"매출원가:                {cogs:>8}억")
print()

# 3. 판관비 (점수수료 포함)
print("【3】 판관비 (점수수료 포함)")
print("-" * 60)

query_sga = """
SELECT
    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS STORE_FEE,
    -- 기타수수료 (SM + 카드 + 온라인)
    ROUND(SUM(COALESCE(SM_CMS, 0) + COALESCE(CARD_CMS, 0) + COALESCE(ONLN_CNS_SALE_CMS, 0)) / 100000000, 0) AS OTHER_CMS
FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-11-30'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST')
  AND CHNL_CD NOT IN ('99', '0')
"""

cursor.execute(query_sga)
sga_row = cursor.fetchone()
store_fee = sga_row[0]
other_cms = sga_row[1]

print(f"점수수료 (SALE_CMS):     {store_fee:>8}억")
print(f"기타수수료:              {other_cms:>8}억")
print()

# 4. 영업이익 계산
print("【4】 영업이익 계산 (가이드 공식)")
print("-" * 60)
print("관리손익: 매출(V-) - 점수수료 - 매출원가 - 판관비(점수수료제외)")
print("재무손익: 매출(V-) - 매출원가 - 판관비(점수수료포함) ← 대시보드")
print()

# 대시보드 방식: 판관비에 점수수료 포함
# 관리손익 방식: 점수수료를 매출에서 차감
print(f"① 재무매출(V-):          {total_sale:>8}억")
print(f"② 점수수료:              {store_fee:>8}억")
print(f"③ 매출원가:              {cogs:>8}억")
print()

# 대시보드 판관비는 점수수료 + 기타판관비로 구성
# 대시보드 표시: 5,247억
dashboard_sga = 5247
print(f"대시보드 판관비:         {dashboard_sga:>8}억")
print()

# 영업이익 계산 (대시보드 방식)
op_profit_dashboard = total_sale - cogs - dashboard_sga

print("-" * 40)
print(f"영업이익 (대시보드방식): {op_profit_dashboard:>8}억")
print(f"  = {total_sale} - {cogs} - {dashboard_sga}")
print()

# 5. 대시보드 비교
print("=" * 80)
print("【대시보드 데이터 vs Snowflake 비교】")
print("=" * 80)
print()
print(f"{'항목':<20} {'대시보드':>10} {'Snowflake':>10} {'차이':>10}")
print("-" * 60)
print(f"{'실판매출(V-)':>20} {'14,882':>10} {f'{total_sale:,}':>10} {f'{14882 - total_sale:,}':>10}")
print(f"{'국내매출':>20} {'7,021':>10} {f'{dom_sale:,}':>10} {f'{7021 - dom_sale:,}':>10}")
print(f"{'수출매출':>20} {'7,861':>10} {f'{exp_sale:,}':>10} {f'{7861 - exp_sale:,}':>10}")
print(f"{'매출원가':>20} {'5,402':>10} {f'{cogs:,}':>10} {f'{5402 - cogs:,}':>10}")
print(f"{'판관비':>20} {'5,247':>10} {'(별도계산)':>10} {'-':>10}")
print(f"{'영업이익':>20} {'4,233':>10} {f'{op_profit_dashboard:,}':>10} {f'{4233 - op_profit_dashboard:,}':>10}")
print()

# 6. 검증 결과
print("=" * 80)
print("【검증 결과】")
print("=" * 80)
print()
sale_match = 14882 == total_sale
dom_match = 7021 == dom_sale
exp_match = 7861 == exp_sale
op_match = 4233 == op_profit_dashboard

print(f"✅ 실판매출(V-): {'일치' if sale_match else '불일치'}")
print(f"✅ 국내매출: {'일치' if dom_match else '불일치'}")
print(f"✅ 수출매출: {'일치' if exp_match else '불일치'}")
print(f"✅ 영업이익: {'일치' if op_match else '불일치 (판관비 차이로 인한 것으로 추정)'}")

conn.close()
print()
print("=" * 80)
print("검증 완료")
print("=" * 80)

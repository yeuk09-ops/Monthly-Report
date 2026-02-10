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
print("【1】 25년 1~12월 손익 핵심 데이터 (COPA 기준)")
print("=" * 80)

# 연간 손익 핵심 데이터 쿼리
query_annual = """
SELECT
    TO_CHAR(PST_DT, 'YYYY') AS YR,

    -- 매출액 (실판매 V-)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE_AMT,

    -- 점수수료 (SALE_CMS)
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,

    -- 출고매출 (실판매 - 점수수료)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT - SALE_CMS) / 100000000, 0) AS NET_SALE,

    -- 매출원가
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS ACT_COGS

FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
GROUP BY TO_CHAR(PST_DT, 'YYYY')
ORDER BY YR
"""

cursor.execute(query_annual)
results = cursor.fetchall()

print(f"{'연도':^6} | {'매출액(V-)':^12} | {'점수수료':^10} | {'출고매출':^10} | {'매출원가':^10}")
print("-" * 60)
for row in results:
    print(f"{row[0]:^6} | {row[1]:>10}억 | {row[2]:>8}억 | {row[3]:>8}억 | {row[4]:>8}억")

print()
print("=" * 80)
print("【2】 25년 1~12월 국내/수출 매출 분리")
print("=" * 80)

# 국내/수출 매출 분리
query_domestic_export = """
SELECT
    TO_CHAR(PST_DT, 'YYYY') AS YR,

    -- 국내 매출 (V+)
    ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_SALE_VPLUS,

    -- 국내 매출 (V-)
    ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_SALE_VMINUS,

    -- 수출 매출 (영세율)
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE,

    -- 전체 매출 (V-)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS TOTAL_SALE_VMINUS

FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
GROUP BY TO_CHAR(PST_DT, 'YYYY')
ORDER BY YR
"""

cursor.execute(query_domestic_export)
results = cursor.fetchall()

print(f"{'연도':^6} | {'국내(V+)':^10} | {'국내(V-)':^10} | {'수출':^10} | {'전체(V-)':^10}")
print("-" * 60)
for row in results:
    print(f"{row[0]:^6} | {row[1]:>8}억 | {row[2]:>8}억 | {row[3]:>8}억 | {row[4]:>8}억")

# VAT 검증
print()
print("【국내 VAT 검증】")
for row in results:
    vat_calc = round(row[1] / 1.1)
    diff = row[2] - vat_calc
    print(f"{row[0]}년: 국내(V+) {row[1]}억 / 1.1 = {vat_calc}억 vs 국내(V-) {row[2]}억 (차이: {diff}억)")

print()
print("=" * 80)
print("【3】 25년 판관비 상세 (점수수료 구분)")
print("=" * 80)

# 점수수료 및 기타 수수료 확인
query_cms = """
SELECT
    TO_CHAR(PST_DT, 'YYYY') AS YR,

    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,

    -- 기타수수료 (SM_CMS + CARD_CMS + ONLN_CNS_SALE_CMS)
    ROUND(SUM(COALESCE(SM_CMS, 0) + COALESCE(CARD_CMS, 0) + COALESCE(ONLN_CNS_SALE_CMS, 0)) / 100000000, 0) AS OTHER_CMS

FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
GROUP BY TO_CHAR(PST_DT, 'YYYY')
ORDER BY YR
"""

cursor.execute(query_cms)
results_cms = cursor.fetchall()

print(f"{'연도':^6} | {'점수수료':^12} | {'기타수수료':^12} | {'수수료합계':^12}")
print("-" * 50)
for row in results_cms:
    total_cms = row[1] + row[2]
    print(f"{row[0]:^6} | {row[1]:>10}억 | {row[2]:>10}억 | {total_cms:>10}억")

print()
print("=" * 80)
print("【4】 영업이익 계산 검증 (가이드 공식 적용)")
print("=" * 80)

# 영업이익 계산 - 가이드 공식
query_op = """
SELECT
    TO_CHAR(PST_DT, 'YYYY') AS YR,

    -- 매출액 (V-)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE,

    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,

    -- 매출원가
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS COGS,

    -- 기타수수료 (판관비 일부)
    ROUND(SUM(COALESCE(SM_CMS, 0) + COALESCE(CARD_CMS, 0) + COALESCE(ONLN_CNS_SALE_CMS, 0)) / 100000000, 0) AS OTHER_CMS

FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
GROUP BY TO_CHAR(PST_DT, 'YYYY')
ORDER BY YR
"""

cursor.execute(query_op)
results_op = cursor.fetchall()

print("【관리손익 방식】 영업이익 = 매출액 - 점수수료 - 매출원가 - 판관비")
print("-" * 80)

for row in results_op:
    yr = row[0]
    sale = row[1]
    sale_cms = row[2]
    cogs = row[3]
    other_cms = row[4]

    # 가이드 공식: 영업이익 = 매출액 - 점수수료 - 매출원가 - 판관비
    # 여기서 판관비는 점수수료 제외 금액
    net_sale = sale - sale_cms  # 출고매출
    gross_profit = net_sale - cogs  # 매출총이익

    print(f"\n{yr}년 손익 구조:")
    print(f"  매출액(V-):     {sale:>8}억")
    print(f"  (-)점수수료:    {sale_cms:>8}억")
    print(f"  ──────────────────────")
    print(f"  출고매출:       {net_sale:>8}억")
    print(f"  (-)매출원가:    {cogs:>8}억")
    print(f"  ──────────────────────")
    print(f"  매출총이익:     {gross_profit:>8}억")
    print(f"  (-)기타수수료:  {other_cms:>8}억")

print()
print("=" * 80)
print("【5】 대시보드 vs Snowflake 비교")
print("=" * 80)

# 25년 데이터만 다시 조회
query_2025 = """
SELECT
    -- 매출액 (V-)
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) AS SALE,

    -- 점수수료
    ROUND(SUM(SALE_CMS) / 100000000, 0) AS SALE_CMS,

    -- 매출원가
    ROUND(SUM(ACT_COGS) / 100000000, 0) AS COGS,

    -- 국내매출(V-)
    ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS DOM_SALE,

    -- 수출매출
    ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) AS EXPORT_SALE

FROM DW_COPA_D
WHERE PST_DT >= '2025-01-01' AND PST_DT <= '2025-12-31'
"""

cursor.execute(query_2025)
row = cursor.fetchone()

sale = row[0]
sale_cms = row[1]
cogs = row[2]
dom_sale = row[3]
export_sale = row[4]

print(f"Snowflake 25년 1~12월 데이터:")
print(f"  매출액(V-):     {sale:>8}억")
print(f"  - 국내매출(V-): {dom_sale:>8}억")
print(f"  - 수출매출:     {export_sale:>8}억")
print(f"  점수수료:       {sale_cms:>8}억")
print(f"  매출원가:       {cogs:>8}억")

print()
print("대시보드 25년 12월 데이터 (2025-12.json):")
print(f"  매출액(V-):     {17018:>8}억")
print(f"  - 국내매출(V-): {8022:>8}억")
print(f"  - 수출매출:     {8996:>8}억")
print(f"  매출원가:       {6129:>8}억")
print(f"  판관비:         {5878:>8}억")
print(f"  영업이익:       {5011:>8}억")

print()
print("【차이 분석】")
print(f"  매출액 차이:    {sale - 17018:>8}억 (Snowflake - 대시보드)")
print(f"  국내매출 차이:  {dom_sale - 8022:>8}억")
print(f"  수출매출 차이:  {export_sale - 8996:>8}억")
print(f"  매출원가 차이:  {cogs - 6129:>8}억")

# 대시보드 영업이익 역산
dashboard_op = 17018 - 6129 - 5878
print()
print("【대시보드 영업이익 계산 검증】")
print(f"  대시보드: 17,018 - 6,129 - 5,878 = {dashboard_op}억")
print(f"  대시보드 판관비 {5878}억에 점수수료 포함 여부:")
print(f"    - Snowflake 점수수료: {sale_cms}억")

# 점수수료 포함/제외 검증
if sale_cms > 0:
    sga_with_cms = 5878
    sga_without_cms = 5878 - sale_cms
    print(f"    - 판관비(점수수료 포함 가정): {sga_with_cms}억 → 점수수료 제외시: {sga_without_cms}억")
    # 가이드 공식 적용
    guide_op = sale - sale_cms - cogs - sga_without_cms
    print(f"  가이드 공식 적용 (Snowflake 기준):")
    print(f"    매출액 {sale} - 점수수료 {sale_cms} - 원가 {cogs} - 판관비(제외) {sga_without_cms}")
    print(f"    = {guide_op}억")

conn.close()
print()
print("=" * 80)
print("쿼리 완료")
print("=" * 80)

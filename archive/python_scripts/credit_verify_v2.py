# -*- coding: utf-8 -*-
"""
중국/홍콩 여신검증 - Snowflake 가이드 기준 쿼리
- 매출: DW_COPA_D, CHNL_CD='9', CUST_CD로 지역 구분
- 채권: DM_F_FI_AR_AGING, WWDCH='09', NAME1으로 지역 구분
- 중국 CUST_CD: 105787, 105798, 105864, 105807, 100888, 100495
- 홍콩 CUST_CD: 100461, 105788, 105792, 105799, 105803, 105909, 106314, 100942
"""
import snowflake.connector

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

print("=" * 120)
print("CREDIT VERIFICATION - China/HK (Oct~Dec 2025) - Guide Based Query")
print("=" * 120)

# 1. 수출 매출: 중국 vs 홍콩 vs 기타 (10~12월)
print("\n[1] Export Sales by Region (Oct~Dec 2025) - DW_COPA_D")
print("-" * 100)

cursor.execute("""
SELECT
    TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 1) AS SALE_100M
FROM FNF.SAP_FNF.DW_COPA_D
WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'  -- Export only
GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'),
         CASE
             WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
             WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HONG_KONG'
             ELSE 'OTHER'
         END
ORDER BY MONTH, REGION
""")
results = cursor.fetchall()

# Organize data
sales_data = {}
for row in results:
    month, region, sale = row[0], row[1], float(row[2])
    if region not in sales_data:
        sales_data[region] = {}
    sales_data[region][month] = sale

print(f"{'Region':^12} | {'2025-10':^10} | {'2025-11':^10} | {'2025-12':^10} | {'Total':^10} | {'Avg':^10}")
print("-" * 75)

for region in ['CHINA', 'HONG_KONG', 'OTHER']:
    if region in sales_data:
        oct = sales_data[region].get('2025-10', 0)
        nov = sales_data[region].get('2025-11', 0)
        dec = sales_data[region].get('2025-12', 0)
        total = oct + nov + dec
        avg = total / 3
        print(f"{region:^12} | {oct:>8.1f} | {nov:>8.1f} | {dec:>8.1f} | {total:>8.1f} | {avg:>8.1f}")

# 2. 수출 채권: 중국 vs 홍콩 vs 기타 (12월말)
print("\n[2] Export AR by Region (Dec 2025) - DM_F_FI_AR_AGING")
print("-" * 100)

cursor.execute("""
SELECT
    CASE
        WHEN NAME1 LIKE '%CHINA%' THEN 'CHINA'
        WHEN NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%' THEN 'HONG_KONG'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'  -- 외상매출금만
  AND WWDCH = '09'   -- 수출만
GROUP BY CASE
             WHEN NAME1 LIKE '%CHINA%' THEN 'CHINA'
             WHEN NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%' THEN 'HONG_KONG'
             ELSE 'OTHER'
         END
ORDER BY REGION
""")
results = cursor.fetchall()

ar_data = {}
print(f"{'Region':^12} | {'AR (100M)':^15}")
print("-" * 35)
for row in results:
    region, ar = row[0], float(row[1]) if row[1] else 0
    ar_data[region] = ar
    print(f"{region:^12} | {ar:>13.1f}")

# 3. 상세 채권 내역 (거래처별)
print("\n[3] AR Detail by Customer (Dec 2025, Export)")
print("-" * 100)

cursor.execute("""
SELECT
    KUNNR,
    NAME1,
    ROUND(TRY_TO_NUMBER(COL_2_TOTAL) / 100000000, 1) AS AR_100M
FROM FNF.SAP_FNF.DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
  AND TRY_TO_NUMBER(COL_2_TOTAL) > 100000000
ORDER BY TRY_TO_NUMBER(COL_2_TOTAL) DESC
""")
results = cursor.fetchall()

print(f"{'Code':^10} | {'Customer':^45} | {'AR (100M)':^12}")
print("-" * 75)
for row in results:
    print(f"{row[0]:^10} | {str(row[1])[:45]:^45} | {float(row[2]) if row[2] else 0:>10.1f}")

# 4. Summary
print("\n" + "=" * 120)
print("CREDIT VERIFICATION SUMMARY")
print("=" * 120)

cn_oct = sales_data.get('CHINA', {}).get('2025-10', 0)
cn_nov = sales_data.get('CHINA', {}).get('2025-11', 0)
cn_dec = sales_data.get('CHINA', {}).get('2025-12', 0)
cn_total = cn_oct + cn_nov + cn_dec
cn_avg = cn_total / 3 if cn_total > 0 else 0
cn_ar = ar_data.get('CHINA', 0)
cn_months = cn_ar / cn_avg if cn_avg > 0 else 0

hk_oct = sales_data.get('HONG_KONG', {}).get('2025-10', 0)
hk_nov = sales_data.get('HONG_KONG', {}).get('2025-11', 0)
hk_dec = sales_data.get('HONG_KONG', {}).get('2025-12', 0)
hk_total = hk_oct + hk_nov + hk_dec
hk_avg = hk_total / 3 if hk_total > 0 else 0
hk_ar = ar_data.get('HONG_KONG', 0)
hk_months = hk_ar / hk_avg if hk_avg > 0 else 0

other_oct = sales_data.get('OTHER', {}).get('2025-10', 0)
other_nov = sales_data.get('OTHER', {}).get('2025-11', 0)
other_dec = sales_data.get('OTHER', {}).get('2025-12', 0)
other_total = other_oct + other_nov + other_dec
other_avg = other_total / 3 if other_total > 0 else 0
other_ar = ar_data.get('OTHER', 0)
other_months = other_ar / other_avg if other_avg > 0 else 0

print(f"\n{'Region':^12} | {'Oct':^8} | {'Nov':^8} | {'Dec':^8} | {'3M Avg':^8} | {'12/E AR':^10} | {'Months':^8}")
print("-" * 80)
print(f"{'CHINA':^12} | {cn_oct:>6.1f} | {cn_nov:>6.1f} | {cn_dec:>6.1f} | {cn_avg:>6.1f} | {cn_ar:>8.1f} | {cn_months:>6.1f}M")
print(f"{'HONG_KONG':^12} | {hk_oct:>6.1f} | {hk_nov:>6.1f} | {hk_dec:>6.1f} | {hk_avg:>6.1f} | {hk_ar:>8.1f} | {hk_months:>6.1f}M")
print(f"{'OTHER':^12} | {other_oct:>6.1f} | {other_nov:>6.1f} | {other_dec:>6.1f} | {other_avg:>6.1f} | {other_ar:>8.1f} | {other_months:>6.1f}M")

print("\n" + "-" * 80)
print("Analysis:")
print(f"  * CHINA: AR {cn_ar:.0f} / Monthly Avg {cn_avg:.1f} = {cn_months:.1f} months")
print(f"  * HONG_KONG: AR {hk_ar:.0f} / Monthly Avg {hk_avg:.1f} = {hk_months:.1f} months")
print(f"  * OTHER: AR {other_ar:.0f} / Monthly Avg {other_avg:.1f} = {other_months:.1f} months")
print("=" * 120)

cursor.close()
conn.close()

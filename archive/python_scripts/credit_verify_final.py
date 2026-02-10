# -*- coding: utf-8 -*-
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
print("CREDIT VERIFICATION - CHINA/HONG KONG (Oct~Dec 2025)")
print("=" * 120)

# China Customer Codes
china_codes = ['105787', '105798', '105864']
hk_codes = ['105788', '105792', '105799', '105803', '105909', '106314']

# 1. CHINA Monthly Sales
print("\n[1] CHINA Monthly Sales (DW_COPA_D)")
print("-" * 100)

cursor.execute("""
    SELECT
        TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
        CUST_CD,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DW_COPA_D
    WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
        AND CUST_CD IN ('105787', '105798', '105864')
    GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'), CUST_CD
    ORDER BY MONTH, CUST_CD
""")
results = cursor.fetchall()
china_monthly = {'2025-10': 0, '2025-11': 0, '2025-12': 0}
print(f"{'Month':^10} | {'Customer':^10} | {'Sales (100Mil)':^15}")
print("-" * 45)
for row in results:
    china_monthly[row[0]] = china_monthly.get(row[0], 0) + float(row[2])
    print(f"{row[0]:^10} | {row[1]:^10} | {float(row[2]):>13.1f}")

print("-" * 45)
cn_oct = china_monthly.get('2025-10', 0)
cn_nov = china_monthly.get('2025-11', 0)
cn_dec = china_monthly.get('2025-12', 0)
cn_total = cn_oct + cn_nov + cn_dec
cn_avg = cn_total / 3
print(f"{'TOTAL':^10} | {'Oct':^10} | {cn_oct:>13.1f}")
print(f"{'':^10} | {'Nov':^10} | {cn_nov:>13.1f}")
print(f"{'':^10} | {'Dec':^10} | {cn_dec:>13.1f}")
print(f"{'':^10} | {'3M Total':^10} | {cn_total:>13.1f}")
print(f"{'':^10} | {'3M Avg':^10} | {cn_avg:>13.1f}")

# 2. HONG KONG Monthly Sales
print("\n[2] HONG KONG Monthly Sales (DW_COPA_D)")
print("-" * 100)

cursor.execute("""
    SELECT
        TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
        CUST_CD,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DW_COPA_D
    WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
        AND CUST_CD IN ('105788', '105792', '105799', '105803', '105909', '106314')
    GROUP BY TO_CHAR(PST_DT, 'YYYY-MM'), CUST_CD
    ORDER BY MONTH, CUST_CD
""")
results = cursor.fetchall()
hk_monthly = {'2025-10': 0, '2025-11': 0, '2025-12': 0}
print(f"{'Month':^10} | {'Customer':^10} | {'Sales (100Mil)':^15}")
print("-" * 45)
for row in results:
    hk_monthly[row[0]] = hk_monthly.get(row[0], 0) + float(row[2])
    print(f"{row[0]:^10} | {row[1]:^10} | {float(row[2]):>13.1f}")

print("-" * 45)
hk_oct = hk_monthly.get('2025-10', 0)
hk_nov = hk_monthly.get('2025-11', 0)
hk_dec = hk_monthly.get('2025-12', 0)
hk_total = hk_oct + hk_nov + hk_dec
hk_avg = hk_total / 3
print(f"{'TOTAL':^10} | {'Oct':^10} | {hk_oct:>13.1f}")
print(f"{'':^10} | {'Nov':^10} | {hk_nov:>13.1f}")
print(f"{'':^10} | {'Dec':^10} | {hk_dec:>13.1f}")
print(f"{'':^10} | {'3M Total':^10} | {hk_total:>13.1f}")
print(f"{'':^10} | {'3M Avg':^10} | {hk_avg:>13.1f}")

# 3. CHINA AR Balance
print("\n[3] CHINA AR Balance (Dec 2025)")
print("-" * 100)

cursor.execute("""
    SELECT
        KUNNR,
        NAME1,
        CAST(COL_1_TOTAL AS NUMBER) / 100000000 AS AR_BIL
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND NAME1 LIKE '%CHINA%'
        AND CAST(COL_1_TOTAL AS NUMBER) > 0
    ORDER BY CAST(COL_1_TOTAL AS NUMBER) DESC
""")
results = cursor.fetchall()
cn_ar = 0
print(f"{'Code':^10} | {'Customer':^40} | {'AR (100Mil)':^15}")
print("-" * 75)
for row in results:
    ar = float(row[2])
    cn_ar += ar
    print(f"{row[0]:^10} | {row[1][:40]:^40} | {ar:>13.1f}")
print("-" * 75)
print(f"{'':^10} | {'CHINA AR TOTAL':^40} | {cn_ar:>13.1f}")

# 4. HONG KONG AR Balance
print("\n[4] HONG KONG AR Balance (Dec 2025)")
print("-" * 100)

cursor.execute("""
    SELECT
        KUNNR,
        NAME1,
        CAST(COL_1_TOTAL AS NUMBER) / 100000000 AS AR_BIL
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND NAME1 LIKE '%HONG KONG%'
        AND CAST(COL_1_TOTAL AS NUMBER) > 0
    ORDER BY CAST(COL_1_TOTAL AS NUMBER) DESC
""")
results = cursor.fetchall()
hk_ar = 0
print(f"{'Code':^10} | {'Customer':^40} | {'AR (100Mil)':^15}")
print("-" * 75)
for row in results:
    ar = float(row[2])
    hk_ar += ar
    print(f"{row[0]:^10} | {row[1][:40]:^40} | {ar:>13.1f}")
print("-" * 75)
print(f"{'':^10} | {'HONG KONG AR TOTAL':^40} | {hk_ar:>13.1f}")

# 5. SUMMARY
print("\n" + "=" * 120)
print("CREDIT VERIFICATION SUMMARY")
print("=" * 120)
print(f"\n{'Region':^15} | {'Oct':^10} | {'Nov':^10} | {'Dec':^10} | {'3M Avg':^10} | {'12/E AR':^12} | {'Months':^10}")
print("-" * 95)

cn_months = cn_ar / cn_avg if cn_avg > 0 else 0
hk_months = hk_ar / hk_avg if hk_avg > 0 else 0

print(f"{'CHINA':^15} | {cn_oct:>8.1f} | {cn_nov:>8.1f} | {cn_dec:>8.1f} | {cn_avg:>8.1f} | {cn_ar:>10.1f} | {cn_months:>8.1f}M")
print(f"{'HONG KONG':^15} | {hk_oct:>8.1f} | {hk_nov:>8.1f} | {hk_dec:>8.1f} | {hk_avg:>8.1f} | {hk_ar:>10.1f} | {hk_months:>8.1f}M")

print("\n" + "-" * 95)
print("ANALYSIS:")
print(f"  * CHINA: AR {cn_ar:.0f}억 / Monthly Avg {cn_avg:.1f}억 = {cn_months:.1f}개월")
print(f"     - 기준: 통상 여신 1~2개월 → {cn_months:.1f}개월은 초과")
print(f"  * HONG KONG: AR {hk_ar:.0f}억 / Monthly Avg {hk_avg:.1f}억 = {hk_months:.1f}개월")
print(f"     - 기준: 선적말일+3개월 여신 → {hk_months:.1f}개월은 초과")
print("=" * 120)

cursor.close()
conn.close()

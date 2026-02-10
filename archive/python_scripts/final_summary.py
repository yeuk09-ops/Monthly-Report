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
print("China/HK Credit Verification - Monthly Sales & AR Summary")
print("=" * 120)

# 1. China Monthly Sales
print("\n[1] CHINA Monthly Sales (Oct~Dec 2025)")
print("-" * 60)

cursor.execute("""
    SELECT
        TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DW_CN_COPA_D
    WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
    GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
    ORDER BY MONTH
""")
results = cursor.fetchall()
cn_sales = {}
print(f"{'Month':^12} | {'Sales (Bil KRW)':^20}")
print("-" * 35)
for row in results:
    cn_sales[row[0]] = float(row[1])
    print(f"{row[0]:^12} | {float(row[1]):>18.1f}")

cn_total = sum(cn_sales.values())
cn_avg = cn_total / len(cn_sales) if cn_sales else 0
print("-" * 35)
print(f"{'3M Total':^12} | {cn_total:>18.1f}")
print(f"{'Monthly Avg':^12} | {cn_avg:>18.1f}")

# 2. HK Monthly Sales - Try DM_HMD_PL_SHOP_M
print("\n[2] HONG KONG Monthly Sales (Oct~Dec 2025)")
print("-" * 60)

# First check the structure
cursor.execute("DESCRIBE TABLE DM_HMD_PL_SHOP_M")
hmd_cols = [c[0] for c in cursor.fetchall()]
print("HMD Columns:", hmd_cols[:10])

cursor.execute("""
    SELECT
        YYYYMM AS MONTH,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DM_HMD_PL_SHOP_M
    WHERE YYYYMM >= '202510' AND YYYYMM <= '202512'
    GROUP BY YYYYMM
    ORDER BY YYYYMM
""")
results = cursor.fetchall()
hk_sales = {}
print(f"\n{'Month':^12} | {'Sales (Bil KRW)':^20}")
print("-" * 35)
for row in results:
    hk_sales[str(row[0])] = float(row[1])
    print(f"{row[0]:^12} | {float(row[1]):>18.1f}")

hk_total = sum(hk_sales.values())
hk_avg = hk_total / len(hk_sales) if hk_sales else 0
print("-" * 35)
print(f"{'3M Total':^12} | {hk_total:>18.1f}")
print(f"{'Monthly Avg':^12} | {hk_avg:>18.1f}")

# 3. China AR
print("\n[3] CHINA AR Balance (Dec 2025)")
print("-" * 60)

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
cn_ar_total = 0
print(f"{'Code':^10} | {'Customer':^40} | {'AR (Bil)':^12}")
print("-" * 70)
for row in results:
    ar = float(row[2])
    cn_ar_total += ar
    print(f"{row[0]:^10} | {row[1][:40]:^40} | {ar:>10.1f}")
print("-" * 70)
print(f"{'':^10} | {'CHINA AR TOTAL':^40} | {cn_ar_total:>10.1f}")

# 4. HK AR
print("\n[4] HONG KONG AR Balance (Dec 2025)")
print("-" * 60)

cursor.execute("""
    SELECT
        KUNNR,
        NAME1,
        CAST(COL_1_TOTAL AS NUMBER) / 100000000 AS AR_BIL
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND (NAME1 LIKE '%HONG KONG%')
        AND CAST(COL_1_TOTAL AS NUMBER) > 0
    ORDER BY CAST(COL_1_TOTAL AS NUMBER) DESC
""")
results = cursor.fetchall()
hk_ar_total = 0
print(f"{'Code':^10} | {'Customer':^40} | {'AR (Bil)':^12}")
print("-" * 70)
for row in results:
    ar = float(row[2])
    hk_ar_total += ar
    print(f"{row[0]:^10} | {row[1][:40]:^40} | {ar:>10.1f}")
print("-" * 70)
print(f"{'':^10} | {'HONG KONG AR TOTAL':^40} | {hk_ar_total:>10.1f}")

# 5. Summary
print("\n" + "=" * 120)
print("CREDIT VERIFICATION SUMMARY")
print("=" * 120)
print(f"\n{'Region':^12} | {'Oct':^8} | {'Nov':^8} | {'Dec':^8} | {'3M Avg':^8} | {'12/E AR':^10} | {'AR/Avg':^10} | {'Months':^8}")
print("-" * 90)

# China (Unit: 100 mil)
cn_oct = cn_sales.get('2025-10', 0)
cn_nov = cn_sales.get('2025-11', 0)
cn_dec = cn_sales.get('2025-12', 0)
cn_months = cn_ar_total / cn_avg if cn_avg > 0 else 0
print(f"{'CHINA':^12} | {cn_oct:>6.1f} | {cn_nov:>6.1f} | {cn_dec:>6.1f} | {cn_avg:>6.1f} | {cn_ar_total:>8.1f} | {cn_ar_total/cn_avg*100 if cn_avg else 0:>8.1f}% | {cn_months:>6.1f}M")

# HK
hk_oct = hk_sales.get('202510', 0)
hk_nov = hk_sales.get('202511', 0)
hk_dec = hk_sales.get('202512', 0)
hk_months = hk_ar_total / hk_avg if hk_avg > 0 else 0
print(f"{'HONG KONG':^12} | {hk_oct:>6.1f} | {hk_nov:>6.1f} | {hk_dec:>6.1f} | {hk_avg:>6.1f} | {hk_ar_total:>8.1f} | {hk_ar_total/hk_avg*100 if hk_avg else 0:>8.1f}% | {hk_months:>6.1f}M")

print("\n" + "-" * 90)
print("Notes:")
print(f"  - China: AR {cn_ar_total:.0f} Bil / Monthly Avg {cn_avg:.1f} Bil = {cn_months:.1f} months")
print(f"  - HK: AR {hk_ar_total:.0f} Bil / Monthly Avg {hk_avg:.1f} Bil = {hk_months:.1f} months")
print("  - Unit: 100 million KRW (Bil = Bil KRW)")
print("=" * 120)

cursor.close()
conn.close()

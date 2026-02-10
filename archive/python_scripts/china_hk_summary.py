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

print("=" * 100)
print("China/HK AR & Sales Summary")
print("=" * 100)

# 1. AR Aging - China/HK by Month (2025)
print("\n[1] China/HK AR Aging Summary (2025 Oct-Dec)")
print("-" * 100)

cursor.execute("""
    SELECT
        CALMONTH,
        CASE
            WHEN NAME1 LIKE '%CHINA%' THEN 'CHINA'
            WHEN NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%' THEN 'HONG KONG'
            ELSE 'OTHER'
        END AS REGION,
        SUM(CAST(COL_1_TOTAL AS NUMBER)) / 100000000 AS AR_TOTAL_BIL
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH >= '2025-10'
        AND (NAME1 LIKE '%CHINA%' OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%')
    GROUP BY CALMONTH, CASE
            WHEN NAME1 LIKE '%CHINA%' THEN 'CHINA'
            WHEN NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%' THEN 'HONG KONG'
            ELSE 'OTHER'
        END
    ORDER BY CALMONTH, REGION
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'Region':^15} | {'AR Total (Bil KRW)':^20}")
print("-" * 55)
for row in results:
    print(f"{row[0]:^12} | {row[1]:^15} | {float(row[2]):>18.1f}")

# 2. China/HK Detail by Customer
print("\n[2] China/HK AR Detail by Customer (Dec 2025)")
print("-" * 100)

cursor.execute("""
    SELECT
        KUNNR,
        NAME1,
        CAST(COL_1_TOTAL AS NUMBER) / 100000000 AS AR_BIL
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND (NAME1 LIKE '%CHINA%' OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%')
        AND CAST(COL_1_TOTAL AS NUMBER) > 0
    ORDER BY CAST(COL_1_TOTAL AS NUMBER) DESC
""")
results = cursor.fetchall()
print(f"{'Code':^12} | {'Customer Name':^45} | {'AR (Bil KRW)':^15}")
print("-" * 80)
total_china = 0
total_hk = 0
for row in results:
    ar_val = float(row[2])
    if 'CHINA' in row[1]:
        total_china += ar_val
    elif 'HONG KONG' in row[1] or 'HK' in row[1]:
        total_hk += ar_val
    print(f"{row[0]:^12} | {row[1][:45]:^45} | {ar_val:>13.1f}")

print("-" * 80)
print(f"{'':^12} | {'CHINA Total':^45} | {total_china:>13.1f}")
print(f"{'':^12} | {'HONG KONG Total':^45} | {total_hk:>13.1f}")
print(f"{'':^12} | {'GRAND TOTAL':^45} | {total_china + total_hk:>13.1f}")

# 3. China PL Summary (Sales)
print("\n[3] China Monthly Sales (Oct-Dec 2025)")
print("-" * 100)

cursor.execute("""
    SELECT
        YYYYMM,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM PREP_CN_PL_SUMMARY_M
    WHERE YYYYMM >= '202510'
    GROUP BY YYYYMM
    ORDER BY YYYYMM
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'Sales (Bil KRW)':^20}")
print("-" * 35)
for row in results:
    print(f"{row[0]:^12} | {float(row[1]):>18.1f}")

# 4. China AR Collection Plan
print("\n[4] China AR Collection Plan (Oct-Dec 2025)")
print("-" * 100)

cursor.execute("""
    SELECT
        YYYYMM,
        BRD_CD,
        (RCV_AMT_P1 + RCV_AMT_P2 + RCV_AMT_P3 + RCV_AMT_P4) / 100000000 AS TOTAL_BIL
    FROM PREP_CN_AR_RCV_PLAN_M
    WHERE YYYYMM >= '202510'
    ORDER BY YYYYMM, BRD_CD
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'Brand':^10} | {'AR Plan (Bil KRW)':^20}")
print("-" * 50)
for row in results:
    print(f"{row[0]:^12} | {row[1]:^10} | {float(row[2]):>18.1f}")

# 5. Monthly comparison
print("\n[5] AR Aging Monthly Trend (China + HK)")
print("-" * 100)

cursor.execute("""
    SELECT
        CALMONTH,
        SUM(CASE WHEN NAME1 LIKE '%CHINA%' THEN CAST(COL_1_TOTAL AS NUMBER) ELSE 0 END) / 100000000 AS CHINA_AR,
        SUM(CASE WHEN NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%' THEN CAST(COL_1_TOTAL AS NUMBER) ELSE 0 END) / 100000000 AS HK_AR
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH >= '2025-01'
        AND (NAME1 LIKE '%CHINA%' OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%HK%')
    GROUP BY CALMONTH
    ORDER BY CALMONTH
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'China AR':^18} | {'HK AR':^18} | {'Total':^18}")
print("-" * 75)
for row in results:
    china = float(row[1])
    hk = float(row[2])
    print(f"{row[0]:^12} | {china:>16.1f} | {hk:>16.1f} | {china+hk:>16.1f}")

cursor.close()
conn.close()
print("\n" + "=" * 100)
print("Query Complete")

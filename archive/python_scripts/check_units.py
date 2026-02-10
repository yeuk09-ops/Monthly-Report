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
print("Unit Check - China/HK Sales & AR")
print("=" * 100)

# 1. Check China Sales Raw Values
print("\n[1] China Sales Raw (DW_CN_COPA_D) - Dec 2025")
print("-" * 80)

cursor.execute("""
    SELECT
        TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
        SUM(VAT_EXC_ACT_SALE_AMT) AS RAW_SALES,
        SUM(VAT_EXC_ACT_SALE_AMT) / 1000000 AS MIL_KRW,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS BIL_KRW
    FROM DW_CN_COPA_D
    WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
    GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
    ORDER BY MONTH
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'Raw Value':^20} | {'Mil KRW':^15} | {'100Mil KRW':^15}")
print("-" * 70)
for row in results:
    print(f"{row[0]:^12} | {float(row[1]):>18,.0f} | {float(row[2]):>13,.0f} | {float(row[3]):>13.1f}")

# 2. Check AR Raw Values
print("\n[2] China AR Raw (DM_F_FI_AR_AGING) - Dec 2025")
print("-" * 80)

cursor.execute("""
    SELECT
        KUNNR,
        NAME1,
        COL_1_TOTAL AS RAW_AR,
        CAST(COL_1_TOTAL AS NUMBER) / 1000000 AS MIL_KRW,
        CAST(COL_1_TOTAL AS NUMBER) / 100000000 AS BIL_KRW
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND NAME1 LIKE '%CHINA%'
        AND CAST(COL_1_TOTAL AS NUMBER) > 100000000
    ORDER BY CAST(COL_1_TOTAL AS NUMBER) DESC
""")
results = cursor.fetchall()
print(f"{'Code':^10} | {'Customer':^35} | {'Raw Value':^20} | {'Mil':^12} | {'100Mil':^10}")
print("-" * 100)
for row in results:
    print(f"{row[0]:^10} | {row[1][:35]:^35} | {row[2]:>18} | {float(row[3]):>10,.0f} | {float(row[4]):>8.1f}")

# 3. Check HK Sales from different table
print("\n[3] Check DW_COPA_D for Export Sales")
print("-" * 80)

cursor.execute("DESCRIBE TABLE DW_COPA_D")
cols = [c[0] for c in cursor.fetchall()]
print("DW_COPA_D Columns:", cols[:20])

# 4. Try to find export channel sales
print("\n[4] Export Sales by Channel (DM_PL_CHNL_M)")
print("-" * 80)

cursor.execute("DESCRIBE TABLE DM_PL_CHNL_M")
cols = [c[0] for c in cursor.fetchall()]
print("Columns:", cols)

cursor.execute("""
    SELECT
        PST_YYYYMM,
        CHNL_NM,
        SUM(ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DM_PL_CHNL_M
    WHERE PST_YYYYMM >= '202510'
        AND (CHNL_NM LIKE '%HK%' OR CHNL_NM LIKE '%HONG%' OR CHNL_NM LIKE '%CN%' OR CHNL_NM LIKE '%CHINA%' OR CHNL_NM LIKE '%EXPORT%')
    GROUP BY PST_YYYYMM, CHNL_NM
    ORDER BY PST_YYYYMM, CHNL_NM
""")
results = cursor.fetchall()
if results:
    print(f"{'Month':^10} | {'Channel':^30} | {'Sales (100Mil)':^15}")
    print("-" * 60)
    for row in results:
        print(f"{row[0]:^10} | {row[1][:30]:^30} | {float(row[2]):>13.1f}")
else:
    print("No matching channels found")

# 5. All channel names
print("\n[5] All Channel Names in DM_PL_CHNL_M (Oct-Dec 2025)")
print("-" * 80)

cursor.execute("""
    SELECT DISTINCT CHNL_NM
    FROM DM_PL_CHNL_M
    WHERE PST_YYYYMM >= '202510'
    ORDER BY CHNL_NM
""")
results = cursor.fetchall()
print("Channels:")
for row in results:
    print(f"  {row[0]}")

cursor.close()
conn.close()

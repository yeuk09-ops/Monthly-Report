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
print("China Monthly Sales from DW_CN_COPA_D")
print("=" * 100)

# DW_CN_COPA_D Monthly Sales
print("\n[1] China Monthly Sales (2025)")
print("-" * 80)

cursor.execute("""
    SELECT
        TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DW_CN_COPA_D
    WHERE PST_DT >= '2025-01-01'
    GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
    ORDER BY MONTH
""")
results = cursor.fetchall()
print(f"{'Month':^12} | {'Sales (Bil KRW)':^20}")
print("-" * 35)
for row in results:
    print(f"{row[0]:^12} | {float(row[1]):>18.1f}")

# DM_PL_CHNL_M - Check for Export Sales
print("\n[2] Channel Sales (DM_PL_CHNL_M)")
print("-" * 80)

cursor.execute("DESCRIBE TABLE DM_PL_CHNL_M")
columns = cursor.fetchall()
print("Columns:", [c[0] for c in columns[:15]])

cursor.execute("""
    SELECT * FROM DM_PL_CHNL_M
    WHERE YYYYMM >= '202510'
    LIMIT 5
""")
results = cursor.fetchall()
desc = cursor.description
col_names = [d[0] for d in desc]
print("\nSample data columns:", col_names[:10])

# DM_PL_CHNL_RPT
print("\n[3] Channel Report (DM_PL_CHNL_RPT)")
print("-" * 80)

cursor.execute("DESCRIBE TABLE DM_PL_CHNL_RPT")
columns = cursor.fetchall()
print("Columns:", [c[0] for c in columns[:20]])

cursor.execute("""
    SELECT * FROM DM_PL_CHNL_RPT
    WHERE YYYYMM >= '202510'
    LIMIT 5
""")
results = cursor.fetchall()
desc = cursor.description
col_names = [d[0] for d in desc]
print("\nSample data:")
for row in results:
    print(row[:10])

# Check for HK sales table
print("\n[4] Looking for HK Sales")
print("-" * 80)

cursor.execute("SHOW TABLES LIKE '%HMD%' IN FNF.SAP_FNF")
results = cursor.fetchall()
print("HMD Tables:", [t[1] for t in results])

# DM_HMD_PL_SHOP_M
cursor.execute("DESCRIBE TABLE DM_HMD_PL_SHOP_M")
columns = cursor.fetchall()
print("\nDM_HMD_PL_SHOP_M Columns:", [c[0] for c in columns[:15]])

cursor.execute("""
    SELECT
        YYYYMM,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DM_HMD_PL_SHOP_M
    WHERE YYYYMM >= '202510'
    GROUP BY YYYYMM
    ORDER BY YYYYMM
""")
results = cursor.fetchall()
print("\nHMD Monthly Sales (Oct-Dec 2025):")
for row in results:
    print(f"  {row[0]}: {float(row[1]):.1f} Bil")

cursor.close()
conn.close()
print("\n" + "=" * 100)

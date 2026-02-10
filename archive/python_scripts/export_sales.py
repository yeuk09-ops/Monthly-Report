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
print("Export Sales Search - China/HK")
print("=" * 100)

# 1. DW_COPA_D - Search by CUST_CD or CHNL_CD
print("\n[1] DW_COPA_D - Channel Codes")
print("-" * 80)

cursor.execute("""
    SELECT DISTINCT CHNL_CD
    FROM DW_COPA_D
    WHERE PST_DT >= '2025-10-01'
    ORDER BY CHNL_CD
""")
results = cursor.fetchall()
print("Channel Codes:", [r[0] for r in results])

# 2. Check for export channels
print("\n[2] Sales by Channel (Oct-Dec 2025)")
print("-" * 80)

cursor.execute("""
    SELECT
        CHNL_CD,
        SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DW_COPA_D
    WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
    GROUP BY CHNL_CD
    ORDER BY SALES_BIL DESC
""")
results = cursor.fetchall()
print(f"{'Channel':^10} | {'Sales (100Mil KRW)':^20}")
print("-" * 35)
for row in results:
    print(f"{row[0]:^10} | {float(row[1]):>18.1f}")

# 3. Find HK/China customer codes in AR
print("\n[3] China/HK Customer Codes from AR")
print("-" * 80)

cursor.execute("""
    SELECT DISTINCT
        KUNNR,
        NAME1
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '2025-12'
        AND (NAME1 LIKE '%CHINA%' OR NAME1 LIKE '%HONG KONG%')
    ORDER BY NAME1
""")
results = cursor.fetchall()
print("Customer Codes:")
for row in results:
    print(f"  {row[0]}: {row[1]}")

# 4. Search DW_COPA_D by customer code
print("\n[4] Sales by China/HK Customer Codes (DW_COPA_D)")
print("-" * 80)

customer_codes = ['105787', '105788', '105792', '105798', '105799', '105803', '105864', '105909', '106314']

for cust in customer_codes[:3]:
    cursor.execute(f"""
        SELECT
            TO_CHAR(PST_DT, 'YYYY-MM') AS MONTH,
            SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_BIL
        FROM DW_COPA_D
        WHERE PST_DT >= '2025-10-01' AND PST_DT < '2026-01-01'
            AND CUST_CD = '{cust}'
        GROUP BY TO_CHAR(PST_DT, 'YYYY-MM')
        ORDER BY MONTH
    """)
    results = cursor.fetchall()
    if results:
        print(f"\nCustomer {cust}:")
        for row in results:
            print(f"  {row[0]}: {float(row[1]):.1f}")
    else:
        print(f"Customer {cust}: No data")

# 5. Check BI_COPA_SHOP_M for export
print("\n[5] BI_COPA_SHOP_M Structure")
print("-" * 80)

cursor.execute("DESCRIBE TABLE BI_COPA_SHOP_M")
cols = [c[0] for c in cursor.fetchall()]
print("Columns:", cols[:15])

# 6. Search all tables for HK sales
print("\n[6] Search Tables with HK/Export Data")
print("-" * 80)

# Check DM_PRFT tables
cursor.execute("""
    SELECT
        PST_YYYYMM,
        CHNL_NM,
        SUM(ACT_SALE_AMT) / 100000000 AS SALES_BIL
    FROM DM_PRFT_CHNL_M
    WHERE PST_YYYYMM >= '202510'
    GROUP BY PST_YYYYMM, CHNL_NM
    ORDER BY PST_YYYYMM, CHNL_NM
""")
results = cursor.fetchall()
if results:
    print(f"{'Month':^10} | {'Channel':^30} | {'Sales':^12}")
    print("-" * 60)
    for row in results:
        print(f"{row[0]:^10} | {str(row[1])[:30]:^30} | {float(row[2]):>10.1f}")

cursor.close()
conn.close()

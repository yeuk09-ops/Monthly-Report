import snowflake.connector
import pandas as pd

# Snowflake 연결
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
print("중국/홍콩 여신검증 데이터 조회")
print("=" * 120)

# 1. 중국 월별 매출 (PREP_CN_PL_SUMMARY_M)
print("\n[1] 중국 월별 매출 (2025년 10~12월)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            YYYYMM,
            SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_억원
        FROM PREP_CN_PL_SUMMARY_M
        WHERE YYYYMM >= '202510'
        GROUP BY YYYYMM
        ORDER BY YYYYMM
    """)
    results = cursor.fetchall()
    print(f"{'월':^10} | {'매출(억원)':^15}")
    print("-" * 30)
    for row in results:
        print(f"{row[0]:^10} | {float(row[1]):>12.1f}")
except Exception as e:
    print(f"오류: {e}")

# 2. 중국 브랜드별 매출
print("\n[2] 중국 브랜드별 월별 매출 (10~12월)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            YYYYMM,
            BRD_CD,
            SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_억원
        FROM PREP_CN_PL_SUMMARY_M
        WHERE YYYYMM >= '202510'
        GROUP BY YYYYMM, BRD_CD
        ORDER BY YYYYMM, BRD_CD
    """)
    results = cursor.fetchall()
    print(f"{'월':^10} | {'브랜드':^10} | {'매출(억원)':^15}")
    print("-" * 45)
    for row in results:
        print(f"{row[0]:^10} | {row[1]:^10} | {float(row[2]):>12.1f}")
except Exception as e:
    print(f"오류: {e}")

# 3. 중국 AR 수금계획 (채권 현황)
print("\n[3] 중국 AR 수금계획 (채권 현황)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            YYYYMM,
            BRD_CD,
            RCV_AMT_P1 / 100000000 AS P1_억원,
            RCV_AMT_P2 / 100000000 AS P2_억원,
            RCV_AMT_P3 / 100000000 AS P3_억원,
            RCV_AMT_P4 / 100000000 AS P4_억원,
            (RCV_AMT_P1 + RCV_AMT_P2 + RCV_AMT_P3 + RCV_AMT_P4) / 100000000 AS TOTAL_억원
        FROM PREP_CN_AR_RCV_PLAN_M
        WHERE YYYYMM >= '202510'
        ORDER BY YYYYMM, BRD_CD
    """)
    results = cursor.fetchall()
    print(f"{'월':^10} | {'브랜드':^6} | {'P1':^10} | {'P2':^10} | {'P3':^10} | {'P4':^10} | {'합계(억원)':^12}")
    print("-" * 85)
    for row in results:
        print(f"{row[0]:^10} | {row[1]:^6} | {float(row[2]):>8.1f} | {float(row[3]):>8.1f} | {float(row[4]):>8.1f} | {float(row[5]):>8.1f} | {float(row[6]):>10.1f}")
except Exception as e:
    print(f"오류: {e}")

# 4. AR Aging 테이블에서 중국/홍콩 채권 조회
print("\n[4] AR Aging - 중국/홍콩 채권 (2025년 12월)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            CALMONTH,
            NAME1,
            H_HWAER,
            COL_1_TOTAL,
            COL_2_TOTAL
        FROM DM_F_FI_AR_AGING
        WHERE CALMONTH LIKE '2025%'
            AND (NAME1 LIKE '%중국%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%CHINA%' OR NAME1 LIKE '%HONG%' OR NAME1 LIKE '%HK%' OR NAME1 LIKE '%CN%')
        ORDER BY CALMONTH DESC
        LIMIT 20
    """)
    results = cursor.fetchall()
    if results:
        print(f"{'월':^10} | {'거래처명':^40} | {'통화':^6} | {'채권합계':^15}")
        print("-" * 80)
        for row in results:
            print(f"{row[0]:^10} | {row[1][:40]:^40} | {row[2]:^6} | {row[3]:>15}")
    else:
        print("중국/홍콩 데이터가 없습니다. 전체 최근 데이터를 확인합니다...")
except Exception as e:
    print(f"오류: {e}")

# 5. AR Aging 최근 월 전체 데이터 확인
print("\n[5] AR Aging - 최근 월 데이터 확인")
print("-" * 80)

try:
    cursor.execute("""
        SELECT DISTINCT CALMONTH
        FROM DM_F_FI_AR_AGING
        ORDER BY CALMONTH DESC
        LIMIT 5
    """)
    results = cursor.fetchall()
    print("최근 월: ", [r[0] for r in results])
except Exception as e:
    print(f"오류: {e}")

# 6. AR Aging에서 수출 채권 확인
print("\n[6] AR Aging - 수출 채권 (WWDCH 기준)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            CALMONTH,
            WWDCH,
            COUNT(*) AS CNT,
            SUM(CAST(COL_1_TOTAL AS NUMBER)) / 100000000 AS TOTAL_억원
        FROM DM_F_FI_AR_AGING
        WHERE CALMONTH >= '2025-10'
        GROUP BY CALMONTH, WWDCH
        ORDER BY CALMONTH DESC, WWDCH
    """)
    results = cursor.fetchall()
    print(f"{'월':^10} | {'채널코드':^10} | {'건수':^8} | {'채권합계(억원)':^15}")
    print("-" * 55)
    for row in results:
        print(f"{row[0]:^10} | {row[1]:^10} | {row[2]:>6} | {float(row[3]):>13.1f}")
except Exception as e:
    print(f"오류: {e}")

# 7. DW_CN_COPA_D에서 중국 매출
print("\n[7] 중국 COPA 월별 매출 (DW_CN_COPA_D)")
print("-" * 80)

try:
    cursor.execute("""
        SELECT
            TO_CHAR(PST_DT, 'YYYYMM') AS YYYYMM,
            BRD_CD,
            SUM(VAT_EXC_ACT_SALE_AMT) / 100000000 AS SALES_억원
        FROM DW_CN_COPA_D
        WHERE PST_DT >= '2025-10-01'
        GROUP BY TO_CHAR(PST_DT, 'YYYYMM'), BRD_CD
        ORDER BY YYYYMM, BRD_CD
    """)
    results = cursor.fetchall()
    print(f"{'월':^10} | {'브랜드':^10} | {'매출(억원)':^15}")
    print("-" * 45)
    for row in results:
        print(f"{row[0]:^10} | {row[1]:^10} | {float(row[2]):>12.1f}")
except Exception as e:
    print(f"오류: {e}")

# 8. 홍콩 관련 테이블 검색
print("\n[8] 홍콩 관련 테이블 검색")
print("-" * 80)

try:
    cursor.execute("SHOW TABLES LIKE '%HK%' IN FNF.SAP_FNF")
    results = cursor.fetchall()
    if results:
        print("홍콩 관련 테이블:")
        for t in results:
            print(f"  {t[1]}")
    else:
        print("HK 관련 테이블 없음")

    cursor.execute("SHOW TABLES LIKE '%HONG%' IN FNF.SAP_FNF")
    results = cursor.fetchall()
    if results:
        for t in results:
            print(f"  {t[1]}")
except Exception as e:
    print(f"오류: {e}")

cursor.close()
conn.close()
print("\n" + "=" * 120)
print("조회 완료")

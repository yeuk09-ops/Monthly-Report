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

print("=" * 80)
print("1. 중국/홍콩 월별 매출 (2025년 10~12월)")
print("=" * 80)

# 중국/홍콩 매출 조회 (COPA)
sales_query = """
SELECT
    LEFT(PERDE, 6) AS YEARMONTH,
    CASE
        WHEN KNDNR LIKE '%HK%' OR LAND1 = 'HK' THEN '홍콩'
        WHEN KNDNR LIKE '%CN%' OR LAND1 = 'CN' THEN '중국'
        ELSE '기타'
    END AS REGION,
    SUM(VV010) / 1000000 AS SALES_MIO
FROM FNF.SAP_FNF.COPA_DATA
WHERE LEFT(PERDE, 4) = '2025'
    AND LEFT(PERDE, 6) >= '202510'
    AND (KNDNR LIKE '%HK%' OR KNDNR LIKE '%CN%' OR LAND1 IN ('HK', 'CN'))
GROUP BY LEFT(PERDE, 6),
    CASE
        WHEN KNDNR LIKE '%HK%' OR LAND1 = 'HK' THEN '홍콩'
        WHEN KNDNR LIKE '%CN%' OR LAND1 = 'CN' THEN '중국'
        ELSE '기타'
    END
ORDER BY 1, 2
"""

try:
    cursor.execute(sales_query)
    results = cursor.fetchall()
    if results:
        print("\n월별 매출 데이터:")
        for row in results:
            print(f"  {row[0]} | {row[1]}: {row[2]:.1f} 백만원")
    else:
        print("매출 데이터가 없습니다. 다른 쿼리로 시도합니다...")
except Exception as e:
    print(f"매출 쿼리 오류: {e}")

# 대안 쿼리: 테이블 구조 확인
print("\n" + "=" * 80)
print("2. COPA 테이블 컬럼 확인")
print("=" * 80)

try:
    cursor.execute("DESCRIBE TABLE FNF.SAP_FNF.COPA_DATA")
    columns = cursor.fetchall()
    print("\nCOPA 주요 컬럼:")
    for col in columns[:20]:
        print(f"  {col[0]}: {col[1]}")
except Exception as e:
    print(f"테이블 구조 확인 오류: {e}")

# AR Aging 데이터 확인
print("\n" + "=" * 80)
print("3. 매출채권 테이블 확인")
print("=" * 80)

try:
    cursor.execute("SHOW TABLES LIKE '%AR%' IN FNF.SAP_FNF")
    tables = cursor.fetchall()
    print("\nAR 관련 테이블:")
    for t in tables:
        print(f"  {t[1]}")
except Exception as e:
    print(f"테이블 조회 오류: {e}")

# 모든 테이블 목록
print("\n" + "=" * 80)
print("4. SAP_FNF 스키마의 주요 테이블")
print("=" * 80)

try:
    cursor.execute("SHOW TABLES IN FNF.SAP_FNF")
    tables = cursor.fetchall()
    print("\n테이블 목록:")
    for t in tables[:30]:
        print(f"  {t[1]}")
except Exception as e:
    print(f"테이블 목록 조회 오류: {e}")

cursor.close()
conn.close()
print("\n연결 종료")

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

print("=" * 100)
print("1. AR Aging 테이블 구조 확인 (DM_F_FI_AR_AGING)")
print("=" * 100)

try:
    cursor.execute("DESCRIBE TABLE DM_F_FI_AR_AGING")
    columns = cursor.fetchall()
    print("\nAR Aging 컬럼:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
except Exception as e:
    print(f"오류: {e}")

print("\n" + "=" * 100)
print("2. AR Aging 샘플 데이터")
print("=" * 100)

try:
    cursor.execute("SELECT * FROM DM_F_FI_AR_AGING LIMIT 5")
    results = cursor.fetchall()
    desc = cursor.description
    col_names = [d[0] for d in desc]
    print("\n컬럼명:", col_names)
    print("\n샘플 데이터:")
    for row in results:
        print(row)
except Exception as e:
    print(f"오류: {e}")

print("\n" + "=" * 100)
print("3. 중국 COPA 테이블 구조 (DW_CN_COPA_D)")
print("=" * 100)

try:
    cursor.execute("DESCRIBE TABLE DW_CN_COPA_D")
    columns = cursor.fetchall()
    print("\n중국 COPA 컬럼:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
except Exception as e:
    print(f"오류: {e}")

print("\n" + "=" * 100)
print("4. 중국 월별 매출 (10~12월)")
print("=" * 100)

try:
    cursor.execute("""
        SELECT * FROM DW_CN_COPA_D
        WHERE STD_YM >= '202510'
        LIMIT 5
    """)
    results = cursor.fetchall()
    desc = cursor.description
    col_names = [d[0] for d in desc]
    print("\n컬럼명:", col_names)
    print("\n샘플:")
    for row in results:
        print(row)
except Exception as e:
    print(f"오류: {e}")

print("\n" + "=" * 100)
print("5. 중국 PL Summary 테이블 (PREP_CN_PL_SUMMARY_M)")
print("=" * 100)

try:
    cursor.execute("DESCRIBE TABLE PREP_CN_PL_SUMMARY_M")
    columns = cursor.fetchall()
    print("\n컬럼:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
except Exception as e:
    print(f"오류: {e}")

print("\n" + "=" * 100)
print("6. 중국 AR 수금계획 테이블 (PREP_CN_AR_RCV_PLAN_M)")
print("=" * 100)

try:
    cursor.execute("DESCRIBE TABLE PREP_CN_AR_RCV_PLAN_M")
    columns = cursor.fetchall()
    print("\n컬럼:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
except Exception as e:
    print(f"오류: {e}")

try:
    cursor.execute("SELECT * FROM PREP_CN_AR_RCV_PLAN_M LIMIT 5")
    results = cursor.fetchall()
    desc = cursor.description
    col_names = [d[0] for d in desc]
    print("\n컬럼명:", col_names)
    print("\n샘플:")
    for row in results:
        print(row)
except Exception as e:
    print(f"오류: {e}")

cursor.close()
conn.close()
print("\n연결 종료")

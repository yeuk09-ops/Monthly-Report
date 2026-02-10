# -*- coding: utf-8 -*-
"""
FNF 재무제표 대시보드용 Snowflake 데이터 추출
- 손익계산서 (CO-PA 기준)
- 여신기준 검증 데이터
"""
import snowflake.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = snowflake.connector.connect(
    user='ykjung',
    password='Fnfsnowflake2025!',
    account='gv28284.ap-northeast-2.aws',
    database='fnf',
    warehouse='dev_wh',
    role='pu_sql_sap',
    schema='sap_fnf'
)

cursor = conn.cursor()

print("=" * 100)
print("【1】 손익계산서 (CO-PA) - 24년 vs 25년 연간 비교")
print("=" * 100)

# 손익 데이터 - 채널별 (국내/수출)
cursor.execute("""
SELECT
    YEAR(PST_DT) as YR,
    CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END as CHANNEL,
    ROUND(SUM(TAG_SALE_AMT) / 100000000, 0) as TAG_100M,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) as ACT_SALE_100M,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
    ROUND(SUM(SALE_CMS) / 100000000, 0) as CMS_100M,
    ROUND(SUM(ACT_COGS) / 100000000, 0) as COGS_100M
FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY YEAR(PST_DT), CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END
ORDER BY YR, CHANNEL
""")

print(f"{'연도':^6} | {'채널':^10} | {'TAG':^10} | {'실판(VAT)':^10} | {'실판(V-)':^10} | {'점수수료':^10} | {'매출원가':^10}")
print("-" * 85)
for row in cursor.fetchall():
    print(f"{row[0]:^6} | {row[1]:^10} | {row[2]:>8.0f}억 | {row[3]:>8.0f}억 | {row[4]:>8.0f}억 | {row[5]:>8.0f}억 | {row[6]:>8.0f}억")

print()
print("=" * 100)
print("【2】 손익계산서 합계 - 24년 vs 25년")
print("=" * 100)

cursor.execute("""
SELECT
    YEAR(PST_DT) as YR,
    ROUND(SUM(TAG_SALE_AMT) / 100000000, 0) as TAG_100M,
    ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) as ACT_SALE_100M,
    ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
    ROUND(SUM(SALE_CMS) / 100000000, 0) as CMS_100M,
    ROUND(SUM(ACT_COGS) / 100000000, 0) as COGS_100M
FROM DW_COPA_D
WHERE PST_DT >= '2024-01-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0')
GROUP BY YEAR(PST_DT)
ORDER BY YR
""")

print(f"{'연도':^6} | {'TAG(억)':^10} | {'실판VAT(억)':^12} | {'실판V-(억)':^12} | {'점수수료(억)':^12} | {'매출원가(억)':^12}")
print("-" * 75)
for row in cursor.fetchall():
    print(f"{row[0]:^6} | {row[1]:>8.0f} | {row[2]:>10.0f} | {row[3]:>10.0f} | {row[4]:>10.0f} | {row[5]:>10.0f}")

print()
print("=" * 100)
print("【3】 여신기준 검증 - 11월~12월 매출 및 12월말 채권")
print("=" * 100)

# 국내 매출 (11월, 12월)
cursor.execute("""
SELECT
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '11' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '12' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DEC_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND CHNL_CD NOT IN ('99', '0', '9')
""")
dom_sale = cursor.fetchone()
print(f"국내: 11월={dom_sale[0]}억, 12월={dom_sale[1]}억")

# 수출 매출 - 지역별
cursor.execute("""
SELECT
    CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '11' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as NOV_SALE,
    ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '12' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DEC_SALE
FROM DW_COPA_D
WHERE PST_DT >= '2025-11-01' AND PST_DT <= '2025-12-31'
  AND CORP_CD = '1000'
  AND CHNL_CD = '9'
  AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
    END
ORDER BY REGION
""")
print(f"\n{'지역':^10} | {'11월 매출':^10} | {'12월 매출':^10}")
print("-" * 35)
export_data = {}
for row in cursor.fetchall():
    export_data[row[0]] = {'nov': row[1], 'dec': row[2]}
    print(f"{row[0]:^10} | {row[1]:>8.0f}억 | {row[2]:>8.0f}억")

# 국내 채권
cursor.execute("""
SELECT
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) as AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
  AND WWDCH != '09'
""")
dom_ar = cursor.fetchone()[0]
print(f"\n국내 12월말 채권: {dom_ar}억")

# 수출 채권 - 지역별
cursor.execute("""
SELECT
    CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN 'HK_TW'
        ELSE 'OTHER'
    END AS REGION,
    ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) AS AR_100M
FROM DM_F_FI_AR_AGING
WHERE CALMONTH = '2025-12'
  AND ZARTYP = 'R1'
  AND WWDCH = '09'
GROUP BY CASE
        WHEN KUNNR IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN KUNNR IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942')
             OR NAME1 LIKE '%HONG KONG%' OR NAME1 LIKE '%홍콩%' OR NAME1 LIKE '%대만%' OR NAME1 LIKE '%TAIWAN%'
        THEN 'HK_TW'
        ELSE 'OTHER'
    END
ORDER BY REGION
""")
print(f"\n{'지역':^10} | {'12월말 채권':^12}")
print("-" * 25)
ar_data = {}
for row in cursor.fetchall():
    ar_data[row[0]] = row[1]
    print(f"{row[0]:^10} | {row[1]:>10.0f}억")

print()
print("=" * 100)
print("【4】 여신기준 검증표 계산 (11~12월 기준)")
print("=" * 100)

# 국내
nov_dom = dom_sale[0]
dec_dom = dom_sale[1]
ar_dom = dom_ar
avg_dom = (nov_dom + dec_dom) / 2
ratio_dom = ar_dom / (nov_dom + dec_dom) * 100 if (nov_dom + dec_dom) > 0 else 0
months_dom = ar_dom / avg_dom if avg_dom > 0 else 0

print(f"\n【국내】")
print(f"  11월 매출: {nov_dom}억")
print(f"  12월 매출: {dec_dom}억")
print(f"  12월말 채권: {ar_dom}억")
print(f"  채권/매출: {ratio_dom:.0f}%")
print(f"  월수 환산: {months_dom:.1f}개월")

# 수출 - 중국
if 'CHINA' in export_data and 'CHINA' in ar_data:
    nov = export_data['CHINA']['nov']
    dec = export_data['CHINA']['dec']
    ar = ar_data['CHINA']
    avg = (nov + dec) / 2
    ratio = ar / (nov + dec) * 100 if (nov + dec) > 0 else 0
    months = ar / avg if avg > 0 else 0
    print(f"\n【수출-중국】")
    print(f"  11월 매출: {nov}억")
    print(f"  12월 매출: {dec}억")
    print(f"  12월말 채권: {ar}억")
    print(f"  채권/매출: {ratio:.0f}%")
    print(f"  월수 환산: {months:.1f}개월")

# 수출 - 홍콩/대만
if 'HK_TW' in export_data and 'HK_TW' in ar_data:
    nov = export_data['HK_TW']['nov']
    dec = export_data['HK_TW']['dec']
    ar = ar_data['HK_TW']
    avg = (nov + dec) / 2
    ratio = ar / (nov + dec) * 100 if (nov + dec) > 0 else 0
    months = ar / avg if avg > 0 else 0
    print(f"\n【수출-홍콩/대만】")
    print(f"  11월 매출: {nov}억")
    print(f"  12월 매출: {dec}억")
    print(f"  12월말 채권: {ar}억")
    print(f"  채권/매출: {ratio:.0f}%")
    print(f"  월수 환산: {months:.1f}개월")

# 수출 - 기타
if 'OTHER' in export_data and 'OTHER' in ar_data:
    nov = export_data['OTHER']['nov']
    dec = export_data['OTHER']['dec']
    ar = ar_data['OTHER']
    avg = (nov + dec) / 2
    ratio = ar / (nov + dec) * 100 if (nov + dec) > 0 else 0
    months = ar / avg if avg > 0 else 0
    print(f"\n【수출-기타】")
    print(f"  11월 매출: {nov}억")
    print(f"  12월 매출: {dec}억")
    print(f"  12월말 채권: {ar}억")
    print(f"  채권/매출: {ratio:.0f}%")
    print(f"  월수 환산: {months:.1f}개월")

conn.close()

print()
print("=" * 100)
print("데이터 추출 완료")
print("=" * 100)

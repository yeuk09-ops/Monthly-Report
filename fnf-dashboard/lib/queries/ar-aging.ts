// AR Aging (매출채권 연령분석) 관련 쿼리

// 국내 채권 쿼리
export function getDomesticARQuery(calmonth: string) {
  return `
    SELECT
      ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 0) as AR_100M
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '${calmonth}'
      AND ZARTYP = 'R1'
      AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND WWDCH != '09'
  `;
}

// 수출 채권 (지역별) 쿼리
export function getExportARByRegionQuery(calmonth: string) {
  return `
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
    WHERE CALMONTH = '${calmonth}'
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
  `;
}

// 여신검증용 매출 쿼리 (국내)
export function getDomesticSalesForCreditQuery(year: string, prevMonth: string, currMonth: string) {
  return `
    SELECT
      ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '${prevMonth}' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as PREV_SALE,
      ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '${currMonth}' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as CURR_SALE
    FROM DW_COPA_D
    WHERE PST_DT >= '${year}-${prevMonth}-01' AND PST_DT <= '${year}-${currMonth}-31'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0', '9')
  `;
}

// 여신검증용 매출 쿼리 (수출 지역별)
export function getExportSalesForCreditQuery(year: string, prevMonth: string, currMonth: string) {
  return `
    SELECT
      CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
      END AS REGION,
      ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '${prevMonth}' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as PREV_SALE,
      ROUND(SUM(CASE WHEN TO_CHAR(PST_DT, 'MM') = '${currMonth}' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as CURR_SALE
    FROM DW_COPA_D
    WHERE PST_DT >= '${year}-${prevMonth}-01' AND PST_DT <= '${year}-${currMonth}-31'
      AND CORP_CD = '1000'
      AND CHNL_CD = '9'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
    GROUP BY CASE
        WHEN CUST_CD IN ('105787', '105798', '105864', '105807', '100888', '100495') THEN 'CHINA'
        WHEN CUST_CD IN ('100461', '105788', '105792', '105799', '105803', '105909', '106314', '100942') THEN 'HK_TW'
        ELSE 'OTHER'
      END
    ORDER BY REGION
  `;
}

// 전체 AR Aging 쿼리 (브랜드/채널별)
export function getFullARAgingQuery(calmonth: string) {
  return `
    SELECT
      CALMONTH,
      WWBND AS BRD_CD,
      CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END AS CHANNEL,
      ROUND(SUM(TRY_TO_NUMBER(COL_2_TOTAL)) / 100000000, 1) AS AR_TOTAL,
      ROUND(SUM(TRY_TO_NUMBER(COL_2_1M)) / 100000000, 1) AS AR_1M,
      ROUND(SUM(TRY_TO_NUMBER(COL_2_2M)) / 100000000, 1) AS AR_2M,
      ROUND(SUM(TRY_TO_NUMBER(COL_2_3M)) / 100000000, 1) AS AR_3M,
      ROUND(SUM(TRY_TO_NUMBER(COL_2_OVER3M)) / 100000000, 1) AS AR_OVER3M
    FROM DM_F_FI_AR_AGING
    WHERE CALMONTH = '${calmonth}'
      AND ZARTYP = 'R1'
      AND WWBND IN ('M', 'I', 'X', 'V', 'ST', 'W')
    GROUP BY CALMONTH, WWBND,
             CASE WHEN WWDCH = '09' THEN 'EXPORT' ELSE 'DOMESTIC' END
    ORDER BY CALMONTH, BRD_CD, CHANNEL
  `;
}

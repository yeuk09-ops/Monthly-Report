// COPA (손익계산서) 관련 쿼리

// 연간 손익 합계 쿼리
export function getAnnualPLQuery(year: string) {
  return `
    SELECT
      YEAR(PST_DT) as YR,
      ROUND(SUM(TAG_SALE_AMT) / 100000000, 0) as TAG_100M,
      ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) as ACT_SALE_100M,
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
      ROUND(SUM(SALE_CMS) / 100000000, 0) as CMS_100M,
      ROUND(SUM(ACT_COGS) / 100000000, 0) as COGS_100M
    FROM DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' AND PST_DT <= '${year}-12-31'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0')
    GROUP BY YEAR(PST_DT)
    ORDER BY YR
  `;
}

// 채널별(국내/수출) 손익 쿼리
export function getChannelPLQuery(startYear: string, endYear: string) {
  return `
    SELECT
      YEAR(PST_DT) as YR,
      CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END as CHANNEL,
      ROUND(SUM(TAG_SALE_AMT) / 100000000, 0) as TAG_100M,
      ROUND(SUM(ACT_SALE_AMT) / 100000000, 0) as ACT_SALE_100M,
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
      ROUND(SUM(SALE_CMS) / 100000000, 0) as CMS_100M,
      ROUND(SUM(ACT_COGS) / 100000000, 0) as COGS_100M
    FROM DW_COPA_D
    WHERE PST_DT >= '${startYear}-01-01' AND PST_DT <= '${endYear}-12-31'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0')
    GROUP BY YEAR(PST_DT), CASE WHEN CHNL_CD = '9' THEN 'EXPORT' ELSE 'DOMESTIC' END
    ORDER BY YR, CHANNEL
  `;
}

// 브랜드별 매출 쿼리
export function getBrandSalesQuery(year: string) {
  return `
    SELECT
      BRD_CD,
      CASE
        WHEN BRD_CD = 'M' THEN 'MLB'
        WHEN BRD_CD = 'I' THEN 'Discovery'
        WHEN BRD_CD = 'X' THEN 'MLB Kids'
        WHEN BRD_CD = 'V' THEN 'Vans'
        WHEN BRD_CD = 'ST' THEN 'Stretton'
        WHEN BRD_CD = 'W' THEN 'Other'
        ELSE 'Unknown'
      END as BRD_NM,
      ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DOMESTIC_SALE,
      ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as EXPORT_SALE,
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as TOTAL_SALE
    FROM DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' AND PST_DT <= '${year}-12-31'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0')
    GROUP BY BRD_CD
    ORDER BY TOTAL_SALE DESC
  `;
}

// 월별 매출 추이 쿼리
export function getMonthlySalesQuery(year: string) {
  return `
    SELECT
      TO_CHAR(PST_DT, 'MM') as MM,
      ROUND(SUM(VAT_EXC_ACT_SALE_AMT) / 100000000, 0) as SALE_100M,
      ROUND(SUM(CASE WHEN CHNL_CD != '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as DOMESTIC,
      ROUND(SUM(CASE WHEN CHNL_CD = '9' THEN VAT_EXC_ACT_SALE_AMT ELSE 0 END) / 100000000, 0) as EXPORT
    FROM DW_COPA_D
    WHERE PST_DT >= '${year}-01-01' AND PST_DT <= '${year}-12-31'
      AND CORP_CD = '1000'
      AND BRD_CD IN ('M', 'I', 'X', 'V', 'ST', 'W')
      AND CHNL_CD NOT IN ('99', '0')
    GROUP BY TO_CHAR(PST_DT, 'MM')
    ORDER BY MM
  `;
}

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import {
  getDomesticARQuery,
  getExportARByRegionQuery,
  getDomesticSalesForCreditQuery,
  getExportSalesForCreditQuery,
} from '@/lib/queries';

interface DomesticAR {
  AR_100M: number;
}

interface ExportAR {
  REGION: string;
  AR_100M: number;
}

interface SalesData {
  PREV_SALE: number;
  CURR_SALE: number;
}

interface ExportSalesData {
  REGION: string;
  PREV_SALE: number;
  CURR_SALE: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calmonth = searchParams.get('calmonth') || '2025-12';
  const year = calmonth.split('-')[0];
  const currMonth = calmonth.split('-')[1];
  const prevMonth = (parseInt(currMonth) - 1).toString().padStart(2, '0');

  try {
    // 국내 채권
    const domesticAR = await executeQuery<DomesticAR>(getDomesticARQuery(calmonth));
    const domAR = domesticAR[0]?.AR_100M || 0;

    // 수출 채권 (지역별)
    const exportAR = await executeQuery<ExportAR>(getExportARByRegionQuery(calmonth));

    // 국내 매출 (여신검증용)
    const domesticSales = await executeQuery<SalesData>(
      getDomesticSalesForCreditQuery(year, prevMonth, currMonth)
    );
    const domSales = domesticSales[0] || { PREV_SALE: 0, CURR_SALE: 0 };

    // 수출 매출 (지역별, 여신검증용)
    const exportSales = await executeQuery<ExportSalesData>(
      getExportSalesForCreditQuery(year, prevMonth, currMonth)
    );

    // 여신검증 데이터 구성
    const creditVerification = {
      domestic: {
        prevSale: domSales.PREV_SALE,
        currSale: domSales.CURR_SALE,
        ar: domAR,
        avgSale: (domSales.PREV_SALE + domSales.CURR_SALE) / 2,
        ratio: domAR / (domSales.PREV_SALE + domSales.CURR_SALE) * 100 || 0,
        months: domAR / ((domSales.PREV_SALE + domSales.CURR_SALE) / 2) || 0,
      },
      export: {} as Record<string, {
        prevSale: number;
        currSale: number;
        ar: number;
        avgSale: number;
        ratio: number;
        months: number;
      }>,
    };

    // 수출 지역별 계산
    exportAR.forEach((ar) => {
      const sales = exportSales.find((s) => s.REGION === ar.REGION) || {
        PREV_SALE: 0,
        CURR_SALE: 0,
      };
      const avgSale = (sales.PREV_SALE + sales.CURR_SALE) / 2;
      const totalSale = sales.PREV_SALE + sales.CURR_SALE;

      creditVerification.export[ar.REGION] = {
        prevSale: sales.PREV_SALE,
        currSale: sales.CURR_SALE,
        ar: ar.AR_100M,
        avgSale,
        ratio: totalSale > 0 ? (ar.AR_100M / totalSale) * 100 : 0,
        months: avgSale > 0 ? ar.AR_100M / avgSale : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        calmonth,
        creditVerification,
        raw: {
          domesticAR: domAR,
          exportAR,
          domesticSales: domSales,
          exportSales,
        },
      },
    });
  } catch (error) {
    console.error('AR Aging API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AR aging data' },
      { status: 500 }
    );
  }
}

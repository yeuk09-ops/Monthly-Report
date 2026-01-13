import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import { getChannelPLQuery, getBrandSalesQuery } from '@/lib/queries';

interface PLData {
  YR: number;
  CHANNEL: string;
  TAG_100M: number;
  ACT_SALE_100M: number;
  SALE_100M: number;
  CMS_100M: number;
  COGS_100M: number;
}

interface BrandData {
  BRD_CD: string;
  BRD_NM: string;
  DOMESTIC_SALE: number;
  EXPORT_SALE: number;
  TOTAL_SALE: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025';
  const prevYear = (parseInt(year) - 1).toString();

  try {
    // 채널별 P/L 데이터 조회
    const channelData = await executeQuery<PLData>(getChannelPLQuery(prevYear, year));

    // 연도별 합계 계산
    const yearlyTotals: Record<string, { sale: number; cogs: number; cms: number }> = {};
    const channelTotals: Record<string, Record<string, { sale: number; cogs: number; cms: number }>> = {};

    channelData.forEach((row) => {
      const yr = row.YR.toString();
      const ch = row.CHANNEL;

      // 연도별 합계
      if (!yearlyTotals[yr]) {
        yearlyTotals[yr] = { sale: 0, cogs: 0, cms: 0 };
      }
      yearlyTotals[yr].sale += row.SALE_100M;
      yearlyTotals[yr].cogs += row.COGS_100M;
      yearlyTotals[yr].cms += row.CMS_100M;

      // 채널별 합계
      if (!channelTotals[yr]) {
        channelTotals[yr] = {};
      }
      channelTotals[yr][ch] = {
        sale: row.SALE_100M,
        cogs: row.COGS_100M,
        cms: row.CMS_100M,
      };
    });

    // 브랜드별 매출 조회
    const brandDataCY = await executeQuery<BrandData>(getBrandSalesQuery(year));
    const brandDataPY = await executeQuery<BrandData>(getBrandSalesQuery(prevYear));

    // 응답 구성
    const response = {
      summary: {
        currentYear: year,
        previousYear: prevYear,
        current: yearlyTotals[year] || { sale: 0, cogs: 0, cms: 0 },
        previous: yearlyTotals[prevYear] || { sale: 0, cogs: 0, cms: 0 },
      },
      channels: {
        current: channelTotals[year] || {},
        previous: channelTotals[prevYear] || {},
      },
      brands: {
        current: brandDataCY,
        previous: brandDataPY,
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PL API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PL data' },
      { status: 500 }
    );
  }
}

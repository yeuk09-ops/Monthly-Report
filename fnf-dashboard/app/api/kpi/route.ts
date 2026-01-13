import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import { getAnnualPLQuery } from '@/lib/queries';
import { calcYoYGrowth, calcOpMargin } from '@/lib/utils/calculations';

interface PLSummary {
  YR: number;
  TAG_100M: number;
  ACT_SALE_100M: number;
  SALE_100M: number;
  CMS_100M: number;
  COGS_100M: number;
}

// 재무상태표 데이터 (CSV에서 가져온 하드코딩 값 - 추후 API로 대체)
const bsData = {
  '2024': {
    totalAssets: 19200,
    cash: 615,
    receivables: 1324,
    inventory: 2253,
    totalLiabilities: 4309,
    equity: 14952,
  },
  '2025': {
    totalAssets: 23000,
    cash: 2708,
    receivables: 2780,
    inventory: 2303,
    totalLiabilities: 4744,
    equity: 18317,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025';
  const prevYear = (parseInt(year) - 1).toString();

  try {
    // 손익 데이터 조회
    const plDataCY = await executeQuery<PLSummary>(getAnnualPLQuery(year));
    const plDataPY = await executeQuery<PLSummary>(getAnnualPLQuery(prevYear));

    const currentPL = plDataCY[0] || { SALE_100M: 0, COGS_100M: 0, CMS_100M: 0 };
    const previousPL = plDataPY[0] || { SALE_100M: 0, COGS_100M: 0, CMS_100M: 0 };

    // 매출총이익 = 출고매출(실판-수수료) - 원가
    const currentNetSale = currentPL.SALE_100M - currentPL.CMS_100M;
    const previousNetSale = previousPL.SALE_100M - previousPL.CMS_100M;
    const currentGrossProfit = currentNetSale - currentPL.COGS_100M;
    const previousGrossProfit = previousNetSale - previousPL.COGS_100M;

    // 판관비 및 영업이익 (간이 계산 - 실제는 추가 데이터 필요)
    // 25년 판관비 4,000억, 영업이익 5,013억 (하드코딩)
    const opProfit = { current: 5013, previous: 3965 };
    const sga = { current: 4000, previous: 3862 };

    // 재무상태표 데이터
    const currentBS = bsData[year as keyof typeof bsData] || bsData['2025'];
    const previousBS = bsData[prevYear as keyof typeof bsData] || bsData['2024'];

    // KPI 계산
    const kpi = {
      // 손익 KPI
      revenue: {
        current: currentPL.SALE_100M,
        previous: previousPL.SALE_100M,
        change: currentPL.SALE_100M - previousPL.SALE_100M,
        growth: calcYoYGrowth(currentPL.SALE_100M, previousPL.SALE_100M),
      },
      opProfit: {
        current: opProfit.current,
        previous: opProfit.previous,
        change: opProfit.current - opProfit.previous,
        growth: calcYoYGrowth(opProfit.current, opProfit.previous),
      },
      opMargin: {
        current: calcOpMargin(opProfit.current, currentPL.SALE_100M),
        previous: calcOpMargin(opProfit.previous, previousPL.SALE_100M),
      },

      // 재무상태표 KPI
      totalAssets: {
        current: currentBS.totalAssets,
        previous: previousBS.totalAssets,
        change: currentBS.totalAssets - previousBS.totalAssets,
        growth: calcYoYGrowth(currentBS.totalAssets, previousBS.totalAssets),
      },
      totalLiabilities: {
        current: currentBS.totalLiabilities,
        previous: previousBS.totalLiabilities,
        change: currentBS.totalLiabilities - previousBS.totalLiabilities,
        growth: calcYoYGrowth(currentBS.totalLiabilities, previousBS.totalLiabilities),
      },
      equity: {
        current: currentBS.equity,
        previous: previousBS.equity,
        change: currentBS.equity - previousBS.equity,
        growth: calcYoYGrowth(currentBS.equity, previousBS.equity),
      },
      cash: {
        current: currentBS.cash,
        previous: previousBS.cash,
        change: currentBS.cash - previousBS.cash,
        growth: calcYoYGrowth(currentBS.cash, previousBS.cash),
      },

      // 재무비율
      ratios: {
        debtRatio: {
          current: (currentBS.totalLiabilities / currentBS.equity) * 100,
          previous: (previousBS.totalLiabilities / previousBS.equity) * 100,
        },
        equityRatio: {
          current: (currentBS.equity / currentBS.totalAssets) * 100,
          previous: (previousBS.equity / previousBS.totalAssets) * 100,
        },
        netDebtRatio: {
          current: ((0 - currentBS.cash) / currentBS.equity) * 100, // 차입금 0
          previous: ((0 - previousBS.cash) / previousBS.equity) * 100,
        },
        roe: {
          current: (opProfit.current / currentBS.equity) * 100,
          previous: (opProfit.previous / previousBS.equity) * 100,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        year,
        previousYear: prevYear,
        kpi,
      },
    });
  } catch (error) {
    console.error('KPI API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}

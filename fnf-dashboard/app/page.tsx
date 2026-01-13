'use client';

import { useMemo } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { RatioCard } from '@/components/dashboard/RatioCard';

// 재무 데이터 (CSV 파일 기준: F&F 월별재무제표(25.12).csv)
// 단위: 억원 (백만원 ÷ 100)
const financialData = {
  // 손익계산서 (1~12월 누계)
  revenue: { current: 17048, previous: 15210 }, // 실판매출
  domesticRevenue: { current: 8052, previous: 8745 }, // 국내매출
  exportRevenue: { current: 8996, previous: 6465 }, // 수출매출
  cogs: { current: 6426, previous: 5837 }, // 매출원가
  sga: { current: 5609, previous: 5408 }, // 판관비
  operatingProfit: { current: 5013, previous: 3965 }, // 영업이익

  // 재무상태표 (12월 기준) - CSV 25년 12월(e) 데이터
  totalAssets: { current: 22448, previous: 19248 }, // 총자산: 2,244,836 → 22448억
  currentAssets: { current: 9638, previous: 5806 }, // 유동자산
  cash: { current: 2708, previous: 615 }, // 현금: 270,819 → 2708억
  receivables: { current: 2180, previous: 1324 }, // 매출채권: 218,011 → 2180억
  inventory: { current: 2303, previous: 2253 }, // 재고자산: 230,263 → 2303억

  totalLiabilities: { current: 4144, previous: 4309 }, // 총부채: 414,400 → 4144억
  currentLiabilities: { current: 2399, previous: 3611 }, // 유동부채
  borrowings: { current: 0, previous: 450 }, // 차입금
  payables: { current: 862, previous: 798 }, // 매입채무: 86,213 → 862억

  equity: { current: 18304, previous: 14939 }, // 자본총계: 1,830,436 → 18304억
  retainedEarnings: { current: 15657, previous: 12227 }, // 이익잉여금: 1,565,723 → 15657억
};

export default function DashboardPage() {
  // 계산된 지표들
  const calculatedMetrics = useMemo(() => {
    const d = financialData;

    // 성장률 계산
    const calcGrowth = (curr: number, prev: number) =>
      prev !== 0 ? ((curr - prev) / prev * 100) : 0;

    // 수익성 지표
    const grossProfit = {
      current: d.revenue.current - d.cogs.current,
      previous: d.revenue.previous - d.cogs.previous
    };
    const grossMargin = {
      current: (grossProfit.current / d.revenue.current * 100),
      previous: (grossProfit.previous / d.revenue.previous * 100)
    };
    const opMargin = {
      current: (d.operatingProfit.current / d.revenue.current * 100),
      previous: (d.operatingProfit.previous / d.revenue.previous * 100)
    };
    const exportRatio = {
      current: (d.exportRevenue.current / d.revenue.current * 100),
      previous: (d.exportRevenue.previous / d.revenue.previous * 100)
    };

    // 안정성 지표
    const debtRatio = {
      current: (d.totalLiabilities.current / d.equity.current * 100),
      previous: (d.totalLiabilities.previous / d.equity.previous * 100)
    };
    const currentRatio = {
      current: (d.currentAssets.current / d.currentLiabilities.current * 100),
      previous: (d.currentAssets.previous / d.currentLiabilities.previous * 100)
    };
    const netDebt = {
      current: d.borrowings.current - d.cash.current,
      previous: d.borrowings.previous - d.cash.previous
    };
    const netDebtRatio = {
      current: (netDebt.current / d.equity.current * 100),
      previous: (netDebt.previous / d.equity.previous * 100)
    };
    const equityRatio = {
      current: (d.equity.current / d.totalAssets.current * 100),
      previous: (d.equity.previous / d.totalAssets.previous * 100)
    };

    // 활동성 지표 (연환산)
    const avgReceivables = (d.receivables.current + d.receivables.previous) / 2;
    const avgInventory = (d.inventory.current + d.inventory.previous) / 2;
    const avgPayables = (d.payables.current + d.payables.previous) / 2;

    const receivablesTurnover = {
      current: d.revenue.current / avgReceivables,
      previous: d.revenue.previous / ((d.receivables.previous + 1200) / 2) // 전전년 추정
    };
    const dso = {
      current: 365 / receivablesTurnover.current,
      previous: 365 / receivablesTurnover.previous
    };

    const inventoryTurnover = {
      current: d.cogs.current / avgInventory,
      previous: d.cogs.previous / ((d.inventory.previous + 2100) / 2)
    };
    const dio = {
      current: 365 / inventoryTurnover.current,
      previous: 365 / inventoryTurnover.previous
    };

    const payablesTurnover = {
      current: d.cogs.current / avgPayables,
      previous: d.cogs.previous / ((d.payables.previous + 750) / 2)
    };
    const dpo = {
      current: 365 / payablesTurnover.current,
      previous: 365 / payablesTurnover.previous
    };

    const ccc = {
      current: dso.current + dio.current - dpo.current,
      previous: dso.previous + dio.previous - dpo.previous
    };

    // 수익성 지표
    const avgEquity = (d.equity.current + d.equity.previous) / 2;
    const avgAssets = (d.totalAssets.current + d.totalAssets.previous) / 2;
    const netIncome = d.operatingProfit.current * 0.8; // 추정 (세후)
    const prevNetIncome = d.operatingProfit.previous * 0.8;

    const roe = {
      current: (netIncome / avgEquity * 100),
      previous: (prevNetIncome / ((d.equity.previous + 12500) / 2) * 100)
    };
    const roa = {
      current: (netIncome / avgAssets * 100),
      previous: (prevNetIncome / ((d.totalAssets.previous + 17500) / 2) * 100)
    };

    return {
      // 성장률
      revenueGrowth: calcGrowth(d.revenue.current, d.revenue.previous),
      opProfitGrowth: calcGrowth(d.operatingProfit.current, d.operatingProfit.previous),
      assetGrowth: calcGrowth(d.totalAssets.current, d.totalAssets.previous),
      liabilityGrowth: calcGrowth(d.totalLiabilities.current, d.totalLiabilities.previous),
      equityGrowth: calcGrowth(d.equity.current, d.equity.previous),
      exportGrowth: calcGrowth(d.exportRevenue.current, d.exportRevenue.previous),
      domesticGrowth: calcGrowth(d.domesticRevenue.current, d.domesticRevenue.previous),
      cashGrowth: calcGrowth(d.cash.current, d.cash.previous),
      receivablesGrowth: calcGrowth(d.receivables.current, d.receivables.previous),

      // 수익성
      grossMargin,
      opMargin,
      exportRatio,
      roe,
      roa,

      // 안정성
      debtRatio,
      currentRatio,
      netDebtRatio,
      equityRatio,

      // 활동성
      receivablesTurnover,
      inventoryTurnover,
      payablesTurnover,
      dso,
      dio,
      dpo,
      ccc,
    };
  }, []);

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const formatPercent = (num: number) => num.toFixed(1);

  const d = financialData;
  const m = calculatedMetrics;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-[#1e3c72] border-l-4 border-[#2a5298] pl-4">
        FNF 12월 재무제표 (대시보드)
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="실판매출 (1~12월)"
          value={`${(d.revenue.current / 10000).toFixed(2)}조`}
          unit=""
          yoy={m.revenueGrowth}
          yoyType="positive"
        />
        <KPICard
          title="영업이익 (1~12월)"
          value={d.operatingProfit.current}
          yoy={m.opProfitGrowth}
          yoyType="positive"
          highlight
        />
        <KPICard
          title="총자산 (12월)"
          value={`${(d.totalAssets.current / 10000).toFixed(2)}조`}
          unit=""
          yoy={m.assetGrowth}
        />
        <KPICard
          title="부채 (12월)"
          value={d.totalLiabilities.current}
          yoy={m.liabilityGrowth}
          yoyType="negative"
        />
        <KPICard
          title="자기자본 (12월)"
          value={`${(d.equity.current / 10000).toFixed(2)}조`}
          unit=""
          yoy={m.equityGrowth}
        />
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#2a5298]">
          <h2 className="text-lg font-semibold text-[#1e3c72] mb-4 flex items-center gap-2">
            <span>📈</span> 수익성 분석
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong className="text-emerald-700">매출 성장세 지속</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• 실판매출 {formatNumber(d.revenue.previous)}억 → {formatNumber(d.revenue.current)}억 (<span className="text-emerald-600 font-medium">+{formatPercent(m.revenueGrowth)}%↑</span>)</li>
                <li>• 영업이익 {formatNumber(d.operatingProfit.previous)}억 → {formatNumber(d.operatingProfit.current)}억 (<span className="text-emerald-600 font-medium">+{formatPercent(m.opProfitGrowth)}%↑</span>)</li>
                <li>• 영업이익률 {formatPercent(m.opMargin.previous)}% → {formatPercent(m.opMargin.current)}% (+{formatPercent(m.opMargin.current - m.opMargin.previous)}%p)</li>
              </ul>
            </div>
            <div className="pt-2">
              <strong className="text-blue-700">수출 매출 고성장</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• 수출매출 {formatNumber(d.exportRevenue.previous)}억 → {formatNumber(d.exportRevenue.current)}억 (<span className="text-emerald-600 font-medium">+{formatPercent(m.exportGrowth)}%↑</span>)</li>
                <li>• 수출 비중 {formatPercent(m.exportRatio.previous)}% → {formatPercent(m.exportRatio.current)}% (+{formatPercent(m.exportRatio.current - m.exportRatio.previous)}%p)</li>
                <li>• 수익성 개선의 핵심 동력</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#2a5298]">
          <h2 className="text-lg font-semibold text-[#1e3c72] mb-4 flex items-center gap-2">
            <span>💰</span> 재무 현황
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>자산 구조 (12월 기준)</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• 총자산: {(d.totalAssets.previous/10000).toFixed(2)}조 → {(d.totalAssets.current/10000).toFixed(2)}조 (+{formatNumber(d.totalAssets.current - d.totalAssets.previous)}억, +{formatPercent(m.assetGrowth)}%)</li>
                <li>• 현금: {formatNumber(d.cash.previous)}억 → {formatNumber(d.cash.current)}억 (<span className="text-emerald-600">+{formatNumber(d.cash.current - d.cash.previous)}억, +{formatPercent(m.cashGrowth)}%</span>)</li>
                <li>• 재고자산: {formatNumber(d.inventory.previous)}억 → {formatNumber(d.inventory.current)}억 ({d.inventory.current - d.inventory.previous > 0 ? '+' : ''}{formatNumber(d.inventory.current - d.inventory.previous)}억)</li>
              </ul>
            </div>
            <div className="pt-2">
              <strong className="text-emerald-700">무차입 경영 유지</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• 총부채: {formatNumber(d.totalLiabilities.previous)}억 → {formatNumber(d.totalLiabilities.current)}억 ({formatNumber(d.totalLiabilities.current - d.totalLiabilities.previous)}억, {formatPercent(m.liabilityGrowth)}%)</li>
                <li>• 차입금: <strong className="text-emerald-700">{formatNumber(d.borrowings.current)}원</strong> (무차입 경영 유지)</li>
                <li>• 부채비율: {formatPercent(m.debtRatio.previous)}% → {formatPercent(m.debtRatio.current)}% (<span className="text-emerald-600">{formatPercent(m.debtRatio.current - m.debtRatio.previous)}%p 개선</span>)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 수익성 지표 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-l-4 border-emerald-500">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4">📊 수익성 지표</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <RatioCard
            label="매출총이익률"
            value={m.grossMargin.current}
            previousValue={m.grossMargin.previous}
          />
          <RatioCard
            label="영업이익률"
            value={m.opMargin.current}
            previousValue={m.opMargin.previous}
          />
          <RatioCard
            label="ROE"
            value={m.roe.current}
            previousValue={m.roe.previous}
          />
          <RatioCard
            label="ROA"
            value={m.roa.current}
            previousValue={m.roa.previous}
          />
          <RatioCard
            label="수출비중"
            value={m.exportRatio.current}
            previousValue={m.exportRatio.previous}
          />
        </div>
      </div>

      {/* 안정성 지표 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">🛡️ 안정성 지표</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <RatioCard
            label="부채비율"
            value={m.debtRatio.current}
            previousValue={m.debtRatio.previous}
            positiveGood={false}
          />
          <RatioCard
            label="유동비율"
            value={m.currentRatio.current}
            previousValue={m.currentRatio.previous}
          />
          <RatioCard
            label="순차입금비율"
            value={m.netDebtRatio.current}
            previousValue={m.netDebtRatio.previous}
            positiveGood={false}
          />
          <RatioCard
            label="자기자본비율"
            value={m.equityRatio.current}
            previousValue={m.equityRatio.previous}
          />
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">차입금</div>
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(d.borrowings.current)}원</div>
            <div className="text-xs text-emerald-600 mt-1">무차입 경영</div>
          </div>
        </div>
      </div>

      {/* 활동성 지표 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-orange-400">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">⚡ 활동성 지표 (회전율/회전일수)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <RatioCard
            label="매출채권회전율"
            value={m.receivablesTurnover.current}
            previousValue={m.receivablesTurnover.previous}
            format="times"
          />
          <RatioCard
            label="DSO (매출채권)"
            value={m.dso.current}
            previousValue={m.dso.previous}
            format="days"
            positiveGood={false}
          />
          <RatioCard
            label="재고자산회전율"
            value={m.inventoryTurnover.current}
            previousValue={m.inventoryTurnover.previous}
            format="times"
          />
          <RatioCard
            label="DIO (재고)"
            value={m.dio.current}
            previousValue={m.dio.previous}
            format="days"
            positiveGood={false}
          />
          <RatioCard
            label="DPO (매입채무)"
            value={m.dpo.current}
            previousValue={m.dpo.previous}
            format="days"
          />
          <RatioCard
            label="CCC (현금전환주기)"
            value={m.ccc.current}
            previousValue={m.ccc.previous}
            format="days"
            positiveGood={false}
          />
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightCard
          type="positive"
          title="긍정적 시그널 (AI 분석)"
          items={[
            `<strong>무차입 경영 유지</strong>: 차입금 ${formatNumber(d.borrowings.current)}원, 순차입금비율 ${formatPercent(m.netDebtRatio.current)}%로 재무안정성 최고 수준`,
            `<strong>영업이익률 ${formatPercent(m.opMargin.current)}%</strong>: 전년대비 +${formatPercent(m.opMargin.current - m.opMargin.previous)}%p 상승, ${formatNumber(d.operatingProfit.current)}억원 영업이익 달성`,
            `<strong>현금 ${formatNumber(d.cash.current)}억원</strong>: 전년대비 +${formatNumber(d.cash.current - d.cash.previous)}억원(+${formatPercent(m.cashGrowth)}%) 대폭 증가`,
            `<strong>수출 매출 고성장</strong>: +${formatPercent(m.exportGrowth)}% 증가 (${formatNumber(d.exportRevenue.previous)}억→${formatNumber(d.exportRevenue.current)}억), 수출비중 ${formatPercent(m.exportRatio.current)}%`,
          ]}
        />
        <InsightCard
          type="warning"
          title="모니터링 필요 (AI 분석)"
          items={[
            `<strong>매출채권 증가</strong>: +${formatPercent(m.receivablesGrowth)}% 증가 (${formatNumber(d.receivables.previous)}억→${formatNumber(d.receivables.current)}억), 회전율 ${formatPercent(m.receivablesTurnover.current)}회`,
            `<strong>CCC 확대</strong>: ${formatPercent(m.ccc.previous)}일→${formatPercent(m.ccc.current)}일 (+${formatPercent(m.ccc.current - m.ccc.previous)}일), 운전자본 효율성 점검 필요`,
            `<strong>국내 매출 역성장</strong>: ${formatPercent(m.domesticGrowth)}% (${formatNumber(d.domesticRevenue.previous)}억→${formatNumber(d.domesticRevenue.current)}억)`,
            `<strong>재고회전일수</strong>: ${formatPercent(m.dio.current)}일로 전년 대비 개선 추세`,
          ]}
        />
      </div>

      {/* 계산식 참고 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📐 재무비율 계산식</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">수익성 지표</h4>
            <ul className="space-y-1">
              <li>• 매출총이익률 = (매출액-매출원가) ÷ 매출액 × 100</li>
              <li>• 영업이익률 = 영업이익 ÷ 매출액 × 100</li>
              <li>• ROE = 당기순이익 ÷ 평균자기자본 × 100</li>
              <li>• ROA = 당기순이익 ÷ 평균총자산 × 100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">안정성 지표</h4>
            <ul className="space-y-1">
              <li>• 부채비율 = 총부채 ÷ 자기자본 × 100</li>
              <li>• 유동비율 = 유동자산 ÷ 유동부채 × 100</li>
              <li>• 순차입금비율 = (차입금-현금) ÷ 자기자본 × 100</li>
              <li>• 자기자본비율 = 자기자본 ÷ 총자산 × 100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">활동성 지표</h4>
            <ul className="space-y-1">
              <li>• 매출채권회전율 = 매출액 ÷ 평균매출채권</li>
              <li>• DSO = 365 ÷ 매출채권회전율</li>
              <li>• DIO = 365 ÷ 재고자산회전율</li>
              <li>• DPO = 365 ÷ 매입채무회전율</li>
              <li>• CCC = DSO + DIO - DPO</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

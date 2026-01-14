'use client';

import { useMemo } from 'react';
import { useReport } from '@/components/providers/ReportContext';
import { KPICard, InsightCard, RatioCard } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Building2, PiggyBank } from 'lucide-react';

export default function DashboardPage() {
  const { reportData, isLoading } = useReport();

  const calculatedMetrics = useMemo(() => {
    if (!reportData) return null;

    const d = reportData.financialData;

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

    // 활동성 지표
    const avgReceivables = (d.receivables.current + d.receivables.previous) / 2;
    const avgInventory = (d.inventory.current + d.inventory.previous) / 2;
    const avgPayables = (d.payables.current + d.payables.previous) / 2;

    const receivablesTurnover = {
      current: d.revenue.current / avgReceivables,
      previous: d.revenue.previous / ((d.receivables.previous + 1200) / 2)
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

    // ROE, ROA
    const avgEquity = (d.equity.current + d.equity.previous) / 2;
    const avgAssets = (d.totalAssets.current + d.totalAssets.previous) / 2;
    const netIncome = d.operatingProfit.current * 0.8;
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
      revenueGrowth: calcGrowth(d.revenue.current, d.revenue.previous),
      opProfitGrowth: calcGrowth(d.operatingProfit.current, d.operatingProfit.previous),
      assetGrowth: calcGrowth(d.totalAssets.current, d.totalAssets.previous),
      liabilityGrowth: calcGrowth(d.totalLiabilities.current, d.totalLiabilities.previous),
      equityGrowth: calcGrowth(d.equity.current, d.equity.previous),
      exportGrowth: calcGrowth(d.exportRevenue.current, d.exportRevenue.previous),
      domesticGrowth: calcGrowth(d.domesticRevenue.current, d.domesticRevenue.previous),
      cashGrowth: calcGrowth(d.cash.current, d.cash.previous),
      receivablesGrowth: calcGrowth(d.receivables.current, d.receivables.previous),
      grossMargin,
      opMargin,
      exportRatio,
      roe,
      roa,
      debtRatio,
      netDebtRatio,
      equityRatio,
      receivablesTurnover,
      inventoryTurnover,
      payablesTurnover,
      dso,
      dio,
      dpo,
      ccc,
    };
  }, [reportData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!reportData || !calculatedMetrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-slate-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const d = reportData.financialData;
  const m = calculatedMetrics;
  const month = reportData.meta.month;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const formatPercent = (num: number) => num.toFixed(1);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* KPI Cards - 심플하고 고급스러운 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">실판매출 (1~{month}월)</p>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{(d.revenue.current / 10000).toFixed(2)}조</p>
            <p className={`text-xs mt-1 font-medium ${m.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.revenueGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.revenueGrowth).toFixed(1)}% YoY
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 overflow-hidden">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-emerald-100 font-medium">영업이익 (1~{month}월)</p>
              <TrendingUp className="w-4 h-4 text-emerald-200" />
            </div>
            <p className="text-2xl font-bold text-white">{formatNumber(d.operatingProfit.current)}억</p>
            <p className="text-xs mt-1 font-medium text-emerald-100">
              ▲ {m.opProfitGrowth.toFixed(1)}% YoY
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-slate-400" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">총자산 ({month}월)</p>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{(d.totalAssets.current / 10000).toFixed(2)}조</p>
            <p className={`text-xs mt-1 font-medium ${m.assetGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.assetGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.assetGrowth).toFixed(1)}% YoY
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-amber-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">부채 ({month}월)</p>
              <TrendingDown className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(d.totalLiabilities.current)}억</p>
            <p className={`text-xs mt-1 font-medium ${m.liabilityGrowth <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.liabilityGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.liabilityGrowth).toFixed(1)}% YoY
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-violet-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">자기자본 ({month}월)</p>
              <PiggyBank className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{(d.equity.current / 10000).toFixed(2)}조</p>
            <p className={`text-xs mt-1 font-medium ${m.equityGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.equityGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.equityGrowth).toFixed(1)}% YoY
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">수익성 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-emerald-600 mb-2">매출 성장세 지속</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>실판매출 {formatNumber(d.revenue.previous)}억 → {formatNumber(d.revenue.current)}억 <span className="text-emerald-500 font-medium">(+{formatPercent(m.revenueGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>영업이익 {formatNumber(d.operatingProfit.previous)}억 → {formatNumber(d.operatingProfit.current)}억 <span className="text-emerald-500 font-medium">(+{formatPercent(m.opProfitGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>영업이익률 {formatPercent(m.opMargin.previous)}% → {formatPercent(m.opMargin.current)}% (+{formatPercent(m.opMargin.current - m.opMargin.previous)}%p)</span>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-semibold text-blue-600 mb-2">수출 매출 고성장</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>수출매출 {formatNumber(d.exportRevenue.previous)}억 → {formatNumber(d.exportRevenue.current)}억 <span className="text-emerald-500 font-medium">(+{formatPercent(m.exportGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>수출 비중 {formatPercent(m.exportRatio.previous)}% → {formatPercent(m.exportRatio.current)}% (+{formatPercent(m.exportRatio.current - m.exportRatio.previous)}%p)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>수익성 개선의 핵심 동력</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-slate-600" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">재무 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-700 mb-2">자산 구조 (12월 기준)</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>총자산: {(d.totalAssets.previous/10000).toFixed(2)}조 → {(d.totalAssets.current/10000).toFixed(2)}조 (+{formatNumber(d.totalAssets.current - d.totalAssets.previous)}억, +{formatPercent(m.assetGrowth)}%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>현금: {formatNumber(d.cash.previous)}억 → {formatNumber(d.cash.current)}억 <span className="text-emerald-500 font-medium">(+{formatNumber(d.cash.current - d.cash.previous)}억, +{formatPercent(m.cashGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>재고자산: {formatNumber(d.inventory.previous)}억 → {formatNumber(d.inventory.current)}억 ({d.inventory.current - d.inventory.previous > 0 ? '+' : ''}{formatNumber(d.inventory.current - d.inventory.previous)}억)</span>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-semibold text-emerald-600 mb-2">무차입 경영 유지</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>총부채: {formatNumber(d.totalLiabilities.previous)}억 → {formatNumber(d.totalLiabilities.current)}억 ({formatNumber(d.totalLiabilities.current - d.totalLiabilities.previous)}억)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>차입금: <span className="font-semibold text-emerald-600">{formatNumber(d.borrowings.current)}원</span> (무차입 경영 유지)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>부채비율: {formatPercent(m.debtRatio.previous)}% → {formatPercent(m.debtRatio.current)}% <span className="text-emerald-500 font-medium">({formatPercent(m.debtRatio.current - m.debtRatio.previous)}%p 개선)</span></span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수익성 지표 */}
      <Card className="shadow-sm border-0 bg-white overflow-hidden">
        <div className="h-1 bg-emerald-500" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">수익성 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <RatioCard label="매출총이익률" value={m.grossMargin.current} previousValue={m.grossMargin.previous} />
            <RatioCard label="영업이익률" value={m.opMargin.current} previousValue={m.opMargin.previous} />
            <RatioCard label="ROE" value={m.roe.current} previousValue={m.roe.previous} />
            <RatioCard label="ROA" value={m.roa.current} previousValue={m.roa.previous} />
            <RatioCard label="수출비중" value={m.exportRatio.current} previousValue={m.exportRatio.previous} />
          </div>
        </CardContent>
      </Card>

      {/* 안정성 지표 */}
      <Card className="shadow-sm border-0 bg-white overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">안정성 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <RatioCard label="부채비율" value={m.debtRatio.current} previousValue={m.debtRatio.previous} positiveGood={false} />
            <RatioCard label="자기자본비율" value={m.equityRatio.current} previousValue={m.equityRatio.previous} />
            <RatioCard label="순차입금비율" value={m.netDebtRatio.current} previousValue={m.netDebtRatio.previous} positiveGood={false} />
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">차입금</p>
              <p className="text-2xl font-bold text-emerald-600">{formatNumber(d.borrowings.current)}원</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">무차입 경영</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 활동성 지표 */}
      <Card className="shadow-sm border-0 bg-white overflow-hidden">
        <div className="h-1 bg-amber-500" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">활동성 지표 (회전율/회전일수)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <RatioCard label="매출채권회전율" value={m.receivablesTurnover.current} previousValue={m.receivablesTurnover.previous} format="times" />
            <RatioCard label="DSO (매출채권)" value={m.dso.current} previousValue={m.dso.previous} format="days" positiveGood={false} />
            <RatioCard label="재고자산회전율" value={m.inventoryTurnover.current} previousValue={m.inventoryTurnover.previous} format="times" />
            <RatioCard label="DIO (재고)" value={m.dio.current} previousValue={m.dio.previous} format="days" positiveGood={false} />
            <RatioCard label="DPO (매입채무)" value={m.dpo.current} previousValue={m.dpo.previous} format="days" />
            <RatioCard label="CCC (현금전환주기)" value={m.ccc.current} previousValue={m.ccc.previous} format="days" positiveGood={false} />
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          type="positive"
          title="긍정적 시그널"
          items={reportData.aiInsights.positive}
        />
        <InsightCard
          type="warning"
          title="모니터링 필요"
          items={reportData.aiInsights.warning}
        />
      </div>

      {/* 계산식 참고 */}
      <Card className="shadow-sm border-0 bg-slate-800 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200">재무비율 계산식</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div>
              <h4 className="font-semibold text-white mb-2">수익성 지표</h4>
              <ul className="space-y-1">
                <li>• 매출총이익률 = (매출액-매출원가) ÷ 매출액 × 100</li>
                <li>• 영업이익률 = 영업이익 ÷ 매출액 × 100</li>
                <li>• ROE = 당기순이익 ÷ 평균자기자본 × 100</li>
                <li>• ROA = 당기순이익 ÷ 평균총자산 × 100</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">안정성 지표</h4>
              <ul className="space-y-1">
                <li>• 부채비율 = 총부채 ÷ 자기자본 × 100</li>
                <li>• 자기자본비율 = 자기자본 ÷ 총자산 × 100</li>
                <li>• 순차입금비율 = (차입금-현금) ÷ 자기자본 × 100</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">활동성 지표</h4>
              <ul className="space-y-1">
                <li>• 매출채권회전율 = 매출액 ÷ 평균매출채권</li>
                <li>• 재고자산회전율 = 매출원가 ÷ 평균재고자산</li>
                <li>• 매입채무회전율 = 매출원가 ÷ 평균매입채무</li>
                <li>• DSO = 365 ÷ 매출채권회전율</li>
                <li>• DIO = 365 ÷ 재고자산회전율</li>
                <li>• DPO = 365 ÷ 매입채무회전율</li>
                <li>• CCC = DSO + DIO - DPO</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

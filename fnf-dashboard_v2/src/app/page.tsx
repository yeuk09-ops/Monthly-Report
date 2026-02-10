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
    const incomeStmt = reportData.incomeStatement;

    const calcGrowth = (curr: number, prev: number) =>
      prev !== 0 ? ((curr - prev) / prev * 100) : 0;

    // 수익성 지표 - 손익계산서의 ratio 값 사용 (incomeStatement.*.ratio)
    // incomeStatement의 grossProfit과 operatingProfit에 이미 정확한 ratio가 계산되어 있음
    const grossMargin = {
      current: incomeStmt.grossProfit?.ratio || (d.revenue.current - d.cogs.current) / d.revenue.current * 100,
      previousYear: d.revenue.previousYear && d.cogs.previousYear
        ? ((d.revenue.previousYear - d.cogs.previousYear) / d.revenue.previousYear * 100)
        : 0
    };

    const opMargin = {
      current: incomeStmt.operatingProfit?.ratio || (d.operatingProfit.current / d.revenue.current * 100),
      previousYear: d.operatingProfit.previousYear && d.revenue.previousYear
        ? (d.operatingProfit.previousYear / d.revenue.previousYear * 100)
        : 0
    };

    const exportRatio = {
      current: (d.exportRevenue.current / d.revenue.current * 100),
      previousYear: d.exportRevenue.previousYear && d.revenue.previousYear
        ? (d.exportRevenue.previousYear / d.revenue.previousYear * 100)
        : 0
    };

    // 안정성 지표 - YoY 기준 (전년동월 대비)
    const debtRatio = {
      current: (d.totalLiabilities.current / d.equity.current * 100),
      previousYear: (d.totalLiabilities.previousYear / d.equity.previousYear * 100)
    };
    const netDebt = {
      current: d.borrowings.current - d.cash.current,
      previousMonth: d.borrowings.previousMonth - d.cash.previousMonth,
      previousYear: d.borrowings.previousYear - d.cash.previousYear
    };
    const netDebtRatio = {
      current: (netDebt.current / d.equity.current * 100),
      previousYear: (netDebt.previousYear / d.equity.previousYear * 100)
    };
    const equityRatio = {
      current: (d.equity.current / d.totalAssets.current * 100),
      previousYear: (d.equity.previousYear / d.totalAssets.previousYear * 100)
    };

    // 활동성 지표 - 연환산 기준 (월 데이터를 12배하여 연환산)
    const avgReceivables = (d.receivables.current + d.receivables.previousMonth) / 2;
    const avgInventory = (d.inventory.current + d.inventory.previousMonth) / 2;
    const avgPayables = (d.payables.current + d.payables.previousMonth) / 2;

    // 전년 동월 기준 (25.1월 기말 + 24.12월 기말) / 2 - 하지만 24.12 데이터가 없으므로 전년 1월만 사용
    const avgReceivablesYoY = d.receivables.previousYear;  // 전년 1월 잔액
    const avgInventoryYoY = d.inventory.previousYear;
    const avgPayablesYoY = d.payables.previousYear;

    // 연환산: 월 매출/원가를 12배하여 연간으로 환산
    const receivablesTurnover = {
      current: (d.revenue.current * 12) / avgReceivables,
      previousYear: (d.revenue.previousYear * 12) / avgReceivablesYoY
    };
    const dso = {
      current: 365 / receivablesTurnover.current,
      previousYear: 365 / receivablesTurnover.previousYear
    };

    const inventoryTurnover = {
      current: (d.cogs.current * 12) / avgInventory,
      previousYear: (d.cogs.previousYear * 12) / avgInventoryYoY
    };
    const dio = {
      current: 365 / inventoryTurnover.current,
      previousYear: 365 / inventoryTurnover.previousYear
    };

    const payablesTurnover = {
      current: (d.cogs.current * 12) / avgPayables,
      previousYear: (d.cogs.previousYear * 12) / avgPayablesYoY
    };
    const dpo = {
      current: 365 / payablesTurnover.current,
      previousYear: 365 / payablesTurnover.previousYear
    };

    const ccc = {
      current: dso.current + dio.current - dpo.current,
      previousYear: dso.previousYear + dio.previousYear - dpo.previousYear
    };

    // ROE, ROA - 연환산 기준 (월 영업이익을 12배하여 연간으로 환산)
    const avgEquity = (d.equity.current + d.equity.previousMonth) / 2;
    const avgAssets = (d.totalAssets.current + d.totalAssets.previousMonth) / 2;
    const avgEquityYoY = d.equity.previousYear;  // 전년 1월 자본
    const avgAssetsYoY = d.totalAssets.previousYear;  // 전년 1월 자산

    const netIncome = d.operatingProfit.current * 0.8 * 12;  // 월 영업이익 → 연환산 당기순이익
    const prevNetIncome = d.operatingProfit.previousYear * 0.8 * 12;

    const roe = {
      current: (netIncome / avgEquity * 100),
      previousYear: (prevNetIncome / avgEquityYoY * 100)
    };
    const roa = {
      current: (netIncome / avgAssets * 100),
      previousYear: (prevNetIncome / avgAssetsYoY * 100)
    };

    return {
      // MoM (Month-over-Month): 전월 대비
      revenueMomGrowth: calcGrowth(d.revenue.current, d.revenue.previousMonth),
      assetMomGrowth: calcGrowth(d.totalAssets.current, d.totalAssets.previousMonth),
      cashMomGrowth: calcGrowth(d.cash.current, d.cash.previousMonth),

      // YoY (Year-over-Year): 전년동월 대비
      revenueYoyGrowth: calcGrowth(d.revenue.current, d.revenue.previousYear),
      opProfitYoyGrowth: calcGrowth(d.operatingProfit.current, d.operatingProfit.previousYear),
      assetYoyGrowth: calcGrowth(d.totalAssets.current, d.totalAssets.previousYear),
      liabilityYoyGrowth: calcGrowth(d.totalLiabilities.current, d.totalLiabilities.previousYear),
      equityYoyGrowth: calcGrowth(d.equity.current, d.equity.previousYear),
      exportYoyGrowth: calcGrowth(d.exportRevenue.current, d.exportRevenue.previousYear),
      domesticYoyGrowth: calcGrowth(d.domesticRevenue.current, d.domesticRevenue.previousYear),
      receivablesYoyGrowth: calcGrowth(d.receivables.current, d.receivables.previousYear),
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

  const formatNumber = (num: number) => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '-';
    return num.toLocaleString('ko-KR');
  };
  const formatPercent = (num: number) => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '-';
    return num.toFixed(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* KPI Cards - 심플하고 고급스러운 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">실판매출(V-) (1~{month}월)</p>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(d.revenue.current)}억</p>
            <p className={`text-xs mt-1 font-medium ${m.revenueYoyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.revenueYoyGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.revenueYoyGrowth).toFixed(1)}% YoY
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
              {m.opProfitYoyGrowth >= 0 ? '▲' : '▼'} {Math.abs(m.opProfitYoyGrowth).toFixed(1)}% YoY
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
            <p className="text-2xl font-bold text-slate-800">{formatNumber(d.totalAssets.current)}억</p>
            <p className={`text-xs mt-1 font-medium ${m.assetYoyGrowth && m.assetYoyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.assetYoyGrowth && (m.assetYoyGrowth >= 0 ? '▲' : '▼')} {m.assetYoyGrowth ? Math.abs(m.assetYoyGrowth).toFixed(1) : '0.0'}% YoY
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
            <p className={`text-xs mt-1 font-medium ${m.liabilityYoyGrowth && m.liabilityYoyGrowth <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.liabilityYoyGrowth && (m.liabilityYoyGrowth >= 0 ? '▲' : '▼')} {m.liabilityYoyGrowth ? Math.abs(m.liabilityYoyGrowth).toFixed(1) : '0.0'}% YoY
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
            <p className="text-2xl font-bold text-slate-800">{formatNumber(d.equity.current)}억</p>
            <p className={`text-xs mt-1 font-medium ${m.equityYoyGrowth && m.equityYoyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.equityYoyGrowth && (m.equityYoyGrowth >= 0 ? '▲' : '▼')} {m.equityYoyGrowth ? Math.abs(m.equityYoyGrowth).toFixed(1) : '0.0'}% YoY
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
                  <span>실판매출(V-) {formatNumber(d.revenue.previousYear)}억 → {formatNumber(d.revenue.current)}억 <span className="text-emerald-500 font-medium">({m.revenueYoyGrowth > 0 ? '+' : ''}{formatPercent(m.revenueYoyGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>영업이익 {formatNumber(d.operatingProfit.previousYear)}억 → {formatNumber(d.operatingProfit.current)}억 <span className="text-emerald-500 font-medium">({m.opProfitYoyGrowth > 0 ? '+' : ''}{formatPercent(m.opProfitYoyGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>영업이익률 {formatPercent(m.opMargin.previousYear)}% → {formatPercent(m.opMargin.current)}% ({(m.opMargin.current - m.opMargin.previousYear) > 0 ? '+' : ''}{formatPercent(m.opMargin.current - m.opMargin.previousYear)}%p)</span>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-semibold text-blue-600 mb-2">수출 매출 고성장</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>수출매출 {formatNumber(d.exportRevenue.previousYear)}억 → {formatNumber(d.exportRevenue.current)}억 <span className="text-emerald-500 font-medium">({m.exportYoyGrowth > 0 ? '+' : ''}{formatPercent(m.exportYoyGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>수출 비중 {formatPercent(m.exportRatio.previousYear)}% → {formatPercent(m.exportRatio.current)}% ({(m.exportRatio.current - m.exportRatio.previousYear) > 0 ? '+' : ''}{formatPercent(m.exportRatio.current - m.exportRatio.previousYear)}%p)</span>
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
                  <span>총자산: {(d.totalAssets.previousMonth/10000).toFixed(2)}조 → {(d.totalAssets.current/10000).toFixed(2)}조 ({(d.totalAssets.current - d.totalAssets.previousMonth) > 0 ? '+' : ''}{formatNumber(d.totalAssets.current - d.totalAssets.previousMonth)}억, {m.assetMomGrowth > 0 ? '+' : ''}{formatPercent(m.assetMomGrowth)}%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>현금: {formatNumber(d.cash.previousMonth)}억 → {formatNumber(d.cash.current)}억 <span className="text-emerald-500 font-medium">({(d.cash.current - d.cash.previousMonth) > 0 ? '+' : ''}{formatNumber(d.cash.current - d.cash.previousMonth)}억, {m.cashMomGrowth > 0 ? '+' : ''}{formatPercent(m.cashMomGrowth)}%)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>재고자산: {formatNumber(d.inventory.previousMonth)}억 → {formatNumber(d.inventory.current)}억 ({d.inventory.current - d.inventory.previousMonth > 0 ? '+' : ''}{formatNumber(d.inventory.current - d.inventory.previousMonth)}억)</span>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-semibold text-emerald-600 mb-2">무차입 경영 유지</p>
              <ul className="space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>총부채: {formatNumber(d.totalLiabilities.previousMonth)}억 → {formatNumber(d.totalLiabilities.current)}억 ({(d.totalLiabilities.current - d.totalLiabilities.previousMonth) > 0 ? '+' : ''}{formatNumber(d.totalLiabilities.current - d.totalLiabilities.previousMonth)}억)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>차입금: <span className="font-semibold text-emerald-600">{formatNumber(d.borrowings.current)}원</span> (무차입 경영 유지)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>부채비율: {formatPercent(m.debtRatio.previousYear)}% → {formatPercent(m.debtRatio.current)}% <span className="text-emerald-500 font-medium">({(m.debtRatio.current - m.debtRatio.previousYear) > 0 ? '+' : ''}{formatPercent(m.debtRatio.current - m.debtRatio.previousYear)}%p)</span></span>
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
            <RatioCard label="매출총이익률" value={m.grossMargin.current} previousValue={m.grossMargin.previousYear} />
            <RatioCard label="영업이익률" value={m.opMargin.current} previousValue={m.opMargin.previousYear} />
            <RatioCard label="ROE" value={m.roe.current} previousValue={m.roe.previousYear} />
            <RatioCard label="ROA" value={m.roa.current} previousValue={m.roa.previousYear} />
            <RatioCard label="수출비중" value={m.exportRatio.current} previousValue={m.exportRatio.previousYear} />
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
            <RatioCard label="부채비율" value={m.debtRatio.current} previousValue={m.debtRatio.previousYear} positiveGood={false} />
            <RatioCard label="자기자본비율" value={m.equityRatio.current} previousValue={m.equityRatio.previousYear} />
            <RatioCard label="순차입금비율" value={m.netDebtRatio.current} previousValue={m.netDebtRatio.previousYear} positiveGood={false} />
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
            <RatioCard label="매출채권회전율" value={m.receivablesTurnover.current} previousValue={m.receivablesTurnover.previousYear} format="times" />
            <RatioCard label="DSO (매출채권)" value={m.dso.current} previousValue={m.dso.previousYear} format="days" positiveGood={false} />
            <RatioCard label="재고자산회전율" value={m.inventoryTurnover.current} previousValue={m.inventoryTurnover.previousYear} format="times" />
            <RatioCard label="DIO (재고)" value={m.dio.current} previousValue={m.dio.previousYear} format="days" positiveGood={false} />
            <RatioCard label="DPO (매입채무)" value={m.dpo.current} previousValue={m.dpo.previousYear} format="days" />
            <RatioCard label="CCC (현금전환주기)" value={m.ccc.current} previousValue={m.ccc.previousYear} format="days" positiveGood={false} />
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
              <h4 className="font-semibold text-white mb-2">수익성 지표 (연환산)</h4>
              <ul className="space-y-1">
                <li>• 매출총이익률 = (매출액-매출원가) ÷ 매출액 × 100</li>
                <li>• 영업이익률 = 영업이익 ÷ 매출액 × 100</li>
                <li>• ROE = (월영업이익 × 0.8 × 12) ÷ 평균자기자본 × 100</li>
                <li>• ROA = (월영업이익 × 0.8 × 12) ÷ 평균총자산 × 100</li>
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
              <h4 className="font-semibold text-white mb-2">활동성 지표 (연환산)</h4>
              <ul className="space-y-1">
                <li>• 매출채권회전율 = (월매출액 × 12) ÷ 평균매출채권</li>
                <li>• 재고자산회전율 = (월매출원가 × 12) ÷ 평균재고자산</li>
                <li>• 매입채무회전율 = (월매출원가 × 12) ÷ 평균매입채무</li>
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

'use client';

import React, { useState } from 'react';
import { useReport } from '@/components/providers/ReportContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FXReportPage() {
  const { reportData, isLoading } = useReport();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CNY');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!reportData || !reportData.fxReport) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-gray-500">외환리포트 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { fxReport, meta } = reportData;
  const { summary, positions, rateRanges, rateTrends, sensitivity, transactions, valuations, insights, warnings } = fxReport;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const formatRate = (rate: number) => rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const formatBillion = (num: number) => (num / 100000000).toFixed(1);
  const getGainLossColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 bg-emerald-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };
  const getGainLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    if (value < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return null;
  };
  const getRateChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // 환율 상승 = 원화 약세
    if (change < 0) return 'text-blue-600'; // 환율 하락 = 원화 강세
    return 'text-slate-600';
  };

  // 12개월 환율 추세 차트 데이터 (선택된 통화)
  const trendChartData = rateTrends?.map(t => ({
    month: t.displayMonth,
    date: t.date,
    rate: (t as any)[selectedCurrency] || 0
  })).filter(t => t.rate > 0) || [];

  // Y축 동적 범위 계산 (더 드라마틱하게)
  const rates = trendChartData.map(d => d.rate).filter(r => r > 0);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const range = maxRate - minRate;
  const yAxisDomain = [
    Math.floor(minRate - range * 0.2),
    Math.ceil(maxRate + range * 0.2)
  ];

  // X축 틱 인덱스 (월별 첫 거래일만)
  const monthlyTickIndexes = trendChartData
    .map((d, idx) => (d.month ? idx : null))
    .filter(idx => idx !== null) as number[];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">외환리포트</h1>
          <p className="text-slate-500 mt-1">
            {meta.year}년 {meta.month}월 외환차손익 및 외화평가손익 분석
          </p>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* 외화 잔액 현황 (월말) - 새로 추가 */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              외화 잔액 현황 (월말)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">{meta.year}년 {meta.month}월말</p>
            <div className="space-y-3">
              {['CNY', 'USD'].map(curr => {
                const vals = valuations.filter(v => v.currency === curr);
                const receivables = vals.filter(v => v.type === 'receivable');
                const payables = vals.filter(v => v.type === 'payable');
                const deposits = vals.filter(v => v.type === 'deposit');

                // 대표 환율 (채권 우선, 없으면 예금)
                const mainItem = receivables[0] || deposits[0] || payables[0];
                if (!mainItem) return null;

                const currName = curr === 'CNY' ? '위안' : '달러';

                return (
                  <div key={curr} className="border-b border-slate-200 pb-2 last:border-0">
                    <div className="font-semibold text-slate-800 mb-1.5">{curr}</div>

                    {/* 채권 */}
                    {receivables.map((r, idx) => (
                      <div key={`r-${idx}`} className="flex justify-between text-sm">
                        <span className="text-slate-600">채권</span>
                        <span className="font-medium">
                          {(r.fxBalance / 1000000).toFixed(1)}M {currName}
                        </span>
                      </div>
                    ))}

                    {/* 채무 */}
                    {payables.map((p, idx) => (
                      <div key={`p-${idx}`} className="flex justify-between text-sm">
                        <span className="text-slate-600">채무</span>
                        <span className="font-medium text-red-600">
                          {(Math.abs(p.fxBalance) / 1000000).toFixed(1)}M {currName}
                        </span>
                      </div>
                    ))}

                    {/* 예금 */}
                    {deposits.map((d, idx) => (
                      <div key={`d-${idx}`} className="flex justify-between text-sm">
                        <span className="text-slate-600">예금</span>
                        <span className="font-medium text-blue-600">
                          {(d.fxBalance / 1000000).toFixed(1)}M {currName}
                        </span>
                      </div>
                    ))}

                    {/* 장부환율 */}
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>장부환율</span>
                      <span>{mainItem.bookRate.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 거래 손익 - CNY, USD, HKD 상세 + 기타 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">외환차손익 (실현)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold mb-2 ${summary.transactionGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.transactionGainLoss >= 0 ? '+' : ''}{(summary.transactionGainLoss / 100000000).toFixed(1)}억
            </p>
            <div className="space-y-2">
              {['CNY', 'USD', 'HKD'].map(curr => {
                const trans = transactions.filter(t => t.currency === curr);
                const mainTrans = trans.reduce((max, t) =>
                  Math.abs(t.settlementAmountKRW) > Math.abs(max?.settlementAmountKRW || 0) ? t : max, trans[0]
                );
                const totalGainLoss = trans.reduce((sum, t) => sum + t.fxGainLoss, 0);
                const isMajor = ['CNY', 'USD'].includes(curr);

                return mainTrans ? (
                  <div key={curr}>
                    <div className={`flex justify-between items-center ${isMajor ? 'text-sm' : 'text-xs'}`}>
                      <span className={`${isMajor ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        {curr} {mainTrans.type === 'receivable' ? '채권' : '채무'} {(Math.abs(mainTrans.settlementAmountKRW) / 100000000).toFixed(1)}억
                      </span>
                      <span className={`${isMajor ? 'font-bold text-base' : 'font-semibold text-sm'} ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'} whitespace-nowrap`}>
                        {totalGainLoss >= 0 ? '+' : ''}{(totalGainLoss / 100000000).toFixed(1)}억
                      </span>
                    </div>
                    <div className={`${isMajor ? 'text-xs' : 'text-[10px]'} text-slate-600 mt-0.5`}>
                      장부 {mainTrans.bookRate.toFixed(1)} → 결제 {mainTrans.settlementRate.toFixed(1)}
                    </div>
                  </div>
                ) : null;
              })}
              {(() => {
                const otherTrans = transactions.filter(t => !['CNY', 'USD', 'HKD'].includes(t.currency));
                const otherTotal = otherTrans.reduce((sum, t) => sum + t.fxGainLoss, 0);
                const otherKRW = otherTrans.reduce((sum, t) => sum + Math.abs(t.settlementAmountKRW), 0);

                return otherTotal !== 0 ? (
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                    <span className="text-slate-700">
                      기타 {(otherKRW / 100000000).toFixed(1)}억
                    </span>
                    <span className={`font-semibold ${otherTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {otherTotal >= 0 ? '+' : ''}{(otherTotal / 100000000).toFixed(1)}억
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 평가 손익 - CNY, USD, HKD 상세 + 기타 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">외화평가손익 (미실현)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold mb-2 ${summary.valuationGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.valuationGainLoss >= 0 ? '+' : ''}{(summary.valuationGainLoss / 100000000).toFixed(1)}억
            </p>
            <div className="space-y-2">
              {['CNY', 'USD', 'HKD'].map(curr => {
                const vals = valuations.filter(v => v.currency === curr);
                const totalGainLoss = vals.reduce((sum, v) => sum + v.valuationGainLoss, 0);
                const receivables = vals.filter(v => v.type === 'receivable');
                const deposits = vals.filter(v => v.type === 'deposit');
                const payables = vals.filter(v => v.type === 'payable');
                const isMajor = ['CNY', 'USD'].includes(curr);

                if (vals.length === 0) return null;

                // 대표 환율 (채권 또는 예금 중 금액이 큰 것)
                const mainItem = [...receivables, ...deposits].reduce((max, v) =>
                  Math.abs(v.valuationAmountKRW) > Math.abs(max?.valuationAmountKRW || 0) ? v : max,
                  receivables[0] || deposits[0]
                );

                return (
                  <div key={curr}>
                    <div className={`flex justify-between items-center ${isMajor ? 'text-sm' : 'text-xs'}`}>
                      <div className={`${isMajor ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        <div className="mb-0.5">{curr}</div>
                        <div className="text-[10px] text-slate-500">
                          {receivables.length > 0 && `채권 ${(receivables.reduce((s, v) => s + Math.abs(v.valuationAmountKRW), 0) / 100000000).toFixed(1)}억`}
                          {deposits.length > 0 && (receivables.length > 0 ? ' / ' : '')}
                          {deposits.length > 0 && `예금 ${(deposits.reduce((s, v) => s + Math.abs(v.valuationAmountKRW), 0) / 100000000).toFixed(1)}억`}
                        </div>
                      </div>
                      <span className={`${isMajor ? 'font-bold text-base' : 'font-semibold text-sm'} ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'} whitespace-nowrap`}>
                        {totalGainLoss >= 0 ? '+' : ''}{(totalGainLoss / 100000000).toFixed(1)}억
                      </span>
                    </div>
                    {mainItem && (
                      <div className={`${isMajor ? 'text-xs' : 'text-[10px]'} text-slate-600 mt-0.5`}>
                        장부 {mainItem.bookRate.toFixed(1)} → 기말 {mainItem.endRate.toFixed(1)}
                      </div>
                    )}
                  </div>
                );
              })}
              {(() => {
                const otherVals = valuations.filter(v => !['CNY', 'USD', 'HKD'].includes(v.currency));
                const otherTotal = otherVals.reduce((sum, v) => sum + v.valuationGainLoss, 0);
                const otherKRW = otherVals.reduce((sum, v) => sum + Math.abs(v.valuationAmountKRW), 0);

                return otherTotal !== 0 ? (
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                    <span className="text-slate-700">
                      기타 {(otherKRW / 100000000).toFixed(1)}억
                    </span>
                    <span className={`font-semibold ${otherTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {otherTotal >= 0 ? '+' : ''}{(otherTotal / 100000000).toFixed(1)}억
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 총 손익 */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">총 외환손익</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold mb-3 ${summary.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.totalGainLoss >= 0 ? '+' : ''}{(summary.totalGainLoss / 100000000).toFixed(1)}억
            </p>
            <div className="space-y-2">
              {['CNY', 'USD', 'HKD'].map(curr => {
                const transGainLoss = transactions
                  .filter(t => t.currency === curr)
                  .reduce((sum, t) => sum + t.fxGainLoss, 0);
                const valGainLoss = valuations
                  .filter(v => v.currency === curr)
                  .reduce((sum, v) => sum + v.valuationGainLoss, 0);
                const total = transGainLoss + valGainLoss;
                const isMajor = ['CNY', 'USD'].includes(curr);

                return (
                  <div key={curr} className="flex justify-between items-center">
                    <span className={`${isMajor ? 'text-base font-bold' : 'text-sm font-semibold'} text-slate-800`}>{curr}</span>
                    <span className={`${isMajor ? 'text-lg font-bold' : 'text-base font-semibold'} ${total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {total >= 0 ? '+' : ''}{(total / 100000000).toFixed(1)}억
                    </span>
                  </div>
                );
              })}
              {(() => {
                const otherTrans = transactions.filter(t => !['CNY', 'USD', 'HKD'].includes(t.currency));
                const otherVals = valuations.filter(v => !['CNY', 'USD', 'HKD'].includes(v.currency));
                const otherTransTotal = otherTrans.reduce((sum, t) => sum + t.fxGainLoss, 0);
                const otherValTotal = otherVals.reduce((sum, v) => sum + v.valuationGainLoss, 0);
                const otherTotal = otherTransTotal + otherValTotal;
                const otherKRW = otherTrans.reduce((sum, t) => sum + Math.abs(t.settlementAmountKRW), 0) +
                                 otherVals.reduce((sum, v) => sum + Math.abs(v.valuationAmountKRW), 0);

                return otherTotal !== 0 ? (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-sm text-slate-700">기타 {(otherKRW / 100000000).toFixed(1)}억</span>
                    <span className={`text-base font-semibold ${otherTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {otherTotal >= 0 ? '+' : ''}{(otherTotal / 100000000).toFixed(1)}억
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 환율 검증 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">장부환율 검증</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-xs text-slate-500 mb-3">{meta.year}년 {meta.month}월</p>
            <div className="space-y-4">
              {['CNY', 'USD', 'HKD'].map(curr => {
                const range = rateRanges?.find(r => r.currency === curr);
                if (!range) return null;

                const trans = transactions.filter(t => t.currency === curr);
                const vals = valuations.filter(v => v.currency === curr);

                // 대표 거래/평가 환율 추출
                const mainTrans = trans.reduce((max, t) =>
                  Math.abs(t.fxGainLoss) > Math.abs(max?.fxGainLoss || 0) ? t : max, trans[0]
                );
                const mainVal = vals.reduce((max, v) =>
                  Math.abs(v.valuationGainLoss) > Math.abs(max?.valuationGainLoss || 0) ? v : max, vals[0]
                );

                const bookRate = mainVal?.bookRate || 0;
                const settlementRate = mainTrans?.settlementRate || 0;

                // 막대그래프용 위치 계산 (백분율)
                const rangeSpan = range.max - range.min;
                const bookPos = ((bookRate - range.min) / rangeSpan) * 100;
                const settlePos = ((settlementRate - range.min) / rangeSpan) * 100;

                const isMajor = ['CNY', 'USD'].includes(curr);

                return (
                  <div key={curr}>
                    <div className={`flex justify-between mb-1 ${isMajor ? 'text-sm font-bold' : 'text-xs font-semibold'}`}>
                      <span className="text-slate-900">{curr}</span>
                      <span className="text-slate-600">{range.min.toFixed(1)} ~ {range.max.toFixed(1)}</span>
                    </div>
                    <div className="relative h-8 bg-slate-100 rounded-md overflow-hidden">
                      {/* 장부환율 마커 */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
                        style={{ left: `${bookPos}%` }}
                        title={`장부 ${bookRate.toFixed(1)}`}
                      >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-blue-600 whitespace-nowrap">
                          장부 {bookRate.toFixed(1)}
                        </div>
                      </div>
                      {/* 결제환율 마커 */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                        style={{ left: `${settlePos}%` }}
                        title={`결제 ${settlementRate.toFixed(1)}`}
                      >
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-red-600 whitespace-nowrap">
                          결제 {settlementRate.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 인사이트 & 환율 추세 (나란히) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {/* 왼쪽: 인사이트 & 주의사항 */}
        <div className="space-y-1">
          {/* 긍정 인사이트 */}
          {insights && insights.length > 0 && (
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-0 pt-1 px-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  주요 인사이트
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-1 pt-0 px-2">
                <ul className="space-y-0">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-1.5 leading-tight">
                      <span className="text-emerald-600">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 주의사항 */}
          {warnings && warnings.length > 0 && (
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-0 pt-1 px-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  주의사항
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-1 pt-0 px-2">
                <ul className="space-y-0">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-1.5 leading-tight">
                      <span className="text-amber-600">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 환율 민감도 분석 (±5%) */}
          <div className="grid grid-cols-4 gap-1.5">
            {['CNY', 'USD'].map(curr => {
              // 해당 통화의 총 외화 잔액 계산
              const currValuations = valuations.filter(v => v.currency === curr);
              const totalFxBalance = currValuations.reduce((sum, v) => sum + v.fxBalance, 0);
              const currentEndRate = currValuations[0]?.endRate || 0;

              // ±5% 환율 변동 시 평가금액 변동
              const impactDown = (totalFxBalance * currentEndRate * -0.05) / 100000000;
              const impactUp = (totalFxBalance * currentEndRate * 0.05) / 100000000;

              return (
                <React.Fragment key={curr}>
                  {/* -5% 카드 */}
                  <Card className="border-l-2 border-l-red-400">
                    <CardContent className="pt-1 pb-1 px-2">
                      <div className="text-[13px] text-slate-700 font-semibold mb-0.5">{curr} -5%</div>
                      <div className={`text-sm font-bold ${impactDown >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {impactDown >= 0 ? '+' : ''}{impactDown.toFixed(1)}억
                      </div>
                    </CardContent>
                  </Card>

                  {/* +5% 카드 */}
                  <Card className="border-l-2 border-l-emerald-400">
                    <CardContent className="pt-1 pb-1 px-2">
                      <div className="text-[13px] text-slate-700 font-semibold mb-0.5">{curr} +5%</div>
                      <div className={`text-sm font-bold ${impactUp >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {impactUp >= 0 ? '+' : ''}{impactUp.toFixed(1)}억
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 환율 추세 그래프 */}
        {rateTrends && rateTrends.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-2">
              <div className="flex items-center justify-between">
                <CardTitle>환율 추세 (최근 12개월)</CardTitle>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">CNY (중국 위안)</SelectItem>
                    <SelectItem value="USD">USD (미국 달러)</SelectItem>
                    <SelectItem value="HKD">HKD (홍콩 달러)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pb-1">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    ticks={monthlyTickIndexes.map(idx => trendChartData[idx].date)}
                    tickFormatter={(value, index) => {
                      const item = trendChartData.find(d => d.date === value);
                      return item?.month || '';
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{ value: `${selectedCurrency} 환율`, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    domain={yAxisDomain}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: number) => value.toFixed(1)}
                    labelFormatter={(label) => label}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name={`${selectedCurrency} 환율`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 1. 외화 포지션 현황 */}
      {positions && positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>외화 포지션 현황 (기말 vs 현재)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="align-middle">통화</TableHead>
                  <TableHead colSpan={2} className="text-center border-r">채권</TableHead>
                  <TableHead colSpan={2} className="text-center border-r">채무</TableHead>
                  <TableHead colSpan={2} className="text-center border-r">예금</TableHead>
                  <TableHead colSpan={2} className="text-center border-r">순포지션</TableHead>
                  <TableHead colSpan={3} className="text-center">환율</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right">외화</TableHead>
                  <TableHead className="text-right border-r">원화(억)</TableHead>
                  <TableHead className="text-right">외화</TableHead>
                  <TableHead className="text-right border-r">원화(억)</TableHead>
                  <TableHead className="text-right">외화</TableHead>
                  <TableHead className="text-right border-r">원화(억)</TableHead>
                  <TableHead className="text-right">외화</TableHead>
                  <TableHead className="text-right border-r">원화(억)</TableHead>
                  <TableHead className="text-right">기말</TableHead>
                  <TableHead className="text-right">현재</TableHead>
                  <TableHead className="text-right">변동</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {pos.currency}
                      <span className="text-xs text-slate-500 ml-1">({pos.currencyName})</span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(Math.round(pos.receivableFX))}</TableCell>
                    <TableCell className="text-right border-r font-medium">{formatBillion(pos.receivableKRW)}</TableCell>
                    <TableCell className="text-right">{formatNumber(Math.round(Math.abs(pos.payableFX)))}</TableCell>
                    <TableCell className="text-right border-r font-medium">{formatBillion(Math.abs(pos.payableKRW))}</TableCell>
                    <TableCell className="text-right">{pos.depositFX ? formatNumber(Math.round(pos.depositFX)) : '-'}</TableCell>
                    <TableCell className="text-right border-r font-medium">{pos.depositKRW ? formatBillion(pos.depositKRW) : '-'}</TableCell>
                    <TableCell className={`text-right font-bold ${pos.netFX >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatNumber(Math.round(pos.netFX))}
                    </TableCell>
                    <TableCell className={`text-right border-r font-bold ${pos.netKRW >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatBillion(pos.netKRW)}
                    </TableCell>
                    <TableCell className="text-right">{formatRate(pos.endRate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatRate(pos.currentRate)}</TableCell>
                    <TableCell className={`text-right ${getRateChangeColor(pos.rateChange)}`}>
                      {pos.rateChange >= 0 ? <ArrowUpRight className="inline h-4 w-4" /> : <ArrowDownRight className="inline h-4 w-4" />}
                      {Math.abs(pos.rateChangePercent).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>참고:</strong> 순포지션 = 채권 - 채무 + 예금 (양수: 외화자산 초과, 음수: 외화부채 초과)
                <br />
                환율 상승(원화 약세) 시: 외화자산 초과 → 평가이익 발생
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* 3. 민감도 분석 (±5% 환율 변동) */}
      {sensitivity && sensitivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>민감도 분석 (±5% 환율 변동 시 평가손익 영향)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>통화</TableHead>
                  <TableHead className="text-right">순포지션 외화</TableHead>
                  <TableHead className="text-right">기준 환율</TableHead>
                  <TableHead className="text-right">기준 원화(억)</TableHead>
                  <TableHead className="text-center border-x bg-emerald-50" colSpan={2}>+5% 환율 상승</TableHead>
                  <TableHead className="text-center bg-blue-50" colSpan={2}>-5% 환율 하락</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right bg-emerald-50">환율</TableHead>
                  <TableHead className="text-right border-r bg-emerald-50">평가손익</TableHead>
                  <TableHead className="text-right bg-blue-50">환율</TableHead>
                  <TableHead className="text-right bg-blue-50">평가손익</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensitivity.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {s.currency}
                      <span className="text-xs text-slate-500 ml-1">({s.currencyName})</span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(Math.round(s.netFX))}</TableCell>
                    <TableCell className="text-right">{formatRate(s.baseRate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatBillion(s.baseKRW)}</TableCell>
                    <TableCell className="text-right bg-emerald-50">{formatRate(s.plus5PercentRate)}</TableCell>
                    <TableCell className="text-right border-r bg-emerald-50">
                      <span className={s.plus5PercentImpact >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {s.plus5PercentImpact >= 0 ? '+' : ''}{formatBillion(s.plus5PercentImpact)}억
                      </span>
                    </TableCell>
                    <TableCell className="text-right bg-blue-50">{formatRate(s.minus5PercentRate)}</TableCell>
                    <TableCell className="text-right bg-blue-50">
                      <span className={s.minus5PercentImpact >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {s.minus5PercentImpact >= 0 ? '+' : ''}{formatBillion(s.minus5PercentImpact)}억
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-800">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                <strong>민감도 해석:</strong> CNY 순포지션이 양수(+)이므로, CNY 환율 상승(원화 약세) 시 평가이익 발생.
                USD/HKD가 음수(-)이면 환율 상승 시 평가손실 발생.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. 거래 외환손익 상세 (통화별) */}
      <Card>
        <CardHeader>
          <CardTitle>외환차손익 (거래 - 실현)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">채권 결제</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>통화</TableHead>
                    <TableHead className="text-right">외화 금액</TableHead>
                    <TableHead className="text-right">원화 장부금액(억)</TableHead>
                    <TableHead className="text-right">원화 결제금액(억)</TableHead>
                    <TableHead className="text-right">장부 환율</TableHead>
                    <TableHead className="text-right">결제 환율</TableHead>
                    <TableHead className="text-right">환율 차이</TableHead>
                    <TableHead className="text-right">외환손익(억)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === 'receivable').map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {t.currency}
                        <span className="text-xs text-slate-500 ml-1">({t.currencyName})</span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(Math.round(t.fxAmount))}</TableCell>
                      <TableCell className="text-right">{formatBillion(t.bookAmountKRW)}</TableCell>
                      <TableCell className="text-right">{formatBillion(t.settlementAmountKRW)}</TableCell>
                      <TableCell className="text-right">{formatRate(t.bookRate)}</TableCell>
                      <TableCell className="text-right">{formatRate(t.settlementRate)}</TableCell>
                      <TableCell className={`text-right ${t.settlementRate - t.bookRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.settlementRate - t.bookRate >= 0 ? '+' : ''}{formatRate(t.settlementRate - t.bookRate)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getGainLossColor(t.fxGainLoss)}`}>
                        {t.fxGainLoss >= 0 ? '+' : ''}{formatBillion(t.fxGainLoss)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {transactions.filter(t => t.type === 'payable').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">채무 결제</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>통화</TableHead>
                      <TableHead className="text-right">외화 금액</TableHead>
                      <TableHead className="text-right">원화 장부금액(억)</TableHead>
                      <TableHead className="text-right">원화 결제금액(억)</TableHead>
                      <TableHead className="text-right">장부 환율</TableHead>
                      <TableHead className="text-right">결제 환율</TableHead>
                      <TableHead className="text-right">환율 차이</TableHead>
                      <TableHead className="text-right">외환손익(억)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.filter(t => t.type === 'payable').map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {t.currency}
                          <span className="text-xs text-slate-500 ml-1">({t.currencyName})</span>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(Math.round(Math.abs(t.fxAmount)))}</TableCell>
                        <TableCell className="text-right">{formatBillion(Math.abs(t.bookAmountKRW))}</TableCell>
                        <TableCell className="text-right">{formatBillion(Math.abs(t.settlementAmountKRW))}</TableCell>
                        <TableCell className="text-right">{formatRate(t.bookRate)}</TableCell>
                        <TableCell className="text-right">{formatRate(t.settlementRate)}</TableCell>
                        <TableCell className={`text-right ${t.settlementRate - t.bookRate >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {t.settlementRate - t.bookRate >= 0 ? '+' : ''}{formatRate(t.settlementRate - t.bookRate)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getGainLossColor(t.fxGainLoss)}`}>
                          {t.fxGainLoss >= 0 ? '+' : ''}{formatBillion(t.fxGainLoss)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. 외화평가손익 상세 (통화별) */}
      <Card>
        <CardHeader>
          <CardTitle>외화평가손익 (잔액 - 미실현)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">채권 잔액</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>통화</TableHead>
                    <TableHead className="text-right">외화 잔액</TableHead>
                    <TableHead className="text-right">원화 장부금액(억)</TableHead>
                    <TableHead className="text-right">원화 평가금액(억)</TableHead>
                    <TableHead className="text-right">장부 환율</TableHead>
                    <TableHead className="text-right">기말 환율</TableHead>
                    <TableHead className="text-right">외화평가손익(억)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuations.filter(v => v.type === 'receivable').map((v, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {v.currency}
                        <span className="text-xs text-slate-500 ml-1">({v.currencyName})</span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(Math.round(v.fxBalance))}</TableCell>
                      <TableCell className="text-right">{formatBillion(v.bookAmountKRW)}</TableCell>
                      <TableCell className="text-right">{formatBillion(v.valuationAmountKRW)}</TableCell>
                      <TableCell className="text-right">{formatRate(v.bookRate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatRate(v.endRate)}</TableCell>
                      <TableCell className={`text-right font-semibold ${getGainLossColor(v.valuationGainLoss)}`}>
                        {v.valuationGainLoss >= 0 ? '+' : ''}{formatBillion(v.valuationGainLoss)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">채무 잔액</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>통화</TableHead>
                    <TableHead className="text-right">외화 잔액</TableHead>
                    <TableHead className="text-right">원화 장부금액(억)</TableHead>
                    <TableHead className="text-right">원화 평가금액(억)</TableHead>
                    <TableHead className="text-right">장부 환율</TableHead>
                    <TableHead className="text-right">기말 환율</TableHead>
                    <TableHead className="text-right">외화평가손익(억)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuations.filter(v => v.type === 'payable').map((v, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {v.currency}
                        <span className="text-xs text-slate-500 ml-1">({v.currencyName})</span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(Math.round(Math.abs(v.fxBalance)))}</TableCell>
                      <TableCell className="text-right">{formatBillion(Math.abs(v.bookAmountKRW))}</TableCell>
                      <TableCell className="text-right">{formatBillion(Math.abs(v.valuationAmountKRW))}</TableCell>
                      <TableCell className="text-right">{formatRate(v.bookRate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatRate(v.endRate)}</TableCell>
                      <TableCell className={`text-right font-semibold ${getGainLossColor(v.valuationGainLoss)}`}>
                        {v.valuationGainLoss >= 0 ? '+' : ''}{formatBillion(v.valuationGainLoss)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

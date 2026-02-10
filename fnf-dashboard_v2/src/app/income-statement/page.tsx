'use client';

import { useReport } from '@/components/providers/ReportContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// 브랜드별 색상 정의
const BRAND_COLORS: Record<string, string> = {
  'MLB': '#3B82F6',        // blue-500
  'Discovery': '#F97316',  // orange-500
  'MLB Kids': '#06B6D4',   // cyan-500
  'Duvetica': '#8B5CF6',   // violet-500
  '기타': '#6B7280',       // gray-500
};

export default function IncomeStatementPage() {
  const { reportData, isLoading } = useReport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-gray-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { incomeStatement, channelSales, exportSales, brandSales, financialData } = reportData;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const getChangeColor = (change: number, isCost: boolean = false) => {
    if (change === 0) return 'text-slate-500';
    if (isCost) return change > 0 ? 'text-red-500' : 'text-emerald-500';
    return change > 0 ? 'text-emerald-500' : 'text-red-500';
  };

  // 수익성 지표 계산 (MoM: 전월 대비)
  const grossMargin = ((financialData.revenue.current - financialData.cogs.current) / financialData.revenue.current * 100);
  const prevGrossMargin = financialData.revenue.previousMonth && financialData.cogs.previousMonth
    ? ((financialData.revenue.previousMonth - financialData.cogs.previousMonth) / financialData.revenue.previousMonth * 100)
    : 0;
  const opMargin = (financialData.operatingProfit.current / financialData.revenue.current * 100);
  const prevOpMargin = financialData.operatingProfit.previousMonth && financialData.revenue.previousMonth
    ? (financialData.operatingProfit.previousMonth / financialData.revenue.previousMonth * 100)
    : 0;
  const exportRatio = (financialData.exportRevenue.current / financialData.revenue.current * 100);
  const prevExportRatio = financialData.exportRevenue.previousMonth && financialData.revenue.previousMonth
    ? (financialData.exportRevenue.previousMonth / financialData.revenue.previousMonth * 100)
    : 0;

  // 채널별 합계
  const channelTotal = {
    current: channelSales.reduce((sum, c) => sum + c.current, 0),
    previous: channelSales.reduce((sum, c) => sum + c.previous, 0)
  };

  // 수출 합계
  const exportTotal = {
    current: exportSales.reduce((sum, e) => sum + e.current, 0),
    previous: exportSales.reduce((sum, e) => sum + e.previous, 0)
  };

  // 브랜드 합계
  const brandTotal = {
    current: brandSales.reduce((sum, b) => sum + b.current, 0),
    previous: brandSales.reduce((sum, b) => sum + b.previous, 0)
  };

  // 도넛 차트 데이터
  const prevYearChartData = brandSales.map(b => ({
    name: b.brand,
    value: b.prevRatio,
    color: BRAND_COLORS[b.brand] || '#6B7280',
    change: 0
  }));

  const currYearChartData = brandSales.map(b => ({
    name: b.brand,
    value: b.currentRatio,
    color: BRAND_COLORS[b.brand] || '#6B7280',
    change: b.currentRatio - b.prevRatio
  }));

  // 커스텀 레전드 렌더러
  type ChartDataItem = { name: string; value: number; color: string; change: number };
  const renderCustomLegend = (data: ChartDataItem[], showChange: boolean = false) => {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700">{entry.name} {entry.value.toFixed(1)}%</span>
            {showChange && (
              <span className={`text-xs font-medium ${entry.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ({entry.change >= 0 ? '+' : ''}{entry.change.toFixed(1)}%p)
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const month = reportData.meta.month;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 손익계산서 테이블 */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="bg-slate-800 text-white rounded-t-lg py-4">
          <CardTitle className="text-lg font-semibold">FNF 손익계산서 (1~{month}월 누계)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="w-[200px] text-slate-600 font-semibold">계정과목</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">당기 (억원)</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">전기 (억원)</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">증감</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">증감률</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">비율(%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 매출 섹션 */}
              <TableRow className="bg-emerald-50/50 border-0">
                <TableCell colSpan={5} className="font-semibold text-emerald-700 py-2">매출</TableCell>
              </TableRow>
              {incomeStatement.revenue.map((item: any, idx) => (
                <TableRow key={`rev-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className={`${idx <= 2 ? 'pl-6 font-medium text-slate-800' : 'pl-10 text-slate-600'}`}>{item.label}</TableCell>
                  <TableCell className="text-right font-medium text-slate-800">
                    {item.isPercentage ? `${item.current.toFixed(1)}%` : formatNumber(item.current)}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">
                    {item.isPercentage ? `${item.previous.toFixed(1)}%` : formatNumber(item.previous)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getChangeColor(item.change, item.label === '할인율')}`}>
                    {item.change > 0 ? '+' : ''}{item.isPercentage ? item.change.toFixed(1) + '%p' : formatNumber(item.change)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getChangeColor(item.changePercent, item.label === '할인율')}`}>
                    {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.ratio !== undefined ? `${item.ratio.toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}

              {/* 비용 섹션 */}
              <TableRow className="bg-red-50/50 border-0">
                <TableCell colSpan={5} className="font-semibold text-red-700 py-2">비용</TableCell>
              </TableRow>
              {incomeStatement.costs.map((item: any, idx) => (
                <TableRow key={`cost-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className={`${idx < 3 ? 'pl-6 font-medium text-slate-800' : 'pl-10 text-slate-600'}`}>
                    {item.label}
                    {item.note && <span className="text-xs text-amber-600 ml-2">({item.note})</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800">{formatNumber(item.current)}</TableCell>
                  <TableCell className="text-right text-slate-500">{formatNumber(item.previous)}</TableCell>
                  <TableCell className={`text-right font-medium ${getChangeColor(item.change, true)}`}>
                    {item.change > 0 ? '+' : ''}{formatNumber(item.change)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getChangeColor(item.changePercent, true)}`}>
                    {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.ratio !== undefined ? `${item.ratio.toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}

              {/* 매출총이익 */}
              <TableRow className="bg-emerald-50 border-t border-emerald-200">
                <TableCell className="pl-6 font-bold text-emerald-800 py-3">{incomeStatement.grossProfit.label}</TableCell>
                <TableCell className="text-right font-bold text-emerald-800 text-lg">{formatNumber(incomeStatement.grossProfit.current)}</TableCell>
                <TableCell className="text-right text-slate-500 font-medium">{formatNumber(incomeStatement.grossProfit.previous)}</TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {incomeStatement.grossProfit.change > 0 ? '+' : ''}{formatNumber(incomeStatement.grossProfit.change)}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {incomeStatement.grossProfit.changePercent > 0 ? '+' : ''}{incomeStatement.grossProfit.changePercent.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-800">
                  {incomeStatement.grossProfit.ratio?.toFixed(1)}%
                </TableCell>
              </TableRow>

              {/* 영업이익 */}
              <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                <TableCell className="pl-6 font-bold text-blue-800 py-3">
                  {incomeStatement.operatingProfit.label}
                  {incomeStatement.operatingProfit.note && (
                    <div className="text-xs text-amber-600 font-normal mt-1">
                      {incomeStatement.operatingProfit.note}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold text-blue-800 text-lg">{formatNumber(incomeStatement.operatingProfit.current)}</TableCell>
                <TableCell className="text-right text-slate-500 font-medium">{formatNumber(incomeStatement.operatingProfit.previous)}</TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {incomeStatement.operatingProfit.change > 0 ? '+' : ''}{formatNumber(incomeStatement.operatingProfit.change)}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {incomeStatement.operatingProfit.changePercent > 0 ? '+' : ''}{incomeStatement.operatingProfit.changePercent.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-bold text-blue-800">
                  {incomeStatement.operatingProfit.ratio?.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 수익성 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500 font-medium mb-1">매출총이익률</p>
            <p className="text-3xl font-bold text-slate-800">{grossMargin.toFixed(1)}%</p>
            <p className="text-sm text-slate-500 mt-1">
              전년 {prevGrossMargin.toFixed(1)}%
              <span className="text-emerald-500 font-medium ml-1">+{(grossMargin - prevGrossMargin).toFixed(1)}%p</span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500 font-medium mb-1">영업이익률</p>
            <p className="text-3xl font-bold text-slate-800">{opMargin.toFixed(1)}%</p>
            <p className="text-sm text-slate-500 mt-1">
              전년 {prevOpMargin.toFixed(1)}%
              <span className="text-emerald-500 font-medium ml-1">+{(opMargin - prevOpMargin).toFixed(1)}%p</span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <div className="h-1 bg-orange-500" />
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500 font-medium mb-1">수출 비중</p>
            <p className="text-3xl font-bold text-slate-800">{exportRatio.toFixed(1)}%</p>
            <p className="text-sm text-slate-500 mt-1">
              전년 {prevExportRatio.toFixed(1)}%
              <span className="text-emerald-500 font-medium ml-1">+{(exportRatio - prevExportRatio).toFixed(1)}%p</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 / 수출 지역별 매출 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 채널별 매출 분석 */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">채널별 매출 분석</CardTitle>
            <p className="text-xs text-slate-500 mt-1">국내 채널 + 사입 매출 기준, 수출 제외</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="text-slate-600 text-sm">채널</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">당기</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">전기</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">YoY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelSales.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-sm text-slate-700">{item.channel}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-slate-800">{formatNumber(item.current)}</TableCell>
                    <TableCell className="text-right text-sm text-slate-500">{formatNumber(item.previous)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${item.yoy >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.yoy >= 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100/70 font-semibold">
                  <TableCell className="text-sm text-slate-800">합계</TableCell>
                  <TableCell className="text-right text-sm text-slate-800">{formatNumber(channelTotal.current)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">{formatNumber(channelTotal.previous)}</TableCell>
                  <TableCell className={`text-right text-sm ${channelTotal.current - channelTotal.previous >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {((channelTotal.current - channelTotal.previous) / channelTotal.previous * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 수출 지역별 매출 분석 */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">수출 지역별 매출 분석</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="text-slate-600 text-sm">지역</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">당기</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">전기</TableHead>
                  <TableHead className="text-right text-slate-600 text-sm">YoY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportSales.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-sm text-slate-700">{item.region}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-slate-800">{formatNumber(item.current)}</TableCell>
                    <TableCell className="text-right text-sm text-slate-500">{formatNumber(item.previous)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${item.yoy >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.yoy >= 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100/70 font-semibold">
                  <TableCell className="text-sm text-slate-800">합계</TableCell>
                  <TableCell className="text-right text-sm text-slate-800">{formatNumber(exportTotal.current)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">{formatNumber(exportTotal.previous)}</TableCell>
                  <TableCell className="text-right text-sm text-emerald-500">
                    +{((exportTotal.current - exportTotal.previous) / exportTotal.previous * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 브랜드별 매출 분석 */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">브랜드별 매출 분석</CardTitle>
          <p className="text-xs text-slate-500 mt-1">수출 매출 제외, 국내 채널 + 사입 매출 기준</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800">
                <TableHead className="text-white text-sm font-medium rounded-tl-md">브랜드</TableHead>
                <TableHead className="text-right text-white text-sm font-medium">당기 매출</TableHead>
                <TableHead className="text-right text-white text-sm font-medium">전기 매출</TableHead>
                <TableHead className="text-right text-white text-sm font-medium">YoY</TableHead>
                <TableHead className="text-right text-white text-sm font-medium">당기 비중</TableHead>
                <TableHead className="text-right text-white text-sm font-medium rounded-tr-md">전기 비중</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brandSales.map((item, idx) => (
                <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: BRAND_COLORS[item.brand] || '#6B7280' }}
                      />
                      {item.brand}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800">{formatNumber(item.current)}</TableCell>
                  <TableCell className="text-right text-slate-500">{formatNumber(item.previous)}</TableCell>
                  <TableCell className={`text-right font-semibold ${item.yoy >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.yoy >= 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800">{item.currentRatio.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-slate-500">{item.prevRatio.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-amber-50/70 font-semibold border-t-2 border-amber-200">
                <TableCell className="text-slate-800">합계</TableCell>
                <TableCell className="text-right text-slate-800">{formatNumber(brandTotal.current)}</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(brandTotal.previous)}</TableCell>
                <TableCell className={`text-right ${brandTotal.current - brandTotal.previous >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {((brandTotal.current - brandTotal.previous) / brandTotal.previous * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-slate-800">100.0%</TableCell>
                <TableCell className="text-right text-slate-500">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-amber-600 mt-3 pl-1">* 수출 매출 제외, 국내 채널 + 사입 매출 기준</p>
        </CardContent>
      </Card>

      {/* 브랜드 믹스 변화 (도넛 차트) */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-amber-600 underline underline-offset-4">
            브랜드 믹스 변화 (국내+사입 매출 기준, 수출 제외)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 전년 (24년) */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">24년</h3>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prevYearChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {prevYearChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderCustomLegend(prevYearChartData, false)}
            </div>

            {/* 당기 (25년) */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">25년</h3>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currYearChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {currYearChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderCustomLegend(currYearChartData, true)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 브랜드 인사이트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-0 bg-blue-50/50 overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base font-semibold text-blue-800">MLB 브랜드</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-1.5 pb-4">
            <p>• 국내 매출 비중: {brandSales.find(b => b.brand === 'MLB')?.currentRatio.toFixed(1)}% (전년 {brandSales.find(b => b.brand === 'MLB')?.prevRatio.toFixed(1)}%)</p>
            <p>• 국내 매출 소폭 감소 ({brandSales.find(b => b.brand === 'MLB')?.yoy.toFixed(1)}%)</p>
            <p>• 수출 매출(중국)에서 고성장</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-orange-50/50 overflow-hidden">
          <div className="h-1 bg-orange-500" />
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base font-semibold text-orange-800">Discovery 브랜드</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-700 space-y-1.5 pb-4">
            <p>• 국내 매출 비중: {brandSales.find(b => b.brand === 'Discovery')?.currentRatio.toFixed(1)}% (전년 {brandSales.find(b => b.brand === 'Discovery')?.prevRatio.toFixed(1)}%)</p>
            <p>• 국내 매출 역성장 ({brandSales.find(b => b.brand === 'Discovery')?.yoy.toFixed(1)}%)</p>
            <p>• 아웃도어 시장 경쟁 심화 영향</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

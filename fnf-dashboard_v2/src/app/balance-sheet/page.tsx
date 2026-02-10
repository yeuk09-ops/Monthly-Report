'use client';

import { useState, useMemo, Fragment } from 'react';
import { useReport } from '@/components/providers/ReportContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

export default function BalanceSheetPage() {
  const { reportData, isLoading } = useReport();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    asset: false, liability: false, equity: false, arDetail: false, invDetail: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAll = () => {
    const allExpanded = Object.values(expandedSections).every(v => v);
    const newState = Object.keys(expandedSections).reduce((acc, key) => {
      acc[key] = !allExpanded;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedSections(newState);
  };

  const turnoverMetrics = useMemo(() => {
    if (!reportData) return null;
    const d = reportData.financialData;

    const avgReceivables = (d.receivables.current + d.receivables.previous) / 2;
    const avgInventory = (d.inventory.current + d.inventory.previous) / 2;
    const avgPayables = (d.payables.current + d.payables.previous) / 2;

    const receivablesTurnover = { current: d.revenue.current / avgReceivables, previous: d.revenue.previous / ((d.receivables.previous + 1200) / 2) };
    const inventoryTurnover = { current: d.cogs.current / avgInventory, previous: d.cogs.previous / ((d.inventory.previous + 2100) / 2) };
    const payablesTurnover = { current: d.cogs.current / avgPayables, previous: d.cogs.previous / ((d.payables.previous + 750) / 2) };

    const dso = { current: 365 / receivablesTurnover.current, previous: 365 / receivablesTurnover.previous };
    const dio = { current: 365 / inventoryTurnover.current, previous: 365 / inventoryTurnover.previous };
    const dpo = { current: 365 / payablesTurnover.current, previous: 365 / payablesTurnover.previous };
    const ccc = { current: dso.current + dio.current - dpo.current, previous: dso.previous + dio.previous - dpo.previous };

    return { dso, dio, dpo, ccc };
  }, [reportData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!reportData || !turnoverMetrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-gray-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { balanceSheet, workingCapital, creditVerification, financialData } = reportData;
  const { totals } = balanceSheet;

  const formatNumber = (num: number) => {
    if (num < 0) return `△${Math.abs(num).toLocaleString('ko-KR')}`;
    return num.toLocaleString('ko-KR');
  };

  const getChangeColor = (change: number, isNegativeGood: boolean = false) => {
    if (change === 0) return 'text-gray-600';
    if (isNegativeGood) return change < 0 ? 'text-emerald-600' : 'text-red-600';
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <Badge className="bg-emerald-100 text-emerald-700">정상</Badge>;
      case 'warning': return <Badge className="bg-amber-100 text-amber-700">경계</Badge>;
      case 'danger': return <Badge className="bg-red-100 text-red-700">장기</Badge>;
      default: return null;
    }
  };

  const renderSectionHeader = (
    sectionKey: string, title: string, jan25: number, dec25: number, jan26: number,
    momChange: number, momChangePercent: number, yoyChange: number, yoyChangePercent: number, bgClass: string
  ) => (
    <TableRow className={`${bgClass} cursor-pointer hover:opacity-90`} onClick={() => toggleSection(sectionKey)}>
      <TableCell className="font-bold flex items-center gap-2">
        {expandedSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </TableCell>
      <TableCell className="text-right font-semibold">{formatNumber(jan25)}</TableCell>
      <TableCell className="text-right font-semibold">{formatNumber(dec25)}</TableCell>
      <TableCell className="text-right font-semibold bg-yellow-50/50">{formatNumber(jan26)}</TableCell>
      <TableCell className={`text-right font-semibold ${getChangeColor(momChange)}`}>
        {momChange > 0 ? '+' : ''}{formatNumber(momChange)}
      </TableCell>
      <TableCell className={`text-right font-semibold ${getChangeColor(yoyChange)}`}>
        {yoyChange > 0 ? '+' : ''}{formatNumber(yoyChange)} ({yoyChangePercent > 0 ? '+' : ''}{yoyChangePercent.toFixed(1)}%)
      </TableCell>
    </TableRow>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 재무상태표 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">재무상태표 (B/S) - 26년 1월 기준</h1>
        <Button onClick={toggleAll} variant="outline" size="sm">전체 접기/펴기</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600">
                <TableHead className="text-white w-[200px]">계정과목</TableHead>
                <TableHead className="text-white text-right w-[110px]">25년 1월</TableHead>
                <TableHead className="text-white text-right w-[110px]">25년 12월</TableHead>
                <TableHead className="text-white text-right w-[110px]">26년 1월</TableHead>
                <TableHead className="text-white text-right w-[100px]">월간증감</TableHead>
                <TableHead className="text-white text-right w-[140px]">연간증감 (YoY)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 자산 */}
              {balanceSheet.totals && balanceSheet.totals.length > 0 && renderSectionHeader(
                'asset',
                '자산총계',
                balanceSheet.totals[0].jan25,
                balanceSheet.totals[0].dec25,
                balanceSheet.totals[0].jan26,
                balanceSheet.totals[0].momChange,
                balanceSheet.totals[0].momChangePercent,
                balanceSheet.totals[0].yoyChange,
                balanceSheet.totals[0].yoyChangePercent,
                'bg-blue-100'
              )}
              {balanceSheet.assets.map((item, idx) => {
                const isVisible = item.isAlwaysVisible || expandedSections.asset;
                if (!isVisible) return null;
                return (
                  <TableRow key={idx} className={item.isSubItem ? 'text-gray-600' : ''}>
                    <TableCell className={item.isSubItem ? 'pl-10 text-sm' : 'pl-8'}>{item.label}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.jan25)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.dec25)}</TableCell>
                    <TableCell className={`text-right ${item.highlight ? 'bg-yellow-50' : ''}`}>{formatNumber(item.jan26)}</TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.momChange)}`}>
                      {item.momChange > 0 ? '+' : ''}{formatNumber(item.momChange)}
                    </TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.yoyChange)}`}>
                      {item.yoyChange > 0 ? '+' : ''}{formatNumber(item.yoyChange)} ({item.yoyChangePercent > 0 ? '+' : ''}{item.yoyChangePercent.toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* 부채 */}
              {balanceSheet.totals && balanceSheet.totals.length > 1 && renderSectionHeader(
                'liability',
                '부채총계',
                balanceSheet.totals[1].jan25,
                balanceSheet.totals[1].dec25,
                balanceSheet.totals[1].jan26,
                balanceSheet.totals[1].momChange,
                balanceSheet.totals[1].momChangePercent,
                balanceSheet.totals[1].yoyChange,
                balanceSheet.totals[1].yoyChangePercent,
                'bg-red-100'
              )}
              {balanceSheet.liabilities.map((item, idx) => {
                const isVisible = item.isAlwaysVisible || expandedSections.liability;
                if (!isVisible) return null;
                return (
                  <TableRow key={idx} className={item.isSubItem ? 'text-gray-600' : ''}>
                    <TableCell className={item.isSubItem ? 'pl-10 text-sm' : 'pl-8'}>{item.label}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.jan25)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.dec25)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.jan26)}</TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.momChange, true)}`}>
                      {item.momChange > 0 ? '+' : ''}{formatNumber(item.momChange)}
                    </TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.yoyChange, true)}`}>
                      {item.yoyChange > 0 ? '+' : ''}{formatNumber(item.yoyChange)} ({item.yoyChangePercent > 0 ? '+' : ''}{item.yoyChangePercent.toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* 자본 */}
              {balanceSheet.totals && balanceSheet.totals.length > 2 && renderSectionHeader(
                'equity',
                '자본총계',
                balanceSheet.totals[2].jan25,
                balanceSheet.totals[2].dec25,
                balanceSheet.totals[2].jan26,
                balanceSheet.totals[2].momChange,
                balanceSheet.totals[2].momChangePercent,
                balanceSheet.totals[2].yoyChange,
                balanceSheet.totals[2].yoyChangePercent,
                'bg-emerald-100'
              )}
              {balanceSheet.equity.map((item, idx) => {
                const isVisible = item.isAlwaysVisible || expandedSections.equity;
                if (!isVisible) return null;
                return (
                  <TableRow key={idx} className={item.isSubItem ? 'text-gray-600' : ''}>
                    <TableCell className={item.isSubItem ? 'pl-10 text-sm' : 'pl-8'}>{item.label}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.jan25)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.dec25)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.jan26)}</TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.momChange)}`}>
                      {item.momChange > 0 ? '+' : ''}{formatNumber(item.momChange)}
                    </TableCell>
                    <TableCell className={`text-right ${getChangeColor(item.yoyChange)}`}>
                      {item.yoyChange > 0 ? '+' : ''}{formatNumber(item.yoyChange)} ({item.yoyChangePercent > 0 ? '+' : ''}{item.yoyChangePercent.toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 운전자본 분석 */}
      <h2 className="text-lg font-bold text-slate-800 border-l-4 border-orange-400 pl-4">운전자본 분석</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600">
                <TableHead className="text-white w-[200px]">구분</TableHead>
                <TableHead className="text-white text-right w-[140px]">25년 12월</TableHead>
                <TableHead className="text-white text-right w-[140px]">26년 1월</TableHead>
                <TableHead className="text-white text-right w-[120px]">증감</TableHead>
                <TableHead className="text-white text-right w-[80px]">증감률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 매출채권 */}
              <TableRow className="bg-blue-100 cursor-pointer hover:opacity-90" onClick={() => toggleSection('arDetail')}>
                <TableCell className="font-semibold flex items-center gap-2">
                  {expandedSections.arDetail ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  매출채권
                </TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.receivables.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.receivables.current)}</TableCell>
                <TableCell className="text-right font-semibold text-red-600">+{formatNumber(financialData.receivables.current - financialData.receivables.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold text-red-600">+{((financialData.receivables.current - financialData.receivables.previousMonth) / financialData.receivables.previousMonth * 100).toFixed(1)}%</TableCell>
              </TableRow>
              {expandedSections.arDetail && workingCapital.ar && workingCapital.ar.map((item: any, idx) => (
                <TableRow key={idx} className={item.warning ? 'bg-orange-50' : 'bg-gray-50'}>
                  <TableCell className={`pl-10 ${item.warning ? 'text-orange-700 font-medium' : ''}`}>{item.label}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.dec25)}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.jan26)}</TableCell>
                  <TableCell className={`text-right ${getChangeColor(item.change)}`}>{item.change > 0 ? '+' : ''}{formatNumber(item.change)}</TableCell>
                  <TableCell className={`text-right ${getChangeColor(item.changePercent)}`}>{item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%</TableCell>
                </TableRow>
              ))}

              {/* 재고자산 */}
              <TableRow className="bg-blue-100 cursor-pointer hover:opacity-90" onClick={() => toggleSection('invDetail')}>
                <TableCell className="font-semibold flex items-center gap-2">
                  {expandedSections.invDetail ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  재고자산
                </TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.inventory.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.inventory.current)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{financialData.inventory.current - financialData.inventory.previousMonth > 0 ? '+' : ''}{formatNumber(financialData.inventory.current - financialData.inventory.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold">{((financialData.inventory.current - financialData.inventory.previousMonth) / financialData.inventory.previousMonth * 100) > 0 ? '+' : ''}{((financialData.inventory.current - financialData.inventory.previousMonth) / financialData.inventory.previousMonth * 100).toFixed(1)}%</TableCell>
              </TableRow>
              {expandedSections.invDetail && workingCapital.inventory && workingCapital.inventory.map((brand, idx) => (
                <Fragment key={idx}>
                  <TableRow className="bg-blue-50">
                    <TableCell className="pl-8 font-semibold text-blue-700">{brand.brand}</TableCell>
                    <TableCell></TableCell><TableCell></TableCell><TableCell></TableCell><TableCell></TableCell>
                  </TableRow>
                  {brand.items.map((item, subIdx) => (
                    <TableRow key={subIdx} className="hover:bg-gray-50">
                      <TableCell className="pl-12 text-gray-600">{item.label}</TableCell>
                      <TableCell className="text-right">{item.jan26}</TableCell>
                      <TableCell className="text-right">{item.jan26}</TableCell>
                      <TableCell className={`text-right ${getChangeColor(item.change)}`}>{item.change > 0 ? '+' : ''}{item.change}</TableCell>
                      <TableCell className={`text-right ${getChangeColor(item.changePercent)}`}>{item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}

              {/* 매입채무 */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-semibold">매입채무</TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.payables.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(financialData.payables.current)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{financialData.payables.current - financialData.payables.previousMonth > 0 ? '+' : ''}{formatNumber(financialData.payables.current - financialData.payables.previousMonth)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{((financialData.payables.current - financialData.payables.previousMonth) / financialData.payables.previousMonth * 100) > 0 ? '+' : ''}{((financialData.payables.current - financialData.payables.previousMonth) / financialData.payables.previousMonth * 100).toFixed(1)}%</TableCell>
              </TableRow>

              {/* 순운전자본 */}
              <TableRow className="bg-amber-100 font-bold">
                <TableCell className="text-center">순운전자본 (AR+INV−AP)</TableCell>
                <TableCell className="text-right">{formatNumber(financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth)}</TableCell>
                <TableCell className="text-right">{formatNumber(financialData.receivables.current + financialData.inventory.current - financialData.payables.current)}</TableCell>
                <TableCell className="text-right text-red-600">{((financialData.receivables.current + financialData.inventory.current - financialData.payables.current) - (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth)) > 0 ? '+' : ''}{formatNumber((financialData.receivables.current + financialData.inventory.current - financialData.payables.current) - (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth))}</TableCell>
                <TableCell className="text-right text-red-600">{(((financialData.receivables.current + financialData.inventory.current - financialData.payables.current) - (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth)) / (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth) * 100) > 0 ? '+' : ''}{(((financialData.receivables.current + financialData.inventory.current - financialData.payables.current) - (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth)) / (financialData.receivables.previousMonth + financialData.inventory.previousMonth - financialData.payables.previousMonth) * 100).toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 회전율 분석 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400">
        <CardHeader>
          <CardTitle className="text-lg text-orange-800">회전율 분석 (연환산 기준)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-100">
                <TableHead>지표</TableHead>
                <TableHead className="text-right">25년 1월</TableHead>
                <TableHead className="text-right">26년 1월</TableHead>
                <TableHead className="text-right">증감</TableHead>
                <TableHead className="text-center">평가</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              <TableRow>
                <TableCell>재고회전일수 (DIO)</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dio.previous)}일</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dio.current)}일</TableCell>
                <TableCell className={`text-right ${turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? '△' : '+'}{Math.abs(Math.round(turnoverMetrics.dio.current - turnoverMetrics.dio.previous))}일
                </TableCell>
                <TableCell className="text-center">{turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? '✓✓' : '⚠️'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>매출채권회전일수 (DSO)</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dso.previous)}일</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dso.current)}일</TableCell>
                <TableCell className={`text-right ${turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? '+' : '△'}{Math.abs(Math.round(turnoverMetrics.dso.current - turnoverMetrics.dso.previous))}일
                </TableCell>
                <TableCell className="text-center">{turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? '⚠️' : '✓'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>매입채무회전일수 (DPO)</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dpo.previous)}일</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.dpo.current)}일</TableCell>
                <TableCell className="text-right">
                  {Math.round(turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous) === 0 ? '0' : (turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous > 0 ? '+' : '△') + Math.abs(Math.round(turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous))}일
                </TableCell>
                <TableCell className="text-center">✓</TableCell>
              </TableRow>
              <TableRow className="bg-amber-50 font-bold">
                <TableCell className="text-center">현금전환주기 (CCC)</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.ccc.previous)}일</TableCell>
                <TableCell className="text-right">{Math.round(turnoverMetrics.ccc.current)}일</TableCell>
                <TableCell className={`text-right ${turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous > 0 ? '+' : '△'}{Math.abs(Math.round(turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous))}일
                </TableCell>
                <TableCell className="text-center">{Math.abs(turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous) < 5 ? '✓' : '⚠️'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 여신기준 검증 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-orange-400">
        <CardHeader>
          <CardTitle className="text-lg text-orange-800">여신기준 검증 (11월~1월 매출 대비 채권)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">※ 통상 여신기간 1~2개월 기준으로 채권 잔액 적정성 검증</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-500 text-white">
                  <TableHead className="text-white">구분</TableHead>
                  <TableHead className="text-white text-right">11월</TableHead>
                  <TableHead className="text-white text-right">12월</TableHead>
                  <TableHead className="text-white text-right">1월</TableHead>
                  <TableHead className="text-white text-right">1월말 채권</TableHead>
                  <TableHead className="text-white text-right">채권/매출</TableHead>
                  <TableHead className="text-white text-right">월수 환산</TableHead>
                  <TableHead className="text-white text-right">전년 월수</TableHead>
                  <TableHead className="text-white text-center">판정</TableHead>
                  <TableHead className="text-white min-w-[280px]">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {creditVerification.map((item, idx) => (
                  <TableRow key={idx} className={item.status === 'danger' ? 'bg-red-50' : item.status === 'warning' ? 'bg-amber-50' : ''}>
                    <TableCell className={`font-semibold ${item.status === 'danger' ? 'text-red-700' : ''}`}>{item.channel}</TableCell>
                    <TableCell className="text-right">{item.nov}억</TableCell>
                    <TableCell className="text-right">{item.dec}억</TableCell>
                    <TableCell className="text-right">{item.jan}억</TableCell>
                    <TableCell className={`text-right ${item.status === 'danger' ? 'text-red-700 font-semibold' : ''}`}>{item.arBalance}억</TableCell>
                    <TableCell className={`text-right ${item.status === 'danger' ? 'text-red-700 font-semibold' : item.status === 'warning' ? 'text-orange-600' : ''}`}>{item.arRatio}%</TableCell>
                    <TableCell className={`text-right font-semibold ${item.status === 'danger' ? 'text-red-700' : ''}`}>{item.months}개월</TableCell>
                    <TableCell className="text-right">{item.prevMonths}개월</TableCell>
                    <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {item.notes.map((note, noteIdx) => (<div key={noteIdx}>{note}</div>))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 주요 지표 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">부채비율</h3>
            <p className="text-2xl font-bold text-slate-800">{((balanceSheet.totals[1].jan26 / balanceSheet.totals[2].jan26) * 100).toFixed(1)}%</p>
            <p className="text-sm text-emerald-600">전월 {((balanceSheet.totals[1].dec25 / balanceSheet.totals[2].dec25) * 100).toFixed(1)}% → △{(((balanceSheet.totals[1].dec25 / balanceSheet.totals[2].dec25) * 100) - ((balanceSheet.totals[1].jan26 / balanceSheet.totals[2].jan26) * 100)).toFixed(1)}%p 개선</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">자기자본비율</h3>
            <p className="text-2xl font-bold text-slate-800">{((balanceSheet.totals[2].jan26 / balanceSheet.totals[0].jan26) * 100).toFixed(1)}%</p>
            <p className="text-sm text-emerald-600">전월 {((balanceSheet.totals[2].dec25 / balanceSheet.totals[0].dec25) * 100).toFixed(1)}% → +{(((balanceSheet.totals[2].jan26 / balanceSheet.totals[0].jan26) * 100) - ((balanceSheet.totals[2].dec25 / balanceSheet.totals[0].dec25) * 100)).toFixed(1)}%p 개선</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">순차입금비율</h3>
            <p className="text-2xl font-bold text-slate-800">△14.8%</p>
            <p className="text-sm text-emerald-600">무차입 경영 유지 (현금 &gt; 차입금)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

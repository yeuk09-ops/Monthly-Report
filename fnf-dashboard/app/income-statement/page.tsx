'use client';

import { useState, useEffect } from 'react';

interface IncomeItem {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

interface IncomeStatementData {
  revenue: IncomeItem[];
  costs: IncomeItem[];
  operatingProfit: IncomeItem;
}

export default function IncomeStatementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncomeStatementData | null>(null);

  useEffect(() => {
    // 하드코딩된 데이터 사용 (나중에 API 연동)
    const mockData: IncomeStatementData = {
      revenue: [
        { label: '실판매출', current: 17048, previous: 15210, change: 1838, changePercent: 12.1 },
        { label: '- 국내매출', current: 8052, previous: 8745, change: -693, changePercent: -7.9 },
        { label: '- 수출매출', current: 8996, previous: 6465, change: 2531, changePercent: 39.1 },
      ],
      costs: [
        { label: '매출원가', current: 6426, previous: 5837, change: 589, changePercent: 10.1 },
        { label: '판매비와관리비', current: 5609, previous: 5408, change: 201, changePercent: 3.7 },
        { label: '- 인건비', current: 1823, previous: 1756, change: 67, changePercent: 3.8 },
        { label: '- 광고선전비', current: 1245, previous: 1189, change: 56, changePercent: 4.7 },
        { label: '- 물류비', current: 892, previous: 823, change: 69, changePercent: 8.4 },
        { label: '- 기타판관비', current: 1649, previous: 1640, change: 9, changePercent: 0.5 },
      ],
      operatingProfit: { label: '영업이익', current: 5013, previous: 3965, change: 1048, changePercent: 26.4 },
    };

    setData(mockData);
    setLoading(false);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const getChangeColor = (change: number, isCost: boolean = false) => {
    if (change === 0) return 'text-gray-600';
    if (isCost) {
      return change > 0 ? 'text-red-600' : 'text-emerald-600';
    }
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3c72] border-l-4 border-[#2a5298] pl-4">
        FNF 손익계산서 (2025.1~12월 누계)
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">계정과목</th>
              <th className="px-4 py-3 text-right font-semibold">당기 (억원)</th>
              <th className="px-4 py-3 text-right font-semibold">전기 (억원)</th>
              <th className="px-4 py-3 text-right font-semibold">증감</th>
              <th className="px-4 py-3 text-right font-semibold">증감률</th>
            </tr>
          </thead>
          <tbody>
            {/* 매출 섹션 */}
            <tr className="bg-emerald-50">
              <td colSpan={5} className="px-4 py-2 font-bold text-emerald-800">
                📈 매출
              </td>
            </tr>
            {data?.revenue.map((item, idx) => (
              <tr key={`rev-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className={`px-4 py-2 ${idx === 0 ? 'pl-6 font-semibold' : 'pl-10'} text-gray-700`}>
                  {item.label}
                </td>
                <td className="px-4 py-2 text-right font-medium">{formatNumber(item.current)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{formatNumber(item.previous)}</td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.change)}`}>
                  {item.change > 0 ? '+' : ''}{formatNumber(item.change)}
                </td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.changePercent)}`}>
                  {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                </td>
              </tr>
            ))}

            {/* 비용 섹션 */}
            <tr className="bg-red-50">
              <td colSpan={5} className="px-4 py-2 font-bold text-red-800">
                📉 비용
              </td>
            </tr>
            {data?.costs.map((item, idx) => (
              <tr key={`cost-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className={`px-4 py-2 ${idx < 2 ? 'pl-6 font-semibold' : 'pl-10'} text-gray-700`}>
                  {item.label}
                </td>
                <td className="px-4 py-2 text-right font-medium">{formatNumber(item.current)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{formatNumber(item.previous)}</td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.change, true)}`}>
                  {item.change > 0 ? '+' : ''}{formatNumber(item.change)}
                </td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.changePercent, true)}`}>
                  {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                </td>
              </tr>
            ))}

            {/* 영업이익 */}
            <tr className="bg-blue-100 font-bold text-lg">
              <td className="px-4 py-3 pl-6 text-[#1e3c72]">
                ⭐ {data?.operatingProfit.label}
              </td>
              <td className="px-4 py-3 text-right text-[#1e3c72]">
                {formatNumber(data?.operatingProfit.current || 0)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatNumber(data?.operatingProfit.previous || 0)}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600">
                +{formatNumber(data?.operatingProfit.change || 0)}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600">
                +{data?.operatingProfit.changePercent.toFixed(1)}%
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* 수익성 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">매출총이익률</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">62.3%</p>
          <p className="text-sm text-emerald-600">전년 61.6% → +0.7%p</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-emerald-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">영업이익률</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">29.4%</p>
          <p className="text-sm text-emerald-600">전년 26.1% → +3.3%p</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">수출 비중</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">52.8%</p>
          <p className="text-sm text-emerald-600">전년 42.5% → +10.3%p</p>
        </div>
      </div>

      {/* 채널별 매출 분석 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4">채널별 매출 분석 (국내+사입, 수출제외)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">채널</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">당기 (억원)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">전기 (억원)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">YoY</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">백화점</td>
                <td className="px-3 py-2 text-right font-medium">2,339</td>
                <td className="px-3 py-2 text-right text-gray-600">2,567</td>
                <td className="px-3 py-2 text-right text-red-600">-8.9%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">대리점</td>
                <td className="px-3 py-2 text-right font-medium">370</td>
                <td className="px-3 py-2 text-right text-gray-600">262</td>
                <td className="px-3 py-2 text-right text-emerald-600">+41.2%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">면세점</td>
                <td className="px-3 py-2 text-right font-medium">1,472</td>
                <td className="px-3 py-2 text-right text-gray-600">1,663</td>
                <td className="px-3 py-2 text-right text-red-600">-11.5%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">직영점</td>
                <td className="px-3 py-2 text-right font-medium">796</td>
                <td className="px-3 py-2 text-right text-gray-600">720</td>
                <td className="px-3 py-2 text-right text-emerald-600">+10.6%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">할인점</td>
                <td className="px-3 py-2 text-right font-medium">358</td>
                <td className="px-3 py-2 text-right text-gray-600">399</td>
                <td className="px-3 py-2 text-right text-red-600">-10.3%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">아울렛</td>
                <td className="px-3 py-2 text-right font-medium">1,873</td>
                <td className="px-3 py-2 text-right text-gray-600">2,163</td>
                <td className="px-3 py-2 text-right text-red-600">-13.4%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">온라인(자사몰)</td>
                <td className="px-3 py-2 text-right font-medium">881</td>
                <td className="px-3 py-2 text-right text-gray-600">970</td>
                <td className="px-3 py-2 text-right text-red-600">-9.2%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">온라인(입점몰)</td>
                <td className="px-3 py-2 text-right font-medium">210</td>
                <td className="px-3 py-2 text-right text-gray-600">239</td>
                <td className="px-3 py-2 text-right text-red-600">-12.1%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-blue-50">
                <td className="px-3 py-2 text-blue-700 font-semibold">사입</td>
                <td className="px-3 py-2 text-right font-medium text-blue-700">491</td>
                <td className="px-3 py-2 text-right text-blue-600">568</td>
                <td className="px-3 py-2 text-right text-red-600">-13.6%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">기타</td>
                <td className="px-3 py-2 text-right font-medium">32</td>
                <td className="px-3 py-2 text-right text-gray-600">36</td>
                <td className="px-3 py-2 text-right text-red-600">-11.1%</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="px-3 py-2 text-gray-800">합계</td>
                <td className="px-3 py-2 text-right text-gray-800">8,822</td>
                <td className="px-3 py-2 text-right text-gray-700">9,587</td>
                <td className="px-3 py-2 text-right text-red-600">-8.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 수출 지역별 매출 분석 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4">수출 지역별 매출 분석</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">지역</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">당기 (억원)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">전기 (억원)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">YoY</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">중국</td>
                <td className="px-3 py-2 text-right font-medium">8,316</td>
                <td className="px-3 py-2 text-right text-gray-600">5,642</td>
                <td className="px-3 py-2 text-right text-emerald-600">+47.4%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">홍콩/마카오</td>
                <td className="px-3 py-2 text-right font-medium">169</td>
                <td className="px-3 py-2 text-right text-gray-600">206</td>
                <td className="px-3 py-2 text-right text-red-600">-18.0%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">대만</td>
                <td className="px-3 py-2 text-right font-medium">127</td>
                <td className="px-3 py-2 text-right text-gray-600">93</td>
                <td className="px-3 py-2 text-right text-emerald-600">+36.6%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">기타</td>
                <td className="px-3 py-2 text-right font-medium">380</td>
                <td className="px-3 py-2 text-right text-gray-600">356</td>
                <td className="px-3 py-2 text-right text-emerald-600">+6.7%</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="px-3 py-2 text-gray-800">합계</td>
                <td className="px-3 py-2 text-right text-gray-800">8,992</td>
                <td className="px-3 py-2 text-right text-gray-700">6,297</td>
                <td className="px-3 py-2 text-right text-emerald-600">+42.8%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 브랜드별 실적 분석 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4">브랜드별 매출 분석 (수출 제외, 국내+사입)</h2>

        {/* 브랜드별 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">브랜드</th>
                <th className="px-4 py-3 text-right font-semibold">당기 매출 (억원)</th>
                <th className="px-4 py-3 text-right font-semibold">전기 매출 (억원)</th>
                <th className="px-4 py-3 text-right font-semibold">매출 YoY</th>
                <th className="px-4 py-3 text-right font-semibold">당기 비중</th>
                <th className="px-4 py-3 text-right font-semibold">전기 비중</th>
              </tr>
            </thead>
            <tbody>
              {/* MLB */}
              <tr className="border-b border-gray-100 hover:bg-blue-50">
                <td className="px-4 py-3 font-semibold text-blue-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    MLB
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">3,660</td>
                <td className="px-4 py-3 text-right text-gray-600">3,775</td>
                <td className="px-4 py-3 text-right text-red-600 font-semibold">-3.0%</td>
                <td className="px-4 py-3 text-right font-medium">41.4%</td>
                <td className="px-4 py-3 text-right text-gray-600">39.2%</td>
              </tr>
              {/* Discovery */}
              <tr className="border-b border-gray-100 hover:bg-orange-50">
                <td className="px-4 py-3 font-semibold text-orange-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    Discovery
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">3,946</td>
                <td className="px-4 py-3 text-right text-gray-600">4,755</td>
                <td className="px-4 py-3 text-right text-red-600 font-semibold">-17.0%</td>
                <td className="px-4 py-3 text-right font-medium">44.6%</td>
                <td className="px-4 py-3 text-right text-gray-600">49.4%</td>
              </tr>
              {/* MLB Kids */}
              <tr className="border-b border-gray-100 hover:bg-cyan-50">
                <td className="px-4 py-3 font-semibold text-cyan-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-cyan-500 rounded-full"></span>
                    MLB Kids
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">822</td>
                <td className="px-4 py-3 text-right text-gray-600">827</td>
                <td className="px-4 py-3 text-right text-red-600 font-semibold">-0.6%</td>
                <td className="px-4 py-3 text-right font-medium">9.3%</td>
                <td className="px-4 py-3 text-right text-gray-600">8.6%</td>
              </tr>
              {/* Duvetica */}
              <tr className="border-b border-gray-100 hover:bg-purple-50">
                <td className="px-4 py-3 font-semibold text-purple-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    Duvetica
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">303</td>
                <td className="px-4 py-3 text-right text-gray-600">160</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+89.4%</td>
                <td className="px-4 py-3 text-right font-medium">3.4%</td>
                <td className="px-4 py-3 text-right text-gray-600">1.7%</td>
              </tr>
              {/* 기타 브랜드 */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    기타
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">126</td>
                <td className="px-4 py-3 text-right text-gray-600">102</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+23.5%</td>
                <td className="px-4 py-3 text-right font-medium">1.4%</td>
                <td className="px-4 py-3 text-right text-gray-600">1.1%</td>
              </tr>
              {/* 합계 */}
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">8,857</td>
                <td className="px-4 py-3 text-right text-gray-600">9,619</td>
                <td className="px-4 py-3 text-right text-red-600">-7.9%</td>
                <td className="px-4 py-3 text-right">100.0%</td>
                <td className="px-4 py-3 text-right text-gray-600">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">* 수출 매출 제외, 국내 채널 + 사입 매출 기준</p>

        {/* 브랜드 믹스 변화 - 원형 그래프 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-4">브랜드 믹스 변화 (국내+사입 매출 기준, 수출 제외)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2024년 원형 그래프 */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-gray-600 mb-3">24년</div>
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* MLB: 39.2% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20"
                    strokeDasharray="98.6 251.4" strokeDashoffset="0" />
                  {/* Discovery: 49.4% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="20"
                    strokeDasharray="124.0 126.0" strokeDashoffset="-98.6" />
                  {/* MLB Kids: 8.6% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" strokeWidth="20"
                    strokeDasharray="21.6 228.4" strokeDashoffset="-222.6" />
                  {/* Duvetica: 1.7% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" strokeWidth="20"
                    strokeDasharray="4.3 245.7" strokeDashoffset="-244.2" />
                  {/* 기타: 1.1% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9ca3af" strokeWidth="20"
                    strokeDasharray="2.8 247.2" strokeDashoffset="-248.5" />
                </svg>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>MLB 39.2%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-full"></span>Discovery 49.4%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-500 rounded-full"></span>MLB Kids 8.6%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded-full"></span>Duvetica 1.7%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-400 rounded-full"></span>기타 1.1%</div>
              </div>
            </div>
            {/* 2025년 원형 그래프 */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-gray-600 mb-3">25년</div>
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* MLB: 41.4% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20"
                    strokeDasharray="104.0 146.0" strokeDashoffset="0" />
                  {/* Discovery: 44.6% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="20"
                    strokeDasharray="112.0 138.0" strokeDashoffset="-104.0" />
                  {/* MLB Kids: 9.3% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" strokeWidth="20"
                    strokeDasharray="23.4 226.6" strokeDashoffset="-216.0" />
                  {/* Duvetica: 3.4% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" strokeWidth="20"
                    strokeDasharray="8.5 241.5" strokeDashoffset="-239.4" />
                  {/* 기타: 1.4% */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9ca3af" strokeWidth="20"
                    strokeDasharray="3.5 246.5" strokeDashoffset="-247.9" />
                </svg>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>MLB 41.4% <span className="text-emerald-600">(+2.2%p)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-full"></span>Discovery 44.6% <span className="text-red-600">(-4.8%p)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-500 rounded-full"></span>MLB Kids 9.3% <span className="text-emerald-600">(+0.7%p)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded-full"></span>Duvetica 3.4% <span className="text-emerald-600">(+1.7%p)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-400 rounded-full"></span>기타 1.4% <span className="text-emerald-600">(+0.3%p)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* 브랜드별 인사이트 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">MLB 브랜드</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 국내 매출 비중: 41.4% (전년 39.2% → +2.2%p)</li>
              <li>• 국내 매출 소폭 감소 (-3.0%)</li>
              <li>• 수출 매출(중국)에서 고성장 (+47%)</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-semibold text-orange-800 mb-2">Discovery 브랜드</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• 국내 매출 비중: 44.6% (전년 49.4% → -4.8%p)</li>
              <li>• 국내 매출 역성장 (-17.0%)</li>
              <li>• 아웃도어 시장 경쟁 심화 영향</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 계산식 참고 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📐 수익성 지표 계산식</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">이익률 지표</h4>
            <ul className="space-y-1">
              <li>• 매출총이익률 = (매출액-매출원가) ÷ 매출액 × 100</li>
              <li>• 영업이익률 = 영업이익 ÷ 매출액 × 100</li>
              <li>• 판관비율 = 판매비와관리비 ÷ 매출액 × 100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">성장성 지표</h4>
            <ul className="space-y-1">
              <li>• 매출성장률 = (당기매출-전기매출) ÷ 전기매출 × 100</li>
              <li>• 영업이익성장률 = (당기OP-전기OP) ÷ 전기OP × 100</li>
              <li>• 수출비중 = 수출매출 ÷ 총매출 × 100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">비용 구조</h4>
            <ul className="space-y-1">
              <li>• 매출원가율 = 매출원가 ÷ 매출액 × 100</li>
              <li>• 인건비율 = 인건비 ÷ 매출액 × 100</li>
              <li>• 광고선전비율 = 광고선전비 ÷ 매출액 × 100</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

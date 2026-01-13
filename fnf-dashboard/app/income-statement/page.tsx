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
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4">채널별 매출 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">국내 채널</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">백화점</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">2,856억</span>
                  <span className="text-sm text-red-600">-5.2%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">대리점</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">3,245억</span>
                  <span className="text-sm text-red-600">-8.3%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">온라인</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">1,951억</span>
                  <span className="text-sm text-emerald-600">+12.4%</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-3">수출 지역</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">중국</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">6,124억</span>
                  <span className="text-sm text-emerald-600">+45.2%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">동남아</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">1,823억</span>
                  <span className="text-sm text-emerald-600">+28.5%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">기타</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">1,049억</span>
                  <span className="text-sm text-emerald-600">+31.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 브랜드별 실적 분석 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3c72] mb-4">브랜드별 실적 분석 (1~12월 누계)</h2>

        {/* 브랜드별 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">브랜드</th>
                <th className="px-4 py-3 text-right font-semibold">당기 매출</th>
                <th className="px-4 py-3 text-right font-semibold">전기 매출</th>
                <th className="px-4 py-3 text-right font-semibold">매출 YoY</th>
                <th className="px-4 py-3 text-right font-semibold">당기 영업이익</th>
                <th className="px-4 py-3 text-right font-semibold">전기 영업이익</th>
                <th className="px-4 py-3 text-right font-semibold">영업이익 YoY</th>
                <th className="px-4 py-3 text-right font-semibold">영업이익률</th>
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
                <td className="px-4 py-3 text-right font-medium">11,245억</td>
                <td className="px-4 py-3 text-right text-gray-600">9,156억</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+22.8%</td>
                <td className="px-4 py-3 text-right font-medium">3,598억</td>
                <td className="px-4 py-3 text-right text-gray-600">2,746억</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+31.0%</td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">32.0%</span>
                </td>
              </tr>
              {/* Discovery */}
              <tr className="border-b border-gray-100 hover:bg-orange-50">
                <td className="px-4 py-3 font-semibold text-orange-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    Discovery
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">5,423억</td>
                <td className="px-4 py-3 text-right text-gray-600">5,712억</td>
                <td className="px-4 py-3 text-right text-red-600 font-semibold">-5.1%</td>
                <td className="px-4 py-3 text-right font-medium">1,302억</td>
                <td className="px-4 py-3 text-right text-gray-600">1,142억</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+14.0%</td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">24.0%</span>
                </td>
              </tr>
              {/* 기타 브랜드 */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    기타
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">380억</td>
                <td className="px-4 py-3 text-right text-gray-600">342억</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+11.1%</td>
                <td className="px-4 py-3 text-right font-medium">113억</td>
                <td className="px-4 py-3 text-right text-gray-600">77억</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">+46.8%</td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">29.7%</span>
                </td>
              </tr>
              {/* 합계 */}
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">17,048억</td>
                <td className="px-4 py-3 text-right text-gray-600">15,210억</td>
                <td className="px-4 py-3 text-right text-emerald-600">+12.1%</td>
                <td className="px-4 py-3 text-right">5,013억</td>
                <td className="px-4 py-3 text-right text-gray-600">3,965억</td>
                <td className="px-4 py-3 text-right text-emerald-600">+26.4%</td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">29.4%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 브랜드별 인사이트 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">MLB 브랜드</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 매출 비중: 66.0% (전년 60.2% → +5.8%p)</li>
              <li>• 수출 성장 견인: 중국 MLB 매출 +45% 이상</li>
              <li>• 영업이익률 32.0% (전년 30.0% → +2.0%p)</li>
              <li>• 전체 영업이익의 71.8% 기여</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-semibold text-orange-800 mb-2">Discovery 브랜드</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• 매출 비중: 31.8% (전년 37.6% → -5.8%p)</li>
              <li>• 국내 매출 역성장 영향 (-8% 내외)</li>
              <li>• 영업이익률 24.0% (전년 20.0% → +4.0%p)</li>
              <li>• 비용 효율화로 수익성 개선</li>
            </ul>
          </div>
        </div>

        {/* 브랜드 믹스 변화 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">브랜드 믹스 변화 (매출 기준)</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">24년</div>
              <div className="flex h-6 rounded-full overflow-hidden">
                <div className="bg-blue-500" style={{width: '60.2%'}}></div>
                <div className="bg-orange-500" style={{width: '37.6%'}}></div>
                <div className="bg-gray-400" style={{width: '2.2%'}}></div>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">25년</div>
              <div className="flex h-6 rounded-full overflow-hidden">
                <div className="bg-blue-500" style={{width: '66.0%'}}></div>
                <div className="bg-orange-500" style={{width: '31.8%'}}></div>
                <div className="bg-gray-400" style={{width: '2.2%'}}></div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> MLB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span> Discovery</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 rounded-full"></span> 기타</span>
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

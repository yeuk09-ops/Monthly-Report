'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BalanceSheetItem {
  label: string;
  dec24: number;
  dec25: number;
  change: number;
  changePercent: number;
  isSubItem?: boolean;
  isAlwaysVisible?: boolean;
  highlight?: boolean;
}

// 재무 데이터 (CSV 파일 기준: F&F 월별재무제표(25.12).csv)
// 단위: 억원 (백만원 ÷ 100)
const financialData = {
  // 손익계산서 (1~12월 누계)
  revenue: { current: 17048, previous: 15210 }, // 실판매출
  cogs: { current: 6426, previous: 5837 }, // 매출원가

  // 재무상태표 (12월 기준) - CSV 25년 12월(e) 데이터
  receivables: { current: 2180, previous: 1324 }, // 매출채권: 218,011 → 2180억
  inventory: { current: 2303, previous: 2253 }, // 재고자산: 230,263 → 2303억
  payables: { current: 862, previous: 798 }, // 매입채무: 86,213 → 862억
};

export default function BalanceSheetPage() {
  // 기본 상태: 접기 (false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    asset: false,
    liability: false,
    equity: false,
    arDetail: false,
    invDetail: false,
  });

  // 활동성 지표 계산 (경영요약 페이지와 동일 로직)
  const turnoverMetrics = useMemo(() => {
    const d = financialData;

    // 평균값 계산 (기초+기말)/2
    const avgReceivables = (d.receivables.current + d.receivables.previous) / 2;
    const avgInventory = (d.inventory.current + d.inventory.previous) / 2;
    const avgPayables = (d.payables.current + d.payables.previous) / 2;

    // 회전율 계산
    const receivablesTurnover = {
      current: d.revenue.current / avgReceivables,
      previous: d.revenue.previous / ((d.receivables.previous + 1200) / 2)
    };
    const inventoryTurnover = {
      current: d.cogs.current / avgInventory,
      previous: d.cogs.previous / ((d.inventory.previous + 2100) / 2)
    };
    const payablesTurnover = {
      current: d.cogs.current / avgPayables,
      previous: d.cogs.previous / ((d.payables.previous + 750) / 2)
    };

    // 회전일수 계산
    const dso = {
      current: 365 / receivablesTurnover.current,
      previous: 365 / receivablesTurnover.previous
    };
    const dio = {
      current: 365 / inventoryTurnover.current,
      previous: 365 / inventoryTurnover.previous
    };
    const dpo = {
      current: 365 / payablesTurnover.current,
      previous: 365 / payablesTurnover.previous
    };

    // CCC 계산
    const ccc = {
      current: dso.current + dio.current - dpo.current,
      previous: dso.previous + dio.previous - dpo.previous
    };

    return { dso, dio, dpo, ccc };
  }, []);

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

  // 재무상태표 데이터 (CSV 기준 25년 12월(e) 데이터)
  const assetItems: BalanceSheetItem[] = [
    { label: '현금및현금성자산', dec24: 615, dec25: 2708, change: 2093, changePercent: 340.3, isAlwaysVisible: true },
    { label: '매출채권', dec24: 1324, dec25: 2180, change: 856, changePercent: 64.7, isAlwaysVisible: true, highlight: true },
    { label: '재고자산', dec24: 2253, dec25: 2303, change: 50, changePercent: 2.2, isAlwaysVisible: true },
    { label: '(재고자산 평가충당금)', dec24: -110, dec25: -137, change: -27, changePercent: 24.5, isSubItem: true },
    { label: '투자자산', dec24: 6760, dec25: 6715, change: -45, changePercent: -0.7, isSubItem: true },
    { label: '유무형자산', dec24: 6098, dec25: 6013, change: -85, changePercent: -1.4, isSubItem: true },
    { label: '사용권자산', dec24: 1476, dec25: 1325, change: -151, changePercent: -10.2, isSubItem: true },
    { label: '기타채권', dec24: 523, dec25: 1000, change: 477, changePercent: 91.2, isSubItem: true },
    { label: '기타자산', dec24: 310, dec25: 341, change: 31, changePercent: 10.0, isSubItem: true },
  ];

  const liabilityItems: BalanceSheetItem[] = [
    { label: '매입채무', dec24: 798, dec25: 862, change: 64, changePercent: 8.0, isAlwaysVisible: true },
    { label: '미지급금', dec24: 361, dec25: 553, change: 192, changePercent: 53.2, isSubItem: true },
    { label: '차입금', dec24: 450, dec25: 0, change: -450, changePercent: -100, isAlwaysVisible: true },
    { label: '법인세부채', dec24: 675, dec25: 932, change: 257, changePercent: 38.1, isSubItem: true },
    { label: '리스부채', dec24: 1528, dec25: 1406, change: -122, changePercent: -8.0, isSubItem: true },
    { label: '퇴직급여/충당부채', dec24: 80, dec25: 55, change: -25, changePercent: -31.3, isSubItem: true },
    { label: '기타부채', dec24: 418, dec25: 336, change: -82, changePercent: -19.6, isSubItem: true },
  ];

  const equityItems: BalanceSheetItem[] = [
    { label: '자본금', dec24: 38, dec25: 38, change: 0, changePercent: 0, isSubItem: true },
    { label: '자본잉여금', dec24: 3199, dec25: 3199, change: 0, changePercent: 0, isSubItem: true },
    { label: '이익잉여금', dec24: 12227, dec25: 15657, change: 3430, changePercent: 28.1, isAlwaysVisible: true },
    { label: '자기주식', dec24: -525, dec25: -590, change: -65, changePercent: 12.4, isSubItem: true },
  ];

  // 운전자본 데이터 (25년 12월 기준)
  const workingCapitalAR = [
    { label: '국내', dec24: 1020, dec25: 980, change: -40, changePercent: -3.9 },
    { label: '수출-중국', dec24: 426, dec25: 850, change: 424, changePercent: 99.5 },
    { label: '수출-홍콩(연결)', dec24: 223, dec25: 280, change: 57, changePercent: 25.6, warning: true },
    { label: '수출-기타', dec24: 55, dec25: 70, change: 15, changePercent: 27.3 },
  ];

  const workingCapitalInv = [
    { label: 'MLB', subItems: [
      { label: '의류-당시즌', dec24: 98, dec25: 105, change: 7, changePercent: 7.1 },
      { label: '의류-과시즌', dec24: 113, dec25: 85, change: -28, changePercent: -24.8 },
    ]},
    { label: 'Discovery', subItems: [
      { label: '의류-당시즌', dec24: 459, dec25: 550, change: 91, changePercent: 19.8 },
      { label: '의류-과시즌', dec24: 514, dec25: 460, change: -54, changePercent: -10.5 },
    ]},
  ];

  // 여신기준 검증 데이터 (10~12월 매출 대비 채권)
  const creditVerification = [
    {
      channel: '국내',
      oct: 791, nov: 1055, dec: 850,
      arBalance: 980, arRatio: 36,
      months: 1.1, prevMonths: 1.3,
      status: 'normal',
      notes: [
        '백화점: 신세계(익월10일), 현대/롯데(익월30일) 外',
        '면세점: 롯데(익월8일), 신라(익월10일), 신세계(익월15일), 현대(익월30일) 外',
        '대리점: 1차: 1~15일 매출→16~18일 발송→(당월)23~25일',
        '        2차: 16일~말일 매출→(익월)14~17일'
      ]
    },
    {
      channel: '수출-중국',
      oct: 378, nov: 444, dec: 1091,
      arBalance: 8316, arRatio: 1304,
      months: 13.0, prevMonths: 1.1,
      status: 'danger',
      notes: [
        '※ Snowflake 검증 (DW_COPA_D, DM_F_FI_AR_AGING)',
        'AR 8,316억 / 월평균매출 638억 = 13.0개월',
        '주요채권: F&F CHINA CO.,LTD (105787) 7,655억',
        '→ TP정산 및 지연송금 포함'
      ]
    },
    {
      channel: '수출-홍콩(연결)',
      oct: 17, nov: 18, dec: 26,
      arBalance: 293, arRatio: 1437,
      months: 14.4, prevMonths: 15.9,
      status: 'danger',
      notes: [
        '※ Snowflake 검증 (DW_COPA_D, DM_F_FI_AR_AGING)',
        'AR 293억 / 월평균매출 20억 = 14.4개월',
        '결제조건: 선적말일 +3개월 적용',
        '→ TP정산 지연 포함'
      ]
    },
    {
      channel: '수출-기타',
      oct: 8, nov: 19, dec: 25,
      arBalance: 70, arRatio: 40,
      months: 1.3, prevMonths: 1.7,
      status: 'normal',
      notes: [
        '동남아, 유럽, 미국 등 다양한 시장',
        '전년 대비 개선 추세'
      ]
    },
  ];

  const formatNumber = (num: number) => {
    if (num < 0) return `△${Math.abs(num).toLocaleString('ko-KR')}`;
    return num.toLocaleString('ko-KR');
  };

  const getChangeColor = (change: number, isNegativeGood: boolean = false) => {
    if (change === 0) return 'text-gray-600';
    if (isNegativeGood) {
      return change < 0 ? 'text-emerald-600' : 'text-red-600';
    }
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">✅ 정상</span>;
      case 'warning':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">🟡 경계</span>;
      case 'danger':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">🔴 장기</span>;
      default:
        return null;
    }
  };

  const renderSectionHeader = (
    sectionKey: string,
    title: string,
    dec24: number,
    dec25: number,
    change: number,
    changePercent: number,
    bgClass: string
  ) => (
    <tr
      className={`${bgClass} cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={() => toggleSection(sectionKey)}
    >
      <td className="px-4 py-3 font-bold text-gray-800 flex items-center gap-2">
        {expandedSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </td>
      <td className="px-4 py-3 text-right font-semibold">{formatNumber(dec24)}</td>
      <td className="px-4 py-3 text-right font-semibold bg-yellow-50">{formatNumber(dec25)}</td>
      <td className={`px-4 py-3 text-right font-semibold ${getChangeColor(change)}`}>
        {change > 0 ? '+' : ''}{formatNumber(change)}
      </td>
      <td className={`px-4 py-3 text-right font-semibold ${getChangeColor(changePercent)}`}>
        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
      </td>
    </tr>
  );

  const renderSubRows = (sectionKey: string, items: BalanceSheetItem[]) => {
    return items.map((item, idx) => {
      const isVisible = item.isAlwaysVisible || expandedSections[sectionKey];
      if (!isVisible) return null;

      return (
        <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${item.isSubItem ? 'text-gray-600' : ''}`}>
          <td className={`px-4 py-2 ${item.isSubItem ? 'pl-10' : 'pl-8'} ${item.isSubItem ? 'text-sm' : ''}`}>
            {item.label}
          </td>
          <td className="px-4 py-2 text-right">{formatNumber(item.dec24)}</td>
          <td className={`px-4 py-2 text-right ${item.highlight ? 'bg-yellow-50' : ''}`}>{formatNumber(item.dec25)}</td>
          <td className={`px-4 py-2 text-right ${getChangeColor(item.change)}`}>
            {item.change > 0 ? '+' : ''}{formatNumber(item.change)}
          </td>
          <td className={`px-4 py-2 text-right ${getChangeColor(item.changePercent)}`}>
            {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
          </td>
        </tr>
      );
    });
  };

  // CSV 기준 총계 계산
  const totalAssets = { dec24: 19248, dec25: 22448 };
  const totalLiabilities = { dec24: 4309, dec25: 4144 };
  const totalEquity = { dec24: 14939, dec25: 18304 };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3c72] border-l-4 border-[#2a5298] pl-4">
        1. 재무상태표 (B/S) - 25년 12월 기준
      </h1>

      {/* 전체 접기/펴기 버튼 */}
      <button
        onClick={toggleAll}
        className="px-4 py-2 bg-gradient-to-r from-[#2a5298] to-[#1e3c72] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
      >
        전체 접기/펴기
      </button>

      {/* 재무상태표 테이블 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-[200px]">계정과목</th>
              <th className="px-4 py-3 text-right font-semibold w-[120px]">24년 12월</th>
              <th className="px-4 py-3 text-right font-semibold w-[120px]">25년 12월</th>
              <th className="px-4 py-3 text-right font-semibold w-[100px]">증감</th>
              <th className="px-4 py-3 text-right font-semibold w-[80px]">증감률</th>
            </tr>
          </thead>
          <tbody>
            {/* 자산 섹션 */}
            {renderSectionHeader('asset', '자산총계', totalAssets.dec24, totalAssets.dec25, totalAssets.dec25 - totalAssets.dec24, ((totalAssets.dec25 - totalAssets.dec24) / totalAssets.dec24 * 100), 'bg-gradient-to-r from-blue-100 to-blue-50')}
            {renderSubRows('asset', assetItems)}

            {/* 부채 섹션 */}
            {renderSectionHeader('liability', '부채총계', totalLiabilities.dec24, totalLiabilities.dec25, totalLiabilities.dec25 - totalLiabilities.dec24, ((totalLiabilities.dec25 - totalLiabilities.dec24) / totalLiabilities.dec24 * 100), 'bg-gradient-to-r from-red-100 to-red-50')}
            {renderSubRows('liability', liabilityItems)}

            {/* 자본 섹션 */}
            {renderSectionHeader('equity', '자본총계', totalEquity.dec24, totalEquity.dec25, totalEquity.dec25 - totalEquity.dec24, ((totalEquity.dec25 - totalEquity.dec24) / totalEquity.dec24 * 100), 'bg-gradient-to-r from-emerald-100 to-emerald-50')}
            {renderSubRows('equity', equityItems)}
          </tbody>
        </table>
      </div>

      {/* 참고사항 */}
      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>📌 참고사항:</strong><br />
        • 25년 12월은 가결산 재무제표 (F&F 월별재무제표(25.12).csv 기준)<br />
        • 25년 5월 무차입 경영 달성 (차입금 전액 상환)<br />
        • 증감은 24년 12월 vs 25년 12월 기준<br />
        • 금액 단위: 억원
      </div>

      {/* 운전자본 분석 */}
      <h2 className="text-xl font-bold text-[#1e3c72] border-l-4 border-orange-400 pl-4 mt-8">
        운전자본 분석 (25년 12월 기준)
      </h2>

      <button
        onClick={() => {
          setExpandedSections(prev => ({
            ...prev,
            arDetail: !prev.arDetail,
            invDetail: !prev.invDetail,
          }));
        }}
        className="px-4 py-2 bg-gradient-to-r from-[#2a5298] to-[#1e3c72] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
      >
        전체 접기/펴기
      </button>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-[200px]">구분</th>
              <th className="px-4 py-3 text-right font-semibold w-[140px]">24년 12월</th>
              <th className="px-4 py-3 text-right font-semibold w-[140px]">25년 12월</th>
              <th className="px-4 py-3 text-right font-semibold w-[120px]">증감</th>
              <th className="px-4 py-3 text-right font-semibold w-[80px]">증감률</th>
            </tr>
          </thead>
          <tbody>
            {/* 매출채권 섹션 */}
            <tr
              className="bg-gradient-to-r from-blue-100 to-blue-50 cursor-pointer hover:opacity-90"
              onClick={() => toggleSection('arDetail')}
            >
              <td className="px-4 py-3 font-semibold flex items-center gap-2">
                {expandedSections.arDetail ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                📊 매출채권 <span className="text-xs text-gray-500 font-normal">※ 대손충당금·외화평가 미반영</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold">1,324</td>
              <td className="px-4 py-3 text-right font-semibold">2,180</td>
              <td className="px-4 py-3 text-right font-semibold text-red-600">+856</td>
              <td className="px-4 py-3 text-right font-semibold text-red-600">+64.7%</td>
            </tr>
            {expandedSections.arDetail && workingCapitalAR.map((item, idx) => (
              <tr key={idx} className={`border-b border-gray-100 ${item.warning ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <td className={`px-4 py-2 pl-10 ${item.warning ? 'text-orange-700 font-medium' : ''}`}>
                  {item.label} {item.warning && '⚠️'}
                </td>
                <td className="px-4 py-2 text-right">{formatNumber(item.dec24)}</td>
                <td className="px-4 py-2 text-right">{formatNumber(item.dec25)}</td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.change)}`}>
                  {item.change > 0 ? '+' : ''}{formatNumber(item.change)}
                </td>
                <td className={`px-4 py-2 text-right ${getChangeColor(item.changePercent)}`}>
                  {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                </td>
              </tr>
            ))}

            {/* 재고자산 섹션 */}
            <tr
              className="bg-gradient-to-r from-blue-100 to-blue-50 cursor-pointer hover:opacity-90"
              onClick={() => toggleSection('invDetail')}
            >
              <td className="px-4 py-3 font-semibold flex items-center gap-2">
                {expandedSections.invDetail ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                📦 재고자산
              </td>
              <td className="px-4 py-3 text-right font-semibold">2,253</td>
              <td className="px-4 py-3 text-right font-semibold">2,303</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-600">+50</td>
              <td className="px-4 py-3 text-right font-semibold">+2.2%</td>
            </tr>
            {expandedSections.invDetail && workingCapitalInv.map((brand, idx) => (
              <div key={`brand-wrapper-${idx}`}>
                <tr key={`brand-${idx}`} className="bg-blue-50">
                  <td colSpan={5} className="px-4 py-2 pl-8 font-semibold text-blue-700">{brand.label}</td>
                </tr>
                {brand.subItems.map((item, subIdx) => (
                  <tr key={`item-${idx}-${subIdx}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 pl-12 text-gray-600">{item.label}</td>
                    <td className="px-4 py-2 text-right">{item.dec24}</td>
                    <td className="px-4 py-2 text-right">{item.dec25}</td>
                    <td className={`px-4 py-2 text-right ${getChangeColor(item.change)}`}>
                      {item.change > 0 ? '+' : ''}{item.change}
                    </td>
                    <td className={`px-4 py-2 text-right ${getChangeColor(item.changePercent)}`}>
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </div>
            ))}

            {/* 매입채무 */}
            <tr className="bg-blue-50">
              <td className="px-4 py-3 font-semibold">💳 매입채무</td>
              <td className="px-4 py-3 text-right font-semibold">798</td>
              <td className="px-4 py-3 text-right font-semibold">862</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-600">+64</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-600">+8.0%</td>
            </tr>

            {/* 순운전자본 */}
            <tr className="bg-gradient-to-r from-amber-100 to-amber-50 font-bold">
              <td className="px-4 py-3 text-center">순운전자본 (AR+INV−AP)</td>
              <td className="px-4 py-3 text-right">2,779</td>
              <td className="px-4 py-3 text-right">3,621</td>
              <td className="px-4 py-3 text-right text-red-600">+842</td>
              <td className="px-4 py-3 text-right text-red-600">+30.3%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 회전율 분석 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-orange-400">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">📊 회전율 분석 (연환산 기준)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-100">
                <th className="px-4 py-2 text-left font-semibold">지표</th>
                <th className="px-4 py-2 text-right font-semibold">24년</th>
                <th className="px-4 py-2 text-right font-semibold">25년</th>
                <th className="px-4 py-2 text-right font-semibold">증감</th>
                <th className="px-4 py-2 text-center font-semibold">평가</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="border-b">
                <td className="px-4 py-2">재고회전일수 (DIO)</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dio.previous)}일</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dio.current)}일</td>
                <td className={`px-4 py-2 text-right ${turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? '△' : '+'}{Math.abs(Math.round(turnoverMetrics.dio.current - turnoverMetrics.dio.previous))}일
                </td>
                <td className="px-4 py-2 text-center">{turnoverMetrics.dio.current - turnoverMetrics.dio.previous < 0 ? '✔✔' : '⚠️'}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2">매출채권회전일수 (DSO)</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dso.previous)}일</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dso.current)}일</td>
                <td className={`px-4 py-2 text-right ${turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? '+' : '△'}{Math.abs(Math.round(turnoverMetrics.dso.current - turnoverMetrics.dso.previous))}일
                </td>
                <td className="px-4 py-2 text-center">{turnoverMetrics.dso.current - turnoverMetrics.dso.previous > 0 ? '⚠️' : '✔'}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2">매입채무회전일수 (DPO)</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dpo.previous)}일</td>
                <td className="px-4 py-2 text-right">{Math.round(turnoverMetrics.dpo.current)}일</td>
                <td className={`px-4 py-2 text-right ${Math.abs(turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous) < 3 ? '' : turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.round(turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous) === 0 ? '0' : (turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous > 0 ? '+' : '△') + Math.abs(Math.round(turnoverMetrics.dpo.current - turnoverMetrics.dpo.previous))}일
                </td>
                <td className="px-4 py-2 text-center">✔</td>
              </tr>
              <tr className="bg-amber-50 font-bold">
                <td className="px-4 py-3 text-center">현금전환주기 (CCC)</td>
                <td className="px-4 py-3 text-right">{Math.round(turnoverMetrics.ccc.previous)}일</td>
                <td className="px-4 py-3 text-right">{Math.round(turnoverMetrics.ccc.current)}일</td>
                <td className={`px-4 py-3 text-right ${turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous > 0 ? '+' : '△'}{Math.abs(Math.round(turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous))}일
                </td>
                <td className="px-4 py-3 text-center">{Math.abs(turnoverMetrics.ccc.current - turnoverMetrics.ccc.previous) < 5 ? '✔' : '⚠️'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 여신기준 검증 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-6 border-2 border-orange-400">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">📋 여신기준 검증 (10~12월 매출 대비 채권)</h3>
        <p className="text-sm text-amber-700 mb-4">※ 통상 여신기간 1~2개월 기준으로 채권 잔액 적정성 검증 (월수 = 채권 ÷ 월평균매출)</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-orange-500 text-white">
                <th className="px-3 py-2 text-left font-semibold">구분</th>
                <th className="px-3 py-2 text-right font-semibold">10월</th>
                <th className="px-3 py-2 text-right font-semibold">11월</th>
                <th className="px-3 py-2 text-right font-semibold">12월</th>
                <th className="px-3 py-2 text-right font-semibold">12월말 채권</th>
                <th className="px-3 py-2 text-right font-semibold">채권/매출</th>
                <th className="px-3 py-2 text-right font-semibold">월수 환산</th>
                <th className="px-3 py-2 text-right font-semibold">전년 월수</th>
                <th className="px-3 py-2 text-center font-semibold">판정</th>
                <th className="px-3 py-2 text-left font-semibold min-w-[280px]">비고</th>
              </tr>
            </thead>
            <tbody>
              {creditVerification.map((item, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${
                    item.status === 'danger' ? 'bg-red-50' :
                    item.status === 'warning' ? 'bg-amber-50' : ''
                  }`}
                >
                  <td className={`px-3 py-2 font-semibold ${item.status === 'danger' ? 'text-red-700' : ''}`}>
                    {item.channel} {item.status === 'danger' && '⚠️'}
                  </td>
                  <td className="px-3 py-2 text-right">{item.oct}억</td>
                  <td className="px-3 py-2 text-right">{item.nov}억</td>
                  <td className="px-3 py-2 text-right">{item.dec}억</td>
                  <td className={`px-3 py-2 text-right ${item.status === 'danger' ? 'text-red-700 font-semibold' : ''}`}>
                    {item.arBalance}억
                  </td>
                  <td className={`px-3 py-2 text-right ${item.status === 'danger' ? 'text-red-700 font-semibold' : item.status === 'warning' ? 'text-orange-600' : ''}`}>
                    {item.arRatio}%
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${item.status === 'danger' ? 'text-red-700' : ''}`}>
                    {item.months}개월
                  </td>
                  <td className="px-3 py-2 text-right">{item.prevMonths}개월</td>
                  <td className="px-3 py-2 text-center">{getStatusBadge(item.status)}</td>
                  <td className="px-3 py-2 text-left text-xs text-gray-600">
                    {item.notes.map((note, noteIdx) => (
                      <div key={noteIdx}>{note}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 요약 박스 */}
        <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-orange-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong className="text-emerald-700">✅ 정상 채널:</strong>
              <p className="text-sm mt-1">• 국내: 1.1개월 (여신 범위 내, 전년 대비 개선)</p>
              <p className="text-sm">• 수출-기타: 1.3개월 (전년 1.7개월 대비 개선)</p>
            </div>
            <div>
              <strong className="text-red-700">🔴 조치 필요 (Snowflake 검증):</strong>
              <p className="text-sm mt-1">• 중국: AR 8,316억 / 월평균 638억 = <strong>13.0개월</strong></p>
              <p className="text-sm">• 홍콩: AR 293억 / 월평균 20억 = <strong>14.4개월</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 지표 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">부채비율</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">{((totalLiabilities.dec25 / totalEquity.dec25) * 100).toFixed(1)}%</p>
          <p className="text-sm text-emerald-600">전년 {((totalLiabilities.dec24 / totalEquity.dec24) * 100).toFixed(1)}% → △{(((totalLiabilities.dec24 / totalEquity.dec24) * 100) - ((totalLiabilities.dec25 / totalEquity.dec25) * 100)).toFixed(1)}%p 개선</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-emerald-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">자기자본비율</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">{((totalEquity.dec25 / totalAssets.dec25) * 100).toFixed(1)}%</p>
          <p className="text-sm text-emerald-600">전년 {((totalEquity.dec24 / totalAssets.dec24) * 100).toFixed(1)}% → +{(((totalEquity.dec25 / totalAssets.dec25) * 100) - ((totalEquity.dec24 / totalAssets.dec24) * 100)).toFixed(1)}%p 개선</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-500 mb-1">순차입금비율</h3>
          <p className="text-2xl font-bold text-[#1e3c72]">△14.8%</p>
          <p className="text-sm text-emerald-600">무차입 경영 유지 (현금 &gt; 차입금)</p>
        </div>
      </div>

      {/* 계산식 참고 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📐 재무비율 및 운전자본 계산식</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">안정성 지표</h4>
            <ul className="space-y-1">
              <li>• 부채비율 = 총부채 ÷ 자기자본 × 100</li>
              <li>• 자기자본비율 = 자기자본 ÷ 총자산 × 100</li>
              <li>• 순차입금비율 = (차입금-현금) ÷ 자기자본 × 100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">운전자본 지표</h4>
            <ul className="space-y-1">
              <li>• 순운전자본 = 매출채권 + 재고자산 - 매입채무</li>
              <li>• 매출채권회전율 = 매출액 ÷ 평균매출채권</li>
              <li>• 재고자산회전율 = 매출원가 ÷ 평균재고자산</li>
              <li>• 매입채무회전율 = 매출원가 ÷ 평균매입채무</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">회전일수 (Cash Conversion Cycle)</h4>
            <ul className="space-y-1">
              <li>• DSO (매출채권) = 365 ÷ 매출채권회전율</li>
              <li>• DIO (재고자산) = 365 ÷ 재고자산회전율</li>
              <li>• DPO (매입채무) = 365 ÷ 매입채무회전율</li>
              <li>• CCC = DSO + DIO - DPO</li>
              <li>• 여신월수 = 채권잔액 ÷ 월평균매출</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

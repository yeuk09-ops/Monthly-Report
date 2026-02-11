import json

# Read existing data
with open('src/data/2026-01.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add unified insights structure
data['unifiedInsights'] = {
    "positive": [
        {
            "keyword": "💰 현금창출력 극대화",
            "analysis": "<span class='font-semibold text-blue-600'>CCC 46일 달성</span>(전년 73일 대비 <strong class='text-emerald-600'>△37% 개선</strong>) + <span class='bg-emerald-100 px-1 py-0.5 rounded'>무차입 경영</span>(차입금 200억→0억) + <span class='font-semibold text-blue-600'>현금 219% 급증</span>(990억→3,158억). 운전자본 효율성 극대화로 <strong>자유현금흐름(FCF) 창출력</strong>이 업계 최고 수준 도달",
            "action": "M&A·배당·자사주매입 등 적극적 주주환원 정책 실행. 1분기 중 주주환원 로드맵 발표 권장"
        },
        {
            "keyword": "📈 프리미엄 포지셔닝 성공",
            "analysis": "<span class='font-semibold text-blue-600'>매출총이익률 64.9% 방어</span>(전년 64.8%) + <span class='bg-blue-100 px-1 py-0.5 rounded'>수출비중 54.4%</span>. 원가 상승 압력 속에서도 <strong class='text-emerald-600'>가격결정력(Pricing Power)</strong> 유지. <span class='font-semibold'>MLB 브랜드</span>의 프리미엄 이미지가 마진 방어의 핵심 동력",
            "action": "고가 라인(프리미엄 콜라보·리미티드 에디션) 확대 전략. 럭셔리 백화점 채널 추가 입점 검토"
        },
        {
            "keyword": "🔄 재고관리 고도화",
            "analysis": "<span class='bg-emerald-100 px-1 py-0.5 rounded'>재고회전일수 6일 단축</span>(59일→53일) + <span class='bg-emerald-100 px-1 py-0.5 rounded'>매입채무회전일수 19일 연장</span>(38일→57일). 공급망 협상력 강화 및 <strong class='text-blue-600'>적기 재고관리</strong> 시스템 효과. 현금흐름 개선의 핵심 요인",
            "action": "AI 기반 수요예측 시스템 고도화. 시즌별 재고 턴오버 KPI 모니터링 강화"
        },
        {
            "keyword": "💎 자본 축적 가속화",
            "analysis": "<span class='font-semibold text-blue-600'>이익잉여금 26.5% 증가</span>(1조 2,645억→1조 5,999억) + <span class='font-semibold text-emerald-600'>자기자본비율 81.3%</span>. 경기 침체기에도 견딜 수 있는 <span class='bg-blue-100 px-1 py-0.5 rounded'>재무 완충력(Financial Cushion)</span> 확보. <strong>ROE 19.7%</strong> 유지 시 3년 내 자본 2배 달성 가능",
            "action": "신규 브랜드 인수(M&A) 또는 해외 직진출 검토. 자본력 기반 공격적 성장 전략 수립"
        }
    ],
    "warning": [
        {
            "keyword": "⚠️ 중국 출고 일시 조정",
            "analysis": "수출매출 <span class='font-semibold text-amber-600'>5.9% 감소</span>(947억→891억)는 <span class='bg-amber-100 px-1 py-0.5 rounded'>중국 현지 재고 최적화</span>를 위한 국내출고 조정에 기인. <strong>2~3월 정상화 예상</strong>되나, <span class='font-semibold'>중국 시장 의존도 약 40%</span>를 고려 시 지속 모니터링 필요",
            "action": "동남아(베트남·태국) 및 북미 시장 다각화 전략 가속화. 중국 의존도 30% 수준으로 단계적 축소"
        },
        {
            "keyword": "⚠️ TP채권 장기화 리스크",
            "analysis": "매출채권 <span class='font-semibold text-amber-600'>19.3% 급증</span>(1,970억→2,350억) 중 <span class='bg-red-100 px-1 py-0.5 rounded font-semibold'>홍콩/대만 TP채권 회수기간 10.5개월</span>(정상 3개월 대비 <strong>3.5배</strong>). TP채권 특성상 장기화 불가피하나 <strong>유동성 리스크 및 대손 가능성</strong> 상존",
            "action": "TP채권 211억 별도 관리. 홍콩/대만 법인 신용등급 정기 모니터링. 필요 시 대손충당금 적립 검토"
        },
        {
            "keyword": "⚠️ 채널 수수료 상승 압력",
            "analysis": "<span class='font-semibold text-amber-600'>점수수료 5.5% 증가</span>(163억→172억)는 <span class='bg-amber-100 px-1 py-0.5 rounded'>백화점 채널 비중 확대</span> 시사. 고마진 채널 확대는 긍정적이나 <span class='font-semibold text-amber-600'>점수수료율 10.5%</span> 상승은 <strong>순수익성(Net Profit Margin) 압박 요인</strong>",
            "action": "채널별 ROI 정밀 분석 후 최적 채널 믹스 재설계. 온라인 D2C(Direct-to-Consumer) 비중 확대 검토"
        },
        {
            "keyword": "⚠️ 법인세 현금유출 준비",
            "analysis": "법인세부채 <span class='font-semibold text-amber-600'>26.2% 증가</span>(811억→1,023억)는 높은 수익성의 반증이나, 1분기 <span class='bg-amber-100 px-1 py-0.5 rounded'>세금 납부 시 현금 1,000억 이상 유출</span> 예상. 현금흐름 관리 주의 필요",
            "action": "1분기 세금 납부 후 현금 포지션 점검. 연구개발비·투자세액공제 적극 활용으로 실효 세율 최적화"
        }
    ]
}

# Write updated data
with open('src/data/2026-01.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('unifiedInsights added successfully!')

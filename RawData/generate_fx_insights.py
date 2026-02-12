#!/usr/bin/env python3
"""
FX Strategic Insights Generator

Generates executive-level FX insights for the dashboard based on:
- Position sizes and exposures
- Exchange rate trends from Snowflake
- Natural hedge effectiveness
- Sensitivity analysis
- Volatility and risk metrics

Usage:
    python generate_fx_insights.py --month 2026-01 --output ../fnf-dashboard_v2/src/data/2026-01.json
"""

import json
import argparse
import os
import snowflake.connector
from datetime import datetime
from typing import Dict, List, Any, Optional


class FXInsightGenerator:
    """Generate strategic FX insights for executive summary"""

    def __init__(self, fx_report_data: Dict[str, Any], snowflake_conn: Optional[snowflake.connector.SnowflakeConnection] = None):
        self.fx_data = fx_report_data
        self.conn = snowflake_conn
        self.insights = {
            'positive': [],
            'warning': []
        }

    def analyze_position_risk(self) -> None:
        """Analyze large FX position exposures and generate warnings"""
        valuations = self.fx_data.get('valuations', [])

        for val in valuations:
            currency = val.get('currency', '')
            currency_name = val.get('currencyName', '')
            fx_balance = val.get('fxBalance', 0)
            book_amount_krw = val.get('bookAmountKRW', 0)
            valuation_gain_loss = val.get('valuationGainLoss', 0)
            book_rate = val.get('bookRate', 0)
            end_rate = val.get('endRate', 0)
            val_type = val.get('type', '')

            # Focus on receivables (채권) with large exposure
            if val_type == 'receivable' and abs(book_amount_krw) > 50_000_000_000:  # > 500억
                # Calculate ±5% sensitivity
                sensitivity_5pct = (fx_balance * end_rate * 0.05) / 100_000_000  # in 억원

                # Get volatility from rate ranges
                volatility = self._get_volatility(currency)

                insight = {
                    "keyword": f"⚠️ {currency} 환노출 리스크",
                    "analysis": (
                        f"{currency} 채권 <strong>{fx_balance/1_000_000:.1f}M {currency_name}</strong> "
                        f"(<strong>{abs(book_amount_krw)/100_000_000:.0f}억원</strong>) 보유 중. "
                        f"1월 환율 변동성 <span class='bg-amber-100'>{volatility:.2f}%</span>로 "
                        f"±5% 환율 변동 시 <strong>±{abs(sensitivity_5pct):.0f}억원</strong> 평가손익 발생"
                    ),
                    "action": f"{currency} 선물환 헤지 전략 검토. 주요 채권 회수 일정 점검"
                }

                self.insights['warning'].append(insight)
                break  # Only add one large position warning (CNY is the main one)

    def analyze_natural_hedge(self) -> None:
        """Analyze USD natural hedge status (deposits vs payables)"""
        valuations = self.fx_data.get('valuations', [])

        # Find USD positions
        usd_payables = sum(v['fxBalance'] for v in valuations
                          if v.get('currency') == 'USD' and v.get('type') == 'payable')
        usd_deposits = sum(v['fxBalance'] for v in valuations
                          if v.get('currency') == 'USD' and v.get('type') == 'deposit')

        if abs(usd_payables) > 0 and usd_deposits > 0:
            hedge_ratio = (usd_deposits / abs(usd_payables)) * 100

            if hedge_ratio > 100:  # Over-hedged - positive
                payables_krw = sum(v['bookAmountKRW'] for v in valuations
                                  if v.get('currency') == 'USD' and v.get('type') == 'payable')
                deposits_krw = sum(v['bookAmountKRW'] for v in valuations
                                  if v.get('currency') == 'USD' and v.get('type') == 'deposit')

                insight = {
                    "keyword": "💱 USD 자연 헤지 최적화",
                    "analysis": (
                        f"USD 채무 <span class='text-red-600'>{abs(usd_payables)/1_000_000:.1f}M USD</span> 대비 "
                        f"USD 예금 <strong>{usd_deposits/1_000_000:.1f}M USD</strong> 보유로 "
                        f"<span class='bg-emerald-100'>{hedge_ratio:.0f}% 커버율</span> 달성. "
                        f"환율 리스크 <strong>자연 상쇄</strong> 구조"
                    ),
                    "action": "현 포지션 유지. USD 예금 활용한 채무 상환 타이밍 최적화"
                }

                self.insights['positive'].append(insight)

    def analyze_rate_trends(self, target_month: str = '2026-02') -> None:
        """
        Compare book rates vs current/February 2026 trends

        Args:
            target_month: Format 'YYYY-MM' for Snowflake query
        """
        if not self.conn:
            # Fallback: Use existing rate trend data
            self._analyze_rate_trends_from_json()
            return

        # Query Snowflake for February 2026 rates
        try:
            cursor = self.conn.cursor()

            # Convert target_month to date range
            year, month = target_month.split('-')
            start_date = f"{year}-{month}-01"

            if month == '12':
                end_year = str(int(year) + 1)
                end_month = '01'
            else:
                end_year = year
                end_month = f"{int(month)+1:02d}"
            end_date = f"{end_year}-{end_month}-01"

            query = """
            SELECT
                SOURCE_CRNCY,
                AVG(EXCHN_RATE) as AVG_RATE,
                MIN(EXCHN_RATE) as MIN_RATE,
                MAX(EXCHN_RATE) as MAX_RATE
            FROM FNF.FNCO.HST_EXCHN_RATE
            WHERE TARGET_CRNCY = 'KRW'
              AND SOURCE_CRNCY IN ('CNY', 'USD', 'HKD')
              AND EFCT_START_DT >= %s
              AND EFCT_START_DT < %s
            GROUP BY SOURCE_CRNCY
            """

            cursor.execute(query, (start_date, end_date))
            feb_rates = {row[0]: {'avg': row[1], 'min': row[2], 'max': row[3]}
                        for row in cursor.fetchall()}

            # Analyze CNY trend
            self._analyze_cny_trend(feb_rates.get('CNY'))

            cursor.close()

        except Exception as e:
            print(f"Snowflake query failed: {e}")
            # Fallback to JSON data
            self._analyze_rate_trends_from_json()

    def _analyze_rate_trends_from_json(self) -> None:
        """Fallback: Analyze trends from existing rateTrends data"""
        rate_trends = self.fx_data.get('rateTrends', [])
        if not rate_trends:
            return

        # Get latest (most recent) CNY rate
        latest_rates = [t for t in rate_trends if t.get('CNY')]
        if not latest_rates:
            return

        latest_cny = latest_rates[-1].get('CNY', 0)

        # Get CNY book rate from valuations
        valuations = self.fx_data.get('valuations', [])
        cny_valuation = next((v for v in valuations
                             if v.get('currency') == 'CNY' and v.get('type') == 'receivable'), None)

        if cny_valuation:
            self._analyze_cny_trend({'avg': latest_cny}, cny_valuation)

    def _analyze_cny_trend(self, feb_rates: Optional[Dict], cny_valuation: Optional[Dict] = None) -> None:
        """Generate CNY rate trend insight"""
        if not feb_rates:
            return

        # Get CNY valuation data
        if not cny_valuation:
            valuations = self.fx_data.get('valuations', [])
            cny_valuation = next((v for v in valuations
                                 if v.get('currency') == 'CNY' and v.get('type') == 'receivable'), None)

        if not cny_valuation:
            return

        feb_cny_avg = feb_rates.get('avg', 0)
        cny_book_rate = cny_valuation.get('bookRate', 0)
        cny_receivables_krw = cny_valuation.get('bookAmountKRW', 0)

        if feb_cny_avg == 0 or cny_book_rate == 0:
            return

        # Calculate rate change
        rate_change_pct = ((feb_cny_avg - cny_book_rate) / cny_book_rate) * 100

        # Generate insight if significant trend (> 1.5% change)
        if rate_change_pct < -1.5:
            # CNY weakening - negative for receivables
            impact = cny_receivables_krw * (rate_change_pct / 100)

            insight = {
                "keyword": "📉 CNY 환율 하락 트렌드",
                "analysis": (
                    f"CNY 환율 2월 <strong>{feb_cny_avg:.1f}원</strong>으로 "
                    f"1월 장부환율 {cny_book_rate:.1f}원 대비 "
                    f"<span class='text-blue-600'>▼{abs(rate_change_pct):.1f}%</span> 하락. "
                    f"보유 채권 <span class='font-semibold'>{abs(impact)/100_000_000:.0f}억원 추가 평가손실</span> 가능성"
                ),
                "action": f"CNY 채권 조기 회수 검토. 환율 {feb_cny_avg*0.98:.0f}원 하회 시 헤지 전략 실행"
            }

            self.insights['warning'].append(insight)

        elif rate_change_pct > 1.5:
            # CNY strengthening - positive for receivables
            impact = cny_receivables_krw * (rate_change_pct / 100)

            insight = {
                "keyword": "📈 CNY 환율 상승 트렌드",
                "analysis": (
                    f"CNY 환율 2월 <strong>{feb_cny_avg:.1f}원</strong>으로 "
                    f"1월 장부환율 {cny_book_rate:.1f}원 대비 "
                    f"<span class='text-emerald-600'>▲{rate_change_pct:.1f}%</span> 상승. "
                    f"보유 채권 <span class='font-semibold'>{impact/100_000_000:.0f}억원 평가이익</span> 기대"
                ),
                "action": "CNY 환율 상승 추세 지속 시 채권 회수 일정 유연화 검토"
            }

            self.insights['positive'].append(insight)

    def recommend_hedging_strategy(self) -> None:
        """Generate hedging strategy recommendations based on volatility and exposure"""
        rate_ranges = self.fx_data.get('rateRanges', [])

        for rate_range in rate_ranges:
            currency = rate_range.get('currency', '')

            if currency != 'CNY':  # Focus on CNY (largest exposure)
                continue

            # Calculate volatility
            min_rate = rate_range.get('min', 0)
            max_rate = rate_range.get('max', 0)
            avg_rate = rate_range.get('avg', 0)

            if avg_rate == 0:
                continue

            volatility = ((max_rate - min_rate) / avg_rate) * 100

            # Get net exposure
            valuations = self.fx_data.get('valuations', [])
            cny_valuations = [v for v in valuations if v.get('currency') == 'CNY']
            net_exposure_krw = sum(v.get('bookAmountKRW', 0) for v in cny_valuations)

            # Recommend hedging if high volatility + large exposure
            if volatility > 3.0 and abs(net_exposure_krw) > 50_000_000_000:  # > 500억
                target_hedge_ratio = 30  # 30% target
                hedge_amount_krw = abs(net_exposure_krw) * 0.3

                insight = {
                    "keyword": "🛡️ 환헤지 전략 검토 필요",
                    "analysis": (
                        f"CNY 변동성 <span class='font-semibold'>{volatility:.1f}%</span>로 높은 수준. "
                        f"순포지션 {abs(net_exposure_krw)/100_000_000:.0f}억원 고려 시 "
                        f"<span class='bg-amber-100'>선물환 헤지</span> 검토 권장"
                    ),
                    "action": f"목표 헤지비율 {target_hedge_ratio}% 설정. CNY 선물환 {hedge_amount_krw/100_000_000:.0f}억원 견적 요청"
                }

                self.insights['warning'].append(insight)
                break

    def _get_volatility(self, currency: str) -> float:
        """Get volatility for a currency from rateRanges"""
        rate_ranges = self.fx_data.get('rateRanges', [])

        for rate_range in rate_ranges:
            if rate_range.get('currency') == currency:
                min_rate = rate_range.get('min', 0)
                max_rate = rate_range.get('max', 0)
                avg_rate = rate_range.get('avg', 0)

                if avg_rate > 0:
                    return ((max_rate - min_rate) / avg_rate) * 100

        return 0.0

    def generate_all_insights(self, target_month: str = '2026-02') -> Dict[str, List[Dict]]:
        """
        Generate all FX insights

        Returns:
            Dict with 'positive' and 'warning' lists
        """
        # 1. Position risk analysis
        self.analyze_position_risk()

        # 2. Natural hedge analysis
        self.analyze_natural_hedge()

        # 3. Rate trend analysis
        self.analyze_rate_trends(target_month)

        # 4. Hedging recommendations
        self.recommend_hedging_strategy()

        return self.insights


def connect_to_snowflake() -> Optional[snowflake.connector.SnowflakeConnection]:
    """Connect to Snowflake database"""
    try:
        conn = snowflake.connector.connect(
            user=os.getenv('SNOWFLAKE_USER'),
            password=os.getenv('SNOWFLAKE_PASSWORD'),
            account=os.getenv('SNOWFLAKE_ACCOUNT'),
            warehouse='ADHOC_WH',
            database='FNF',
            schema='FNCO'
        )
        return conn
    except Exception as e:
        print(f"Snowflake connection failed: {e}")
        print("Falling back to JSON-based analysis")
        return None


def load_json_data(filepath: str) -> Dict[str, Any]:
    """Load JSON data file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_data(filepath: str, data: Dict[str, Any]) -> None:
    """Save JSON data file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description='Generate FX strategic insights')
    parser.add_argument('--month', required=True, help='Target month (YYYY-MM)')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--no-snowflake', action='store_true', help='Skip Snowflake connection')

    args = parser.parse_args()

    # Load existing JSON data
    print(f"Loading data from {args.output}...")
    data = load_json_data(args.output)

    # Extract FX report data
    fx_report = data.get('fxReport', {})
    if not fx_report:
        print("Error: No fxReport section found in JSON")
        return

    # Connect to Snowflake (optional)
    conn = None if args.no_snowflake else connect_to_snowflake()

    # Generate insights
    print("Generating FX insights...")
    generator = FXInsightGenerator(fx_report, conn)
    fx_insights = generator.generate_all_insights(target_month=args.month)

    # Close Snowflake connection
    if conn:
        conn.close()

    # Merge into unifiedInsights
    if 'unifiedInsights' not in data:
        data['unifiedInsights'] = {'positive': [], 'warning': []}

    # Add FX insights
    data['unifiedInsights']['positive'].extend(fx_insights['positive'])
    data['unifiedInsights']['warning'].extend(fx_insights['warning'])

    # Save updated data
    print(f"Saving updated data to {args.output}...")
    save_json_data(args.output, data)

    # Print summary (avoid emoji encoding issues)
    print(f"\nGenerated {len(fx_insights['positive'])} positive insights")
    print(f"Generated {len(fx_insights['warning'])} warning insights")

    try:
        print("\nPositive Insights:")
        for insight in fx_insights['positive']:
            print(f"  - {insight['keyword']}")
    except UnicodeEncodeError:
        print("  (Emoji display issue - check JSON file directly)")

    try:
        print("\nWarning Insights:")
        for insight in fx_insights['warning']:
            print(f"  - {insight['keyword']}")
    except UnicodeEncodeError:
        print("  (Emoji display issue - check JSON file directly)")

    print("\nDone!")


if __name__ == '__main__':
    main()

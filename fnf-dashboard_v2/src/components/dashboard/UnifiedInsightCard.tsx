'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';

interface InsightItem {
  keyword: string;
  analysis: string;
  action?: string;
}

interface UnifiedInsightCardProps {
  positiveInsights: InsightItem[];
  warningInsights: InsightItem[];
}

export function UnifiedInsightCard({ positiveInsights, warningInsights }: UnifiedInsightCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />
      <CardHeader className="pb-4 pt-6">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
          <Zap className="w-6 h-6 text-blue-600" />
          AI 재무 인사이트
          <span className="text-sm font-normal text-slate-500 ml-auto">통합 분석 리포트</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 긍정적 시그널 */}
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-emerald-700 mb-4">
            <TrendingUp className="w-5 h-5" />
            성과 분석 (Positive Signals)
          </h3>
          <div className="space-y-4">
            {positiveInsights.map((insight, idx) => (
              <div key={idx} className="bg-emerald-50/50 rounded-lg p-4 border-l-4 border-emerald-500">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-lg font-bold text-emerald-800">{insight.keyword}</p>
                    <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.analysis }} />
                    {insight.action && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-emerald-200">
                        <Target className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-emerald-700">
                          <span className="text-emerald-600">액션플랜:</span> {insight.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 위험 관리 */}
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-amber-700 mb-4">
            <AlertTriangle className="w-5 h-5" />
            위험 관리 (Risk Management)
          </h3>
          <div className="space-y-4">
            {warningInsights.map((insight, idx) => (
              <div key={idx} className="bg-amber-50/50 rounded-lg p-4 border-l-4 border-amber-500">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-lg font-bold text-amber-800">{insight.keyword}</p>
                    <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.analysis }} />
                    {insight.action && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-amber-200">
                        <Target className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-amber-700">
                          <span className="text-amber-600">액션플랜:</span> {insight.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import type { DailySummary, OverallMetricsSummary } from '../types/api';

interface MetricCardsProps {
  summary: DailySummary;
  overall: OverallMetricsSummary | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, overall }) => {
  const isOverforecast = summary.bias_mw > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          DAILY MAE
        </div>
        <div className="font-mono text-2xl font-extrabold text-slate-900 mt-1">
          {summary.mae_mw.toLocaleString()} <span className="text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          WAPE: <strong className="text-[#0F8A43]">{summary.wape_pct}%</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          RMSE (VOLATILITY)
        </div>
        <div className="font-mono text-2xl font-extrabold text-slate-900 mt-1">
          {summary.rmse_mw.toLocaleString()} <span className="text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {summary.rmse_mw > summary.mae_mw * 1.25 ? 'High Swing Variance' : 'Normal Variance'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          DIRECTIONAL BIAS
        </div>
        <div className={`font-mono text-2xl font-extrabold mt-1 ${isOverforecast ? 'text-rose-600' : 'text-blue-600'}`}>
          {summary.bias_mw > 0 ? `+${summary.bias_mw.toLocaleString()}` : summary.bias_mw.toLocaleString()} <span className="text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-xs font-medium mt-1">
          {isOverforecast ? (
            <span className="text-rose-600 font-semibold">Short Position Risk</span>
          ) : (
            <span className="text-blue-600 font-semibold">Renewable Surplus</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-[11px] font-bold text-[#0F8A43] uppercase tracking-wider">
          90% HEDGE BUFFER
        </div>
        <div className="font-mono text-2xl font-extrabold text-[#0F8A43] mt-1">
          {overall ? `±${overall.confidence_buffer_90pct_mw.toLocaleString()} MW` : '...'}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Grid Balancing Reserve
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { DailySummary, OverallMetricsSummary } from '../types/api';

interface MetricCardsProps {
  summary: DailySummary;
  overall: OverallMetricsSummary | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, overall }) => {
  const isOverforecast = summary.bias_mw > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          DAILY MAE
        </div>
        <div className="font-mono text-base sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1 truncate">
          {summary.mae_mw.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
          WAPE: <strong className="text-[#0F8A43]">{summary.wape_pct}%</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          RMSE (VOLATILITY)
        </div>
        <div className="font-mono text-base sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1 truncate">
          {summary.rmse_mw.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
          {summary.rmse_mw > summary.mae_mw * 1.25 ? 'High Variance' : 'Normal Variance'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          DIRECTIONAL BIAS
        </div>
        <div className={`font-mono text-base sm:text-2xl font-extrabold mt-0.5 sm:mt-1 truncate ${isOverforecast ? 'text-rose-600' : 'text-blue-600'}`}>
          {summary.bias_mw > 0 ? `+${summary.bias_mw.toLocaleString()}` : summary.bias_mw.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">MW</span>
        </div>
        <div className="text-[11px] sm:text-xs font-medium mt-0.5 sm:mt-1 truncate">
          {isOverforecast ? (
            <span className="text-rose-600 font-semibold">Short Risk</span>
          ) : (
            <span className="text-blue-600 font-semibold">Surplus</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="text-[10px] sm:text-[11px] font-bold text-[#0F8A43] uppercase tracking-wider truncate">
          90% HEDGE BUFFER
        </div>
        <div className="font-mono text-base sm:text-2xl font-extrabold text-[#0F8A43] mt-0.5 sm:mt-1 truncate">
          {overall ? `±${overall.confidence_buffer_90pct_mw.toLocaleString()} MW` : '...'}
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
          Grid Reserve
        </div>
      </div>
    </div>
  );
};

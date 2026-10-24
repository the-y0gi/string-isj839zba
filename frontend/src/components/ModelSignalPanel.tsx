import React from 'react';
import type { SettlementPeriodRecord, OverallMetricsSummary, DailySummary } from '../types/api';

interface ModelSignalPanelProps {
  summary: DailySummary;
  records: SettlementPeriodRecord[];
  overall: OverallMetricsSummary | null;
}

export const ModelSignalPanel: React.FC<ModelSignalPanelProps> = ({
  summary,
  records,
  overall,
}) => {
  const peakRecord = [...records].sort((a, b) => (b.actual_mw ?? 0) - (a.actual_mw ?? 0))[0];
  const maxOverRecord = [...records].sort((a, b) => (b.error_mw ?? 0) - (a.error_mw ?? 0))[0];

  const peakActual = peakRecord?.actual_mw ?? 0;
  const peakTime = peakRecord?.start_time ? peakRecord.start_time.substring(11, 16) : '18:00';

  const maxOverMW = maxOverRecord?.error_mw ?? 0;
  const maxOverSP = maxOverRecord?.settlement_period ?? 36;
  const maxOverTime = maxOverRecord?.start_time ? maxOverRecord.start_time.substring(11, 16) : '18:00';

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="bg-[#F0FAF4] border border-[#D1F2DE] rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="text-[10px] sm:text-[11px] font-extrabold text-[#0F8A43] uppercase tracking-wider mb-1.5 sm:mb-2">
          MODEL SIGNAL
        </div>
        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-1.5 sm:mb-2">
          {summary.bias_mw > 0
            ? `Evening ramp drives peaker dispatch (+${Math.round(summary.bias_mw)} MW short risk)`
            : `Wind surplus suppresses Day-Ahead clearing price`}
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          {summary.bias_mw > 0
            ? `At SP ${maxOverSP} (${maxOverTime} UTC), wind was over-forecasted by ${Math.round(maxOverMW)} MW. ${
                overall
                  ? `Procuring a +${Math.round(overall.confidence_buffer_90pct_mw)} MW thermal hedge protects against Balancing Mechanism penalties.`
                  : 'Procuring a thermal hedge protects against Balancing Mechanism penalties.'
              }`
            : `Renewable wind exceeded day-ahead expectations by ${Math.abs(Math.round(summary.bias_mw))} MW on average. Utility holds long position; dump power into intraday continuous market.`}
        </p>
      </div>

      <div className="bg-[#1E293B] text-white rounded-xl p-3.5 sm:p-5 shadow-sm">
        <div className="text-[10px] sm:text-[11px] font-extrabold text-[#10B981] uppercase tracking-wider mb-2.5 sm:mb-3">
          WATCH LIST
        </div>

        <ul className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-xs bg-[#10B981] mt-1 shrink-0" />
            <span>
              Peak wind reached <strong>{peakActual.toLocaleString()} MW</strong> at {peakTime} UTC (SP {peakRecord?.settlement_period}).
            </span>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-xs bg-[#10B981] mt-1 shrink-0" />
            <span>
              Gate closure locked at <strong>{summary.decision_cutoff}</strong> (no lookahead bias).
            </span>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-xs bg-[#10B981] mt-1 shrink-0" />
            <span>
              Month-wide 90% confidence reserve: <strong>±{overall?.confidence_buffer_90pct_mw.toLocaleString()} MW</strong>.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

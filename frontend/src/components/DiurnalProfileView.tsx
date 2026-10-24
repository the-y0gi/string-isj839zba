import React from 'react';
import type { DiurnalProfileResponse, OverallMetricsSummary } from '../types/api';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Clock, Info } from 'lucide-react';

interface DiurnalProfileViewProps {
  data: DiurnalProfileResponse | null;
  overall: OverallMetricsSummary | null;
}

export const DiurnalProfileView: React.FC<DiurnalProfileViewProps> = ({ data, overall }) => {
  if (!data || !data.periods) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        Loading Diurnal Time-of-Day Risk Profile...
      </div>
    );
  }

  const chartData = data.periods.map((p) => ({
    sp: p.settlement_period,
    time: p.time_label,
    label: `SP ${p.settlement_period} (${p.time_label})`,
    actual: p.avg_actual_mw,
    forecast: p.avg_forecast_mw,
    mae: p.mae_mw,
    bias: p.bias_mw,
    wape: p.wape_pct,
  }));

  const highestMAE = [...data.periods].sort((a, b) => b.mae_mw - a.mae_mw)[0];
  const highestOverforecast = [...data.periods].sort((a, b) => b.bias_mw - a.bias_mw)[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 mb-4 sm:mb-6 shadow-xs">
      <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-5 flex-col sm:flex-row gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <Clock size={16} />
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
              Diurnal Accuracy Profile (24-Hour Settlement Cycle)
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Aggregated across all 31 days in January 2026. Reveals how forecasting error fluctuates by time of day.
          </p>
        </div>

        <div className="bg-[#E8F7EE] text-[#0F8A43] border border-[#A7F3D0] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase rounded-full whitespace-nowrap">
          31-Day Analysis
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Highest Miss Period
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 sm:mt-1">
            {highestMAE ? `SP ${highestMAE.settlement_period} (${highestMAE.time_label} UTC)` : 'N/A'}
          </div>
          <div className="text-[11px] sm:text-xs text-rose-600 font-semibold mt-0.5">
            MAE: {highestMAE?.mae_mw} MW (WAPE: {highestMAE?.wape_pct}%)
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Peak Over-Forecast Bias
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 sm:mt-1">
            {highestOverforecast ? `SP ${highestOverforecast.settlement_period} (${highestOverforecast.time_label} UTC)` : 'N/A'}
          </div>
          <div className="text-[11px] sm:text-xs text-rose-600 font-semibold mt-0.5">
            Bias: +{highestOverforecast?.bias_mw} MW (Short Risk)
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Overall Month Accuracy
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-[#0F8A43] mt-0.5 sm:mt-1">
            {overall ? `${overall.wape_pct}% WAPE` : '...'}
          </div>
          <div className="text-[11px] sm:text-xs text-emerald-900 font-semibold mt-0.5">
            Avg MAE: {overall?.mae_mw} MW
          </div>
        </div>
      </div>

      <div className="w-full h-[300px] sm:h-[360px] md:h-[380px] mb-4 sm:mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

            <XAxis
              dataKey="sp"
              minTickGap={20}
              stroke="#CBD5E1"
              tick={{ fill: '#64748B', fontSize: 10 }}
              label={{ value: 'Period (1 - 48)', position: 'insideBottom', offset: -12, fill: '#64748B', fontSize: 11, fontWeight: 600 }}
            />

            <YAxis
              yAxisId="left"
              stroke="#CBD5E1"
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#CBD5E1"
              tick={{ fill: '#94A3B8', fontSize: 9 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />

            <Tooltip content={<DiurnalTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="actual"
              name="Avg Actual (MW)"
              stroke="#0F8A43"
              strokeWidth={2}
              dot={false}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="forecast"
              name="Avg Forecast (MW)"
              stroke="#0284C7"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            <Bar
              yAxisId="right"
              dataKey="mae"
              name="MAE (MW)"
              fill="#F59E0B"
              opacity={0.35}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bias"
              name="Mean Bias (MW)"
              stroke="#DC2626"
              strokeWidth={1.8}
              dot={{ r: 1.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <span className="text-[11px] sm:text-xs text-blue-900 leading-relaxed">
          <strong>Trading Insight:</strong> Notice how between Settlement Periods 34 to 40 (16:30 - 20:00 UK Peak Demand), forecast errors coincide with highest wholesale power price spikes. Adding buffer during these evening blocks protects against severe grid imbalance fees.
        </span>
      </div>
    </div>
  );
};

interface DiurnalTooltipItem {
  sp: number;
  time: string;
  actual: number;
  forecast: number;
  mae: number;
  bias: number;
  wape: number;
}

interface DiurnalTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DiurnalTooltipItem }>;
}

const DiurnalTooltip: React.FC<DiurnalTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-300 rounded-xl p-2 sm:p-3 shadow-lg text-xs min-w-[170px] sm:min-w-[200px]">
        <div className="font-extrabold text-slate-900 mb-1 border-b border-slate-100 pb-1">
          Period {data.sp} ({data.time} UTC)
        </div>
        <div className="flex flex-col gap-1 text-[11px] sm:text-xs">
          <div>Avg Actual: <strong className="font-mono text-[#0F8A43]">{data.actual.toLocaleString()} MW</strong></div>
          <div>Avg Forecast: <strong className="font-mono text-sky-600">{data.forecast.toLocaleString()} MW</strong></div>
          <div>MAE: <strong className="font-mono text-amber-600">{data.mae.toLocaleString()} MW</strong></div>
          <div>Mean Bias: <strong className={`font-mono ${data.bias > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
            {data.bias > 0 ? `+${data.bias.toLocaleString()}` : `${data.bias.toLocaleString()}`} MW
          </strong></div>
          <div>WAPE: <strong className="font-mono">{data.wape}%</strong></div>
        </div>
      </div>
    );
  }
  return null;
};

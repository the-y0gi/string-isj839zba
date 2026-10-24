import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SettlementPeriodRecord } from '../types/api';

interface SettlementChartProps {
  records: SettlementPeriodRecord[];
  deliveryDate: string;
  decisionCutoff: string;
}

export const SettlementChart: React.FC<SettlementChartProps> = ({
  records,
  deliveryDate,
  decisionCutoff,
}) => {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showErrorBars, setShowErrorBars] = useState(true);

  const chartData = records.map((r) => {
    const timeStr = r.start_time ? r.start_time.substring(11, 16) : `SP ${r.settlement_period}`;
    return {
      sp: r.settlement_period,
      label: `SP ${r.settlement_period} (${timeStr})`,
      time: timeStr,
      actual: r.actual_mw,
      forecast: r.forecast_mw,
      error: r.error_mw,
      absError: r.abs_error_mw,
      isOver: r.is_overforecast,
      publishTime: r.forecast_publish_time,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 mb-4 sm:mb-6 shadow-xs">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              Day-Ahead Wind Generation vs Actuals (HH 1 to 48)
            </h2>
            <span className="bg-[#E8F7EE] text-[#0F8A43] border border-[#A7F3D0] px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase rounded-full whitespace-nowrap">
              Gate Closure Matched
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Delivery Date: <strong className="text-slate-900">{deliveryDate}</strong> | Decision Cutoff: <strong className="text-slate-900">{decisionCutoff}</strong>
          </p>
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer transition border text-center justify-center flex items-center ${
              showActual
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Actual
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer transition border text-center justify-center flex items-center ${
              showForecast
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            -- Forecast
          </button>

          <button
            onClick={() => setShowErrorBars(!showErrorBars)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer transition border text-center justify-center flex items-center ${
              showErrorBars
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            Error Bars
          </button>
        </div>
      </div>

      <div className="w-full h-[300px] sm:h-[380px] md:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: showErrorBars ? 0 : 5, left: -20, bottom: 20 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F8A43" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0F8A43" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

            <XAxis
              dataKey="sp"
              minTickGap={20}
              tickFormatter={(sp) => `${sp}`}
              label={{ value: 'Period (1 - 48)', position: 'insideBottom', offset: -12, fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              stroke="#CBD5E1"
              tick={{ fill: '#64748B', fontSize: 10 }}
            />

            <YAxis
              yAxisId="left"
              stroke="#CBD5E1"
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            {showErrorBars && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#E2E8F0"
                tick={{ fill: '#94A3B8', fontSize: 9 }}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${(val / 1000).toFixed(1)}k`}
                domain={['auto', 'auto']}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }} />

            <ReferenceLine yAxisId="left" y={0} stroke="#CBD5E1" />

            {showActual && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                name="Actual Wind (MW)"
                stroke="#0F8A43"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualGradient)"
              />
            )}

            {showForecast && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="forecast"
                name="Day-Ahead Forecast (MW)"
                stroke="#0284C7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 1.5, fill: '#0284C7' }}
                activeDot={{ r: 5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}

            {showErrorBars && (
              <Bar
                yAxisId="right"
                dataKey="error"
                name="Forecast Error (MW)"
                fill="#94A3B8"
                opacity={0.3}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface SettlementTooltipItem {
  sp: number;
  time: string;
  actual: number | null;
  forecast: number | null;
  error: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SettlementTooltipItem }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error > 0;

    return (
      <div className="bg-white border border-slate-300 rounded-xl p-2.5 sm:p-3.5 shadow-xl min-w-[190px] sm:min-w-[220px] text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
          <span className="font-extrabold text-slate-900">
            SP {data.sp} ({data.time} UTC)
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isOver ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isOver ? 'Short Risk' : 'Surplus'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Actual Wind:</span>
            <strong className="font-mono text-[#0F8A43]">
              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
            </strong>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Forecast:</span>
            <strong className="font-mono text-sky-600">
              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'N/A'}
            </strong>
          </div>

          <div className="flex justify-between border-t border-dashed border-slate-200 pt-1 mt-0.5">
            <span className="text-slate-500">Error:</span>
            <strong className={`font-mono ${isOver ? 'text-rose-600' : 'text-blue-600'}`}>
              {data.error > 0 ? `+${data.error.toLocaleString()}` : `${data.error.toLocaleString()}`} MW
            </strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

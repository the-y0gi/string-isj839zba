import React, { useState } from 'react';
import type { SettlementPeriodRecord, OverallMetricsSummary } from '../types/api';
import { Calculator, ShieldCheck, Flame } from 'lucide-react';

interface TraderDecisionAssistantProps {
  records: SettlementPeriodRecord[];
  overall: OverallMetricsSummary | null;
  deliveryDate: string;
}

export const TraderDecisionAssistant: React.FC<TraderDecisionAssistantProps> = ({
  records,
  overall,
  deliveryDate,
}) => {
  const [selectedSP, setSelectedSP] = useState<number>(36);
  const [consumerDemandMW, setConsumerDemandMW] = useState<number>(26000);
  const [confidenceLevel, setConfidenceLevel] = useState<'90' | '95'>('90');

  const record = records.find((r) => r.settlement_period === selectedSP) || records[0];
  const forecastMW = record ? (record.forecast_mw ?? 0) : 0;
  const actualMW = record ? (record.actual_mw ?? 0) : 0;

  const baseThermalProcure = Math.max(0, consumerDemandMW - forecastMW);

  const hedgeBufferMW = overall
    ? (confidenceLevel === '90' ? overall.confidence_buffer_90pct_mw : overall.confidence_buffer_95pct_mw)
    : 0;

  const recommendedThermalProcure = baseThermalProcure + hedgeBufferMW;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8F7EE] flex items-center justify-center text-[#0F8A43]">
              <Calculator size={18} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Day-Ahead Thermal Power Procurement Decision Lab
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Solves: <strong className="text-slate-900">How much additional thermal power to procure from wholesale market</strong> beyond wind generation.
          </p>
        </div>

        <div className="bg-[#E8F7EE] text-[#0F8A43] border border-[#A7F3D0] px-3 py-1 text-xs font-bold uppercase rounded-full">
          Delivery Date: {deliveryDate}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Target Settlement Period (HH 1 - 48)
          </label>
          <select
            value={selectedSP}
            onChange={(e) => setSelectedSP(Number(e.target.value))}
            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 shadow-xs cursor-pointer"
          >
            {records.map((r) => {
              const timeStr = r.start_time ? r.start_time.substring(11, 16) : '';
              return (
                <option key={r.settlement_period} value={r.settlement_period}>
                  Period {r.settlement_period} ({timeStr} UTC) {r.settlement_period >= 34 && r.settlement_period <= 40 ? '🔥 UK Peak Hour' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Forecasted Consumer Demand (MW)
          </label>
          <div className="relative">
            <input
              type="number"
              step="500"
              value={consumerDemandMW}
              onChange={(e) => setConsumerDemandMW(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 shadow-xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              MW
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Risk Tolerance (Statistical Safety Margin)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setConfidenceLevel('90')}
              className={`flex-1 p-2.5 rounded-lg text-xs font-bold cursor-pointer transition border ${
                confidenceLevel === '90'
                  ? 'border-[#0F8A43] bg-[#E8F7EE] text-[#0F8A43] shadow-xs'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              90% Safety Margin
            </button>
            <button
              onClick={() => setConfidenceLevel('95')}
              className={`flex-1 p-2.5 rounded-lg text-xs font-bold cursor-pointer transition border ${
                confidenceLevel === '95'
                  ? 'border-[#0F8A43] bg-[#E8F7EE] text-[#0F8A43] shadow-xs'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              95% Conservative
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">
            1. Consumer Demand
          </div>
          <div className="font-mono text-2xl font-extrabold text-slate-900 mt-1">
            {consumerDemandMW.toLocaleString()} <span className="text-sm font-semibold text-slate-400">MW</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total required generation
          </div>
        </div>

        <div className="bg-[#E8F7EE] border border-[#A7F3D0] rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-[#0F8A43] uppercase">
            2. Available Wind Power
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#0F8A43] mt-1">
            - {forecastMW.toLocaleString()} <span className="text-sm font-semibold text-[#0F8A43]">MW</span>
          </div>
          <div className="text-xs text-emerald-900 mt-1">
            Day-ahead expected generation
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">
            3. Net Thermal Gap
          </div>
          <div className="font-mono text-2xl font-extrabold text-slate-900 mt-1">
            {baseThermalProcure.toLocaleString()} <span className="text-sm font-semibold text-slate-400">MW</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Unhedged baseline procurement
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase">
            <Flame size={14} />
            <span>Recommended Market Bid</span>
          </div>
          <div className="font-mono text-2xl font-extrabold text-sky-400 mt-1">
            {recommendedThermalProcure.toLocaleString()} <span className="text-sm font-semibold text-slate-400">MW</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Includes <strong className="text-slate-100">+{hedgeBufferMW} MW</strong> safety buffer
          </div>
        </div>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Trading Strategy Value:</strong> By applying the <strong>{confidenceLevel}% confidence hedge (+{hedgeBufferMW} MW)</strong>, the trading desk avoids being caught short in the UK Balancing Mechanism (BM) where emergency cashout prices can exceed £250/MWh. On this delivery day, actual wind was <strong>{actualMW.toLocaleString()} MW</strong> (error: {forecastMW - actualMW > 0 ? `over-forecasted by ${forecastMW - actualMW} MW` : `under-forecasted by ${actualMW - forecastMW} MW`}).
        </div>
      </div>
    </div>
  );
};

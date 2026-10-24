import React, { useState, useEffect } from 'react';
import {
  fetchHealth,
  fetchAvailableDates,
  fetchDayAheadForecast,
  fetchMetricsSummary,
  fetchDiurnalProfile
} from './services/api';
import type {
  DayAheadResponse,
  OverallMetricsSummary,
  DiurnalProfileResponse,
  HealthResponse
} from './types/api';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { SettlementChart } from './components/SettlementChart';
import { TraderDecisionAssistant } from './components/TraderDecisionAssistant';
import { DiurnalProfileView } from './components/DiurnalProfileView';
import { SummaryTable } from './components/SummaryTable';
import { ModelSignalPanel } from './components/ModelSignalPanel';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowRight, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState<number>(11);
  const [activeTab, setActiveTab] = useState<'schedule' | 'assistant' | 'diurnal' | 'ledger'>('schedule');
  const [subTab, setSubTab] = useState<'curve' | 'signals' | 'all'>('curve');

  const [dayAheadData, setDayAheadData] = useState<DayAheadResponse | null>(null);
  const [overallMetrics, setOverallMetrics] = useState<OverallMetricsSummary | null>(null);
  const [diurnalData, setDiurnalData] = useState<DiurnalProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [healthRes, datesRes] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchAvailableDates().catch((): string[] => [])
        ]);

        if (healthRes) setHealth(healthRes);
        if (datesRes && datesRes.length > 0) {
          setDates(datesRes);
          if (!datesRes.includes(selectedDate)) {
            setSelectedDate(datesRes[Math.floor(datesRes.length / 2)] || datesRes[0]);
          }
        }
      } catch (err: unknown) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!selectedDate) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [dayRes, metricsRes, diurnalRes] = await Promise.all([
          fetchDayAheadForecast(selectedDate, cutoffHour),
          fetchMetricsSummary(cutoffHour),
          fetchDiurnalProfile(cutoffHour)
        ]);

        setDayAheadData(dayRes);
        setOverallMetrics(metricsRes);
        setDiurnalData(diurnalRes);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to connect to backend service.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedDate, cutoffHour]);

  const currentIndex = dates.indexOf(selectedDate);
  const handlePrevDay = () => currentIndex > 0 && setSelectedDate(dates[currentIndex - 1]);
  const handleNextDay = () => currentIndex < dates.length - 1 && setSelectedDate(dates[currentIndex + 1]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar
        isHealthy={Boolean(health?.data_loaded)}
        totalRecords={health?.total_actual_records ?? 0}
      />

      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer text-center truncate ${
              activeTab === 'schedule'
                ? 'bg-[#0F8A43] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Day-Ahead Dispatch
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer text-center truncate ${
              activeTab === 'assistant'
                ? 'bg-[#0F8A43] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Procurement Lab
          </button>

          <button
            onClick={() => setActiveTab('diurnal')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer text-center truncate ${
              activeTab === 'diurnal'
                ? 'bg-[#0F8A43] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Diurnal Profile
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer text-center truncate ${
              activeTab === 'ledger'
                ? 'bg-[#0F8A43] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ledger (48 SP)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start mb-6 sm:mb-8">
          <div className="lg:col-span-4">
            <div className="text-[10px] sm:text-[11px] font-extrabold text-[#0F8A43] uppercase tracking-wider mb-1 sm:mb-2">
              SIMULATE & FORECAST
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3">
              Simulate Day-Ahead dispatch, unit commitment, and thermal hedging.
            </h1>

            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mb-4 sm:mb-6">
              Evaluate national wind generation forecasts at <strong>Gate Closure (11:00 UTC)</strong>, quantify systematic forecast errors, and size additional thermal power procurement.
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs mb-3 sm:mb-4">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                SELECT DELIVERY PERIOD
              </div>

              <div className="flex items-center gap-1.5 mb-2.5">
                <button
                  onClick={handlePrevDay}
                  disabled={currentIndex <= 0}
                  className="p-1.5 sm:p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <Calendar size={13} className="text-[#0F8A43] shrink-0" />
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="font-mono font-bold text-[11px] sm:text-xs text-slate-900 bg-transparent w-full cursor-pointer outline-none truncate"
                  >
                    {dates.map((d) => (
                      <option key={d} value={d}>
                        {d} (Jan 2026)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleNextDay}
                  disabled={currentIndex >= dates.length - 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Clock size={13} className="text-sky-600 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 shrink-0">Gate:</span>
                <select
                  value={cutoffHour}
                  onChange={(e) => setCutoffHour(Number(e.target.value))}
                  className="font-mono font-bold text-[11px] sm:text-xs text-slate-900 bg-transparent w-full cursor-pointer outline-none truncate"
                >
                  <option value={9}>09:00 UTC (D-1)</option>
                  <option value={10}>10:00 UTC (D-1)</option>
                  <option value={11}>11:00 UTC (D-1 - Market Gate)</option>
                  <option value={12}>12:00 UTC (D-1)</option>
                  <option value={14}>14:00 UTC (D-1)</option>
                  <option value={16}>16:00 UTC (D-1)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('assistant')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F8A43] hover:text-[#0c6e35] transition cursor-pointer"
            >
              <span>Explore Procurement Lab</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="lg:col-span-8 w-full min-w-0">
            <div className="flex items-center gap-3 sm:gap-6 border-b border-slate-200 pb-1.5 sm:pb-2 mb-3 sm:mb-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setSubTab('curve')}
                className={`cursor-pointer transition pb-1 border-b-2 shrink-0 ${
                  subTab === 'curve' ? 'border-[#0F8A43] text-[#0F8A43]' : 'border-transparent hover:text-slate-900'
                }`}
              >
                SETTLEMENT CURVE (HH 1-48)
              </button>

              <button
                onClick={() => setSubTab('signals')}
                className={`cursor-pointer transition pb-1 border-b-2 shrink-0 ${
                  subTab === 'signals' ? 'border-[#0F8A43] text-[#0F8A43]' : 'border-transparent hover:text-slate-900'
                }`}
              >
                SIGNALS & WATCHLIST
              </button>

              <button
                onClick={() => setSubTab('all')}
                className={`cursor-pointer transition pb-1 border-b-2 shrink-0 ${
                  subTab === 'all' ? 'border-[#0F8A43] text-[#0F8A43]' : 'border-transparent hover:text-slate-900'
                }`}
              >
                COMBINED VIEW
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
                <ShieldAlert size={16} className="shrink-0" />
                <span>Connection Error: {errorMessage}</span>
              </div>
            )}

            {dayAheadData && (
              <MetricCards
                summary={dayAheadData.summary}
                overall={overallMetrics}
              />
            )}

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500 shadow-xs">
                <div className="text-xs font-bold">Loading Day-Ahead settlement data...</div>
              </div>
            ) : dayAheadData ? (
              <>
                {activeTab === 'schedule' && (
                  <div className="space-y-4 sm:space-y-6">
                    {subTab === 'curve' && (
                      <SettlementChart
                        records={dayAheadData.records}
                        deliveryDate={dayAheadData.delivery_date}
                        decisionCutoff={dayAheadData.decision_cutoff_time}
                      />
                    )}

                    {subTab === 'signals' && (
                      <ModelSignalPanel
                        summary={dayAheadData.summary}
                        records={dayAheadData.records}
                        overall={overallMetrics}
                      />
                    )}

                    {subTab === 'all' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                        <div className="lg:col-span-8">
                          <SettlementChart
                            records={dayAheadData.records}
                            deliveryDate={dayAheadData.delivery_date}
                            decisionCutoff={dayAheadData.decision_cutoff_time}
                          />
                        </div>
                        <div className="lg:col-span-4">
                          <ModelSignalPanel
                            summary={dayAheadData.summary}
                            records={dayAheadData.records}
                            overall={overallMetrics}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'assistant' && (
                  <TraderDecisionAssistant
                    records={dayAheadData.records}
                    overall={overallMetrics}
                    deliveryDate={dayAheadData.delivery_date}
                  />
                )}

                {activeTab === 'diurnal' && (
                  <DiurnalProfileView
                    data={diurnalData}
                    overall={overallMetrics}
                  />
                )}

                {activeTab === 'ledger' && (
                  <SummaryTable
                    records={dayAheadData.records}
                    deliveryDate={dayAheadData.delivery_date}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

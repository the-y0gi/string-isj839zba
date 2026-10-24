import React, { useState } from 'react';
import type { SettlementPeriodRecord } from '../types/api';
import { Download } from 'lucide-react';

interface SummaryTableProps {
  records: SettlementPeriodRecord[];
  deliveryDate: string;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ records, deliveryDate }) => {
  const [filterType, setFilterType] = useState<'all' | 'over' | 'under'>('all');

  const filteredRecords = records.filter((r) => {
    if (filterType === 'over') return r.is_overforecast === true;
    if (filterType === 'under') return r.is_overforecast === false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Settlement Period', 'Start Time (UTC)', 'Actual Wind (MW)', 'Day-Ahead Forecast (MW)', 'Error (MW)', 'Error (%)', 'Risk Position', 'Publish Time'];
    const rows = records.map((r) => [
      r.settlement_period,
      r.start_time,
      r.actual_mw ?? '',
      r.forecast_mw ?? '',
      r.error_mw ?? '',
      r.error_pct ?? '',
      r.is_overforecast ? 'Over-forecast (Short Risk)' : 'Under-forecast (Surplus)',
      r.forecast_publish_time ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wind_day_ahead_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Settlement Period Ledger (48 Half-Hour Blocks)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Detailed breakdown for {deliveryDate} with point-in-time forecast match.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All (48)
            </button>
            <button
              onClick={() => setFilterType('over')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'over' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Over-forecast (Short)
            </button>
            <button
              onClick={() => setFilterType('under')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'under' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Under-forecast
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[420px] rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-slate-600">Period</th>
              <th className="p-3 font-bold text-slate-600">Start Time (UTC)</th>
              <th className="p-3 font-bold text-slate-600 text-right">Actual (MW)</th>
              <th className="p-3 font-bold text-slate-600 text-right">Forecast (MW)</th>
              <th className="p-3 font-bold text-slate-600 text-right">Error (MW)</th>
              <th className="p-3 font-bold text-slate-600 text-right">Error (%)</th>
              <th className="p-3 font-bold text-slate-600">Risk Position</th>
              <th className="p-3 font-bold text-slate-600">Forecast Publish Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => {
              const timeStr = r.start_time ? r.start_time.substring(11, 16) : '-';
              const pubStr = r.forecast_publish_time ? r.forecast_publish_time.substring(0, 16).replace('T', ' ') : '-';
              const isOver = r.is_overforecast;

              return (
                <tr
                  key={r.settlement_period}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                    r.settlement_period % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-slate-900">
                    SP {r.settlement_period}
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {timeStr}
                  </td>
                  <td className="p-3 font-mono text-right font-bold text-[#0F8A43]">
                    {r.actual_mw !== null ? r.actual_mw.toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-right font-bold text-sky-600">
                    {r.forecast_mw !== null ? r.forecast_mw.toLocaleString() : 'N/A'}
                  </td>
                  <td className={`p-3 font-mono text-right font-bold ${isOver ? 'text-rose-600' : 'text-blue-600'}`}>
                    {r.error_mw !== null ? (r.error_mw > 0 ? `+${r.error_mw.toLocaleString()}` : r.error_mw.toLocaleString()) : 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-right text-slate-500">
                    {r.error_pct !== null ? `${Math.abs(r.error_pct).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      isOver ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {isOver ? 'Short Risk' : 'Surplus'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-500">
                    {pubStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

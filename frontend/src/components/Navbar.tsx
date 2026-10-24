import React from 'react';
import { Database } from 'lucide-react';

interface NavbarProps {
  isHealthy: boolean;
  totalRecords: number;
}

export const Navbar: React.FC<NavbarProps> = ({ isHealthy, totalRecords }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                Wind<span className="text-[#0F8A43]">Analytics</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Renewable Wind Generation Forecasts & Procurement Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Database size={13} className="text-[#0F8A43]" />
            <span>Elexon BMRS (FUELHH + WINDFOR)</span>
          </div>

          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
            isHealthy 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-[#0F8A43]' : 'bg-rose-500'}`} />
            <span>{isHealthy ? 'Feed Connected' : 'Connecting'}</span>
          </div>

          <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            {totalRecords > 0 ? `${totalRecords.toLocaleString()} Periods` : '...'}
          </div>
        </div>
      </div>
    </header>
  );
};

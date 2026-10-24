import React from 'react';
import { Database } from 'lucide-react';

interface NavbarProps {
  isHealthy: boolean;
  totalRecords: number;
}

export const Navbar: React.FC<NavbarProps> = ({ isHealthy, totalRecords }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                Wind<span className="text-[#0F8A43]">Analytics</span>
              </span>
            </div>
            <div className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
              Renewable Wind Generation Forecasts & Procurement Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Database size={13} className="text-[#0F8A43]" />
            <span>Elexon BMRS (FUELHH + WINDFOR)</span>
          </div>

          <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${
            isHealthy 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-[#0F8A43]' : 'bg-rose-500'}`} />
            <span className="hidden sm:inline">{isHealthy ? 'Feed Connected' : 'Connecting'}</span>
            <span className="sm:hidden">{isHealthy ? 'Live' : 'Off'}</span>
          </div>

          <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200">
            {totalRecords > 0 ? `${totalRecords.toLocaleString()} SPs` : '...'}
          </div>
        </div>
      </div>
    </header>
  );
};

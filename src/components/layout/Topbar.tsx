import React from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, ChevronRight, ShieldCheck, Menu } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const REPORT_NAMES: Record<string, { code: string; title: string }> = {
  '/sales/s1': { code: 'S1', title: 'Total Sales by Date' },
  '/sales/s2': { code: 'S2', title: 'Salesman & Party Sales' },
  '/sales/s3': { code: 'S3', title: 'Item-Wise Sales' },
  '/sales/s4': { code: 'S4', title: 'Distributor-Wise Sales' },
  '/sales/s5': { code: 'S5', title: 'Freight Report' },
};

interface TopbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const location = useLocation();
  const currentReport = REPORT_NAMES[location.pathname] || {
    code: 'Reports',
    title: 'Sales Dashboard',
  };

  // Fixed demo current date: 22 Oct 2026
  const currentDateFormatted = formatDate('2026-10-22');

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500 overflow-hidden">
          <span className="hidden sm:inline hover:text-slate-800">ERP Reports</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <span className="hidden md:inline hover:text-slate-800">Sales</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
          <span className="text-slate-900 font-bold flex items-center gap-1.5 truncate">
            <span className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px]">
              {currentReport.code}
            </span>
            <span className="truncate">{currentReport.title}</span>
          </span>
        </nav>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Demo ERP</span>
        </div>

        {/* Current Date */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-100 rounded text-slate-700 text-xs font-semibold border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="whitespace-nowrap">{currentDateFormatted}</span>
        </div>
      </div>
    </header>
  );
};

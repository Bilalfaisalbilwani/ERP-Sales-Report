import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Users2,
  Package,
  Truck,
  Building2,
  TrendingUp,
  Boxes,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const reports = [
    {
      to: '/sales/s1',
      code: 'S1',
      name: 'Total Sales by Date',
      description: 'Item & Value breakdown',
      icon: CalendarDays,
    },
    {
      to: '/sales/s2',
      code: 'S2',
      name: 'Salesman & Party Sales',
      description: '3-level hierarchy report',
      icon: Users2,
    },
    {
      to: '/sales/s3',
      code: 'S3',
      name: 'Item-Wise Sales',
      description: 'Pack & Total Qty by Group',
      icon: Package,
    },
    {
      to: '/sales/s4',
      code: 'S4',
      name: 'Distributor-Wise Sales',
      description: 'Value ranking & invoices',
      icon: Building2,
    },
    {
      to: '/sales/s5',
      code: 'S5',
      name: 'Freight Report',
      description: 'Invoice freight & volume',
      icon: Truck,
    },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar element: fixed drawer on mobile, static on lg */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-screen transition-transform duration-200 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 lg:h-16 px-4 lg:px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">ERP Reports</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.2 rounded font-semibold border border-blue-500/30">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-400">Sales Analytics Module</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation section */}
        <div className="p-3 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" />
            <span>Sales Reports</span>
          </div>

          <nav className="mt-1 space-y-1">
            {reports.map((report) => (
              <NavLink
                key={report.to}
                to={report.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-start gap-3 px-3 py-2.5 rounded-md transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => {
                  const IconComponent = report.icon;
                  return (
                    <>
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold transition-colors ${
                          isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                        }`}
                      >
                        {report.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold leading-tight truncate">
                          {report.name}
                        </div>
                        <div
                          className={`text-[10px] leading-tight truncate mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {report.description}
                        </div>
                      </div>
                    </>
                  );
                }}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs shrink-0">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Environment</span>
            <span className="text-emerald-400 font-medium">Demo Mode</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            ERP Sales prototype with reconciled calculations and full exports.
          </p>
        </div>
      </aside>
    </>
  );
};

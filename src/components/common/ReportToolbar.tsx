import React from 'react';
import { Download, FileSpreadsheet, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface ReportToolbarProps {
  reportCode: string;
  reportTitle: string;
  description: string;
  viewOptions?: { id: string; label: string }[];
  currentView: string;
  onViewChange: (viewId: string) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  dateFrom: string;
  dateTo: string;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
  drillDownContext?: {
    title: string;
    onBack: () => void;
  } | null;
  totalRowCount?: number;
  onRefresh?: () => void;
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
  reportCode,
  reportTitle,
  description,
  viewOptions,
  currentView,
  onViewChange,
  onExportPdf,
  onExportExcel,
  dateFrom,
  dateTo,
  isExportingPdf = false,
  isExportingExcel = false,
  drillDownContext,
  totalRowCount,
  onRefresh,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      {/* Title & Drill-down crumb */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {drillDownContext ? (
          <button
            type="button"
            onClick={drillDownContext.onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Summary
          </button>
        ) : null}

        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
              {reportCode}
            </span>
            <h1 className="text-base font-bold text-slate-900">
              {drillDownContext ? (
                <>
                  <span className="text-slate-400 font-normal">{reportTitle} / </span>
                  <span className="text-blue-700">{drillDownContext.title}</span>
                </>
              ) : (
                reportTitle
              )}
            </h1>
            {totalRowCount !== undefined && (
              <span className="text-xs text-slate-500 font-medium">
                ({totalRowCount} {totalRowCount === 1 ? 'row' : 'rows'})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Middle & Right Actions */}
      <div className="flex items-center gap-3">
        {/* Applied Range pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium">
          <span className="text-slate-400">Period:</span>
          <span>
            {formatDate(dateFrom)} – {formatDate(dateTo)}
          </span>
        </div>

        {/* View Switcher */}
        {viewOptions && viewOptions.length > 1 && !drillDownContext && (
          <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200 text-xs">
            {viewOptions.map((v) => {
              const active = currentView === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onViewChange(v.id)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Recalculate report"
            className="h-8 w-8 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="h-8 px-3 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Export complete report to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExportingExcel}
            className="h-8 px-3 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Export complete report to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExportingExcel ? 'Exporting...' : 'Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

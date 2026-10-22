import React, { useState, useMemo } from 'react';
import { FilterState, SortState } from '../../types';
import { SalesFilterPanel } from '../../components/filters/SalesFilterPanel';
import { ReportToolbar } from '../../components/common/ReportToolbar';
import { SortHeader } from '../../components/common/SortHeader';
import { DataTablePagination } from '../../components/common/DataTablePagination';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  getFilteredRecords,
  computeS5FreightReport,
  S5SummaryRow,
  S5DetailedRow,
} from '../../utils/aggregations';
import {
  formatCurrency,
  formatQuantity,
  formatDate,
  getValueColorClass,
  getExportFilterSummary,
} from '../../utils/formatters';
import { exportReportToPdf } from '../../utils/exportPdf';
import { exportReportToExcel } from '../../utils/exportExcel';
import { COMPANY_MAP } from '../../data/dummyData';

export const ReportS5: React.FC = () => {
  // S5 default date range: 2026-10-01 to 2026-10-22
  const defaultFilters: FilterState = {
    companyIds: [],
    companyId: 'all',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-22',
    salesmenIds: [],
    itemGroupIds: [], // ignored for S5
    distributorIds: [],
  };

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<'summarized' | 'detailed'>('summarized');
  const [drillDownDate, setDrillDownDate] = useState<string | null>(null);

  // Sorting
  const [summarySort, setSummarySort] = useState<SortState>({ column: 'date', direction: 'desc' });
  const [detailSort, setDetailSort] = useState<SortState>({ column: 'date', direction: 'desc' });

  // Pagination for detailed view
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filter invoices for S5 (ignoreItemGroup = true)
  const { invoices } = useMemo(() => {
    return getFilteredRecords(appliedFilters, true);
  }, [appliedFilters]);

  // Compute S5 summaries and detail rows (strictly counting freight once per invoice)
  const { summaryRows: rawSummaryRows, detailedRows: rawDetailedRows, grandTotal } = useMemo(() => {
    return computeS5FreightReport(invoices);
  }, [invoices]);

  // Sort summary rows
  const summaryRows = useMemo(() => {
    const list = [...rawSummaryRows];
    list.sort((a, b) => {
      const col = summarySort.column as keyof S5SummaryRow;
      const valA = a[col];
      const valB = b[col];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return summarySort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return summarySort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [rawSummaryRows, summarySort]);

  // Active detailed rows (filtered by drillDownDate if active)
  const activeDetailedRows = useMemo(() => {
    if (drillDownDate) {
      return rawDetailedRows.filter((r) => r.date === drillDownDate);
    }
    return rawDetailedRows;
  }, [rawDetailedRows, drillDownDate]);

  // Sort detailed rows
  const sortedDetailedRows = useMemo(() => {
    const list = [...activeDetailedRows];
    list.sort((a, b) => {
      const col = detailSort.column as keyof S5DetailedRow;
      const valA = a[col];
      const valB = b[col];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return detailSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return detailSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [activeDetailedRows, detailSort]);

  // Paginated detailed rows
  const paginatedDetailedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDetailedRows.slice(start, start + pageSize);
  }, [sortedDetailedRows, page, pageSize]);

  // Handlers
  const handleApplyFilters = (newFilters: FilterState) => {
    setAppliedFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setAppliedFilters(defaultFilters);
    setDrillDownDate(null);
    setViewMode('summarized');
    setPage(1);
  };

  const handleSummarySort = (colKey: string) => {
    setSummarySort((prev) => ({
      column: colKey,
      direction: prev.column === colKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDetailSort = (colKey: string) => {
    setDetailSort((prev) => ({
      column: colKey,
      direction: prev.column === colKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDateRowClickDrillDown = (row: S5SummaryRow) => {
    setDrillDownDate(row.date);
    setViewMode('detailed');
    setPage(1);
  };

  // PDF Export
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    const filterSummary = getExportFilterSummary(appliedFilters, true);

    try {
      if (viewMode === 'summarized' && !drillDownDate) {
        exportReportToPdf({
          fileName: 'S5_Freight_Report.pdf',
          reportCode: 'S5',
          reportTitle: 'Freight Report Sales (Summarized by Date)',
          viewName: 'Summarized View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'dateFormatted' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Total Freight (PKR)', dataKey: 'totalFreightFormatted', align: 'right' },
          ],
          data: summaryRows.map((r) => ({
            dateFormatted: formatDate(r.date),
            totalQtyFormatted: formatQuantity(r.totalQty),
            totalFreightFormatted: formatCurrency(r.totalFreight),
          })),
          grandTotal: {
            dateFormatted: 'GRAND TOTAL',
            totalQtyFormatted: formatQuantity(grandTotal.totalQty),
            totalFreightFormatted: formatCurrency(grandTotal.totalFreight),
          },
          orientation: 'portrait',
        });
      } else {
        const detailQty = activeDetailedRows.reduce((a, b) => a + b.totalQtyInInvoice, 0);
        const detailFreight = activeDetailedRows.reduce((a, b) => a + b.freight, 0);

        exportReportToPdf({
          fileName: 'S5_Freight_Report_Detailed.pdf',
          reportCode: 'S5',
          reportTitle: drillDownDate
            ? `Freight Report — Detail for Date: ${formatDate(drillDownDate)}`
            : 'Freight Report Sales (Detailed Invoices)',
          viewName: drillDownDate ? `Date: ${formatDate(drillDownDate)}` : 'Detailed View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'dateFormatted' },
            { header: 'Party Name', dataKey: 'partyName' },
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Freight (PKR)', dataKey: 'freightFormatted', align: 'right' },
            { header: 'Total Quantity in that Invoice', dataKey: 'totalQtyFormatted', align: 'right' },
          ],
          data: sortedDetailedRows.map((r) => ({
            dateFormatted: formatDate(r.date),
            partyName: r.partyName,
            invoiceNo: r.invoiceNo,
            freightFormatted: formatCurrency(r.freight),
            totalQtyFormatted: formatQuantity(r.totalQtyInInvoice),
          })),
          grandTotal: {
            dateFormatted: 'GRAND TOTAL',
            partyName: '',
            invoiceNo: '',
            freightFormatted: formatCurrency(detailFreight),
            totalQtyFormatted: formatQuantity(detailQty),
          },
          orientation: 'portrait',
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Export Ready',
        message: 'Freight report PDF downloaded successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'PDF Export Failed',
        message: err?.message || 'Error generating PDF.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const filterSummary = getExportFilterSummary(appliedFilters, true);

    try {
      if (viewMode === 'summarized' && !drillDownDate) {
        await exportReportToExcel({
          fileName: 'S5_Freight_Report.xlsx',
          reportCode: 'S5',
          reportTitle: 'Freight Report Sales (Summarized by Date)',
          viewName: 'Summarized View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'date', width: 16, type: 'date' },
            { header: 'Total Qty', dataKey: 'totalQty', width: 18, type: 'quantity' },
            { header: 'Total Freight (PKR)', dataKey: 'totalFreight', width: 22, type: 'currency' },
          ],
          data: summaryRows.map((r) => ({
            date: formatDate(r.date),
            totalQty: r.totalQty,
            totalFreight: r.totalFreight,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
            totalQty: grandTotal.totalQty,
            totalFreight: grandTotal.totalFreight,
          },
        });
      } else {
        const detailQty = activeDetailedRows.reduce((a, b) => a + b.totalQtyInInvoice, 0);
        const detailFreight = activeDetailedRows.reduce((a, b) => a + b.freight, 0);

        await exportReportToExcel({
          fileName: 'S5_Freight_Report_Detailed.xlsx',
          reportCode: 'S5',
          reportTitle: drillDownDate
            ? `Freight Report — Detail for Date: ${formatDate(drillDownDate)}`
            : 'Freight Report Sales (Detailed Invoices)',
          viewName: drillDownDate ? `Date: ${formatDate(drillDownDate)}` : 'Detailed View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'date', width: 16, type: 'date' },
            { header: 'Party Name', dataKey: 'partyName', width: 26, type: 'text' },
            { header: 'Invoice No', dataKey: 'invoiceNo', width: 18, type: 'text' },
            { header: 'Freight (PKR)', dataKey: 'freight', width: 18, type: 'currency' },
            { header: 'Total Quantity in that Invoice', dataKey: 'totalQtyInInvoice', width: 26, type: 'quantity' },
          ],
          data: sortedDetailedRows.map((r) => ({
            date: formatDate(r.date),
            partyName: r.partyName,
            invoiceNo: r.invoiceNo,
            freight: r.freight,
            totalQtyInInvoice: r.totalQtyInInvoice,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
            partyName: '',
            invoiceNo: '',
            freight: detailFreight,
            totalQtyInInvoice: detailQty,
          },
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Excel Export Ready',
        message: 'Freight report Excel workbook downloaded.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Excel Export Failed',
        message: err?.message || 'Error generating Excel.',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Shared Filter Panel (with isS5Report = true, which disables Item Group and displays Not Applicable helper) */}
      <SalesFilterPanel
        appliedFilters={appliedFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        isS5Report={true}
      />

      {/* Report Toolbar */}
      <ReportToolbar
        reportCode="S5"
        reportTitle="Freight Report Sales"
        description="Invoice freight audit and cumulative dispatched volumes grouped by transaction dates."
        viewOptions={[
          { id: 'summarized', label: 'Summarized by Date' },
          { id: 'detailed', label: 'Detailed Invoices' },
        ]}
        currentView={viewMode}
        onViewChange={(v) => {
          setViewMode(v as 'summarized' | 'detailed');
          if (v === 'summarized') setDrillDownDate(null);
        }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        dateFrom={appliedFilters.dateFrom}
        dateTo={appliedFilters.dateTo}
        isExportingPdf={isExportingPdf}
        isExportingExcel={isExportingExcel}
        drillDownContext={
          drillDownDate
            ? {
                title: `Date: ${formatDate(drillDownDate)}`,
                onBack: () => {
                  setDrillDownDate(null);
                  setViewMode('summarized');
                },
              }
            : null
        }
        totalRowCount={viewMode === 'summarized' && !drillDownDate ? summaryRows.length : sortedDetailedRows.length}
      />

      {/* Table Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto">
        {viewMode === 'summarized' && !drillDownDate ? (
          /* Summarized View: Date, Total Qty, Total Freight */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden max-w-4xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="date" label="Date" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="totalFreight" label="Total Freight" sortState={summarySort} onSort={handleSummarySort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400">
                        No freight records match the active criteria.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((row) => (
                      <tr
                        key={row.date}
                        onClick={() => handleDateRowClickDrillDown(row)}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        title="Click to view detailed invoice freight for this date"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-900 group-hover:text-blue-700">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                          {formatQuantity(row.totalQty)}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${getValueColorClass(row.totalFreight)}`}>
                          {formatCurrency(row.totalFreight)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {summaryRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td className="px-4 py-3 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatQuantity(grandTotal.totalQty)}
                      </td>
                      <td className={`px-4 py-3 text-right ${getValueColorClass(grandTotal.totalFreight)}`}>
                        {formatCurrency(grandTotal.totalFreight)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Click any date row to inspect individual invoices and freight for that day.</span>
              <span>Freight counted exactly once per invoice</span>
            </div>
          </div>
        ) : (
          /* Detailed View: Date, Party Name, Invoice No, Freight, Total Quantity in that Invoice */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden max-w-5xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="date" label="Date" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="partyName" label="Party Name" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="invoiceNo" label="Invoice No" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="freight" label="Freight" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="totalQtyInInvoice" label="Total Quantity in that Invoice" sortState={detailSort} onSort={handleDetailSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDetailedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No invoice freight records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDetailedRows.map((row) => (
                      <tr key={row.invoiceNo} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{formatDate(row.date)}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{row.partyName}</td>
                        <td className="px-4 py-2.5 font-mono text-blue-700 font-semibold">{row.invoiceNo}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${getValueColorClass(row.freight)}`}>
                          {formatCurrency(row.freight)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                          {formatQuantity(row.totalQtyInInvoice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {sortedDetailedRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={3} className="px-4 py-3 uppercase tracking-wider">
                        Reconciled Grand Total ({sortedDetailedRows.length} invoices)
                      </td>
                      <td className={`px-4 py-3 text-right ${getValueColorClass(activeDetailedRows.reduce((a, b) => a + b.freight, 0))}`}>
                        {formatCurrency(activeDetailedRows.reduce((a, b) => a + b.freight, 0))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatQuantity(activeDetailedRows.reduce((a, b) => a + b.totalQtyInInvoice, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              pageSize={pageSize}
              totalRows={sortedDetailedRows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

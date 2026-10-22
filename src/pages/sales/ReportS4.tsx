import React, { useState, useMemo } from 'react';
import { FilterState, SortState } from '../../types';
import { SalesFilterPanel } from '../../components/filters/SalesFilterPanel';
import { ReportToolbar } from '../../components/common/ReportToolbar';
import { SortHeader } from '../../components/common/SortHeader';
import { DataTablePagination } from '../../components/common/DataTablePagination';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  getFilteredRecords,
  computeS4Summary,
  S4SummaryRow,
  FilteredLineItem,
} from '../../utils/aggregations';
import {
  formatCurrency,
  formatQuantity,
  formatPercent,
  formatDate,
  getValueColorClass,
  getExportFilterSummary,
} from '../../utils/formatters';
import { exportReportToPdf } from '../../utils/exportPdf';
import { exportReportToExcel } from '../../utils/exportExcel';
import { DISTRIBUTOR_MAP, PARTY_MAP, SALESMAN_MAP, COMPANY_MAP } from '../../data/dummyData';

export const ReportS4: React.FC = () => {
  // S4 default date range: 2026-10-01 to 2026-10-22
  const defaultFilters: FilterState = {
    companyIds: [],
    companyId: 'all',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-22',
    salesmenIds: [],
    itemGroupIds: [],
    distributorIds: [],
  };

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<'summarized' | 'detailed'>('summarized');
  const [drillDownDistributor, setDrillDownDistributor] = useState<{ id: string; name: string } | null>(null);

  // Sorting
  const [summarySort, setSummarySort] = useState<SortState>({ column: 'value', direction: 'desc' });
  const [detailSort, setDetailSort] = useState<SortState>({ column: 'date', direction: 'desc' });

  // Pagination for detailed view
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filter lines
  const { lineItems } = useMemo(() => {
    return getFilteredRecords(appliedFilters, false);
  }, [appliedFilters]);

  // S4 Summary
  const { rows: rawSummaryRows, grandTotal } = useMemo(() => {
    return computeS4Summary(lineItems);
  }, [lineItems]);

  const summaryRows = useMemo(() => {
    const list = [...rawSummaryRows];
    list.sort((a, b) => {
      const col = summarySort.column as keyof S4SummaryRow;
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

  // Active detail lines
  const activeDetailLines = useMemo(() => {
    if (drillDownDistributor) {
      return lineItems.filter((l) => l.distributorId === drillDownDistributor.id);
    }
    return lineItems;
  }, [lineItems, drillDownDistributor]);

  const sortedDetailLines = useMemo(() => {
    const list = [...activeDetailLines];
    list.sort((a, b) => {
      let valA: any = a[detailSort.column as keyof FilteredLineItem];
      let valB: any = b[detailSort.column as keyof FilteredLineItem];

      if (detailSort.column === 'distributor') {
        valA = DISTRIBUTOR_MAP.get(a.distributorId)?.name || '';
        valB = DISTRIBUTOR_MAP.get(b.distributorId)?.name || '';
      } else if (detailSort.column === 'party') {
        valA = PARTY_MAP.get(a.partyId)?.name || '';
        valB = PARTY_MAP.get(b.partyId)?.name || '';
      } else if (detailSort.column === 'salesman') {
        valA = SALESMAN_MAP.get(a.salesmanId)?.name || '';
        valB = SALESMAN_MAP.get(b.salesmanId)?.name || '';
      } else if (detailSort.column === 'item') {
        valA = a.product.name;
        valB = b.product.name;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return detailSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return detailSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [activeDetailLines, detailSort]);

  const paginatedDetailLines = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDetailLines.slice(start, start + pageSize);
  }, [sortedDetailLines, page, pageSize]);

  // Handlers
  const handleApplyFilters = (newFilters: FilterState) => {
    setAppliedFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setAppliedFilters(defaultFilters);
    setDrillDownDistributor(null);
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

  const handleDistributorDrillDown = (row: S4SummaryRow) => {
    setDrillDownDistributor({ id: row.distributorId, name: row.distributorName });
    setViewMode('detailed');
    setPage(1);
  };

  // PDF Export
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    const filterSummary = getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'summarized' && !drillDownDistributor) {
        exportReportToPdf({
          fileName: 'S4_Distributor_Wise_Sales.pdf',
          reportCode: 'S4',
          reportTitle: 'Distributor-Wise Sales Report',
          viewName: 'Summarized View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Distributor', dataKey: 'distributorName' },
            { header: 'Salesman', dataKey: 'salesmenNames' },
            { header: 'Invoices', dataKey: 'invoiceCount', align: 'right' },
            { header: 'Pack Qty', dataKey: 'packQtyFormatted', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Value (PKR)', dataKey: 'valueFormatted', align: 'right' },
            { header: '% of Total', dataKey: 'percentOfTotalFormatted', align: 'right' },
            { header: 'Last Sale Date', dataKey: 'lastSaleDateFormatted' },
          ],
          data: summaryRows.map((r) => ({
            ...r,
            packQtyFormatted: formatQuantity(r.packQty),
            totalQtyFormatted: formatQuantity(r.totalQty),
            valueFormatted: formatCurrency(r.value),
            percentOfTotalFormatted: formatPercent(r.percentOfTotal),
            lastSaleDateFormatted: formatDate(r.lastSaleDate),
          })),
          grandTotal: {
            distributorName: 'GRAND TOTAL',
            salesmenNames: '',
            invoiceCount: grandTotal.invoiceCount,
            packQtyFormatted: formatQuantity(grandTotal.packQty),
            totalQtyFormatted: formatQuantity(grandTotal.totalQty),
            valueFormatted: formatCurrency(grandTotal.value),
            percentOfTotalFormatted: formatPercent(grandTotal.percentOfTotal),
            lastSaleDateFormatted: '',
          },
          orientation: 'landscape',
        });
      } else {
        const totVal = activeDetailLines.reduce((a, b) => a + b.netValue, 0);
        const totPack = activeDetailLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeDetailLines.reduce((a, b) => a + b.totalQty, 0);

        exportReportToPdf({
          fileName: 'S4_Distributor_Wise_Sales_Detailed.pdf',
          reportCode: 'S4',
          reportTitle: drillDownDistributor
            ? `Distributor Sales — Detail: ${drillDownDistributor.name}`
            : 'Distributor-Wise Sales (Detailed Invoices)',
          viewName: drillDownDistributor ? `Distributor: ${drillDownDistributor.name}` : 'Detailed View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'dateFormatted' },
            { header: 'Distributor', dataKey: 'distributorName' },
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Party', dataKey: 'partyName' },
            { header: 'Salesman', dataKey: 'salesmanName' },
            { header: 'Item', dataKey: 'productName' },
            { header: 'Pack Qty', dataKey: 'packQtyFormatted', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Rate', dataKey: 'rateFormatted', align: 'right' },
            { header: 'Value', dataKey: 'valueFormatted', align: 'right' },
          ],
          data: sortedDetailLines.map((l) => ({
            dateFormatted: formatDate(l.date),
            distributorName: DISTRIBUTOR_MAP.get(l.distributorId)?.name || '',
            invoiceNo: l.invoiceNo,
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            productName: l.product.name,
            packQtyFormatted: formatQuantity(l.packQty),
            totalQtyFormatted: formatQuantity(l.totalQty),
            rateFormatted: formatCurrency(l.rate),
            valueFormatted: formatCurrency(l.netValue),
          })),
          grandTotal: {
            dateFormatted: 'GRAND TOTAL',
            distributorName: '',
            invoiceNo: '',
            partyName: '',
            salesmanName: '',
            productName: '',
            packQtyFormatted: formatQuantity(totPack),
            totalQtyFormatted: formatQuantity(totQty),
            rateFormatted: '',
            valueFormatted: formatCurrency(totVal),
          },
          orientation: 'landscape',
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Export Downloaded',
        message: 'Distributor-wise sales PDF downloaded successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Error generating PDF.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const filterSummary = getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'summarized' && !drillDownDistributor) {
        await exportReportToExcel({
          fileName: 'S4_Distributor_Wise_Sales.xlsx',
          reportCode: 'S4',
          reportTitle: 'Distributor-Wise Sales Report',
          viewName: 'Summarized View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Distributor', dataKey: 'distributorName', width: 26, type: 'text' },
            { header: 'Salesman', dataKey: 'salesmenNames', width: 24, type: 'text' },
            { header: 'Invoices', dataKey: 'invoiceCount', width: 12, type: 'quantity' },
            { header: 'Pack Qty', dataKey: 'packQty', width: 14, type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', width: 14, type: 'quantity' },
            { header: 'Value (PKR)', dataKey: 'value', width: 18, type: 'currency' },
            { header: '% of Total', dataKey: 'percentOfTotal', width: 12, type: 'percent' },
            { header: 'Last Sale Date', dataKey: 'lastSaleDate', width: 15, type: 'date' },
          ],
          data: summaryRows,
          grandTotal: {
            distributorName: 'GRAND TOTAL',
            salesmenNames: '',
            invoiceCount: grandTotal.invoiceCount,
            packQty: grandTotal.packQty,
            totalQty: grandTotal.totalQty,
            value: grandTotal.value,
            percentOfTotal: grandTotal.percentOfTotal,
            lastSaleDate: '',
          },
        });
      } else {
        const totVal = activeDetailLines.reduce((a, b) => a + b.netValue, 0);
        const totPack = activeDetailLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeDetailLines.reduce((a, b) => a + b.totalQty, 0);

        await exportReportToExcel({
          fileName: 'S4_Distributor_Wise_Sales_Detailed.xlsx',
          reportCode: 'S4',
          reportTitle: drillDownDistributor
            ? `Distributor Sales — Detail: ${drillDownDistributor.name}`
            : 'Distributor-Wise Sales (Detailed Invoices)',
          viewName: drillDownDistributor ? `Distributor: ${drillDownDistributor.name}` : 'Detailed View',
          companyName: filterSummary.companyName,
          dateRange: filterSummary.dateRange,
          salesmenText: filterSummary.salesmenText,
          itemGroupsText: filterSummary.itemGroupsText,
          distributorsText: filterSummary.distributorsText,
          columns: [
            { header: 'Date', dataKey: 'date', width: 14, type: 'date' },
            { header: 'Distributor', dataKey: 'distributorName', width: 24, type: 'text' },
            { header: 'Invoice No', dataKey: 'invoiceNo', width: 15, type: 'text' },
            { header: 'Party', dataKey: 'partyName', width: 24, type: 'text' },
            { header: 'Salesman', dataKey: 'salesmanName', width: 18, type: 'text' },
            { header: 'Item', dataKey: 'productName', width: 22, type: 'text' },
            { header: 'Pack Qty', dataKey: 'packQty', width: 12, type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', width: 12, type: 'quantity' },
            { header: 'Rate (PKR)', dataKey: 'rate', width: 14, type: 'currency' },
            { header: 'Value (PKR)', dataKey: 'netValue', width: 18, type: 'currency' },
          ],
          data: sortedDetailLines.map((l) => ({
            date: formatDate(l.date),
            distributorName: DISTRIBUTOR_MAP.get(l.distributorId)?.name || '',
            invoiceNo: l.invoiceNo,
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            productName: l.product.name,
            packQty: l.packQty,
            totalQty: l.totalQty,
            rate: l.rate,
            netValue: l.netValue,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
            distributorName: '',
            invoiceNo: '',
            partyName: '',
            salesmanName: '',
            productName: '',
            packQty: totPack,
            totalQty: totQty,
            rate: '',
            netValue: totVal,
          },
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Excel Export Downloaded',
        message: 'Distributor-wise sales Excel workbook generated successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Excel Export Failed',
        message: err?.message || 'Error generating Excel workbook.',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Shared Filter Panel */}
      <SalesFilterPanel
        appliedFilters={appliedFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Report Toolbar */}
      <ReportToolbar
        reportCode="S4"
        reportTitle="Distributor-Wise Sales Report"
        description="Distributor sales performance ranked by net revenue with invoice frequencies and activity timestamps."
        viewOptions={[
          { id: 'summarized', label: 'Summarized View' },
          { id: 'detailed', label: 'Detailed Invoices' },
        ]}
        currentView={viewMode}
        onViewChange={(v) => {
          setViewMode(v as 'summarized' | 'detailed');
          if (v === 'summarized') setDrillDownDistributor(null);
        }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        dateFrom={appliedFilters.dateFrom}
        dateTo={appliedFilters.dateTo}
        isExportingPdf={isExportingPdf}
        isExportingExcel={isExportingExcel}
        drillDownContext={
          drillDownDistributor
            ? {
                title: `Distributor: ${drillDownDistributor.name}`,
                onBack: () => {
                  setDrillDownDistributor(null);
                  setViewMode('summarized');
                },
              }
            : null
        }
        totalRowCount={viewMode === 'summarized' && !drillDownDistributor ? summaryRows.length : sortedDetailLines.length}
      />

      {/* Table Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto">
        {viewMode === 'summarized' && !drillDownDistributor ? (
          /* Summarized View */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="distributorName" label="Distributor" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="salesmenNames" label="Salesman" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="invoiceCount" label="Invoices" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="packQty" label="Pack Qty" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="value" label="Value" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="percentOfTotal" label="% of Total" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="lastSaleDate" label="Last Sale Date" sortState={summarySort} onSort={handleSummarySort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No distributor sales records match the active filters.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((row) => (
                      <tr
                        key={row.distributorId}
                        onClick={() => handleDistributorDrillDown(row)}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        title="Click to view detailed invoices for this distributor"
                      >
                        <td className="px-3 py-2.5 font-semibold text-slate-900 group-hover:text-blue-700">
                          {row.distributorName}
                          <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({row.distributorCode})</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 truncate max-w-[200px]" title={row.salesmenNames}>
                          {row.salesmenNames}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{row.invoiceCount}</td>
                        <td className="px-3 py-2.5 text-right text-slate-800">{formatQuantity(row.packQty)}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatQuantity(row.totalQty)}</td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${getValueColorClass(row.value)}`}>
                          {formatCurrency(row.value)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{formatPercent(row.percentOfTotal)}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{formatDate(row.lastSaleDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {summaryRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="px-3 py-3 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-3 py-3 text-right">{grandTotal.invoiceCount}</td>
                      <td className="px-3 py-3 text-right">{formatQuantity(grandTotal.packQty)}</td>
                      <td className="px-3 py-3 text-right">{formatQuantity(grandTotal.totalQty)}</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(grandTotal.value)}`}>
                        {formatCurrency(grandTotal.value)}
                      </td>
                      <td className="px-3 py-3 text-right">{formatPercent(grandTotal.percentOfTotal)}</td>
                      <td className="px-3 py-3 text-slate-400 font-normal">—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Sorted by Value (descending). Click any distributor row to drill into underlying invoices.</span>
              <span>Invoice counts reflect distinct invoices without duplicate counting</span>
            </div>
          </div>
        ) : (
          /* Detailed View */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="date" label="Date" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="distributor" label="Distributor" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="invoiceNo" label="Invoice No" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="party" label="Party" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="salesman" label="Salesman" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="item" label="Item" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="packQty" label="Pack Qty" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="rate" label="Rate" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="netValue" label="Value" sortState={detailSort} onSort={handleDetailSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDetailLines.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No detailed lines found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDetailLines.map((line) => {
                      const dist = DISTRIBUTOR_MAP.get(line.distributorId);
                      const party = PARTY_MAP.get(line.partyId);
                      const sm = SALESMAN_MAP.get(line.salesmanId);
                      return (
                        <tr key={line.lineId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{formatDate(line.date)}</td>
                          <td className="px-3 py-2.5 text-slate-700 font-medium">{dist?.name}</td>
                          <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold">{line.invoiceNo}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">{party?.name}</td>
                          <td className="px-3 py-2.5 text-slate-700">{sm?.name}</td>
                          <td className="px-3 py-2.5 text-slate-900">{line.product.name}</td>
                          <td className="px-3 py-2.5 text-right text-slate-800">{formatQuantity(line.packQty)}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatQuantity(line.totalQty)}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-mono">{formatCurrency(line.rate)}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${getValueColorClass(line.netValue)}`}>
                            {formatCurrency(line.netValue)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sortedDetailLines.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={6} className="px-3 py-3 uppercase tracking-wider">
                        Reconciled Grand Total ({sortedDetailLines.length} filtered lines)
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(activeDetailLines.reduce((a, b) => a + b.packQty, 0))}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(activeDetailLines.reduce((a, b) => a + b.totalQty, 0))}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-400 font-normal">—</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(activeDetailLines.reduce((a, b) => a + b.netValue, 0))}`}>
                        {formatCurrency(activeDetailLines.reduce((a, b) => a + b.netValue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              pageSize={pageSize}
              totalRows={sortedDetailLines.length}
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

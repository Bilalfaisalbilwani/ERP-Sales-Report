import React, { useState, useMemo } from 'react';
import { FilterState, SortState } from '../../types';
import { SalesFilterPanel } from '../../components/filters/SalesFilterPanel';
import { ReportToolbar } from '../../components/common/ReportToolbar';
import { SortHeader } from '../../components/common/SortHeader';
import { DataTablePagination } from '../../components/common/DataTablePagination';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  getFilteredRecords,
  computeS1Summary,
  S1SummaryRow,
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
import { PARTY_MAP, SALESMAN_MAP, COMPANY_MAP } from '../../data/dummyData';

export const ReportS1: React.FC = () => {
  // S1 Default date: today's date (2026-10-22)
  const defaultFilters: FilterState = {
    companyIds: [],
    companyId: 'all',
    dateFrom: '2026-10-22',
    dateTo: '2026-10-22',
    salesmenIds: [],
    itemGroupIds: [],
    distributorIds: [],
  };

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<'summarized' | 'detailed'>('summarized');
  const [drillDownItem, setDrillDownItem] = useState<{ id: string; name: string } | null>(null);

  // Sorting
  const [summarySort, setSummarySort] = useState<SortState>({ column: 'value', direction: 'desc' });
  const [detailSort, setDetailSort] = useState<SortState>({ column: 'date', direction: 'desc' });

  // Pagination for detailed view
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Feedback toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // 1. Fetch filtered records
  const { lineItems } = useMemo(() => {
    return getFilteredRecords(appliedFilters, false);
  }, [appliedFilters]);

  // If drilled down to an item, also scope lineItems for detailed view
  const activeDetailLines = useMemo(() => {
    if (drillDownItem) {
      return lineItems.filter((l) => l.productId === drillDownItem.id);
    }
    return lineItems;
  }, [lineItems, drillDownItem]);

  // 2. Compute Summary
  const { rows: rawSummaryRows, grandTotal } = useMemo(() => {
    return computeS1Summary(lineItems);
  }, [lineItems]);

  // Sorted summary rows
  const summaryRows = useMemo(() => {
    const list = [...rawSummaryRows];
    list.sort((a, b) => {
      const col = summarySort.column as keyof S1SummaryRow;
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

  // Sorted detailed lines
  const sortedDetailLines = useMemo(() => {
    const list = [...activeDetailLines];
    list.sort((a, b) => {
      let valA: any = a[detailSort.column as keyof FilteredLineItem];
      let valB: any = b[detailSort.column as keyof FilteredLineItem];

      if (detailSort.column === 'party') {
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

  // Paginated detailed lines
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
    setDrillDownItem(null);
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

  const handleRowClickDrillDown = (row: S1SummaryRow) => {
    setDrillDownItem({ id: row.productId, name: row.itemName });
    setViewMode('detailed');
    setPage(1);
  };


  // Export to PDF
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    const { companyName, dateRange, salesmenText, itemGroupsText, distributorsText } =
      getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'summarized' && !drillDownItem) {
        exportReportToPdf({
          fileName: 'S1_Total_Sales_By_Date.pdf',
          reportCode: 'S1',
          reportTitle: 'Total Sales by Date (Item and Value)',
          viewName: 'Summarized View',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Item Code', dataKey: 'itemCode' },
            { header: 'Item Name', dataKey: 'itemName' },
            { header: 'Item Group', dataKey: 'itemGroupName' },
            { header: 'Pack Size', dataKey: 'packSize' },
            { header: 'Pack Qty', dataKey: 'packQty', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQty', align: 'right' },
            { header: 'Value (PKR)', dataKey: 'valueFormatted', align: 'right' },
            { header: '% of Total', dataKey: 'percentOfTotalFormatted', align: 'right' },
          ],
          data: summaryRows.map((r) => ({
            ...r,
            packQty: formatQuantity(r.packQty),
            totalQty: formatQuantity(r.totalQty),
            valueFormatted: formatCurrency(r.value),
            percentOfTotalFormatted: formatPercent(r.percentOfTotal),
          })),
          grandTotal: {
            itemCode: 'GRAND TOTAL',
            itemName: '',
            itemGroupName: '',
            packSize: '',
            packQty: formatQuantity(grandTotal.packQty),
            totalQty: formatQuantity(grandTotal.totalQty),
            valueFormatted: formatCurrency(grandTotal.value),
            percentOfTotalFormatted: formatPercent(grandTotal.percentOfTotal),
          },
          orientation: 'landscape',
        });
      } else {
        // Detailed View (export all filtered matching lines, not just page)
        const detailTotalVal = activeDetailLines.reduce((acc, l) => acc + l.netValue, 0);
        const detailTotalPack = activeDetailLines.reduce((acc, l) => acc + l.packQty, 0);
        const detailTotalQty = activeDetailLines.reduce((acc, l) => acc + l.totalQty, 0);

        exportReportToPdf({
          fileName: 'S1_Total_Sales_By_Date_Detailed.pdf',
          reportCode: 'S1',
          reportTitle: drillDownItem
            ? `Total Sales by Date — Detail: ${drillDownItem.name}`
            : 'Total Sales by Date (Detailed)',
          viewName: drillDownItem ? `Item Drill-Down: ${drillDownItem.name}` : 'Detailed View',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Date', dataKey: 'dateFormatted' },
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Party', dataKey: 'partyName' },
            { header: 'Salesman', dataKey: 'salesmanName' },
            { header: 'Item', dataKey: 'productName' },
            { header: 'Pack Qty', dataKey: 'packQty', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQty', align: 'right' },
            { header: 'Rate', dataKey: 'rateFormatted', align: 'right' },
            { header: 'Discount', dataKey: 'discountFormatted', align: 'right' },
            { header: 'Net Value', dataKey: 'netValueFormatted', align: 'right' },
          ],
          data: sortedDetailLines.map((l) => ({
            dateFormatted: formatDate(l.date),
            invoiceNo: l.invoiceNo,
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            productName: l.product.name,
            packQty: formatQuantity(l.packQty),
            totalQty: formatQuantity(l.totalQty),
            rateFormatted: formatCurrency(l.rate),
            discountFormatted: formatCurrency(l.discount),
            netValueFormatted: formatCurrency(l.netValue),
          })),
          grandTotal: {
            dateFormatted: 'GRAND TOTAL',
            invoiceNo: '',
            partyName: '',
            salesmanName: '',
            productName: '',
            packQty: formatQuantity(detailTotalPack),
            totalQty: formatQuantity(detailTotalQty),
            rateFormatted: '',
            discountFormatted: '',
            netValueFormatted: formatCurrency(detailTotalVal),
          },
          orientation: 'landscape',
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Export Generated',
        message: 'Your report PDF has been downloaded successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Failed to generate PDF.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const { companyName, dateRange, salesmenText, itemGroupsText, distributorsText } =
      getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'summarized' && !drillDownItem) {
        await exportReportToExcel({
          fileName: 'S1_Total_Sales_By_Date.xlsx',
          reportCode: 'S1',
          reportTitle: 'Total Sales by Date (Item and Value)',
          viewName: 'Summarized View',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Item Code', dataKey: 'itemCode', type: 'text' },
            { header: 'Item Name', dataKey: 'itemName', type: 'text', width: 26 },
            { header: 'Item Group', dataKey: 'itemGroupName', type: 'text' },
            { header: 'Pack Size', dataKey: 'packSize', type: 'text' },
            { header: 'Pack Qty', dataKey: 'packQty', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Value (PKR)', dataKey: 'value', type: 'currency' },
            { header: '% of Total', dataKey: 'percentOfTotal', type: 'percent' },
          ],
          data: summaryRows,
          grandTotal: {
            itemCode: 'GRAND TOTAL',
            itemName: '',
            itemGroupName: '',
            packSize: '',
            packQty: grandTotal.packQty,
            totalQty: grandTotal.totalQty,
            value: grandTotal.value,
            percentOfTotal: grandTotal.percentOfTotal,
          },
        });
      } else {
        const detailTotalVal = activeDetailLines.reduce((acc, l) => acc + l.netValue, 0);
        const detailTotalPack = activeDetailLines.reduce((acc, l) => acc + l.packQty, 0);
        const detailTotalQty = activeDetailLines.reduce((acc, l) => acc + l.totalQty, 0);

        await exportReportToExcel({
          fileName: 'S1_Total_Sales_By_Date_Detailed.xlsx',
          reportCode: 'S1',
          reportTitle: drillDownItem
            ? `Total Sales by Date — Detail: ${drillDownItem.name}`
            : 'Total Sales by Date (Detailed)',
          viewName: drillDownItem ? `Item Drill-Down: ${drillDownItem.name}` : 'Detailed View',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Date', dataKey: 'date', type: 'date' },
            { header: 'Invoice No', dataKey: 'invoiceNo', type: 'text' },
            { header: 'Party', dataKey: 'partyName', type: 'text', width: 22 },
            { header: 'Salesman', dataKey: 'salesmanName', type: 'text', width: 18 },
            { header: 'Item', dataKey: 'productName', type: 'text', width: 25 },
            { header: 'Pack Qty', dataKey: 'packQty', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Rate (PKR)', dataKey: 'rate', type: 'currency' },
            { header: 'Discount', dataKey: 'discount', type: 'currency' },
            { header: 'Net Value (PKR)', dataKey: 'netValue', type: 'currency' },
          ],
          data: sortedDetailLines.map((l) => ({
            date: formatDate(l.date),
            invoiceNo: l.invoiceNo,
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            productName: l.product.name,
            packQty: l.packQty,
            totalQty: l.totalQty,
            rate: l.rate,
            discount: l.discount,
            netValue: l.netValue,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
            invoiceNo: '',
            partyName: '',
            salesmanName: '',
            productName: '',
            packQty: detailTotalPack,
            totalQty: detailTotalQty,
            rate: '',
            discount: '',
            netValue: detailTotalVal,
          },
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Excel Export Generated',
        message: 'Your report Excel workbook has been downloaded.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Failed to generate Excel file.',
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
        reportCode="S1"
        reportTitle="Total Sales by Date"
        description="Comprehensive sales performance breakdown by item, pack size, and net realized value."
        viewOptions={[
          { id: 'summarized', label: 'Summarized View' },
          { id: 'detailed', label: 'Detailed Invoices' },
        ]}
        currentView={viewMode}
        onViewChange={(v) => {
          setViewMode(v as 'summarized' | 'detailed');
          if (v === 'summarized') setDrillDownItem(null);
        }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        dateFrom={appliedFilters.dateFrom}
        dateTo={appliedFilters.dateTo}
        isExportingPdf={isExportingPdf}
        isExportingExcel={isExportingExcel}
        drillDownContext={
          drillDownItem
            ? {
                title: `Item: ${drillDownItem.name}`,
                onBack: () => {
                  setDrillDownItem(null);
                  setViewMode('summarized');
                },
              }
            : null
        }
        totalRowCount={viewMode === 'summarized' && !drillDownItem ? summaryRows.length : sortedDetailLines.length}
      />

      {/* Table Content Container */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto">
        {viewMode === 'summarized' && !drillDownItem ? (
          /* Summarized View Table */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="itemCode" label="Item Code" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="itemName" label="Item" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="itemGroupName" label="Item Group" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="packSize" label="Pack Size" sortState={summarySort} onSort={handleSummarySort} />
                    <SortHeader columnKey="packQty" label="Pack Qty" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="value" label="Value" sortState={summarySort} onSort={handleSummarySort} align="right" />
                    <SortHeader columnKey="percentOfTotal" label="% of Total" sortState={summarySort} onSort={handleSummarySort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No sales records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((row) => (
                      <tr
                        key={row.productId}
                        onClick={() => handleRowClickDrillDown(row)}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        title="Click to view detailed invoice lines for this item"
                      >
                        <td className="px-3 py-2.5 font-mono text-slate-600 font-medium">
                          {row.itemCode}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 group-hover:text-blue-700">
                          {row.itemName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.itemGroupName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-mono">
                          {row.packSize}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                          {formatQuantity(row.packQty)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                          {formatQuantity(row.totalQty)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${getValueColorClass(row.value)}`}>
                          {formatCurrency(row.value)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 font-medium">
                          {formatPercent(row.percentOfTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {summaryRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="px-3 py-3 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(grandTotal.packQty)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(grandTotal.totalQty)}
                      </td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(grandTotal.value)}`}>
                        {formatCurrency(grandTotal.value)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatPercent(grandTotal.percentOfTotal)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing all {summaryRows.length} items. Click any row to drill down into invoice details.</span>
              <span>Sorted by Value (descending)</span>
            </div>
          </div>
        ) : (
          /* Detailed View Table */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="date" label="Date" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="invoiceNo" label="Invoice No" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="party" label="Party" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="salesman" label="Salesman" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="item" label="Item" sortState={detailSort} onSort={handleDetailSort} />
                    <SortHeader columnKey="packQty" label="Pack Qty" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="rate" label="Rate" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="discount" label="Discount" sortState={detailSort} onSort={handleDetailSort} align="right" />
                    <SortHeader columnKey="netValue" label="Net Value" sortState={detailSort} onSort={handleDetailSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDetailLines.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No invoice detail lines found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDetailLines.map((line) => {
                      const party = PARTY_MAP.get(line.partyId);
                      const sm = SALESMAN_MAP.get(line.salesmanId);
                      return (
                        <tr key={line.lineId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {formatDate(line.date)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold whitespace-nowrap">
                            {line.invoiceNo}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {party ? party.name : 'Unknown'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {sm ? sm.name : 'Unknown'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-900 font-medium">
                            {line.product.name}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-800">
                            {formatQuantity(line.packQty)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                            {formatQuantity(line.totalQty)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                            {formatCurrency(line.rate)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-500 font-mono">
                            {line.discount > 0 ? formatCurrency(line.discount) : '-'}
                          </td>
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
                      <td colSpan={5} className="px-3 py-3 uppercase tracking-wider">
                        Reconciled Grand Total ({sortedDetailLines.length} filtered lines)
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(
                          activeDetailLines.reduce((acc, l) => acc + l.packQty, 0)
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(
                          activeDetailLines.reduce((acc, l) => acc + l.totalQty, 0)
                        )}
                      </td>
                      <td colSpan={2} className="px-3 py-3 text-right text-slate-500 font-normal">
                        Line Discount: {formatCurrency(activeDetailLines.reduce((acc, l) => acc + l.discount, 0))}
                      </td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(activeDetailLines.reduce((acc, l) => acc + l.netValue, 0))}`}>
                        {formatCurrency(
                          activeDetailLines.reduce((acc, l) => acc + l.netValue, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination Controls */}
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

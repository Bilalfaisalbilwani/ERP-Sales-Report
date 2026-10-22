import React, { useState, useMemo } from 'react';
import { FilterState, SortState } from '../../types';
import { SalesFilterPanel } from '../../components/filters/SalesFilterPanel';
import { ReportToolbar } from '../../components/common/ReportToolbar';
import { SortHeader } from '../../components/common/SortHeader';
import { DataTablePagination } from '../../components/common/DataTablePagination';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  getFilteredRecords,
  computeS3Summary,
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
import { COMPANIES, PARTY_MAP, SALESMAN_MAP, COMPANY_MAP } from '../../data/dummyData';

export const ReportS3: React.FC = () => {
  // S3 default date range: 2026-10-01 to 2026-10-22
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
  const [drillDownItem, setDrillDownItem] = useState<{ id: string; name: string } | null>(null);

  // Sorting for detailed view
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

  // S3 Grouped Summary
  const { groups: s3Groups, grandTotal } = useMemo(() => {
    return computeS3Summary(lineItems);
  }, [lineItems]);

  // Active detail lines (optionally filtered if user drilled down into a specific item)
  const activeDetailLines = useMemo(() => {
    if (drillDownItem) {
      return lineItems.filter((l) => l.productId === drillDownItem.id);
    }
    return lineItems;
  }, [lineItems, drillDownItem]);

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
    setViewMode('summarized');
    setPage(1);
  };

  const handleDetailSort = (colKey: string) => {
    setDetailSort((prev) => ({
      column: colKey,
      direction: prev.column === colKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleItemClickDrillDown = (item: { id: string; name: string }) => {
    setDrillDownItem(item);
    setViewMode('detailed');
    setPage(1);
  };

  const getExportMetadata = () => {
    const compName =
      appliedFilters.companyIds && appliedFilters.companyIds.length > 0
        ? (appliedFilters.companyIds.length === COMPANIES.length
            ? 'All Companies (Consolidated)'
            : appliedFilters.companyIds.map((id) => COMPANY_MAP.get(id)?.name || id).join(', '))
        : (appliedFilters.companyId && appliedFilters.companyId !== 'all'
            ? COMPANY_MAP.get(appliedFilters.companyId)?.name || 'Unknown'
            : 'All Companies (Consolidated)');
    const dateRangeStr = `${formatDate(appliedFilters.dateFrom)} to ${formatDate(
      appliedFilters.dateTo
    )}`;
    const filtersSummary: string[] = [];
    if (appliedFilters.salesmenIds.length > 0) {
      filtersSummary.push(`Salesmen: ${appliedFilters.salesmenIds.length} selected`);
    }
    if (appliedFilters.itemGroupIds.length > 0) {
      filtersSummary.push(`Item Groups: ${appliedFilters.itemGroupIds.length} selected`);
    }
    if (appliedFilters.distributorIds.length > 0) {
      filtersSummary.push(`Distributors: ${appliedFilters.distributorIds.length} selected`);
    }
    return { compName, dateRangeStr, filtersSummary };
  };

  // Export to PDF
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    const { companyName, dateRange, salesmenText, itemGroupsText, distributorsText } =
      getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'summarized' && !drillDownItem) {
        const rows: any[] = [];
        s3Groups.forEach((grp) => {
          rows.push({
            __isGroupHeader: true,
            __groupTitle: `ITEM GROUP: ${grp.itemGroupName.toUpperCase()}`,
          });
          grp.items.forEach((item) => {
            rows.push({
              itemCode: item.itemCode,
              itemName: item.itemName,
              itemGroupName: item.itemGroupName,
              packSize: item.packSize,
              packQtyFormatted: formatQuantity(item.packQty),
              totalQtyFormatted: formatQuantity(item.totalQty),
              averageRateFormatted: formatCurrency(item.averageRate),
              valueFormatted: formatCurrency(item.value),
              percentOfTotalFormatted: formatPercent(item.percentOfTotal),
            });
          });
          // Subtotal row
          rows.push({
            __isSubtotal: true,
            itemCode: `Subtotal (${grp.itemGroupName})`,
            itemName: '',
            itemGroupName: '',
            packSize: '',
            packQtyFormatted: formatQuantity(grp.subtotal.packQty),
            totalQtyFormatted: formatQuantity(grp.subtotal.totalQty),
            averageRateFormatted: formatCurrency(grp.subtotal.averageRate),
            valueFormatted: formatCurrency(grp.subtotal.value),
            percentOfTotalFormatted: formatPercent(grp.subtotal.percentOfTotal),
          });
        });

        exportReportToPdf({
          fileName: 'S3_Item_Wise_Sales.pdf',
          reportCode: 'S3',
          reportTitle: 'Item-Wise Sales Report (Grouped with Subtotals)',
          viewName: 'Summarized Grouped View',
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
            { header: 'Pack Qty', dataKey: 'packQtyFormatted', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Avg Rate', dataKey: 'averageRateFormatted', align: 'right' },
            { header: 'Value (PKR)', dataKey: 'valueFormatted', align: 'right' },
            { header: '% of Total', dataKey: 'percentOfTotalFormatted', align: 'right' },
          ],
          data: rows,
          grandTotal: {
            itemCode: 'GRAND TOTAL',
            itemName: '',
            itemGroupName: '',
            packSize: '',
            packQtyFormatted: formatQuantity(grandTotal.packQty),
            totalQtyFormatted: formatQuantity(grandTotal.totalQty),
            averageRateFormatted: formatCurrency(grandTotal.averageRate),
            valueFormatted: formatCurrency(grandTotal.value),
            percentOfTotalFormatted: formatPercent(grandTotal.percentOfTotal),
          },
          orientation: 'landscape',
        });
      } else {
        const totPack = activeDetailLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeDetailLines.reduce((a, b) => a + b.totalQty, 0);
        const totVal = activeDetailLines.reduce((a, b) => a + b.netValue, 0);

        exportReportToPdf({
          fileName: 'S3_Item_Wise_Sales_Detailed.pdf',
          reportCode: 'S3',
          reportTitle: drillDownItem
            ? `Item-Wise Sales — Drill-Down: ${drillDownItem.name}`
            : 'Item-Wise Sales (Detailed Invoices)',
          viewName: drillDownItem ? `Item: ${drillDownItem.name}` : 'Detailed View',
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
            { header: 'Pack Qty', dataKey: 'packQtyFormatted', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Rate', dataKey: 'rateFormatted', align: 'right' },
            { header: 'Value', dataKey: 'valueFormatted', align: 'right' },
          ],
          data: sortedDetailLines.map((l) => ({
            dateFormatted: formatDate(l.date),
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
        message: 'Item-wise sales PDF report has been generated.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'PDF Export Failed',
        message: err?.message || 'Error creating PDF.',
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
        const rows: any[] = [];
        s3Groups.forEach((grp) => {
          grp.items.forEach((item) => {
            rows.push({
              itemCode: item.itemCode,
              itemName: item.itemName,
              itemGroupName: item.itemGroupName,
              packSize: item.packSize,
              packQty: item.packQty,
              totalQty: item.totalQty,
              averageRate: item.averageRate,
              value: item.value,
              percentOfTotal: item.percentOfTotal,
            });
          });
          // Subtotal
          rows.push({
            __isSubtotal: true,
            itemCode: `Subtotal (${grp.itemGroupName})`,
            itemName: '',
            itemGroupName: grp.itemGroupName,
            packSize: '',
            packQty: grp.subtotal.packQty,
            totalQty: grp.subtotal.totalQty,
            averageRate: grp.subtotal.averageRate,
            value: grp.subtotal.value,
            percentOfTotal: grp.subtotal.percentOfTotal,
          });
        });

        await exportReportToExcel({
          fileName: 'S3_Item_Wise_Sales.xlsx',
          reportCode: 'S3',
          reportTitle: 'Item-Wise Sales Report',
          viewName: 'Summarized Grouped View',
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
            { header: 'Avg Rate (PKR)', dataKey: 'averageRate', type: 'currency' },
            { header: 'Value (PKR)', dataKey: 'value', type: 'currency' },
            { header: '% of Total', dataKey: 'percentOfTotal', type: 'percent' },
          ],
          data: rows,
          grandTotal: {
            itemCode: 'GRAND TOTAL',
            itemName: '',
            itemGroupName: '',
            packSize: '',
            packQty: grandTotal.packQty,
            totalQty: grandTotal.totalQty,
            averageRate: grandTotal.averageRate,
            value: grandTotal.value,
            percentOfTotal: grandTotal.percentOfTotal,
          },
        });
      } else {
        const totPack = activeDetailLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeDetailLines.reduce((a, b) => a + b.totalQty, 0);
        const totVal = activeDetailLines.reduce((a, b) => a + b.netValue, 0);

        await exportReportToExcel({
          fileName: 'S3_Item_Wise_Sales_Detailed.xlsx',
          reportCode: 'S3',
          reportTitle: drillDownItem
            ? `Item-Wise Sales — Drill-Down: ${drillDownItem.name}`
            : 'Item-Wise Sales (Detailed Invoices)',
          viewName: drillDownItem ? `Item: ${drillDownItem.name}` : 'Detailed View',
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
            { header: 'Item', dataKey: 'productName', type: 'text', width: 26 },
            { header: 'Pack Qty', dataKey: 'packQty', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Rate (PKR)', dataKey: 'rate', type: 'currency' },
            { header: 'Value (PKR)', dataKey: 'netValue', type: 'currency' },
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
            netValue: l.netValue,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
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
        message: 'Item-wise sales Excel workbook generated successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Excel Export Failed',
        message: err?.message || 'Error creating Excel file.',
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
        reportCode="S3"
        reportTitle="Item-Wise Sales"
        description="Item catalog volume and value analysis grouped by item categories with weighted average rates and subtotals."
        viewOptions={[
          { id: 'summarized', label: 'Summarized Grouped View' },
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
        totalRowCount={
          viewMode === 'summarized' && !drillDownItem
            ? s3Groups.reduce((a, b) => a + b.items.length, 0)
            : sortedDetailLines.length
        }
      />

      {/* Table Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto">
        {viewMode === 'summarized' && !drillDownItem ? (
          /* Summarized View Grouped by Item Group with Subtotals */
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Item Code</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Item</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Item Group</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Pack Size</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Pack Qty</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Total Qty</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Average Rate</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Value</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {s3Groups.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No items match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    s3Groups.map((group) => (
                      <React.Fragment key={group.itemGroupId}>
                        {/* Group Header Banner */}
                        <tr className="bg-slate-100/80 font-bold text-slate-800 border-t border-slate-300">
                          <td colSpan={9} className="px-3 py-2 text-slate-800 bg-slate-100">
                            CATEGORY: {group.itemGroupName.toUpperCase()} ({group.items.length} items)
                          </td>
                        </tr>

                        {/* Item Rows */}
                        {group.items.map((item) => (
                          <tr
                            key={item.productId}
                            onClick={() =>
                              handleItemClickDrillDown({ id: item.productId, name: item.itemName })
                            }
                            className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                            title="Click to view detailed invoices for this item"
                          >
                            <td className="px-3 py-2 font-mono text-slate-500 font-medium pl-6">
                              {item.itemCode}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-900 group-hover:text-blue-700">
                              {item.itemName}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{item.itemGroupName}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{item.packSize}</td>
                            <td className="px-3 py-2 text-right text-slate-800">{formatQuantity(item.packQty)}</td>
                            <td className="px-3 py-2 text-right font-medium text-slate-800">
                              {formatQuantity(item.totalQty)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              {formatCurrency(item.averageRate)}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold ${getValueColorClass(item.value)}`}>
                              {formatCurrency(item.value)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700 font-medium">
                              {formatPercent(item.percentOfTotal)}
                            </td>
                          </tr>
                        ))}

                        {/* Group Subtotal Row */}
                        <tr className="bg-slate-50 font-bold text-slate-800 border-b border-slate-200">
                          <td colSpan={4} className="px-3 py-2 pl-6 italic text-slate-600">
                            Subtotal — {group.itemGroupName}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-900 font-semibold">
                            {formatQuantity(group.subtotal.packQty)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-900 font-semibold">
                            {formatQuantity(group.subtotal.totalQty)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-700">
                            {formatCurrency(group.subtotal.averageRate)}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${getValueColorClass(group.subtotal.value)}`}>
                            {formatCurrency(group.subtotal.value)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold">
                            {formatPercent(group.subtotal.percentOfTotal)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
                {s3Groups.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="px-3 py-3 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-3 py-3 text-right">{formatQuantity(grandTotal.packQty)}</td>
                      <td className="px-3 py-3 text-right">{formatQuantity(grandTotal.totalQty)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatCurrency(grandTotal.averageRate)}</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(grandTotal.value)}`}>
                        {formatCurrency(grandTotal.value)}
                      </td>
                      <td className="px-3 py-3 text-right">{formatPercent(grandTotal.percentOfTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Grouped by Item Category with subtotal reconciliations. Click any row to view invoice lines.</span>
              <span>Weighted Average Rate = Sum(Net Value) / Sum(Total Qty)</span>
            </div>
          </div>
        ) : (
          /* Detailed Invoices View */
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
                    <SortHeader columnKey="netValue" label="Value" sortState={detailSort} onSort={handleDetailSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDetailLines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No invoice detail records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDetailLines.map((line) => {
                      const party = PARTY_MAP.get(line.partyId);
                      const sm = SALESMAN_MAP.get(line.salesmanId);
                      return (
                        <tr key={line.lineId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{formatDate(line.date)}</td>
                          <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold">{line.invoiceNo}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">{party?.name}</td>
                          <td className="px-3 py-2.5 text-slate-700">{sm?.name}</td>
                          <td className="px-3 py-2.5 text-slate-900 font-medium">{line.product.name}</td>
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
                      <td colSpan={5} className="px-3 py-3 uppercase tracking-wider">
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

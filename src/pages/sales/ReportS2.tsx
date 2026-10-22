import React, { useState, useMemo } from 'react';
import { FilterState, SortState } from '../../types';
import { SalesFilterPanel } from '../../components/filters/SalesFilterPanel';
import { ReportToolbar } from '../../components/common/ReportToolbar';
import { SortHeader } from '../../components/common/SortHeader';
import { DataTablePagination } from '../../components/common/DataTablePagination';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  getFilteredRecords,
  computeS2SalesmanSummary,
  computeS2SalesmanPartySummary,
  S2SalesmanSummaryRow,
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
import { SALESMAN_MAP, PARTY_MAP, COMPANY_MAP } from '../../data/dummyData';

export const ReportS2: React.FC = () => {
  // S2 default date range: 2026-10-01 to 2026-10-22
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
  const [viewMode, setViewMode] = useState<'viewA' | 'viewB' | 'viewC'>('viewA');

  // Drill-down states
  const [selectedSalesman, setSelectedSalesman] = useState<{ id: string; name: string } | null>(null);
  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string } | null>(null);

  // Sorting
  const [viewASort, setViewASort] = useState<SortState>({ column: 'netValue', direction: 'desc' });
  const [viewCSort, setViewCSort] = useState<SortState>({ column: 'date', direction: 'desc' });

  // Pagination for detailed View C
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filtered raw lines
  const { lineItems } = useMemo(() => {
    return getFilteredRecords(appliedFilters, false);
  }, [appliedFilters]);

  // View A Computation: Salesman Summary
  const { rows: rawViewARows, grandTotal: viewAGrandTotal } = useMemo(() => {
    return computeS2SalesmanSummary(lineItems);
  }, [lineItems]);

  const viewARows = useMemo(() => {
    const list = [...rawViewARows];
    list.sort((a, b) => {
      const col = viewASort.column as keyof S2SalesmanSummaryRow;
      const valA = a[col];
      const valB = b[col];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return viewASort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return viewASort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [rawViewARows, viewASort]);

  // View B Computation: Salesman + Party Summary (optionally filtered by selected salesman)
  const { groups: viewBGroups, grandTotal: viewBGrandTotal } = useMemo(() => {
    return computeS2SalesmanPartySummary(lineItems, selectedSalesman?.id);
  }, [lineItems, selectedSalesman]);

  // View C Lines: optionally filtered by selectedSalesman and selectedParty
  const activeViewCLines = useMemo(() => {
    let lines = lineItems;
    if (selectedSalesman) {
      lines = lines.filter((l) => l.salesmanId === selectedSalesman.id);
    }
    if (selectedParty) {
      lines = lines.filter((l) => l.partyId === selectedParty.id);
    }
    return lines;
  }, [lineItems, selectedSalesman, selectedParty]);

  const sortedViewCLines = useMemo(() => {
    const list = [...activeViewCLines];
    list.sort((a, b) => {
      let valA: any = a[viewCSort.column as keyof FilteredLineItem];
      let valB: any = b[viewCSort.column as keyof FilteredLineItem];

      if (viewCSort.column === 'salesman') {
        valA = SALESMAN_MAP.get(a.salesmanId)?.name || '';
        valB = SALESMAN_MAP.get(b.salesmanId)?.name || '';
      } else if (viewCSort.column === 'party') {
        valA = PARTY_MAP.get(a.partyId)?.name || '';
        valB = PARTY_MAP.get(b.partyId)?.name || '';
      } else if (viewCSort.column === 'item') {
        valA = a.product.name;
        valB = b.product.name;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return viewCSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return viewCSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [activeViewCLines, viewCSort]);

  const paginatedViewCLines = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedViewCLines.slice(start, start + pageSize);
  }, [sortedViewCLines, page, pageSize]);

  // Handlers
  const handleApplyFilters = (newFilters: FilterState) => {
    setAppliedFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setAppliedFilters(defaultFilters);
    setSelectedSalesman(null);
    setSelectedParty(null);
    setViewMode('viewA');
    setPage(1);
  };

  // Drill-down from View A -> View B
  const handleSalesmanClickDrillDown = (smId: string, smName: string) => {
    setSelectedSalesman({ id: smId, name: smName });
    setSelectedParty(null);
    setViewMode('viewB');
  };

  // Drill-down from View B -> View C
  const handlePartyClickDrillDown = (smId: string, smName: string, partyId: string, partyName: string) => {
    setSelectedSalesman({ id: smId, name: smName });
    setSelectedParty({ id: partyId, name: partyName });
    setViewMode('viewC');
    setPage(1);
  };


  // Export to PDF
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    const { companyName, dateRange, salesmenText, itemGroupsText, distributorsText } =
      getExportFilterSummary(appliedFilters, false);

    try {
      if (viewMode === 'viewA') {
        exportReportToPdf({
          fileName: 'S2_Salesman_Summary.pdf',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View A: Salesman Summary',
          viewName: 'Salesman Summary',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Salesman Code', dataKey: 'salesmanCode' },
            { header: 'Salesman Name', dataKey: 'salesmanName' },
            { header: 'No. of Parties', dataKey: 'partyCount', align: 'right' },
            { header: 'Invoices', dataKey: 'invoiceCount', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Net Value (PKR)', dataKey: 'netValueFormatted', align: 'right' },
            { header: '% of Total', dataKey: 'percentOfTotalFormatted', align: 'right' },
          ],
          data: viewARows.map((r) => ({
            ...r,
            totalQtyFormatted: formatQuantity(r.totalQty),
            netValueFormatted: formatCurrency(r.netValue),
            percentOfTotalFormatted: formatPercent(r.percentOfTotal),
          })),
          grandTotal: {
            salesmanCode: 'GRAND TOTAL',
            salesmanName: '',
            partyCount: viewAGrandTotal.partyCount,
            invoiceCount: viewAGrandTotal.invoiceCount,
            totalQtyFormatted: formatQuantity(viewAGrandTotal.totalQty),
            netValueFormatted: formatCurrency(viewAGrandTotal.netValue),
            percentOfTotalFormatted: formatPercent(viewAGrandTotal.percentOfTotal),
          },
          orientation: 'portrait',
        });
      } else if (viewMode === 'viewB') {
        const rows: any[] = [];
        viewBGroups.forEach((grp) => {
          rows.push({
            __isGroupHeader: true,
            __groupTitle: `SALESMAN: ${grp.salesmanName.toUpperCase()}`,
          });
          grp.parties.forEach((p) => {
            rows.push({
              salesmanName: grp.salesmanName,
              partyName: p.partyName,
              invoiceCount: p.invoiceCount,
              totalQtyFormatted: formatQuantity(p.totalQty),
              netValueFormatted: formatCurrency(p.netValue),
            });
          });
          // Subtotal
          rows.push({
            __isSubtotal: true,
            salesmanName: `Subtotal (${grp.salesmanName})`,
            partyName: '',
            invoiceCount: grp.subtotal.invoiceCount,
            totalQtyFormatted: formatQuantity(grp.subtotal.totalQty),
            netValueFormatted: formatCurrency(grp.subtotal.netValue),
          });
        });

        exportReportToPdf({
          fileName: 'S2_Salesman_Party_Summary.pdf',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View B: Salesman + Party Summary',
          viewName: 'Salesman + Party Summary',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Salesman', dataKey: 'salesmanName' },
            { header: 'Party / Customer', dataKey: 'partyName' },
            { header: 'Invoices', dataKey: 'invoiceCount', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQtyFormatted', align: 'right' },
            { header: 'Net Value (PKR)', dataKey: 'netValueFormatted', align: 'right' },
          ],
          data: rows,
          grandTotal: {
            salesmanName: 'GRAND TOTAL',
            partyName: '',
            invoiceCount: viewBGrandTotal.invoiceCount,
            totalQtyFormatted: formatQuantity(viewBGrandTotal.totalQty),
            netValueFormatted: formatCurrency(viewBGrandTotal.netValue),
          },
          orientation: 'portrait',
        });
      } else {
        // View C: Detailed
        const totVal = activeViewCLines.reduce((a, b) => a + b.netValue, 0);
        const totPack = activeViewCLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeViewCLines.reduce((a, b) => a + b.totalQty, 0);

        exportReportToPdf({
          fileName: 'S2_Salesman_Party_Detailed.pdf',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View C: Hierarchy Detailed',
          viewName: 'Salesman + Party Detailed',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Date', dataKey: 'dateFormatted' },
            { header: 'Salesman', dataKey: 'salesmanName' },
            { header: 'Party', dataKey: 'partyName' },
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Item', dataKey: 'productName' },
            { header: 'Pack Qty', dataKey: 'packQty', align: 'right' },
            { header: 'Total Qty', dataKey: 'totalQty', align: 'right' },
            { header: 'Rate', dataKey: 'rateFormatted', align: 'right' },
            { header: 'Value', dataKey: 'valueFormatted', align: 'right' },
          ],
          data: sortedViewCLines.map((l) => ({
            dateFormatted: formatDate(l.date),
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            invoiceNo: l.invoiceNo,
            productName: l.product.name,
            packQty: formatQuantity(l.packQty),
            totalQty: formatQuantity(l.totalQty),
            rateFormatted: formatCurrency(l.rate),
            valueFormatted: formatCurrency(l.netValue),
          })),
          grandTotal: {
            dateFormatted: 'GRAND TOTAL',
            salesmanName: '',
            partyName: '',
            invoiceNo: '',
            productName: '',
            packQty: formatQuantity(totPack),
            totalQty: formatQuantity(totQty),
            rateFormatted: '',
            valueFormatted: formatCurrency(totVal),
          },
          orientation: 'landscape',
        });
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Export Ready',
        message: 'Report PDF has been downloaded successfully.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Export Error',
        message: err?.message || 'Failed to export PDF.',
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
      if (viewMode === 'viewA') {
        await exportReportToExcel({
          fileName: 'S2_Salesman_Summary.xlsx',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View A: Salesman Summary',
          viewName: 'Salesman Summary',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Salesman Code', dataKey: 'salesmanCode', type: 'text' },
            { header: 'Salesman Name', dataKey: 'salesmanName', type: 'text', width: 22 },
            { header: 'No. of Parties', dataKey: 'partyCount', type: 'quantity' },
            { header: 'Invoices', dataKey: 'invoiceCount', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Net Value (PKR)', dataKey: 'netValue', type: 'currency' },
            { header: '% of Total', dataKey: 'percentOfTotal', type: 'percent' },
          ],
          data: viewARows,
          grandTotal: {
            salesmanCode: 'GRAND TOTAL',
            salesmanName: '',
            partyCount: viewAGrandTotal.partyCount,
            invoiceCount: viewAGrandTotal.invoiceCount,
            totalQty: viewAGrandTotal.totalQty,
            netValue: viewAGrandTotal.netValue,
            percentOfTotal: viewAGrandTotal.percentOfTotal,
          },
        });
      } else if (viewMode === 'viewB') {
        const rows: any[] = [];
        viewBGroups.forEach((grp) => {
          grp.parties.forEach((p) => {
            rows.push({
              salesmanName: grp.salesmanName,
              partyName: p.partyName,
              invoiceCount: p.invoiceCount,
              totalQty: p.totalQty,
              netValue: p.netValue,
            });
          });
          rows.push({
            __isSubtotal: true,
            salesmanName: `Subtotal (${grp.salesmanName})`,
            partyName: '',
            invoiceCount: grp.subtotal.invoiceCount,
            totalQty: grp.subtotal.totalQty,
            netValue: grp.subtotal.netValue,
          });
        });

        await exportReportToExcel({
          fileName: 'S2_Salesman_Party_Summary.xlsx',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View B: Salesman + Party Summary',
          viewName: 'Salesman + Party Summary',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Salesman', dataKey: 'salesmanName', type: 'text', width: 22 },
            { header: 'Party / Customer', dataKey: 'partyName', type: 'text', width: 26 },
            { header: 'Invoices', dataKey: 'invoiceCount', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Net Value (PKR)', dataKey: 'netValue', type: 'currency' },
          ],
          data: rows,
          grandTotal: {
            salesmanName: 'GRAND TOTAL',
            partyName: '',
            invoiceCount: viewBGrandTotal.invoiceCount,
            totalQty: viewBGrandTotal.totalQty,
            netValue: viewBGrandTotal.netValue,
          },
        });
      } else {
        const totVal = activeViewCLines.reduce((a, b) => a + b.netValue, 0);
        const totPack = activeViewCLines.reduce((a, b) => a + b.packQty, 0);
        const totQty = activeViewCLines.reduce((a, b) => a + b.totalQty, 0);

        await exportReportToExcel({
          fileName: 'S2_Salesman_Party_Detailed.xlsx',
          reportCode: 'S2',
          reportTitle: 'Salesman & Party Sales — View C: Hierarchy Detailed',
          viewName: 'Salesman + Party Detailed',
          companyName,
          dateRange,
          salesmenText,
          itemGroupsText,
          distributorsText,
          columns: [
            { header: 'Date', dataKey: 'date', type: 'date' },
            { header: 'Salesman', dataKey: 'salesmanName', type: 'text', width: 20 },
            { header: 'Party', dataKey: 'partyName', type: 'text', width: 24 },
            { header: 'Invoice No', dataKey: 'invoiceNo', type: 'text' },
            { header: 'Item', dataKey: 'productName', type: 'text', width: 26 },
            { header: 'Pack Qty', dataKey: 'packQty', type: 'quantity' },
            { header: 'Total Qty', dataKey: 'totalQty', type: 'quantity' },
            { header: 'Rate (PKR)', dataKey: 'rate', type: 'currency' },
            { header: 'Value (PKR)', dataKey: 'netValue', type: 'currency' },
          ],
          data: sortedViewCLines.map((l) => ({
            date: formatDate(l.date),
            salesmanName: SALESMAN_MAP.get(l.salesmanId)?.name || '',
            partyName: PARTY_MAP.get(l.partyId)?.name || '',
            invoiceNo: l.invoiceNo,
            productName: l.product.name,
            packQty: l.packQty,
            totalQty: l.totalQty,
            rate: l.rate,
            netValue: l.netValue,
          })),
          grandTotal: {
            date: 'GRAND TOTAL',
            salesmanName: '',
            partyName: '',
            invoiceNo: '',
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
        title: 'Excel Export Ready',
        message: 'Report workbook has been downloaded.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Export Error',
        message: err?.message || 'Failed to export Excel.',
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
        reportCode="S2"
        reportTitle="Salesman and Party Sales Report"
        description="Multi-tiered sales hierarchy analyzing salesman performance, customer penetration, and invoice-level item lines."
        viewOptions={[
          { id: 'viewA', label: '1. Salesman Summary' },
          { id: 'viewB', label: '2. Salesman + Party Summary' },
          { id: 'viewC', label: '3. Salesman + Party Detailed' },
        ]}
        currentView={viewMode}
        onViewChange={(v) => {
          setViewMode(v as any);
          if (v === 'viewA') {
            setSelectedSalesman(null);
            setSelectedParty(null);
          }
        }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        dateFrom={appliedFilters.dateFrom}
        dateTo={appliedFilters.dateTo}
        isExportingPdf={isExportingPdf}
        isExportingExcel={isExportingExcel}
        drillDownContext={
          selectedParty
            ? {
                title: `${selectedSalesman?.name} → ${selectedParty.name}`,
                onBack: () => {
                  setSelectedParty(null);
                  setViewMode('viewB');
                },
              }
            : selectedSalesman
            ? {
                title: `Salesman: ${selectedSalesman.name}`,
                onBack: () => {
                  setSelectedSalesman(null);
                  setViewMode('viewA');
                },
              }
            : null
        }
        totalRowCount={
          viewMode === 'viewA'
            ? viewARows.length
            : viewMode === 'viewB'
            ? viewBGroups.reduce((a, b) => a + b.parties.length, 0)
            : sortedViewCLines.length
        }
      />

      {/* Report Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto">
        {/* VIEW A: Salesman Summary */}
        {viewMode === 'viewA' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="salesmanCode" label="Code" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="salesmanName" label="Salesman" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="partyCount" label="No. of Parties" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="invoiceCount" label="Invoices" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="netValue" label="Net Value" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="percentOfTotal" label="% of Total" sortState={viewASort} onSort={(k) => setViewASort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewARows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No salesman records found.
                      </td>
                    </tr>
                  ) : (
                    viewARows.map((row) => (
                      <tr
                        key={row.salesmanId}
                        onClick={() => handleSalesmanClickDrillDown(row.salesmanId, row.salesmanName)}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        title="Click to view party breakdown for this salesman"
                      >
                        <td className="px-3 py-2.5 font-mono text-slate-500 font-medium">{row.salesmanCode}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 group-hover:text-blue-700">
                          {row.salesmanName}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{row.partyCount}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{row.invoiceCount}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatQuantity(row.totalQty)}</td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${getValueColorClass(row.netValue)}`}>
                          {formatCurrency(row.netValue)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{formatPercent(row.percentOfTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {viewARows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="px-3 py-3 uppercase tracking-wider">
                        Grand Total (Distinct Counts)
                      </td>
                      <td className="px-3 py-3 text-right">{viewAGrandTotal.partyCount}</td>
                      <td className="px-3 py-3 text-right">{viewAGrandTotal.invoiceCount}</td>
                      <td className="px-3 py-3 text-right">{formatQuantity(viewAGrandTotal.totalQty)}</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(viewAGrandTotal.netValue)}`}>
                        {formatCurrency(viewAGrandTotal.netValue)}
                      </td>
                      <td className="px-3 py-3 text-right">{formatPercent(viewAGrandTotal.percentOfTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>View A: Salesman Summary. Click any salesman row to inspect party-level breakdown.</span>
            </div>
          </div>
        )}

        {/* VIEW B: Salesman + Party Summary */}
        {viewMode === 'viewB' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Salesman</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Party / Customer</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Invoices</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Total Qty</th>
                    <th className="px-3 py-2.5 font-bold text-right uppercase tracking-wider">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewBGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No records match the active criteria.
                      </td>
                    </tr>
                  ) : (
                    viewBGroups.map((group) => (
                      <React.Fragment key={group.salesmanId}>
                        {/* Group Header */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                          <td colSpan={5} className="px-3 py-2 text-blue-900 bg-blue-50/40">
                            Salesman: {group.salesmanName}
                          </td>
                        </tr>

                        {/* Party Rows */}
                        {group.parties.map((party) => (
                          <tr
                            key={`${group.salesmanId}-${party.partyId}`}
                            onClick={() =>
                              handlePartyClickDrillDown(
                                group.salesmanId,
                                group.salesmanName,
                                party.partyId,
                                party.partyName
                              )
                            }
                            className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                            title="Click to view invoice details for this party"
                          >
                            <td className="px-3 py-2 text-slate-400 pl-6 text-[11px]">—</td>
                            <td className="px-3 py-2 font-semibold text-slate-800 group-hover:text-blue-700">
                              {party.partyName}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-700">
                              {party.invoiceCount}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-700">
                              {formatQuantity(party.totalQty)}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold ${getValueColorClass(party.netValue)}`}>
                              {formatCurrency(party.netValue)}
                            </td>
                          </tr>
                        ))}

                        {/* Salesman Subtotal */}
                        <tr className="bg-slate-100/70 font-semibold text-slate-800 border-b border-slate-200">
                          <td colSpan={2} className="px-3 py-2 pl-6 text-slate-600 italic">
                            Subtotal — {group.salesmanName}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800">{group.subtotal.invoiceCount}</td>
                          <td className="px-3 py-2 text-right text-slate-800">{formatQuantity(group.subtotal.totalQty)}</td>
                          <td className={`px-3 py-2 text-right font-bold ${getValueColorClass(group.subtotal.netValue)}`}>
                            {formatCurrency(group.subtotal.netValue)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
                {viewBGroups.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="px-3 py-3 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-3 py-3 text-right">{viewBGrandTotal.invoiceCount}</td>
                      <td className="px-3 py-3 text-right">{formatQuantity(viewBGrandTotal.totalQty)}</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(viewBGrandTotal.netValue)}`}>
                        {formatCurrency(viewBGrandTotal.netValue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>View B: Salesman + Party Summary. Click any party row to drill into item lines.</span>
            </div>
          </div>
        )}

        {/* VIEW C: Salesman + Party Detailed (Hierarchy) */}
        {viewMode === 'viewC' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700">
                    <SortHeader columnKey="date" label="Date" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="salesman" label="Salesman" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="party" label="Party" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="invoiceNo" label="Invoice No" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="item" label="Item" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader columnKey="packQty" label="Pack Qty" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="totalQty" label="Total Qty" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="rate" label="Rate" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                    <SortHeader columnKey="netValue" label="Value" sortState={viewCSort} onSort={(k) => setViewCSort((p) => ({ column: k, direction: p.direction === 'asc' ? 'desc' : 'asc' }))} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedViewCLines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No detailed line items found for the current selection.
                      </td>
                    </tr>
                  ) : (
                    paginatedViewCLines.map((line) => {
                      const sm = SALESMAN_MAP.get(line.salesmanId);
                      const party = PARTY_MAP.get(line.partyId);
                      return (
                        <tr key={line.lineId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(line.date)}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{sm?.name}</td>
                          <td className="px-3 py-2 text-slate-800 font-medium">{party?.name}</td>
                          <td className="px-3 py-2 font-mono text-blue-700 font-semibold">{line.invoiceNo}</td>
                          <td className="px-3 py-2 text-slate-900">{line.product.name}</td>
                          <td className="px-3 py-2 text-right text-slate-800">{formatQuantity(line.packQty)}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">{formatQuantity(line.totalQty)}</td>
                          <td className="px-3 py-2 text-right text-slate-600 font-mono">{formatCurrency(line.rate)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${getValueColorClass(line.netValue)}`}>
                            {formatCurrency(line.netValue)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sortedViewCLines.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={5} className="px-3 py-3 uppercase tracking-wider">
                        Reconciled Grand Total ({sortedViewCLines.length} lines)
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(activeViewCLines.reduce((a, b) => a + b.packQty, 0))}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatQuantity(activeViewCLines.reduce((a, b) => a + b.totalQty, 0))}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-400 font-normal">—</td>
                      <td className={`px-3 py-3 text-right ${getValueColorClass(activeViewCLines.reduce((a, b) => a + b.netValue, 0))}`}>
                        {formatCurrency(activeViewCLines.reduce((a, b) => a + b.netValue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              pageSize={pageSize}
              totalRows={sortedViewCLines.length}
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

/**
 * Formatters and Export Helpers for ERP reporting
 */
import { FilterState } from '../types';
import { COMPANIES, COMPANY_MAP, SALESMAN_MAP, ITEM_GROUP_MAP, DISTRIBUTOR_MAP } from '../data/dummyData';

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  const absVal = Math.abs(value);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatQuantity(qty: number | undefined | null, decimals: number = 0): string {
  if (qty === undefined || qty === null || isNaN(qty)) return '0';
  const absQty = Math.abs(qty);
  const formatted = absQty.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return qty < 0 ? `-${formatted}` : formatted;
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${value.toFixed(2)}%`;
}

// Convert YYYY-MM-DD to "22 Oct 2026"
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11) {
    return dateStr;
  }
  return `${String(day).padStart(2, '0')} ${months[month]} ${year}`;
}

export function getValueColorClass(value: number): string {
  if (value < 0) return 'text-rose-600 font-semibold';
  return 'text-slate-800';
}

/**
 * Returns comprehensive human-readable filter details for PDF and Excel headers
 */
export function getExportFilterSummary(filters: FilterState, isS5: boolean = false) {
  const companyName =
    filters.companyIds && filters.companyIds.length > 0
      ? (filters.companyIds.length === COMPANIES.length
          ? 'All Companies'
          : filters.companyIds.map((id) => COMPANY_MAP.get(id)?.name || id).join(', '))
      : (filters.companyId && filters.companyId !== 'all'
          ? COMPANY_MAP.get(filters.companyId)?.name || 'Unknown'
          : 'All Companies');

  const dateRange =
    filters.dateFrom && filters.dateTo
      ? `${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)}`
      : 'All Dates';

  const salesmenText =
    filters.salesmenIds && filters.salesmenIds.length > 0
      ? filters.salesmenIds.map((id) => SALESMAN_MAP.get(id)?.name || id).join(', ')
      : 'All Salesmen';

  const itemGroupsText = isS5
    ? 'Not Applicable'
    : filters.itemGroupIds && filters.itemGroupIds.length > 0
    ? filters.itemGroupIds.map((id) => ITEM_GROUP_MAP.get(id)?.name || id).join(', ')
    : 'All Item Groups';

  const distributorsText =
    filters.distributorIds && filters.distributorIds.length > 0
      ? filters.distributorIds.map((id) => DISTRIBUTOR_MAP.get(id)?.name || id).join(', ')
      : 'All Distributors';

  return {
    companyName,
    dateRange,
    salesmenText,
    itemGroupsText,
    distributorsText,
  };
}

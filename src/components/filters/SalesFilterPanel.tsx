import React, { useState, useEffect } from 'react';
import { FilterState } from '../../types';
import { COMPANIES, SALESMEN, DISTRIBUTORS, ITEM_GROUPS } from '../../data/dummyData';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { DateRangePicker } from './DateRangePicker';
import { ActiveFilterChips } from './ActiveFilterChips';
import { Check, RotateCcw, AlertCircle } from 'lucide-react';

interface SalesFilterPanelProps {
  appliedFilters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  isS5Report?: boolean;
}

export const SalesFilterPanel: React.FC<SalesFilterPanelProps> = ({
  appliedFilters,
  onApplyFilters,
  onResetFilters,
  isS5Report = false,
}) => {
  // Draft state holds unapplied user selections
  const [draftFilters, setDraftFilters] = useState<FilterState>(appliedFilters);
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync draft filters when appliedFilters change from outside
  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const TODAY_STR = '2026-10-22';

  // Validate dates whenever draft dates change
  useEffect(() => {
    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) {
      setDateError('Date From cannot be later than Date To.');
    } else if (
      (draftFilters.dateTo && draftFilters.dateTo > TODAY_STR) ||
      (draftFilters.dateFrom && draftFilters.dateFrom > TODAY_STR)
    ) {
      setDateError('Future dates cannot be selected (latest date is today, 22 Oct 2026).');
    } else {
      setDateError(null);
    }
  }, [draftFilters.dateFrom, draftFilters.dateTo]);

  // Check if draft has unapplied changes
  const hasUnappliedChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const handleApply = () => {
    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) {
      setDateError('Date From cannot be later than Date To. Please correct before applying.');
      return;
    }
    setDateError(null);
    onApplyFilters(draftFilters);
  };

  const handleReset = () => {
    setDateError(null);
    onResetFilters();
  };

  // Direct removal of individual chips modifies both applied and draft state
  const handleRemoveCompany = (id: string) => {
    const current = appliedFilters.companyIds || [];
    const updatedIds = current.filter((cId) => cId !== id);
    const updated = {
      ...appliedFilters,
      companyIds: updatedIds,
      companyId: updatedIds.length === 1 ? updatedIds[0] : (updatedIds.length === 0 ? 'all' : 'multi'),
    };
    setDraftFilters(updated);
    onApplyFilters(updated);
  };

  const handleRemoveSalesman = (id: string) => {
    const updated = {
      ...appliedFilters,
      salesmenIds: appliedFilters.salesmenIds.filter((smId) => smId !== id),
    };
    setDraftFilters(updated);
    onApplyFilters(updated);
  };

  const handleRemoveItemGroup = (id: string) => {
    const updated = {
      ...appliedFilters,
      itemGroupIds: appliedFilters.itemGroupIds.filter((grpId) => grpId !== id),
    };
    setDraftFilters(updated);
    onApplyFilters(updated);
  };

  const handleRemoveDistributor = (id: string) => {
    const updated = {
      ...appliedFilters,
      distributorIds: appliedFilters.distributorIds.filter((dId) => dId !== id),
    };
    setDraftFilters(updated);
    onApplyFilters(updated);
  };

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3.5 transition-all">
      {/* Filters Grid - 4 columns on S5 (Item Group removed), 5 columns on other reports */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isS5Report ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-3 items-end`}>
        {/* 1. Company Filter (Multi-select checkbox dropdown: Unika, Pasta, Edison) */}
        <MultiSelectDropdown
          label="Company"
          options={COMPANIES.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
          selectedIds={draftFilters.companyIds || []}
          onChange={(ids) =>
            setDraftFilters({
              ...draftFilters,
              companyIds: ids,
              companyId: ids.length === 1 ? ids[0] : (ids.length === 0 ? 'all' : 'multi'),
            })
          }
          placeholder="All Companies"
        />

        {/* 2. Single Unified "Date" Filter (Opens interactive range picker calendar) */}
        <DateRangePicker
          label="Date"
          dateFrom={draftFilters.dateFrom}
          dateTo={draftFilters.dateTo}
          onChange={(from, to) => {
            setDraftFilters({ ...draftFilters, dateFrom: from, dateTo: to });
          }}
          hasError={!!dateError}
        />

        {/* 3. Salesman (Multi-select) */}
        <MultiSelectDropdown
          label="Salesman"
          options={SALESMEN.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
          selectedIds={draftFilters.salesmenIds}
          onChange={(ids) =>
            setDraftFilters({ ...draftFilters, salesmenIds: ids })
          }
          placeholder="All Salesmen"
        />

        {/* 4. Item Group (Multi-select, hidden on S5 Freight Report) */}
        {!isS5Report && (
          <MultiSelectDropdown
            label="Item Group"
            options={ITEM_GROUPS.map((g) => ({ id: g.id, name: g.name, code: g.code }))}
            selectedIds={draftFilters.itemGroupIds}
            onChange={(ids) =>
              setDraftFilters({ ...draftFilters, itemGroupIds: ids })
            }
            placeholder="All Item Groups"
          />
        )}

        {/* 5. Distributor / Vendor (Multi-select) */}
        <MultiSelectDropdown
          label="Distributor / Vendor"
          options={DISTRIBUTORS.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
          selectedIds={draftFilters.distributorIds}
          onChange={(ids) =>
            setDraftFilters({ ...draftFilters, distributorIds: ids })
          }
          placeholder="All Distributors"
        />
      </div>

      {/* Inline Date Validation Error */}
      {dateError && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{dateError}</span>
        </div>
      )}

      {/* Filter Action Buttons & Status */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex-1 min-w-[280px]">
          <ActiveFilterChips
            filters={appliedFilters}
            onRemoveCompany={handleRemoveCompany}
            onRemoveSalesman={handleRemoveSalesman}
            onRemoveItemGroup={handleRemoveItemGroup}
            onRemoveDistributor={handleRemoveDistributor}
            onClearAll={handleReset}
            isS5Report={isS5Report}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {hasUnappliedChanges && !dateError && (
            <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
              Unapplied filter changes
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="h-8 px-3 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!!dateError}
            className={`h-8 px-4 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              dateError
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                : hasUnappliedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ring-2 ring-blue-400/40'
                : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Filter } from 'lucide-react';
import { FilterState } from '../../types';
import {
  COMPANIES,
  SALESMEN,
  DISTRIBUTORS,
  ITEM_GROUPS,
} from '../../data/dummyData';
import { formatDate } from '../../utils/formatters';

interface ActiveFilterChipsProps {
  filters: FilterState;
  onRemoveCompany: (id: string) => void;
  onRemoveSalesman: (id: string) => void;
  onRemoveItemGroup: (id: string) => void;
  onRemoveDistributor: (id: string) => void;
  onClearAll: () => void;
  isS5Report?: boolean;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemoveCompany,
  onRemoveSalesman,
  onRemoveItemGroup,
  onRemoveDistributor,
  onClearAll,
  isS5Report = false,
}) => {
  const activeChips: { label: string; value: string; onRemove: () => void; key: string }[] = [];

  // Company multi-select chips
  if (filters.companyIds && filters.companyIds.length > 0) {
    filters.companyIds.forEach((cId) => {
      const company = COMPANIES.find((c) => c.id === cId);
      if (company) {
        activeChips.push({
          key: `comp-${company.id}`,
          label: 'Company',
          value: company.name,
          onRemove: () => onRemoveCompany(company.id),
        });
      }
    });
  } else if (filters.companyId && filters.companyId !== 'all') {
    const company = COMPANIES.find((c) => c.id === filters.companyId);
    if (company) {
      activeChips.push({
        key: `comp-${company.id}`,
        label: 'Company',
        value: company.name,
        onRemove: () => onRemoveCompany(company.id),
      });
    }
  }

  // Salesmen chips
  filters.salesmenIds.forEach((smId) => {
    const sm = SALESMEN.find((s) => s.id === smId);
    if (sm) {
      activeChips.push({
        key: `sm-${smId}`,
        label: 'Salesman',
        value: sm.name,
        onRemove: () => onRemoveSalesman(smId),
      });
    }
  });

  // Item group chips (not on S5)
  if (!isS5Report) {
    filters.itemGroupIds.forEach((grpId) => {
      const grp = ITEM_GROUPS.find((g) => g.id === grpId);
      if (grp) {
        activeChips.push({
          key: `grp-${grpId}`,
          label: 'Group',
          value: grp.name,
          onRemove: () => onRemoveItemGroup(grpId),
        });
      }
    });
  }

  // Distributor chips
  filters.distributorIds.forEach((distId) => {
    const dist = DISTRIBUTORS.find((d) => d.id === distId);
    if (dist) {
      activeChips.push({
        key: `dist-${distId}`,
        label: 'Distributor',
        value: dist.name,
        onRemove: () => onRemoveDistributor(distId),
      });
    }
  });

  if (activeChips.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
        <Filter className="w-3 h-3 text-slate-400" />
        <span>Default filters applied ({formatDate(filters.dateFrom)} to {formatDate(filters.dateTo)}, all categories active)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
        Active Filters ({activeChips.length}):
      </span>
      {activeChips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
        >
          <span className="text-slate-400 text-[10px]">{chip.label}:</span>
          <span className="truncate max-w-[150px]">{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="hover:text-rose-600 focus:outline-none ml-0.5"
            title={`Remove ${chip.value}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium ml-1 underline decoration-rose-300 underline-offset-2"
      >
        Reset to Default
      </button>
    </div>
  );
};

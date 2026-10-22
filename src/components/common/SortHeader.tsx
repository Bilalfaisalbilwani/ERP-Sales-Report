import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { SortState } from '../../types';

interface SortHeaderProps {
  columnKey: string;
  label: string;
  sortState: SortState;
  onSort: (columnKey: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const SortHeader: React.FC<SortHeaderProps> = ({
  columnKey,
  label,
  sortState,
  onSort,
  align = 'left',
  className = '',
}) => {
  const isSorted = sortState.column === columnKey;
  const isAsc = isSorted && sortState.direction === 'asc';

  const alignClass =
    align === 'right'
      ? 'justify-end text-right'
      : align === 'center'
      ? 'justify-center text-center'
      : 'justify-start text-left';

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100/90 border-b border-slate-200 select-none cursor-pointer hover:bg-slate-200/80 transition-colors uppercase tracking-wider ${className}`}
    >
      <div className={`flex items-center gap-1.5 ${alignClass}`}>
        <span>{label}</span>
        <span className="shrink-0 text-slate-400">
          {isSorted ? (
            isAsc ? (
              <ArrowUp className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
};

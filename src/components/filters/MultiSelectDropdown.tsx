import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
  subtitle?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: OptionItem[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  disabledReason,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.code && opt.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Display text in the button
  const getDisplayText = () => {
    if (selectedIds.length === 0) {
      return <span className="text-slate-400 font-normal">{placeholder}</span>;
    }
    if (selectedIds.length === options.length && options.length > 0) {
      return <span className="text-slate-700 font-medium">All Selected ({options.length})</span>;
    }
    if (selectedIds.length <= 2) {
      const names = selectedIds
        .map((id) => options.find((o) => o.id === id)?.name || id)
        .join(', ');
      return <span className="text-slate-800 font-medium truncate max-w-[190px]">{names}</span>;
    }
    return <span className="text-slate-800 font-medium">{selectedIds.length} Selected</span>;
  };

  return (
    <div className="relative flex flex-col text-xs" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="font-semibold text-slate-700">{label}</label>
        {disabled && disabledReason && (
          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
            {disabledReason}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-9 px-2.5 py-1.5 bg-white border rounded text-left flex items-center justify-between transition-colors shadow-2xs ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
            : isOpen
            ? 'border-blue-600 ring-1 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {getDisplayText()}
        </div>
        <div className="flex items-center gap-1 ml-1 shrink-0">
          {selectedIds.length > 0 && !disabled && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {selectedIds.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[calc(100vw-32px)] sm:w-72 max-w-xs sm:max-w-none bg-white border border-slate-200 rounded-md shadow-lg z-50 py-2 flex flex-col text-xs animate-in fade-in duration-100">
          {/* Search bar inside */}
          <div className="px-2.5 pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-7 pr-7 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons (Select All / Clear) */}
          <div className="flex items-center justify-between px-2.5 py-1 border-y border-slate-100 bg-slate-50 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Select All ({options.length})
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-600 font-medium"
            >
              Clear Selection
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto px-1 py-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400 text-xs">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer select-none transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 truncate">
                      <span>{opt.name}</span>
                      {opt.code && (
                        <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                          ({opt.code})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
            <span>{selectedIds.length} of {options.length} selected</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

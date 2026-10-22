import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface DateRangePickerProps {
  label?: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  onChange: (from: string, to: string) => void;
  hasError?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label = 'Date',
  dateFrom,
  dateTo,
  onChange,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view month from dateTo or dateFrom or default 2026-10-01
  const initialDate = dateTo || dateFrom || '2026-10-22';
  const initialYear = parseInt(initialDate.split('-')[0], 10) || 2026;
  const initialMonth = (parseInt(initialDate.split('-')[1], 10) || 10) - 1;

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth); // 0-indexed

  // Internal draft range while selecting
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState<'selecting-to' | 'idle'>('idle');

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync draft with props when opened
  useEffect(() => {
    if (isOpen) {
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
      setSelectionStep('idle');
      setHoverDate(null);
      if (dateTo) {
        const parts = dateTo.split('-');
        if (parts.length === 3) {
          setCurrentYear(parseInt(parts[0], 10));
          setCurrentMonth(parseInt(parts[1], 10) - 1);
        }
      }
    }
  }, [isOpen, dateFrom, dateTo]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in current viewed month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const TODAY_STR = '2026-10-22';

  const isNextMonthDisabled =
    currentYear > 2026 || (currentYear === 2026 && currentMonth >= 9); // October is month index 9

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatIsoDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (dayStr: string) => {
    if (dayStr > TODAY_STR) return; // Future dates disabled

    if (selectionStep === 'idle') {
      // First click: sets start date and awaits end date
      setDraftFrom(dayStr);
      setDraftTo(dayStr);
      setSelectionStep('selecting-to');
    } else {
      // Second click: sets end date
      let start = draftFrom;
      let end = dayStr;
      if (end < start) {
        const temp = start;
        start = end;
        end = temp;
      }
      setDraftFrom(start);
      setDraftTo(end);
      setSelectionStep('idle');
    }
  };

  const applyPreset = (from: string, to: string) => {
    setDraftFrom(from);
    setDraftTo(to);
    setSelectionStep('idle');
    const parts = to.split('-');
    if (parts.length === 3) {
      setCurrentYear(parseInt(parts[0], 10));
      setCurrentMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handleApply = () => {
    let finalFrom = draftFrom;
    let finalTo = draftTo;
    if (finalFrom > finalTo) {
      const temp = finalFrom;
      finalFrom = finalTo;
      finalTo = temp;
    }
    onChange(finalFrom, finalTo);
    setIsOpen(false);
  };

  // Build calendar matrix
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (string | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(formatIsoDate(currentYear, currentMonth, d));
  }

  // Display label
  const displayText =
    dateFrom && dateTo
      ? dateFrom === dateTo
        ? `${formatDate(dateFrom)} (Single Day)`
        : `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
      : 'Select Date Range';

  return (
    <div className="relative flex flex-col text-xs" ref={containerRef}>
      <label className="font-semibold text-slate-700 mb-1">{label}</label>

      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-2.5 bg-white border rounded flex items-center justify-between text-left transition-colors shadow-2xs cursor-pointer ${
          hasError
            ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50/20'
            : isOpen
            ? 'border-blue-600 ring-1 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-800 font-medium truncate text-xs">
            {displayText}
          </span>
        </div>
      </button>

      {/* Popover Date Range Picker */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3 flex flex-col md:flex-row gap-3 text-xs w-[calc(100vw-32px)] sm:w-auto max-w-[540px] animate-in fade-in duration-100">
          {/* Presets Sidebar */}
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:pr-3 border-b md:border-b-0 md:border-r border-slate-100 shrink-0 text-left min-w-[125px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 hidden md:block">
              Quick Ranges
            </span>
            <button
              type="button"
              onClick={() => applyPreset('2026-10-22', '2026-10-22')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              Today (22 Oct)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2026-10-21', '2026-10-21')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              Yesterday (21 Oct)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2026-10-16', '2026-10-22')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2026-10-01', '2026-10-22')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              This Month (Oct)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2026-09-01', '2026-09-30')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              Last Month (Sep)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2026-09-01', '2026-10-22')}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
            >
              Full Demo Period
            </button>
          </div>

          {/* Calendar Body */}
          <div className="flex-1 min-w-[260px]">
            {/* Month / Year Navigator */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title={isNextMonthDisabled ? 'Future months disabled' : 'Next month'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-400 text-[11px] mb-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) {
                  return <div key={`empty-${idx}`} className="h-7" />;
                }

                const dayNum = parseInt(dateStr.split('-')[2], 10);
                const isFuture = dateStr > TODAY_STR;
                const isStart = dateStr === draftFrom;
                const isEnd = dateStr === draftTo;
                const effectiveEnd = selectionStep === 'selecting-to' && hoverDate ? hoverDate : draftTo;

                const inRange =
                  !isFuture &&
                  draftFrom &&
                  effectiveEnd &&
                  ((dateStr >= draftFrom && dateStr <= effectiveEnd) ||
                    (dateStr <= draftFrom && dateStr >= effectiveEnd));

                let dayClass = 'text-slate-700 hover:bg-slate-100 cursor-pointer';
                if (isFuture) {
                  dayClass = 'text-slate-300 bg-slate-50/50 cursor-not-allowed select-none';
                } else if (isStart || isEnd) {
                  dayClass = 'bg-blue-600 text-white font-bold rounded shadow-2xs cursor-pointer';
                } else if (inRange) {
                  dayClass = 'bg-blue-50 text-blue-900 font-medium rounded-none cursor-pointer';
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isFuture}
                    onClick={() => !isFuture && handleDayClick(dateStr)}
                    onMouseEnter={() => {
                      if (selectionStep === 'selecting-to' && !isFuture) {
                        setHoverDate(dateStr);
                      }
                    }}
                    title={isFuture ? 'Future date disabled' : formatDate(dateStr)}
                    className={`h-7 text-xs flex items-center justify-center transition-colors ${dayClass}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Bottom info and action buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                <span>Range: </span>
                <strong className="text-slate-800">
                  {draftFrom ? formatDate(draftFrom) : 'From'}
                </strong>
                <span> to </span>
                <strong className="text-slate-800">
                  {draftTo ? formatDate(draftTo) : 'To'}
                </strong>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Select Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useRef, useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { useLiveboardStore } from '../../store/liveboardStore';
import { useSchemaStore } from '../../store/schemaStore';
import { hasActiveFilters } from '../../types';
import type { FilterState } from '../../types';

// ─── Multi-select dropdown ─────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const isActive = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
          isActive
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }`}
      >
        <span>{label}</span>
        {isActive && (
          <span className="bg-blue-500 text-white rounded-full px-1.5 leading-4 text-[10px]">
            {selected.length}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                  selected.includes(opt) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              >
                {selected.includes(opt) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date range picker ─────────────────────────────────────────────────────

interface DateRangeProps {
  dateFrom: string | null;
  dateTo: string | null;
  dateColumn: string | null;
  dateColumnOptions: { value: string; label: string }[];
  onChange: (from: string | null, to: string | null, col: string | null) => void;
}

function DateRange({ dateFrom, dateTo, dateColumn, dateColumnOptions, onChange }: DateRangeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const isActive = dateFrom !== null || dateTo !== null;
  const label = isActive ? [dateFrom, dateTo].filter(Boolean).join(' → ') : 'Date Range';
  const currentCol = dateColumn ?? dateColumnOptions[0]?.value ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
          isActive
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }`}
      >
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown size={11} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[230px]">
          <div className="flex flex-col gap-2">
            {dateColumnOptions.length > 1 && (
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Column</span>
                <select
                  value={currentCol ?? ''}
                  onChange={(e) => onChange(dateFrom, dateTo, e.target.value || null)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {dateColumnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">From</span>
              <input
                type="date"
                value={dateFrom ?? ''}
                onChange={(e) => onChange(e.target.value || null, dateTo, currentCol)}
                className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">To</span>
              <input
                type="date"
                value={dateTo ?? ''}
                onChange={(e) => onChange(dateFrom, e.target.value || null, currentCol)}
                className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </label>
            {isActive && (
              <button
                type="button"
                onClick={() => { onChange(null, null, null); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-red-500 text-left transition-colors"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FilterBar ─────────────────────────────────────────────────────────────

export function FilterBar() {
  const { activeFilters, isFilterLoading, setFilters, clearFilters } = useLiveboardStore();
  const { filterColumns, dateColumns, loaded, loadFilterSuggestions } = useSchemaStore();

  // Load filter options on first render
  useEffect(() => { loadFilterSuggestions(); }, [loadFilterSuggestions]);

  const filtersActive = hasActiveFilters(activeFilters);

  function patchColumns(column: string, values: string[]) {
    const next: FilterState = {
      ...activeFilters,
      columns: { ...activeFilters.columns, [column]: values },
    };
    setFilters(next);
  }

  function patchDate(dateFrom: string | null, dateTo: string | null, dateColumn: string | null) {
    setFilters({ ...activeFilters, dateFrom, dateTo, dateColumn });
  }

  const dateColumnOptions = dateColumns.map((d) => ({ value: d.column, label: d.label }));

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-wrap min-h-[42px]">
      <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
        {isFilterLoading ? (
          <Loader2 size={13} className="animate-spin text-blue-500" />
        ) : (
          <Filter size={13} />
        )}
        <span className="text-xs font-medium text-gray-500">Filters</span>
      </div>

      {!loaded && (
        <span className="text-xs text-gray-400 italic">Loading...</span>
      )}

      {loaded && (
        <>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

          {filterColumns.map((fc) => (
            <MultiSelect
              key={`${fc.table}.${fc.column}`}
              label={fc.label}
              options={fc.options}
              selected={activeFilters.columns[fc.column] ?? []}
              onChange={(values) => patchColumns(fc.column, values)}
            />
          ))}

          {dateColumnOptions.length > 0 && (
            <DateRange
              dateFrom={activeFilters.dateFrom}
              dateTo={activeFilters.dateTo}
              dateColumn={activeFilters.dateColumn}
              dateColumnOptions={dateColumnOptions}
              onChange={patchDate}
            />
          )}

          {filtersActive && (
            <>
              <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
              <button
                type="button"
              onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={12} />
                Clear all
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

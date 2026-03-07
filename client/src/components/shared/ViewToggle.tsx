import { BarChart2, Table2 } from 'lucide-react';
import clsx from 'clsx';

export type ViewMode = 'chart' | 'table';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  size?: 'sm' | 'xs';
}

export function ViewToggle({ mode, onChange, size = 'sm' }: ViewToggleProps) {
  const iconSize = size === 'xs' ? 12 : 14;
  const base = 'flex items-center gap-1 rounded transition-colors font-medium';
  const padding = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const text = size === 'xs' ? 'text-xs' : 'text-xs';

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => onChange('chart')}
        className={clsx(base, padding, text, mode === 'chart' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        title="Chart view"
      >
        <BarChart2 size={iconSize} />
        {size === 'sm' && <span>Chart</span>}
      </button>
      <button
        onClick={() => onChange('table')}
        className={clsx(base, padding, text, mode === 'table' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        title="Table view"
      >
        <Table2 size={iconSize} />
        {size === 'sm' && <span>Table</span>}
      </button>
    </div>
  );
}

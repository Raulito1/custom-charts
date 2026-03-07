import React, { useState } from 'react';
import { GripHorizontal, Trash2, Code } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { TableRenderer } from './TableRenderer';
import { ViewToggle, type ViewMode } from '../shared/ViewToggle';
import { useLiveboardStore } from '../../store/liveboardStore';
import type { LiveboardChart } from '../../types';

interface ChartCardProps {
  chart: LiveboardChart;
  height: number;
}

export function ChartCard({ chart, height }: ChartCardProps) {
  const { removeChart } = useLiveboardStore();
  const [showSql, setShowSql] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const contentHeight = Math.max(height - 88, 160);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Drag handle header */}
      <div className="chart-card-header flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-grab active:cursor-grabbing select-none bg-gray-50/50">
        <GripHorizontal size={14} className="text-gray-300 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 truncate flex-1">{chart.queryResult.queryTitle}</span>
        {/* onMouseDown stops drag from triggering when clicking action buttons */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ViewToggle mode={viewMode} onChange={setViewMode} size="xs" />
          <button
            onClick={() => setShowSql(!showSql)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
            title="Show SQL"
          >
            <Code size={13} />
          </button>
          <button
            onClick={() => removeChart(chart.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
            title="Remove chart"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* SQL preview (collapsible) */}
      {showSql && (
        <div className="px-3 py-2 bg-gray-900 text-xs font-mono text-green-300 overflow-x-auto max-h-24 border-b border-gray-700">
          {chart.queryResult.sql}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'chart' ? (
          <div className="p-2 h-full">
            <ChartRenderer options={chart.queryResult.highchartsOptions} height={contentHeight} />
          </div>
        ) : (
          <TableRenderer data={chart.queryResult.data} height={contentHeight} />
        )}
      </div>

      {/* Footer */}
      {chart.queryResult.explanation && (
        <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-xs text-gray-400 truncate">{chart.queryResult.explanation}</p>
        </div>
      )}
    </div>
  );
}

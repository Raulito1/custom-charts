import React, { useRef, useEffect, useState } from 'react';
import { X, Send, Pin, AlertCircle } from 'lucide-react';
import { useQueryStore } from '../../store/queryStore';
import { useLiveboardStore } from '../../store/liveboardStore';
import { useUiStore } from '../../store/uiStore';
import { ChartRenderer } from '../chart/ChartRenderer';
import { TableRenderer } from '../chart/TableRenderer';
import { ViewToggle, type ViewMode } from '../shared/ViewToggle';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';

const SUGGESTIONS = [
  'Show monthly revenue trend for 2024',
  'Compare revenue by region this year',
  'Revenue breakdown by product tier',
  'Top 10 customers by MRR',
  'Event count by type last year',
];

export function NLQPanel() {
  const { nlqPanelOpen, closeNlq, openNewLiveboardModal } = useUiStore();
  const { question, setQuestion, isLoading, error, currentResult, executeQuery, clearResult } = useQueryStore();
  const { activeLiveboard, pinChart } = useLiveboardStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  useEffect(() => {
    if (nlqPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [nlqPanelOpen]);

  // Reset to chart view when a new result comes in
  useEffect(() => {
    if (currentResult) setViewMode('chart');
  }, [currentResult?.queryId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || isLoading) return;
    await executeQuery(question.trim());
  };

  const handlePin = async () => {
    if (!currentResult) return;
    if (!activeLiveboard) {
      openNewLiveboardModal();
      return;
    }
    await pinChart(currentResult);
    clearResult();
    closeNlq();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!nlqPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeNlq} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Ask a question</h2>
            <p className="text-xs text-gray-400 mt-0.5">Powered by Claude — queries your SaaS analytics data</p>
          </div>
          <button onClick={closeNlq} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-3">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Show revenue by region for Q4 2024..."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none px-4 py-3 pr-14 text-sm text-gray-900 placeholder-gray-400 transition-all"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Spinner size={16} /> : <Send size={16} />}
            </button>
          </div>
        </form>

        {/* Suggestions */}
        {!currentResult && !isLoading && !error && (
          <div className="px-5 pb-4">
            <p className="text-xs text-gray-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuestion(s); inputRef.current?.focus(); }}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
            <Spinner size={20} />
            <span className="text-sm">Querying Claude and running SQL...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mb-4 flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Result preview */}
        {currentResult && !isLoading && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
            {/* Result header with toggle */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{currentResult.queryTitle}</h3>
                {currentResult.explanation && (
                  <p className="text-xs text-gray-500 mt-0.5">{currentResult.explanation}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ViewToggle mode={viewMode} onChange={setViewMode} />
                <span className="text-xs text-gray-400">{currentResult.durationMs}ms</span>
              </div>
            </div>

            {/* Chart or Table */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              {viewMode === 'chart' ? (
                <div className="p-3">
                  <ChartRenderer options={currentResult.highchartsOptions} height={260} />
                </div>
              ) : (
                <TableRenderer data={currentResult.data} height={300} />
              )}
            </div>

            {/* SQL preview */}
            <details className="group">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none">
                View SQL ({currentResult.data.length} rows)
              </summary>
              <pre className="mt-2 text-xs font-mono text-green-300 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {currentResult.sql}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button variant="primary" size="sm" icon={<Pin size={14} />} onClick={handlePin}>
                {activeLiveboard ? `Pin to "${activeLiveboard.name}"` : 'Create liveboard & pin'}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearResult}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { LayoutDashboard, Clock, Plus, Trash2, Play } from 'lucide-react';
import { useLiveboardStore } from '../../store/liveboardStore';
import { useQueryStore } from '../../store/queryStore';
import { useUiStore } from '../../store/uiStore';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const { summaries, loadSummaries, loadLiveboard, deleteLiveboard, activeLiveboard } = useLiveboardStore();
  const { savedQueries, savedQueriesLoading, loadSavedQueries, rerunQuery, deleteQuery } = useQueryStore();
  const { openNlq } = useUiStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => { loadSummaries(); loadSavedQueries(); }, []);

  const handleLoadLiveboard = async (lbId: string) => {
    await loadLiveboard(lbId);
    navigate(`/liveboard/${lbId}`);
  };

  const handleRerun = async (queryId: string) => {
    await rerunQuery(queryId);
    openNlq();
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Liveboards section */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Liveboards</span>
        </div>
        <nav className="space-y-0.5">
          {summaries.length === 0 && (
            <p className="text-xs text-gray-400 px-2 py-1">No liveboards yet</p>
          )}
          {summaries.map((lb) => (
            <div key={lb.id} className="group flex items-center">
              <button
                onClick={() => handleLoadLiveboard(lb.id)}
                className={clsx(
                  'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left truncate',
                  (activeLiveboard?.id === lb.id || id === lb.id)
                    ? 'bg-brand-100 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <LayoutDashboard size={14} className="flex-shrink-0" />
                <span className="truncate">{lb.name}</span>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{lb.chartCount}</span>
              </button>
              <button
                onClick={() => deleteLiveboard(lb.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Saved queries section */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Queries</span>
          {savedQueriesLoading && <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />}
        </div>
        <nav className="space-y-0.5">
          {savedQueries.length === 0 && !savedQueriesLoading && (
            <p className="text-xs text-gray-400 px-2 py-1">No saved queries yet. Ask a question!</p>
          )}
          {savedQueries.map((q) => (
            <div key={q.id} className="group flex items-start gap-1">
              <button
                onClick={() => handleRerun(q.id)}
                className="flex-1 flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
              >
                <Clock size={13} className="flex-shrink-0 mt-0.5 text-gray-400" />
                <span className="truncate text-xs leading-snug">{q.question}</span>
              </button>
              <div className="flex opacity-0 group-hover:opacity-100 transition-all pt-1">
                <button onClick={() => handleRerun(q.id)} className="p-0.5 text-gray-400 hover:text-brand-600">
                  <Play size={11} />
                </button>
                <button onClick={() => deleteQuery(q.id)} className="p-0.5 text-gray-400 hover:text-red-500">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

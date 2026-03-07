import React, { useState } from 'react';
import { Menu, Search, Save, Plus, BarChart3 } from 'lucide-react';
import { Button } from '../shared/Button';
import { useUiStore } from '../../store/uiStore';
import { useLiveboardStore } from '../../store/liveboardStore';
import clsx from 'clsx';

export function TopBar() {
  const { toggleSidebar, toggleNlq, openNewLiveboardModal } = useUiStore();
  const { activeLiveboard, isDirty, saveLayout, renameLiveboard } = useLiveboardStore();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const startRename = () => {
    setNameValue(activeLiveboard?.name || '');
    setEditingName(true);
  };

  const commitRename = async () => {
    setEditingName(false);
    if (activeLiveboard && nameValue.trim() && nameValue !== activeLiveboard.name) {
      await renameLiveboard(activeLiveboard.id, nameValue.trim());
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 z-30 flex-shrink-0">
      <button onClick={toggleSidebar} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
          <BarChart3 size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm hidden sm:block">LiveBoard</span>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* Liveboard name */}
      <div className="flex-1 min-w-0">
        {activeLiveboard ? (
          editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingName(false); }}
              className="text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-brand-500 outline-none w-full max-w-xs"
            />
          ) : (
            <button
              onClick={startRename}
              className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate max-w-xs"
            >
              {activeLiveboard.name}
              {isDirty && <span className="text-orange-400 ml-1">●</span>}
            </button>
          )
        ) : (
          <span className="text-sm text-gray-400">No liveboard selected</span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {isDirty && (
          <Button size="sm" variant="secondary" icon={<Save size={14} />} onClick={saveLayout}>
            Save layout
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={14} />}
          onClick={openNewLiveboardModal}
          className={clsx(!activeLiveboard && 'animate-pulse')}
        >
          New liveboard
        </Button>

        <Button size="sm" variant="primary" icon={<Search size={14} />} onClick={toggleNlq}>
          Ask a question
        </Button>
      </div>
    </header>
  );
}

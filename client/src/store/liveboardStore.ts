import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { liveboardApi } from '../api/liveboardApi';
import type { Liveboard, LiveboardSummary, QueryResult } from '../types';

interface LiveboardState {
  summaries: LiveboardSummary[];
  activeLiveboard: Liveboard | null;
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;

  loadSummaries: () => Promise<void>;
  loadLiveboard: (id: string) => Promise<void>;
  createLiveboard: (name: string, description?: string) => Promise<Liveboard>;
  renameLiveboard: (id: string, name: string) => Promise<void>;
  deleteLiveboard: (id: string) => Promise<void>;
  pinChart: (queryResult: QueryResult) => Promise<void>;
  removeChart: (chartId: string) => Promise<void>;
  updateLayout: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  saveLayout: () => Promise<void>;
  setActiveLiveboard: (lb: Liveboard | null) => void;
}

export const useLiveboardStore = create<LiveboardState>()(
  devtools(
    (set, get) => ({
      summaries: [],
      activeLiveboard: null,
      isLoading: false,
      isDirty: false,
      error: null,

      loadSummaries: async () => {
        try {
          const summaries = await liveboardApi.list();
          set({ summaries });
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      loadLiveboard: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const liveboard = await liveboardApi.get(id);
          set({ activeLiveboard: liveboard, isLoading: false, isDirty: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      createLiveboard: async (name, description) => {
        const lb = await liveboardApi.create(name, description);
        set((s) => ({
          summaries: [
            { id: lb.id, name: lb.name, description: lb.description, chartCount: 0, updatedAt: lb.updatedAt },
            ...s.summaries,
          ],
        }));
        return lb;
      },

      renameLiveboard: async (id, name) => {
        const updated = await liveboardApi.update(id, { name });
        set((s) => ({
          activeLiveboard: s.activeLiveboard?.id === id ? { ...s.activeLiveboard, name } : s.activeLiveboard,
          summaries: s.summaries.map((lb) => lb.id === id ? { ...lb, name } : lb),
        }));
        return updated as unknown as void;
      },

      deleteLiveboard: async (id) => {
        await liveboardApi.delete(id);
        set((s) => ({
          summaries: s.summaries.filter((lb) => lb.id !== id),
          activeLiveboard: s.activeLiveboard?.id === id ? null : s.activeLiveboard,
        }));
      },

      pinChart: async (queryResult) => {
        const active = get().activeLiveboard;
        if (!active) throw new Error('No active liveboard');
        const chart = await liveboardApi.pinChart(active.id, queryResult);
        set((s) => ({
          activeLiveboard: s.activeLiveboard
            ? { ...s.activeLiveboard, charts: [...s.activeLiveboard.charts, chart] }
            : null,
          summaries: s.summaries.map((lb) =>
            lb.id === active.id ? { ...lb, chartCount: lb.chartCount + 1 } : lb
          ),
        }));
      },

      removeChart: async (chartId) => {
        const active = get().activeLiveboard;
        if (!active) return;
        await liveboardApi.removeChart(active.id, chartId);
        set((s) => ({
          activeLiveboard: s.activeLiveboard
            ? { ...s.activeLiveboard, charts: s.activeLiveboard.charts.filter((c) => c.id !== chartId) }
            : null,
        }));
      },

      updateLayout: (layouts) => {
        set((s) => {
          if (!s.activeLiveboard) return s;
          const layoutMap = new Map(layouts.map((l) => [l.i, l]));
          const charts = s.activeLiveboard.charts.map((c) => {
            const l = layoutMap.get(c.id);
            if (!l) return c;
            return { ...c, layout: { ...c.layout, x: l.x, y: l.y, w: l.w, h: l.h } };
          });
          return { activeLiveboard: { ...s.activeLiveboard, charts }, isDirty: true };
        });
      },

      saveLayout: async () => {
        const active = get().activeLiveboard;
        if (!active) return;
        const layouts = active.charts.map((c) => ({
          id: c.id,
          x: c.layout.x,
          y: c.layout.y,
          w: c.layout.w,
          h: c.layout.h,
        }));
        await liveboardApi.saveLayout(active.id, layouts);
        set({ isDirty: false });
      },

      setActiveLiveboard: (lb) => set({ activeLiveboard: lb, isDirty: false }),
    }),
    { name: 'liveboard-store' }
  )
);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { queryApi } from '../api/queryApi';
import type { QueryResult, SavedQuery } from '../types';

interface QueryState {
  question: string;
  isLoading: boolean;
  error: string | null;
  currentResult: QueryResult | null;
  savedQueries: SavedQuery[];
  savedQueriesLoading: boolean;

  setQuestion: (q: string) => void;
  executeQuery: (question: string) => Promise<void>;
  clearResult: () => void;
  loadSavedQueries: () => Promise<void>;
  rerunQuery: (id: string) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
}

export const useQueryStore = create<QueryState>()(
  devtools(
    (set) => ({
      question: '',
      isLoading: false,
      error: null,
      currentResult: null,
      savedQueries: [],
      savedQueriesLoading: false,

      setQuestion: (q) => set({ question: q }),

      executeQuery: async (question) => {
        set({ isLoading: true, error: null, currentResult: null });
        try {
          const result = await queryApi.execute(question);
          set({ currentResult: result, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      clearResult: () => set({ currentResult: null, question: '' }),

      loadSavedQueries: async () => {
        set({ savedQueriesLoading: true });
        try {
          const queries = await queryApi.list();
          set({ savedQueries: queries, savedQueriesLoading: false });
        } catch {
          set({ savedQueriesLoading: false });
        }
      },

      rerunQuery: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const result = await queryApi.rerun(id);
          set({ currentResult: result, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      deleteQuery: async (id) => {
        await queryApi.delete(id);
        set((s) => ({ savedQueries: s.savedQueries.filter((q) => q.id !== id) }));
      },
    }),
    { name: 'query-store' }
  )
);

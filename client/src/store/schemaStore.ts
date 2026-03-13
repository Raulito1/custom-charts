import { create } from 'zustand';
import { schemaApi } from '../api/schemaApi';
import type { FilterColumn, DateColumn } from '../types';

interface SchemaState {
  filterColumns: FilterColumn[];
  dateColumns: DateColumn[];
  isLoading: boolean;
  loaded: boolean;
  loadFilterSuggestions: () => Promise<void>;
}

export const useSchemaStore = create<SchemaState>()((set, get) => ({
  filterColumns: [],
  dateColumns: [],
  isLoading: false,
  loaded: false,

  loadFilterSuggestions: async () => {
    if (get().loaded || get().isLoading) return;
    set({ isLoading: true });
    try {
      const { filterColumns, dateColumns } = await schemaApi.filterSuggestions();
      set({ filterColumns, dateColumns, isLoading: false, loaded: true });
    } catch {
      set({ isLoading: false });
    }
  },
}));

import apiClient from './client';
import type { FilterColumn, DateColumn } from '../types';

interface FilterSuggestionsResponse {
  filterColumns: FilterColumn[];
  dateColumns: DateColumn[];
}

export const schemaApi = {
  filterSuggestions: async (): Promise<FilterSuggestionsResponse> => {
    const res = await apiClient.get<{ success: true; data: FilterSuggestionsResponse }>(
      '/schema/filter-suggestions'
    );
    return res.data.data;
  },
};

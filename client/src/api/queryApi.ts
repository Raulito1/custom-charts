import apiClient from './client';
import type { QueryResult, SavedQuery } from '../types';

export const queryApi = {
  execute: async (question: string): Promise<QueryResult> => {
    const res = await apiClient.post<{ success: true; data: QueryResult }>('/query', { question });
    return res.data.data;
  },

  list: async (): Promise<SavedQuery[]> => {
    const res = await apiClient.get<{ success: true; data: SavedQuery[] }>('/queries');
    return res.data.data;
  },

  rerun: async (id: string): Promise<QueryResult> => {
    const res = await apiClient.post<{ success: true; data: QueryResult }>(`/queries/${id}/run`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/queries/${id}`);
  },
};

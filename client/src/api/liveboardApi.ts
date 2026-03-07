import apiClient from './client';
import type { Liveboard, LiveboardSummary, LiveboardChart, QueryResult, GridItemLayout } from '../types';

export const liveboardApi = {
  list: async (): Promise<LiveboardSummary[]> => {
    const res = await apiClient.get<{ success: true; data: LiveboardSummary[] }>('/liveboards');
    return res.data.data;
  },

  create: async (name: string, description?: string): Promise<Liveboard> => {
    const res = await apiClient.post<{ success: true; data: Liveboard }>('/liveboards', { name, description });
    return res.data.data;
  },

  get: async (id: string): Promise<Liveboard> => {
    const res = await apiClient.get<{ success: true; data: Liveboard }>(`/liveboards/${id}`);
    return res.data.data;
  },

  update: async (id: string, updates: { name?: string; description?: string }): Promise<Liveboard> => {
    const res = await apiClient.put<{ success: true; data: Liveboard }>(`/liveboards/${id}`, updates);
    return res.data.data;
  },

  saveLayout: async (
    id: string,
    layouts: { id: string; x: number; y: number; w: number; h: number }[]
  ): Promise<void> => {
    await apiClient.patch(`/liveboards/${id}/layout`, { layouts });
  },

  pinChart: async (id: string, queryResult: QueryResult, layout?: Partial<GridItemLayout>): Promise<LiveboardChart> => {
    const res = await apiClient.post<{ success: true; data: LiveboardChart }>(`/liveboards/${id}/charts`, {
      queryResult,
      layout: { x: 0, y: 9999, w: 6, h: 4, ...layout },
    });
    return res.data.data;
  },

  removeChart: async (liveboardId: string, chartId: string): Promise<void> => {
    await apiClient.delete(`/liveboards/${liveboardId}/charts/${chartId}`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/liveboards/${id}`);
  },
};

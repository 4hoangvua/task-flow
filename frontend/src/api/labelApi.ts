import { api } from '../config/axios';
import type { Label } from '../types';

export const labelApi = {
  getLabels: async (projectId: string) => {
    const res = await api.get<{ success: boolean; data: Label[] }>(`/projects/${projectId}/labels`);
    return res.data.data;
  },

  createLabel: async (projectId: string, data: { name: string; color: string }) => {
    const res = await api.post<{ success: boolean; data: Label }>(`/projects/${projectId}/labels`, data);
    return res.data.data;
  },

  updateLabel: async (id: string, data: { name?: string; color?: string }) => {
    const res = await api.patch<{ success: boolean; data: Label }>(`/labels/${id}`, data);
    return res.data.data;
  },

  deleteLabel: async (id: string) => {
    const res = await api.delete(`/labels/${id}`);
    return res.data;
  },
};

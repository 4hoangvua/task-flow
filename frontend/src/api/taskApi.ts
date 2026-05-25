import { api } from '../config/axios';
import type { Task } from '../types';

export const taskApi = {
  getTasks: async (params: {
    projectId: string;
    status?: string;
    assigneeId?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<{ success: boolean; data: Task[]; meta: any }>('/tasks', { params });
    return res.data;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string | null;
    priority?: string;
    deadline?: string | null;
    labelIds?: string[];
  }) => {
    const res = await api.post<{ success: boolean; data: Task }>('/tasks', data);
    return res.data.data;
  },

  getTaskById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Task }>(`/tasks/${id}`);
    return res.data.data;
  },

  updateTask: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string | null;
      priority?: string;
      deadline?: string | null;
      labelIds?: string[];
    }
  ) => {
    const res = await api.patch<{ success: boolean; data: Task }>(`/tasks/${id}`, data);
    return res.data.data;
  },

  deleteTask: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<{ success: boolean; data: Task }>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  reorderTasks: async (data: { taskId: string; newOrder: number; status: string }) => {
    const res = await api.patch('/tasks/reorder', data);
    return res.data;
  },

  // Subtask APIs
  createSubtask: async (taskId: string, title: string) => {
    const res = await api.post<{ success: boolean; data: any }>(`/subtasks/tasks/${taskId}/subtasks`, { title });
    return res.data.data;
  },

  updateSubtask: async (id: string, data: { title?: string; isDone?: boolean }) => {
    const res = await api.patch<{ success: boolean; data: any }>(`/subtasks/${id}`, data);
    return res.data.data;
  },

  deleteSubtask: async (id: string) => {
    const res = await api.delete(`/subtasks/${id}`);
    return res.data;
  },
};

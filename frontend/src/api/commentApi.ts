import { api } from '../config/axios';
import type { Comment } from '../types';

export const commentApi = {
  getComments: async (taskId: string) => {
    const res = await api.get<{ success: boolean; data: Comment[] }>(`/tasks/${taskId}/comments`);
    return res.data.data;
  },

  createComment: async (taskId: string, content: string) => {
    const res = await api.post<{ success: boolean; data: Comment }>(`/tasks/${taskId}/comments`, { content });
    return res.data.data;
  },

  deleteComment: async (id: string) => {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  },
};

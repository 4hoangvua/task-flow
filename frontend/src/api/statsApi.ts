import { api } from '../config/axios';

export interface ProjectStatsData {
  total: number;
  byStatus: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  overdue: number;
  recentActivity: any[];
}

export interface MySummaryData {
  assigned: number;
  completed: number;
  overdue: number;
}

export const statsApi = {
  getProjectStats: async (projectId: string) => {
    const res = await api.get<{ success: boolean; data: ProjectStatsData }>(`/stats/project/${projectId}`);
    return res.data.data;
  },

  getMySummary: async () => {
    const res = await api.get<{ success: boolean; data: MySummaryData }>('/stats/my-summary');
    return res.data.data;
  },
};

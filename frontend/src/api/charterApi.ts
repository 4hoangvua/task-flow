import { api } from '../config/axios';
import type { TeamCharter } from '../types';

export interface UpdateCharterPayload {
  workingTimeStart?: string | null;
  workingTimeEnd?: string | null;
  workingDays?: string | null;
  workingLocation?: string | null;
  communicationRules?: string | null;
  rewardRules?: string | null;
  disciplineRules?: string | null;
  rolesDescription?: string | null;
}

export const charterApi = {
  getCharter: async (projectId: string) => {
    const res = await api.get<{ success: boolean; data: TeamCharter }>(`/projects/${projectId}/charter`);
    return res.data.data;
  },

  updateCharter: async (projectId: string, data: UpdateCharterPayload) => {
    const res = await api.put<{ success: boolean; data: TeamCharter }>(`/projects/${projectId}/charter`, data);
    return res.data.data;
  },
};

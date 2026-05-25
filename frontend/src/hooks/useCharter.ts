import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { charterApi } from '../api/charterApi';
import type { UpdateCharterPayload } from '../api/charterApi';
import { App } from 'antd';

export function useCharter(projectId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const charterQuery = useQuery({
    queryKey: ['charter', projectId],
    queryFn: () => charterApi.getCharter(projectId),
    enabled: !!projectId,
  });

  const updateCharterMutation = useMutation({
    mutationFn: (data: UpdateCharterPayload) => charterApi.updateCharter(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charter', projectId] });
      message.success('Đã cập nhật quy tắc nhóm thành công!');
    },
    onError: () => {
      message.error('Cập nhật quy tắc nhóm thất bại!');
    },
  });

  return {
    charter: charterQuery.data,
    isLoading: charterQuery.isLoading,
    updateCharter: updateCharterMutation.mutateAsync,
    isUpdating: updateCharterMutation.isPending,
  };
}

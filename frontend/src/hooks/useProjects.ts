import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/projectApi';
import { message } from 'antd';

export const useProjects = (params?: { status?: string; page?: number; limit?: number }) => {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectApi.getProjects(params),
  });

  const createProjectMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      message.success('Tạo dự án thành công!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Tạo dự án thất bại!');
    },
  });

  return {
    projects: projectsQuery.data?.data || [],
    meta: projectsQuery.data?.meta,
    isLoading: projectsQuery.isLoading,
    refetch: projectsQuery.refetch,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
  };
};

export const useProjectDetail = (projectId: string) => {
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProjectById(projectId),
    enabled: !!projectId,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; status?: string }) =>
      projectApi.updateProject(projectId, data),
    onSuccess: () => {
      message.success('Cập nhật dự án thành công!');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật dự án thất bại!');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectApi.deleteProject(projectId),
    onSuccess: () => {
      message.success('Xóa dự án thành công!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Xóa dự án thất bại!');
    },
  });

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    updateProject: updateProjectMutation.mutateAsync,
    isUpdating: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutateAsync,
    isDeleting: deleteProjectMutation.isPending,
  };
};

export const useProjectMembers = (projectId: string) => {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string; role?: string }) => projectApi.addMember(projectId, data),
    onSuccess: () => {
      message.success('Thêm thành viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Thêm thành viên thất bại!');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: string }) =>
      projectApi.updateMemberRole(projectId, uid, { role }),
    onSuccess: () => {
      message.success('Cập nhật vai trò thành công!');
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật vai trò thất bại!');
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (uid: string) => projectApi.deleteMember(projectId, uid),
    onSuccess: () => {
      message.success('Xóa thành viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Xóa thành viên thất bại!');
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    addMember: addMemberMutation.mutateAsync,
    isAdding: addMemberMutation.isPending,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
    isUpdatingRole: updateMemberRoleMutation.isPending,
    deleteMember: deleteMemberMutation.mutateAsync,
    isDeleting: deleteMemberMutation.isPending,
  };
};

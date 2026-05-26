import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../api/taskApi';
import { commentApi } from '../api/commentApi';
import { message } from '../utils/antd';
import type { Task } from '../types';

export const useTasks = (projectId: string, filters?: { status?: string; assigneeId?: string; priority?: string }) => {
  const queryClient = useQueryClient();

  const queryKey = ['tasks', { projectId, ...filters }];

  const tasksQuery = useQuery({
    queryKey,
    queryFn: () => taskApi.getTasks({ projectId, ...filters }),
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      message.success('Tạo nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Tạo nhiệm vụ thất bại!');
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => taskApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasksData = queryClient.getQueryData<{ success: boolean; data: Task[] }>(queryKey);

      if (previousTasksData) {
        const updatedTasks = previousTasksData.data.map((t) =>
          t.id === id ? { ...t, status: status as any } : t
        );
        queryClient.setQueryData(queryKey, {
          ...previousTasksData,
          data: updatedTasks,
        });
      }

      return { previousTasksData };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTasksData) {
        queryClient.setQueryData(queryKey, context.previousTasksData);
      }
      message.error(err instanceof Error ? err.message : 'Di chuyển nhiệm vụ thất bại!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: taskApi.reorderTasks,
    onMutate: async ({ taskId, newOrder, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasksData = queryClient.getQueryData<{ success: boolean; data: Task[] }>(queryKey);

      if (previousTasksData) {
        // Implement complex optimistic sorting for UI responsiveness
        const tasks = [...previousTasksData.data];
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        
        if (taskIndex !== -1) {
          const [movedTask] = tasks.splice(taskIndex, 1);
          movedTask.status = status as any;
          
          // Filter tasks in target column
          const columnTasks = tasks.filter((t) => t.status === status);
          const otherColumnTasks = tasks.filter((t) => t.status !== status);
          
          columnTasks.splice(newOrder, 0, movedTask);
          
          // Re-index
          const reorderedColumnTasks = columnTasks.map((t, index) => ({ ...t, order: index }));
          
          queryClient.setQueryData(queryKey, {
            ...previousTasksData,
            data: [...otherColumnTasks, ...reorderedColumnTasks],
          });
        }
      }

      return { previousTasksData };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasksData) {
        queryClient.setQueryData(queryKey, context.previousTasksData);
      }
      message.error(err.response?.data?.error || 'Di chuyển nhiệm vụ thất bại!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: tasksQuery.data?.data || [],
    isLoading: tasksQuery.isLoading,
    refetch: tasksQuery.refetch,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    updateStatus: updateTaskStatusMutation.mutateAsync,
    reorderTasks: reorderTasksMutation.mutateAsync,
  };
};

export const useTaskDetail = (taskId: string) => {
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getTaskById(taskId),
    enabled: !!taskId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string;
      assigneeId?: string | null;
      priority?: string;
      deadline?: string | null;
      labelIds?: string[];
    }) => taskApi.updateTask(taskId, data),
    onSuccess: () => {
      message.success('Cập nhật nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật nhiệm vụ thất bại!');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskApi.deleteTask(taskId),
    onSuccess: () => {
      message.success('Xóa nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Xóa nhiệm vụ thất bại!');
    },
  });

  // Subtask Mutations
  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) => taskApi.createSubtask(taskId, title),
    onSuccess: () => {
      message.success('Thêm công việc con thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Thêm công việc con thất bại!');
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, title, isDone }: { id: string; title?: string; isDone?: boolean }) =>
      taskApi.updateSubtask(id, { title, isDone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật công việc con thất bại!');
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteSubtask(id),
    onSuccess: () => {
      message.success('Xóa công việc con thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Xóa công việc con thất bại!');
    },
  });

  // Comments
  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentApi.getComments(taskId),
    enabled: !!taskId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => commentApi.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Gửi bình luận thất bại!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: commentApi.deleteComment,
    onSuccess: () => {
      message.success('Xóa bình luận thành công!');
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Xóa bình luận thất bại!');
    },
  });

  const addDependencyMutation = useMutation({
    mutationFn: (dependsOnId: string) => taskApi.addDependency(taskId, dependsOnId),
    onSuccess: () => {
      message.success('Thêm liên kết phụ thuộc thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Thêm liên kết phụ thuộc thất bại!');
    },
  });

  const removeDependencyMutation = useMutation({
    mutationFn: (dependsOnId: string) => taskApi.removeDependency(taskId, dependsOnId),
    onSuccess: () => {
      message.success('Gỡ liên kết phụ thuộc thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Gỡ liên kết phụ thuộc thất bại!');
    },
  });

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeleting: deleteTaskMutation.isPending,
    createSubtask: createSubtaskMutation.mutateAsync,
    isCreatingSubtask: createSubtaskMutation.isPending,
    updateSubtask: updateSubtaskMutation.mutateAsync,
    isUpdatingSubtask: updateSubtaskMutation.isPending,
    deleteSubtask: deleteSubtaskMutation.mutateAsync,
    isDeletingSubtask: deleteSubtaskMutation.isPending,
    comments: commentsQuery.data || [],
    isLoadingComments: commentsQuery.isLoading,
    addComment: addCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutateAsync,

    // Dependency
    addDependency: addDependencyMutation.mutateAsync,
    isAddingDependency: addDependencyMutation.isPending,
    removeDependency: removeDependencyMutation.mutateAsync,
    isRemovingDependency: removeDependencyMutation.isPending,
  };
};

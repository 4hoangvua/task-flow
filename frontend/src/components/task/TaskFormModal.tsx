import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useProjectMembers } from '../../hooks/useProjects';
import { useTasks, useTaskDetail } from '../../hooks/useTasks';
import { labelApi } from '../../api/labelApi';
import type { Task } from '../../types';
import dayjs from 'dayjs';
import { MarkdownEditor } from '../common/MarkdownEditor';

interface TaskFormModalProps {
  projectId: string;
  task?: Task | null;
  open: boolean;
  onCancel: () => void;
  initialDeadline?: dayjs.Dayjs | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ projectId, task, open, onCancel, initialDeadline }) => {
  const [form] = Form.useForm();
  const taskTitle = Form.useWatch('title', form);
  const { members, isLoading: isLoadingMembers } = useProjectMembers(projectId);
  const { createTask, isCreating } = useTasks(projectId);

  // We only conditionally call useTaskDetail if we have a task (editing mode)
  // To satisfy Hook rules, we can fetch it or just use the mutation from taskApi directly, 
  // but useTaskDetail returns updateTask which handles invalidateQueries. 
  // Since hook calls cannot be conditional, we pass the task ID (empty string if none) 
  // and handle enabling the query inside useTaskDetail. 
  const { updateTask, isUpdating } = useTaskDetail(task?.id || '');

  const isEditMode = !!task;

  // Query labels of this project
  const { data: labels = [], isLoading: isLoadingLabels } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => labelApi.getLabels(projectId),
    enabled: !!projectId && open,
  });

  // Set form fields when task changes or modal opens
  useEffect(() => {
    const parseIds = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch (e) {
        return [];
      }
    };

    if (open) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeId: task.assigneeId || undefined,
          deadline: task.deadline ? dayjs(task.deadline) : null,
          labelIds: task.labels ? task.labels.map((l) => l.id) : [],

        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          priority: 'MEDIUM',
          labelIds: [],
          deadline: initialDeadline || null,
        });
      }
    }
  }, [open, task, form, initialDeadline]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        assigneeId: values.assigneeId || null,

        deadline: values.deadline ? values.deadline.toISOString() : null,
      };

      if (isEditMode && task) {
        await updateTask(payload);
      } else {
        await createTask({
          ...payload,
          projectId,
        });
      }
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {isEditMode ? 'Cập nhật nhiệm vụ' : 'Tạo nhiệm vụ mới'}
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={isEditMode ? isUpdating : isCreating}
        >
          {isEditMode ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Tiêu đề công việc"
          name="title"
          rules={[
            { required: true, message: 'Vui lòng nhập tiêu đề!' },
            { min: 3, message: 'Tiêu đề phải từ 3 ký tự trở lên!' },
          ]}
        >
          <Input placeholder="Nhập tiêu đề nhiệm vụ..." />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <MarkdownEditor taskTitle={taskTitle} />
        </Form.Item>

        <Form.Item
          label="Độ ưu tiên"
          name="priority"
          rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
        >
          <Select
            options={[
              { value: 'LOW', label: 'Thấp' },
              { value: 'MEDIUM', label: 'Trung bình' },
              { value: 'HIGH', label: 'Cao' },
              { value: 'URGENT', label: 'Khẩn cấp' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Người thực hiện (Responsible - R)" name="assigneeId">
          <Select
            placeholder="Chọn thành viên thực hiện..."
            loading={isLoadingMembers}
            allowClear
            options={members.map((member) => ({
              value: member.user?.id,
              label: member.user?.name || member.user?.email,
            }))}
          />
        </Form.Item>



        <Form.Item label="Nhãn công việc" name="labelIds">
          <Select
            mode="multiple"
            placeholder="Chọn nhãn công việc..."
            loading={isLoadingLabels}
            allowClear
            options={labels.map((lbl) => ({
              value: lbl.id,
              label: (
                <span className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full inline-block" 
                    style={{ backgroundColor: lbl.color }} 
                  />
                  {lbl.name}
                </span>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Hạn chót"
          name="deadline"
          rules={[
            {
              validator: (_, value) => {
                if (value) {
                  const originalDeadline = task?.deadline ? dayjs(task.deadline) : null;
                  const isChanged = !originalDeadline || !value.isSame(originalDeadline);
                  if (isChanged && value.isBefore(dayjs().startOf('minute'))) {
                    return Promise.reject(new Error('Hạn chót không thể ở trong quá khứ!'));
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker 
            className="w-full" 
            showTime 
            format="YYYY-MM-DD HH:mm" 
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default TaskFormModal;

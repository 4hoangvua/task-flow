import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Tag, Space, Button, Spin, Empty, Alert } from 'antd';
import { CheckSquareOutlined, CalendarOutlined, EyeOutlined, ProjectOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { formatDate, getPriorityColor } from '../utils/helpers';
import type { Task, TaskStatus } from '../types';
import { TaskDetailModal } from '../components/task/TaskDetailModal';

export const MyTasks: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Task Detail Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Set default project to first active project if available
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Tasks Query
  const { tasks, isLoading: isLoadingTasks, updateStatus } = useTasks(selectedProjectId || '');

  // Filter tasks assigned to me
  const myTasks = tasks.filter((t) => t.assigneeId === currentUser?.id);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateStatus({ id: taskId, status: newStatus });
    } catch (err) {
      // Handled in hook
    }
  };

  const columns = [
    {
      title: 'Mã công việc',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-xs">#{id.substring(0, 8)}</span>,
      width: 120,
    },
    {
      title: 'Tiêu đề công việc',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Task) => (
        <span
          onClick={() => {
            setSelectedTaskId(record.id);
            setIsDetailOpen(true);
          }}
          className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
        >
          {title}
        </span>
      ),
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: any) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus, record: Task) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record.id, val)}
          className="w-36"
          options={[
            { value: 'TODO', label: 'Cần làm' },
            { value: 'IN_PROGRESS', label: 'Đang làm' },
            { value: 'REVIEW', label: 'Chờ đánh giá' },
            { value: 'DONE', label: 'Hoàn thành' },
          ]}
        />
      ),
      width: 180,
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => {
        if (!deadline) return <span className="text-slate-400">Không có</span>;
        const isOverdue = new Date(deadline) < new Date();
        return (
          <Space className={isOverdue ? 'text-red-500 font-medium' : 'text-slate-500'}>
            <CalendarOutlined />
            <span>{formatDate(deadline)}</span>
          </Space>
        );
      },
      width: 200,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Task) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedTaskId(record.id);
            setIsDetailOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
      width: 120,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckSquareOutlined className="text-indigo-600" /> Công việc của tôi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi và cập nhật trạng thái các công việc được giao cho bạn.
          </p>
        </div>

        {projects.length > 0 && (
          <Space>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chọn dự án:</span>
            <Select
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              className="w-56"
              loading={isLoadingProjects}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Space>
        )}
      </div>

      {isLoadingProjects ? (
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      ) : projects.length === 0 ? (
        <Card className="shadow-sm">
          <Empty description="Bạn chưa tham gia dự án nào. Vui lòng liên hệ Leader để được thêm vào dự án!" />
        </Card>
      ) : !selectedProjectId ? (
        <Alert message="Vui lòng chọn một dự án để xem danh sách công việc của bạn." type="info" showIcon />
      ) : (
        <Card className="shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
          {isLoadingTasks ? (
            <div className="flex justify-center p-12"><Spin size="large" /></div>
          ) : myTasks.length === 0 ? (
            <div className="p-8">
              <Empty
                image={<ProjectOutlined className="text-5xl text-slate-200" />}
                description={
                  <div className="text-slate-500 mt-2">
                    Chúc mừng! Bạn không có công việc nào cần giải quyết trong dự án này.
                  </div>
                }
              />
            </div>
          ) : (
            <Table
              dataSource={myTasks}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && selectedProjectId && isDetailOpen && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={selectedProjectId}
          open={isDetailOpen}
          onCancel={() => {
            setIsDetailOpen(false);
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
};
export default MyTasks;

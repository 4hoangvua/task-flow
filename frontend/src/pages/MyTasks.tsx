import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Tag, Space, Button, Spin, Empty, Alert, Input } from 'antd';
import { CheckSquareOutlined, CalendarOutlined, EyeOutlined, ProjectOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { formatDate } from '../utils/helpers';
import type { Task, TaskStatus } from '../types';
import { TaskDetailModal } from '../components/task/TaskDetailModal';
import { PriorityTag } from '../components/common/PriorityTag';
import { TaskIdBadge } from '../components/common/TaskIdBadge';
import { SearchAutoComplete } from '../components/common/SearchAutoComplete';
import { message } from '../utils/antd';

export const MyTasks: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Task Detail Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Apply filters: search text, status, priority
  const filteredMyTasks = myTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchText.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'DONE') {
      const task = myTasks.find((t) => t.id === taskId);
      if (task) {
        const incompletePrereqs = task.dependencies?.filter((dep) => dep.dependsOn.status !== 'DONE') || [];
        if (incompletePrereqs.length > 0) {
          const titles = incompletePrereqs.map((d) => `"${d.dependsOn.title}"`).join(', ');
          message.error(`Không thể hoàn thành công việc vì các công việc tiên quyết chưa hoàn thành: ${titles}`);
          return;
        }
      }
    }
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
      render: (id: string) => <TaskIdBadge id={id} />,
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
          className="font-semibold text-[var(--accent)] hover:text-[var(--accent)]/95 cursor-pointer transition-colors"
        >
          {title}
        </span>
      ),
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <PriorityTag priority={priority} />,
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
      width: 160,
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => {
        if (!deadline) return <span className="text-[var(--text-tertiary)] text-xs">Không có</span>;
        const isOverdue = new Date(deadline) < new Date();
        return (
          <Space className={`text-xs ${isOverdue ? 'text-rose-500 font-bold' : 'text-[var(--text-secondary)] font-medium'}`}>
            <CalendarOutlined className="text-xs" />
            <span>{formatDate(deadline)}</span>
          </Space>
        );
      },
      width: 180,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Task) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedTaskId(record.id);
            setIsDetailOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
      width: 110,
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-h)] flex items-center gap-2.5">
            <CheckSquareOutlined className="text-[var(--accent)]" /> Công việc của tôi
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
            Theo dõi và cập nhật trạng thái các công việc được giao cho cá nhân bạn.
          </p>
        </div>
      </div>

      {isLoadingProjects ? (
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      ) : projects.length === 0 ? (
        <Card className="shadow-sm border border-[var(--border)]">
          <Empty description="Bạn chưa tham gia dự án nào. Vui lòng liên hệ Trưởng nhóm để được thêm vào dự án!" />
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Filter Card */}
          <Card className="shadow-sm border border-[var(--border)] notebook-card">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              <div className="flex flex-1 flex-col sm:flex-row flex-wrap gap-3.5">
                {/* Project Selector */}
                {projects.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Dự án:</span>
                    <Select
                      value={selectedProjectId}
                      onChange={setSelectedProjectId}
                      className="w-full sm:w-56"
                      loading={isLoadingProjects}
                      options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </div>
                )}

                {/* Search input */}
                <SearchAutoComplete
                  placeholder="Tìm kiếm công việc..."
                  value={searchText}
                  onChange={setSearchText}
                  dataSource={myTasks}
                  searchFields={['title', 'description']}
                  primaryField="title"
                  className="w-full sm:max-w-xs"
                  renderOption={(task) => (
                    <div className="flex justify-between items-center py-0.5 px-1">
                      <span className="font-semibold text-xs text-[var(--text-h)] truncate max-w-[180px]">{task.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text-secondary)] font-bold shrink-0 ml-3">
                        {task.status === 'TODO' ? 'Cần làm' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'REVIEW' ? 'Đánh giá' : 'Hoàn thành'}
                      </span>
                    </div>
                  )}
                />

                {/* Status Selector */}
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full sm:w-44"
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'TODO', label: 'Cần làm' },
                    { value: 'IN_PROGRESS', label: 'Đang làm' },
                    { value: 'REVIEW', label: 'Chờ đánh giá' },
                    { value: 'DONE', label: 'Hoàn thành' },
                  ]}
                />

                {/* Priority Selector */}
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  className="w-full sm:w-40"
                  options={[
                    { value: 'ALL', label: 'Mọi độ ưu tiên' },
                    { value: 'LOW', label: 'Độ ưu tiên: Thấp' },
                    { value: 'MEDIUM', label: 'Độ ưu tiên: TB' },
                    { value: 'HIGH', label: 'Độ ưu tiên: Cao' },
                    { value: 'URGENT', label: 'Độ ưu tiên: Khẩn cấp' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Tasks List */}
          {!selectedProjectId ? (
            <Alert message="Vui lòng chọn một dự án để xem danh sách công việc của bạn." type="info" showIcon />
          ) : (
            <div className='mt-10'>
              <Card className="shadow-sm border border-[var(--border)] overflow-hidden notebook-card" styles={{ body: { padding: 0 } }}>
                {isLoadingTasks ? (
                  <div className="flex justify-center p-12"><Spin size="large" /></div>
                ) : filteredMyTasks.length === 0 ? (
                  <div className="p-12">
                    <Empty
                      image={<ProjectOutlined className="text-5xl text-[var(--text-tertiary)]" />}
                      description={
                        <div className="text-[var(--text-secondary)] mt-3 text-sm">
                          Không tìm thấy công việc nào phù hợp với bộ lọc trong dự án này.
                        </div>
                      }
                    />
                  </div>
                ) : isMobile ? (
                  <div className="p-4 space-y-4">
                    {filteredMyTasks.map((task) => {
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';
                      return (
                        <div
                          key={task.id}
                          className={`p-4 bg-[var(--bg-card)] border rounded-lg shadow-sm hover:shadow-md premium-card ${
                            isOverdue ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/5 dark:bg-rose-950/5' : 'border-[var(--border)]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setIsDetailOpen(true);
                              }}
                              className="font-bold text-base text-[var(--accent)] hover:text-[var(--accent)]/95 cursor-pointer line-clamp-2"
                            >
                              {task.title}
                            </span>
                            <PriorityTag priority={task.priority} />
                          </div>

                          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mt-3 pt-3 border-t border-[var(--border)]/60">
                            <div>
                              <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">TRẠNG THÁI</span>
                              <Select
                                value={task.status}
                                onChange={(val) => handleStatusChange(task.id, val)}
                                size="small"
                                className="w-28 text-xs"
                                options={[
                                  { value: 'TODO', label: 'Cần làm' },
                                  { value: 'IN_PROGRESS', label: 'Đang làm' },
                                  { value: 'REVIEW', label: 'Đánh giá' },
                                  { value: 'DONE', label: 'Hoàn thành' },
                                ]}
                              />
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">HẠN CHÓT</span>
                              {task.deadline ? (
                                <span className={`font-semibold ${isOverdue ? 'text-rose-500 font-bold' : ''}`}>
                                  {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-[var(--text-tertiary)]">Không có</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Table
                    dataSource={filteredMyTasks}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                )}
              </Card>
            </div>
          )}
        </div>
      )
      }

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

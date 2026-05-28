import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Card, Row, Col, Progress, Tag, Avatar, Table, Form, Input, Select, Button, Space, Popconfirm, Spin, Empty, AutoComplete, Timeline, Tooltip, Checkbox, TimePicker } from 'antd';
import { authApi } from '../api/authApi';
import {
  ProjectOutlined,
  InfoCircleOutlined,
  TableOutlined,
  TeamOutlined,
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  SwapOutlined,
  AlertOutlined,
  EditOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useProjectDetail, useProjectMembers } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { TaskBoard } from '../components/task/TaskBoard';
import { TaskCalendar } from '../components/task/TaskCalendar';
import { formatDate, getRoleColor } from '../utils/helpers';
import type { ProjectMember, User } from '../types';
import { ProjectStatusTag } from '../components/common/ProjectStatusTag';
import { useSocket } from '../providers/SocketProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { statsApi } from '../api/statsApi';
import { TaskDetailModal } from '../components/task/TaskDetailModal';
import { labelApi } from '../api/labelApi';
import { api } from '../config/axios';
import { message } from '../utils/antd';
import { useCharter } from '../hooks/useCharter';
import dayjs from 'dayjs';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Task details modal state (for timeline actions)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Project statistics / history query
  const projectStatsQuery = useQuery({
    queryKey: ['projectStats', id],
    queryFn: () => statsApi.getProjectStats(id || ''),
    enabled: !!id,
  });

  // API hooks
  const { project, isLoading: isLoadingProject, updateProject, deleteProject } = useProjectDetail(id || '');
  const { members, isLoading: isLoadingMembers, addMember, updateMemberRole, deleteMember } = useProjectMembers(id || '');
  const { tasks } = useTasks(id || '');
  const { charter, isLoading: isLoadingCharter, updateCharter: updateCharterApi, isUpdating: isUpdatingCharter } = useCharter(id || '');

  const [charterForm] = Form.useForm();

  const [inviteForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // Invite Member Search Autocomplete
  const [inviteSearchOptions, setInviteSearchOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // CSV Export Handler
  const [isExporting, setIsExporting] = useState(false);

  // Custom Labels Management
  const { data: labels = [] } = useQuery({
    queryKey: ['labels', id],
    queryFn: () => labelApi.getLabels(id || ''),
    enabled: !!id,
  });

  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#3b82f6');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const handleSearchUser = async (value: string) => {
    setIsSearchingUsers(true);
    try {
      const data = await authApi.searchUsers(value || '');
      const options = data.map((u: User) => ({
        value: u.email,
        label: (
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-xs text-[var(--text-h)]">{u.name}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] ml-2">{u.email}</span>
          </div>
        ),
      }));
      setInviteSearchOptions(options);
    } catch (err) {
      // Quiet fail or silent error handling
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Initialize Settings Form when project loads
  useEffect(() => {
    if (project && activeTab === 'settings') {
      const timer = setTimeout(() => {
        settingsForm.setFieldsValue({
          name: project.name,
          description: project.description,
          status: project.status,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [project, activeTab, settingsForm]);

  // Real-time synchronization via Socket.io
  useEffect(() => {
    if (!socket || !id) return;

    const joinRoom = () => {
      socket.emit('join-project', { projectId: id });
    };

    // Join project room initially
    joinRoom();

    // Re-join on connection/reconnection events
    socket.on('connect', joinRoom);

    const handleTaskEvent = () => {
      // Invalidate queries to fetch fresh tasks, stats
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', id] });
    };

    const handleCommentEvent = (data: any) => {
      if (data && data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ['projectStats', id] });
    };

    const handleMemberEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['members', id] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleProjectEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    };

    // Register listeners
    socket.on('task:created', handleTaskEvent);
    socket.on('task:updated', handleTaskEvent);
    socket.on('task:deleted', handleTaskEvent);
    socket.on('task:status-changed', handleTaskEvent);
    socket.on('task:reordered', handleTaskEvent);
    socket.on('comment:added', handleCommentEvent);
    socket.on('comment:deleted', handleCommentEvent);
    socket.on('member:added', handleMemberEvent);
    socket.on('member:removed', handleMemberEvent);
    socket.on('project:updated', handleProjectEvent);

    return () => {
      // Clean up
      socket.off('connect', joinRoom);
      socket.off('task:created', handleTaskEvent);
      socket.off('task:updated', handleTaskEvent);
      socket.off('task:deleted', handleTaskEvent);
      socket.off('task:status-changed', handleTaskEvent);
      socket.off('task:reordered', handleTaskEvent);
      socket.off('comment:added', handleCommentEvent);
      socket.off('comment:deleted', handleCommentEvent);
      socket.off('member:added', handleMemberEvent);
      socket.off('member:removed', handleMemberEvent);
      socket.off('project:updated', handleProjectEvent);
      socket.emit('leave-project', { projectId: id });
    };
  }, [socket, id, queryClient]);

  if (!id) {
    return <Card><Empty description="Không tìm thấy ID dự án" /></Card>;
  }

  if (isLoadingProject) {
    return <div className="flex justify-center p-24"><Spin size="large" /></div>;
  }

  if (!project) {
    return (
      <Card className="shadow-sm border border-[var(--border)]">
        <Empty description="Dự án không tồn tại hoặc bạn không có quyền truy cập." />
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/projects')}>Quay lại danh sách</Button>
        </div>
      </Card>
    );
  }

  // Determine current user's role in this project
  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const isProjectLeader = currentMember?.role === 'LEADER' || currentUser?.role === 'ADMIN' || project.ownerId === currentUser?.id;
  const isOwner = project.ownerId === currentUser?.id || currentUser?.role === 'ADMIN';

  // Statistics calculation
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;

  // Handlers
  const handleInviteMember = async (values: { email: string; role: 'LEADER' | 'MEMBER' }) => {
    try {
      await addMember(values);
      inviteForm.resetFields();
    } catch (err) {
      // Handled in hook
    }
  };

  const handleUpdateRole = async (memberUserId: string, newRole: string) => {
    try {
      await updateMemberRole({ uid: memberUserId, role: newRole });
    } catch (err) {
      // Handled in hook
    }
  };

  const handleDeleteMember = async (memberUserId: string) => {
    try {
      await deleteMember(memberUserId);
    } catch (err) {
      // Handled in hook
    }
  };

  const handleUpdateProjectSettings = async (values: any) => {
    try {
      await updateProject(values);
    } catch (err) {
      // Handled in hook
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject();
      navigate('/projects');
    } catch (err) {
      // Handled in hook
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/projects/${id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `du-an-${project.name || 'export'}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Xuất báo cáo CSV thành công!');
    } catch (err: any) {
      console.error('Export CSV failed:', err);
      message.error('Xuất báo cáo CSV thất bại!');
    } finally {
      setIsExporting(false);
    }
  };

  const PRESET_COLORS = [
    { name: 'Đỏ (Bug)', hex: '#ef4444' },
    { name: 'Xanh dương (Feature)', hex: '#3b82f6' },
    { name: 'Vàng (Refactor)', hex: '#f59e0b' },
    { name: 'Tím (Docs)', hex: '#8b5cf6' },
    { name: 'Hồng (Design)', hex: '#ec4899' },
    { name: 'Xanh lá (Release)', hex: '#10b981' },
    { name: 'Xanh đậm (Tech Debt)', hex: '#1e3a8a' },
    { name: 'Xanh ngọc (UI/UX)', hex: '#14b8a6' },
  ];

  const handleCreateLabel = async () => {
    if (!labelName.trim()) {
      message.error('Vui lòng nhập tên nhãn!');
      return;
    }
    setIsCreatingLabel(true);
    try {
      await labelApi.createLabel(id!, { name: labelName.trim(), color: labelColor });
      setLabelName('');
      queryClient.invalidateQueries({ queryKey: ['labels', id] });
      message.success('Tạo nhãn thành công!');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Tạo nhãn thất bại!');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await labelApi.deleteLabel(labelId);
      queryClient.invalidateQueries({ queryKey: ['labels', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      message.success('Xóa nhãn thành công!');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Xóa nhãn thất bại!');
    }
  };

  // Columns for Members list
  const memberColumns = [
    {
      title: 'Họ tên',
      key: 'name',
      render: (_: any, record: ProjectMember) => (
        <Space>
          <Avatar src={record.user?.avatar} icon={<UserOutlined />} className="bg-[var(--accent)]" />
          <span className="font-semibold text-[var(--text)]">
            {record.user?.name || 'N/A'}
            {project.ownerId === record.userId && (
              <Tag color="red" className="ml-2 text-[10px]">Chủ dự án</Tag>
            )}
          </span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
      render: (email: string) => email || 'N/A',
    },
    {
      title: 'Vai trò dự án',
      key: 'role',
      render: (_: any, record: ProjectMember) => {
        const isSelf = record.userId === currentUser?.id;
        const isTargetOwner = record.userId === project.ownerId;

        if (isProjectLeader && !isTargetOwner && !isSelf) {
          return (
            <Select
              value={record.role}
              onChange={(val) => handleUpdateRole(record.userId, val)}
              className="w-32"
              options={[
                { value: 'LEADER', label: 'Quản trị (Leader)' },
                { value: 'MEMBER', label: 'Thành viên (Member)' },
              ]}
            />
          );
        }

        return <Tag color={getRoleColor(record.role)}>{record.role === 'LEADER' ? 'Quản trị (Leader)' : 'Thành viên (Member)'}</Tag>;
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => formatDate(date).split(' ')[0],
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: ProjectMember) => {
        const isSelf = record.userId === currentUser?.id;
        const isTargetOwner = record.userId === project.ownerId;

        if (isProjectLeader && !isTargetOwner && !isSelf) {
          return (
            <Popconfirm
              title="Xóa thành viên"
              description="Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?"
              onConfirm={() => handleDeleteMember(record.userId)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Project Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-h)] flex items-center gap-2.5">
              <ProjectOutlined className="text-[var(--accent)]" /> {project.name}
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 text-sm flex items-center gap-2">
               <span>Trạng thái:</span>
              <ProjectStatusTag status={project.status} />
            </p>
          </div>
          {isProjectLeader && (
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              loading={isExporting}
              className="font-semibold shadow-xs"
            >
              Xuất báo cáo CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="custom-tabs"
        items={[
          {
            key: 'overview',
            label: (
              <span className="flex items-center gap-2">
                <InfoCircleOutlined /> Tổng quan
              </span>
            ),
            children: (
              <Space orientation="vertical" size={20} className="w-full">
                <Row gutter={[20, 20]}>
                  {/* Overview Stats */}
                  <Col xs={24} lg={16}>
                    <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Tiến độ dự án</span>} className="shadow-sm border border-[var(--border)] h-full">
                      <Row gutter={20} align="middle">
                        <Col xs={24} sm={8} className="flex justify-center mb-6 sm:mb-0">
                          <Progress
                            type="circle"
                            percent={progressPercent}
                            strokeColor={{ '0%': 'var(--accent)', '100%': '#10b981' }}
                            size={132}
                            strokeWidth={8}
                          />
                        </Col>
                        <Col xs={24} sm={16}>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3.5 bg-[var(--bg)]/50 border border-[var(--border)] rounded-xl">
                              <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block mb-1">Cần làm</span>
                              <span className="text-2xl font-extrabold text-[var(--text)]">{todoTasks}</span>
                            </div>
                            <div className="p-3.5 bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100/10 dark:border-blue-900/10 rounded-xl">
                              <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider block mb-1">Đang làm</span>
                              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{inProgressTasks}</span>
                            </div>
                            <div className="p-3.5 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/10 dark:border-amber-900/10 rounded-xl">
                              <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider block mb-1">Đánh giá</span>
                              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{reviewTasks}</span>
                            </div>
                            <div className="p-3.5 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/10 dark:border-emerald-900/10 rounded-xl">
                              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-1">Hoàn thành</span>
                              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{doneTasks}</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  {/* Owner Card */}
                  <Col xs={24} lg={8}>
                    <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Chủ sở hữu & Ngày tạo</span>} className="shadow-sm border border-[var(--border)] h-full">
                      <div className="space-y-5">
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-3 rounded-xl">
                           <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block">Chủ dự án</span>
                          <Space className="mt-2">
                            <Avatar src={project.owner?.avatar} icon={<UserOutlined />} className="bg-rose-500 border border-rose-100/20 shadow-xs" />
                            <span className="font-bold text-[var(--text)] text-sm">
                              {project.owner?.name || 'N/A'}
                            </span>
                          </Space>
                        </div>
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-3 rounded-xl">
                          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block">Ngày bắt đầu</span>
                          <span className="text-sm font-bold text-[var(--text)] block mt-2">
                            {formatDate(project.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Description */}
                <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Mô tả dự án</span>} className="shadow-sm border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {project.description || 'Không có mô tả chi tiết cho dự án này.'}
                  </p>
                </Card>
              </Space>
            ),
          },
          {
            key: 'board',
            label: (
              <span className="flex items-center gap-2">
                <TableOutlined /> Bảng công việc
              </span>
            ),
            children: <TaskBoard projectId={id} isProjectLeader={isProjectLeader} />,
          },
          {
            key: 'calendar',
            label: (
              <span className="flex items-center gap-2">
                <CalendarOutlined /> Lịch công việc
              </span>
            ),
            children: <TaskCalendar projectId={id} isProjectLeader={isProjectLeader} />,
          },
          {
            key: 'members',
            label: (
          <span className="flex items-center gap-2">
                <TeamOutlined /> Thành viên ({members.length})
              </span>
            ),
            children: (
              <Space orientation="vertical" size={20} className="w-full">
                {/* Invite Member Card */}
                {isProjectLeader && (
                  <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Mời thành viên mới</span>} className="shadow-sm border border-[var(--border)]">
                    <Form form={inviteForm} layout="inline" onFinish={handleInviteMember} className="gap-y-3">
                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: 'Nhập email thành viên!' },
                          { type: 'email', message: 'Email không đúng định dạng!' },
                        ]}
                        className="flex-1"
                        style={{ minWidth: 260 }}
                      >
                        <AutoComplete
                          options={inviteSearchOptions}
                          onSearch={handleSearchUser}
                          onFocus={() => handleSearchUser(inviteForm.getFieldValue('email') || '')}
                          className="w-full animate-in fade-in duration-200"
                          notFoundContent={isSearchingUsers ? <Spin size="small" className="flex justify-center p-2" /> : undefined}
                          filterOption={false}
                        >
                          <Input prefix={<MailOutlined className="text-[var(--text-tertiary)]" />} placeholder="Nhập hoặc tìm kiếm email thành viên..." />
                        </AutoComplete>
                      </Form.Item>

                      <Form.Item
                        name="role"
                        initialValue="MEMBER"
                        style={{ width: 150 }}
                      >
                        <Select
                          options={[
                            { value: 'MEMBER', label: 'Thành viên' },
                            { value: 'LEADER', label: 'Quản trị' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item className="mr-0">
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} className="font-semibold">
                          Thêm
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                {/* Members list table */}
                <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Danh sách thành viên</span>} className="shadow-sm overflow-hidden border border-[var(--border)]" styles={{ body: { padding: 0 } }}>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <Table
                      dataSource={members}
                      columns={isProjectLeader ? memberColumns : memberColumns.filter((col) => col.key !== 'action')}
                      rowKey="id"
                      loading={isLoadingMembers}
                      pagination={{ pageSize: 10 }}
                    />
                  </div>

                  {/* Mobile Card List View */}
                  <div className="block sm:hidden p-4">
                    {isLoadingMembers ? (
                      <div className="flex justify-center p-6"><Spin /></div>
                    ) : members.length === 0 ? (
                      <Empty description="Chưa có thành viên" />
                    ) : (
                      <div className="space-y-4">
                        {members.map((record) => {
                          const isSelf = record.userId === currentUser?.id;
                          const isTargetOwner = record.userId === project.ownerId;
                          return (
                            <div key={record.id} className="p-3 bg-[var(--bg)]/40 border border-[var(--border)] rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar src={record.user?.avatar} icon={<UserOutlined />} className="bg-[var(--accent)]" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm text-[var(--text-h)]">
                                    {record.user?.name || 'N/A'}
                                    {project.ownerId === record.userId && (
                                      <Tag color="red" className="ml-1 text-[9px] inline-block">Chủ</Tag>
                                    )}
                                  </span>
                                  <span className="text-xs text-[var(--text-tertiary)] break-all">{record.user?.email}</span>
                                  <div className="mt-1">
                                    {isProjectLeader && !isTargetOwner && !isSelf ? (
                                      <Select
                                        value={record.role}
                                        onChange={(val) => handleUpdateRole(record.userId, val)}
                                        size="small"
                                        className="w-28 text-xs"
                                        options={[
                                          { value: 'LEADER', label: 'Quản trị' },
                                          { value: 'MEMBER', label: 'Thành viên' },
                                        ]}
                                      />
                                    ) : (
                                      <Tag color={getRoleColor(record.role)} className="text-[10px] m-0">{record.role === 'LEADER' ? 'Quản trị' : 'Thành viên'}</Tag>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isProjectLeader && !isTargetOwner && !isSelf && (
                                <Popconfirm
                                  title="Xóa thành viên"
                                  description="Bạn có chắc chắn muốn xóa thành viên này?"
                                  onConfirm={() => handleDeleteMember(record.userId)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </Space>
            ),
          },
          {
            key: 'activity',
            label: (
              <span className="flex items-center gap-2">
                <HistoryOutlined /> Nhật ký hoạt động
              </span>
            ),
            children: (
              <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Nhật ký hoạt động gần đây</span>} className="shadow-sm border border-[var(--border)] notebook-card">
                {projectStatsQuery.isLoading ? (
                  <div className="flex justify-center p-8"><Spin /></div>
                ) : !projectStatsQuery.data?.recentActivity || projectStatsQuery.data.recentActivity.length === 0 ? (
                  <Empty description="Không có hoạt động nào gần đây" />
                ) : (
                  <Timeline
                    className="mt-4 pt-2"
                    mode="left"
                    items={projectStatsQuery.data.recentActivity.map((item: any) => {
                      let desc: React.ReactNode = '';
                      let dotIcon: React.ReactNode = <EditOutlined className="text-xs text-slate-500" />;
                      let color = 'gray';

                      const formatStatus = (status: string) => {
                        switch (status) {
                          case 'TODO': return 'Cần làm';
                          case 'IN_PROGRESS': return 'Đang thực hiện';
                          case 'REVIEW': return 'Chờ đánh giá';
                          case 'DONE': return 'Hoàn thành';
                          default: return status;
                        }
                      };

                      const formatPriority = (prio: string) => {
                        switch (prio) {
                          case 'LOW': return 'Thấp';
                          case 'MEDIUM': return 'Trung bình';
                          case 'HIGH': return 'Cao';
                          case 'URGENT': return 'Khẩn cấp';
                          default: return prio;
                        }
                      };

                      if (item.field === 'status') {
                        if (!item.oldValue) {
                          desc = (
                            <span>
                              đã tạo nhiệm vụ mới và đặt trạng thái là{' '}
                              <Tag color="blue" className="text-[10px] uppercase font-bold py-0.5 px-1.5">{formatStatus(item.newValue)}</Tag>
                            </span>
                          );
                          dotIcon = <PlusCircleOutlined className="text-xs text-blue-500" />;
                          color = 'blue';
                        } else {
                          const isDone = item.newValue === 'DONE';
                          desc = (
                            <span className="flex items-center flex-wrap gap-1">
                              đã chuyển trạng thái từ
                              <Tag className="text-[10px] font-bold py-0.5 px-1.5">{formatStatus(item.oldValue)}</Tag>
                              <SwapOutlined className="text-[var(--text-tertiary)] text-[10px]" />
                              <Tag color={isDone ? 'emerald' : 'blue'} className="text-[10px] font-bold py-0.5 px-1.5">{formatStatus(item.newValue)}</Tag>
                            </span>
                          );
                          dotIcon = isDone 
                            ? <CheckCircleOutlined className="text-xs text-emerald-500" />
                            : <SwapOutlined className="text-xs text-indigo-500" />;
                          color = isDone ? 'green' : 'blue';
                        }
                      } else if (item.field === 'priority') {
                        desc = (
                          <span className="flex items-center flex-wrap gap-1">
                            đã thay đổi độ ưu tiên từ
                            <Tag className="text-[10px] font-bold py-0.5 px-1.5">{formatPriority(item.oldValue)}</Tag>
                            <SwapOutlined className="text-[var(--text-tertiary)] text-[10px]" />
                            <Tag color="red" className="text-[10px] font-bold py-0.5 px-1.5">{formatPriority(item.newValue)}</Tag>
                          </span>
                        );
                        dotIcon = <AlertOutlined className="text-xs text-amber-500" />;
                        color = 'orange';
                      } else if (item.field === 'deadline') {
                        const hasOld = item.oldValue && item.oldValue !== 'None';
                        const hasNew = item.newValue && item.newValue !== 'None';
                        if (!hasNew) {
                          desc = <span>đã xóa hạn chót nhiệm vụ</span>;
                        } else {
                          desc = (
                            <span>
                              đã đặt hạn chót thành{' '}
                              <span className="font-semibold text-[var(--text)]">
                                {new Date(item.newValue).toLocaleDateString('vi-VN')}
                              </span>
                            </span>
                          );
                        }
                        dotIcon = <ClockCircleOutlined className="text-xs text-rose-500" />;
                        color = 'red';
                      } else if (item.field === 'assigneeId') {
                        const isUnassigned = item.newValue === 'None';
                        desc = (
                          <span>
                            {isUnassigned 
                              ? 'đã gỡ người thực hiện' 
                              : 'đã thay đổi người chịu trách nhiệm thực hiện'}
                          </span>
                        );
                        dotIcon = <UserOutlined className="text-xs text-purple-500" />;
                        color = 'purple';
                      } else if (item.field === 'title') {
                        desc = (
                          <span>
                            đã đổi tiêu đề nhiệm vụ thành{' '}
                            <span className="font-semibold text-[var(--text-h)]">"{item.newValue}"</span>
                          </span>
                        );
                        dotIcon = <EditOutlined className="text-xs text-slate-500" />;
                        color = 'gray';
                      } else if (item.field === 'description') {
                        desc = <span>đã cập nhật mô tả chi tiết nhiệm vụ</span>;
                        dotIcon = <EditOutlined className="text-xs text-slate-500" />;
                        color = 'gray';
                      } else {
                        desc = <span>đã cập nhật trường {item.field} thành "{item.newValue}"</span>;
                        dotIcon = <EditOutlined className="text-xs text-slate-500" />;
                        color = 'gray';
                      }

                      return {
                        color: color,
                        dot: dotIcon,
                        children: (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 -mt-1 pb-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Avatar size={20} src={item.user?.avatar} icon={<UserOutlined />} className="bg-[var(--accent)] text-[10px] shrink-0" />
                                <span className="font-bold text-[var(--text-h)]">{item.user?.name}</span>
                                <span className="text-[var(--text-secondary)]">{desc}</span>
                              </div>
                              <div className="pl-7">
                                <span className="text-[var(--text-tertiary)] font-medium">Trên task: </span>
                                <button
                                  onClick={() => {
                                    setSelectedTaskId(item.task.id);
                                    setIsDetailOpen(true);
                                  }}
                                  className="text-[var(--accent)] hover:underline font-bold text-left cursor-pointer transition-all"
                                >
                                  "{item.task.title}"
                                </button>
                              </div>
                            </div>
                            <div className="sm:text-right shrink-0 pl-7 sm:pl-0">
                              <span className="text-[10px] text-[var(--text-tertiary)] font-semibold bg-[var(--bg)] border border-[var(--border)] rounded px-1.5 py-0.5">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        )
                      };
                    })}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'charter',
            label: (
              <span className="flex items-center gap-2">
                <FileTextOutlined /> Quy tắc nhóm
              </span>
            ),
            children: (
              <Card
                title={<span className="font-bold text-sm text-[var(--text-h)]">📜 Quy tắc làm việc nhóm (Team Charter)</span>}
                className="shadow-sm border border-[var(--border)]"
                extra={!isProjectLeader && <Tag color="default" className="text-[10px]">Chỉ Leader mới có quyền chỉnh sửa</Tag>}
              >
                {isLoadingCharter ? (
                  <div className="flex justify-center p-8"><Spin /></div>
                ) : isProjectLeader ? (
                  /* === Leader Editable View === */
                  <Form
                    form={charterForm}
                    layout="vertical"
                    initialValues={{
                      workingTimeStart: charter?.workingTimeStart ? dayjs(charter.workingTimeStart, 'HH:mm') : null,
                      workingTimeEnd: charter?.workingTimeEnd ? dayjs(charter.workingTimeEnd, 'HH:mm') : null,
                      workingDays: charter?.workingDays ? charter.workingDays.split(',') : [],
                      workingLocation: charter?.workingLocation || '',
                      communicationRules: charter?.communicationRules || '',
                      rewardRules: charter?.rewardRules || '',
                      disciplineRules: charter?.disciplineRules || '',
                      rolesDescription: charter?.rolesDescription || '',
                    }}
                    onFinish={async (values) => {
                      await updateCharterApi({
                        workingTimeStart: values.workingTimeStart ? dayjs(values.workingTimeStart).format('HH:mm') : null,
                        workingTimeEnd: values.workingTimeEnd ? dayjs(values.workingTimeEnd).format('HH:mm') : null,
                        workingDays: values.workingDays?.length > 0 ? values.workingDays.join(',') : null,
                        workingLocation: values.workingLocation || null,
                        communicationRules: values.communicationRules || null,
                        rewardRules: values.rewardRules || null,
                        disciplineRules: values.disciplineRules || null,
                        rolesDescription: values.rolesDescription || null,
                      });
                    }}
                    className="max-w-2xl"
                    key={charter?.updatedAt}
                  >
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">⏰ Thời gian & Địa điểm</h4>
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label="Giờ bắt đầu" name="workingTimeStart">
                            <TimePicker format="HH:mm" className="w-full" placeholder="Chọn giờ bắt đầu" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Giờ kết thúc"
                            name="workingTimeEnd"
                            dependencies={['workingTimeStart']}
                            rules={[
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  const start = getFieldValue('workingTimeStart');
                                  if (!value || !start) {
                                    return Promise.resolve();
                                  }
                                  const startStr = start.format('HH:mm');
                                  const endStr = value.format('HH:mm');
                                  if (endStr > startStr) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu!'));
                                },
                              }),
                            ]}
                          >
                            <TimePicker format="HH:mm" className="w-full" placeholder="Chọn giờ kết thúc" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item label="Ngày làm việc" name="workingDays">
                        <Checkbox.Group
                          options={[
                            { label: 'Thứ 2', value: 'Mon' },
                            { label: 'Thứ 3', value: 'Tue' },
                            { label: 'Thứ 4', value: 'Wed' },
                            { label: 'Thứ 5', value: 'Thu' },
                            { label: 'Thứ 6', value: 'Fri' },
                            { label: 'Thứ 7', value: 'Sat' },
                            { label: 'Chủ nhật', value: 'Sun' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item label="Địa điểm làm việc" name="workingLocation">
                        <Input placeholder="VD: Phòng họp A3, Tầng 2 hoặc Online qua Google Meet" maxLength={500} />
                      </Form.Item>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">💬 Quy luật trao đổi thông tin (Nói và Nghe)</h4>
                      <Form.Item name="communicationRules">
                        <Input.TextArea
                          rows={4}
                          placeholder="VD: Giới hạn phát biểu 3 phút/lượt. Ý kiến mang tính xây dựng, hòa nhã. Đặt lợi ích tập thể lên trên."
                          maxLength={2000}
                          showCount
                        />
                      </Form.Item>
                    </div>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">🏆 Quy định Khen thưởng</h4>
                          <Form.Item name="rewardRules">
                            <Input.TextArea rows={4} placeholder="VD: Hoàn thành sớm được cộng điểm thưởng..." maxLength={2000} showCount />
                          </Form.Item>
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">⚠️ Quy định Kỷ luật</h4>
                          <Form.Item name="disciplineRules">
                            <Input.TextArea rows={4} placeholder="VD: Trễ deadline trừ điểm đánh giá cá nhân..." maxLength={2000} showCount />
                          </Form.Item>
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">👥 Chức năng & Quyền hạn</h4>
                      <Form.Item name="rolesDescription">
                        <Input.TextArea
                          rows={4}
                          placeholder="VD: Trưởng nhóm - phân công và giám sát tiến độ. Thành viên - thực hiện và báo cáo kết quả."
                          maxLength={2000}
                          showCount
                        />
                      </Form.Item>
                    </div>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={isUpdatingCharter} className="font-semibold">
                        Lưu quy tắc nhóm
                      </Button>
                    </Form.Item>
                  </Form>
                ) : (
                  /* === Member Read-Only View === */
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">⏰ Thời gian & Địa điểm</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-3 rounded-lg">
                          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block">Giờ làm việc</span>
                          <span className="text-sm font-semibold text-[var(--text)] mt-1 block">
                            {charter?.workingTimeStart && charter?.workingTimeEnd
                              ? `${charter.workingTimeStart} - ${charter.workingTimeEnd}`
                              : 'Chưa thiết lập'}
                          </span>
                        </div>
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-3 rounded-lg">
                          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block">Địa điểm</span>
                          <span className="text-sm font-semibold text-[var(--text)] mt-1 block">
                            {charter?.workingLocation || 'Chưa thiết lập'}
                          </span>
                        </div>
                      </div>
                      {charter?.workingDays && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {charter.workingDays.split(',').map((day) => {
                            const dayMap: Record<string, string> = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };
                            return <Tag key={day} color="blue" className="text-[10px] font-bold">{dayMap[day] || day}</Tag>;
                          })}
                        </div>
                      )}
                    </div>

                    {charter?.communicationRules && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">💬 Quy luật trao đổi thông tin</h4>
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-4 rounded-lg text-sm text-[var(--text)] whitespace-pre-wrap">
                          {charter.communicationRules}
                        </div>
                      </div>
                    )}

                    <Row gutter={16}>
                      {charter?.rewardRules && (
                        <Col xs={24} md={12}>
                          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">🏆 Khen thưởng</h4>
                          <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-4 rounded-lg text-sm text-[var(--text)] whitespace-pre-wrap">
                            {charter.rewardRules}
                          </div>
                        </Col>
                      )}
                      {charter?.disciplineRules && (
                        <Col xs={24} md={12}>
                          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">⚠️ Kỷ luật</h4>
                          <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-4 rounded-lg text-sm text-[var(--text)] whitespace-pre-wrap">
                            {charter.disciplineRules}
                          </div>
                        </Col>
                      )}
                    </Row>

                    {charter?.rolesDescription && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">👥 Chức năng & Quyền hạn</h4>
                        <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-4 rounded-lg text-sm text-[var(--text)] whitespace-pre-wrap">
                          {charter.rolesDescription}
                        </div>
                      </div>
                    )}

                    {!charter?.communicationRules && !charter?.rewardRules && !charter?.disciplineRules && !charter?.rolesDescription && !charter?.workingLocation && (
                      <Empty description="Leader chưa thiết lập quy tắc nhóm cho dự án này." />
                    )}
                  </div>
                )}
              </Card>
            ),
          },
          isProjectLeader ? {
            key: 'settings',
            label: (
              <span className="flex items-center gap-2">
                <SettingOutlined /> Cấu hình dự án
              </span>
            ),
            children: (
              <div className="space-y-6">
                <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Cấu hình thông tin dự án</span>} className="shadow-sm border border-[var(--border)]">
                  <Form
                    form={settingsForm}
                    layout="vertical"
                    onFinish={handleUpdateProjectSettings}
                    className="max-w-xl"
                  >
                    <Form.Item
                      label="Tên dự án"
                      name="name"
                      rules={[{ required: true, message: 'Vui lòng nhập tên dự án!' }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item label="Mô tả dự án" name="description">
                      <Input.TextArea rows={4} />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status">
                      <Select
                        options={[
                          { value: 'ACTIVE', label: 'Đang hoạt động' },
                          { value: 'ARCHIVED', label: 'Đã lưu trữ (Lưu trữ sẽ ẩn dự án)' },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="font-semibold">
                        Lưu thay đổi
                      </Button>
                    </Form.Item>
                  </Form>

                  {isOwner && (
                    <>
                      <div className="border-t border-[var(--border)] mt-8 pt-6">
                        <h4 className="text-red-500 dark:text-red-400 font-extrabold text-sm mb-2 flex items-center gap-1.5">
                          <ExclamationCircleOutlined /> Danger Zone (Vùng nguy hiểm)
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mb-4">
                          Khi xóa dự án, toàn bộ dữ liệu công việc, bình luận và lịch sử liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </p>

                        <Popconfirm
                          title="Xóa vĩnh viễn dự án?"
                          description="Bạn có chắc chắn muốn xóa toàn bộ dự án này cùng tất cả dữ liệu liên quan?"
                          onConfirm={handleDeleteProject}
                          okText="Xóa vĩnh viễn"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true, size: 'large' }}
                        >
                          <Button type="primary" danger className="font-semibold">
                            Xóa dự án này
                          </Button>
                        </Popconfirm>
                      </div>
                    </>
                  )}
                </Card>

                <Card title={<span className="font-bold text-sm text-[var(--text-h)]">Quản lý nhãn công việc (Custom Labels)</span>} className="shadow-sm border border-[var(--border)]">
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                      CÁC NHÃN HIỆN CÓ
                    </h4>
                    {labels.length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)] mb-4">Dự án này chưa cấu hình nhãn công việc nào.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {labels.map((lbl) => (
                          <Tag
                            key={lbl.id}
                            color={lbl.color}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              handleDeleteLabel(lbl.id);
                            }}
                            style={{ border: 'none', padding: '4px 8px', fontSize: '12px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', fontWeight: 500 }}
                          >
                            {lbl.name}
                          </Tag>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-[var(--border)] pt-4 mt-4 max-w-md">
                      <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                        TẠO NHÃN MỚI
                      </h4>
                      <Space direction="vertical" className="w-full" size={12}>
                        <div>
                          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Tên nhãn</label>
                          <Input
                            placeholder="Nhập tên nhãn (ví dụ: Bug, Feature...)"
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            maxLength={30}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Màu sắc đại diện</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {PRESET_COLORS.map((c) => (
                              <Tooltip key={c.hex} title={c.name}>
                                <button
                                  type="button"
                                  className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all ${
                                    labelColor === c.hex 
                                      ? 'border-slate-800 dark:border-white scale-110 shadow-md' 
                                      : 'border-transparent hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  onClick={() => setLabelColor(c.hex)}
                                />
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreateLabel}
                          loading={isCreatingLabel}
                          disabled={!labelName.trim()}
                          className="mt-2"
                        >
                          Tạo nhãn mới
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Card>
              </div>
            ),
          } : null,
        ].filter(Boolean) as any}
      />

      {selectedTaskId && isDetailOpen && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={id}
          open={isDetailOpen}
          isProjectLeader={isProjectLeader}
          onCancel={() => {
            setIsDetailOpen(false);
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
};
export default ProjectDetail;

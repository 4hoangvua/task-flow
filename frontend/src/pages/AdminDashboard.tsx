/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Input, Select, Table, Space, Spin, Switch, Avatar, Tag, Button, Pagination, Empty } from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useAdminUsers, useAdminStats, useUpdateUserRole, useUpdateUserStatus } from '../hooks/useAdmin';
import { formatDate } from '../utils/helpers';
import type { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // Table & Filters state
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // API Query Hooks
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useAdminStats();
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useAdminUsers({
    search: searchText,
    role: roleFilter,
    status: statusFilter,
    page,
    limit: 10,
  });

  // API Mutation Hooks
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const getRoleTagColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'LEADER': return 'gold';
      case 'MEMBER': return 'blue';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ADMIN';
      case 'LEADER': return 'LEADER';
      case 'MEMBER': return 'MEMBER';
      default: return role;
    }
  };

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: any, record: User) => (
        <Space size={12}>
          <Avatar
            src={record.avatar || undefined}
            icon={<UserOutlined />}
            className="bg-indigo-600 border border-[var(--border)]"
          />
          <div className="flex flex-col">
            <span className="font-bold text-[var(--text-h)] text-sm">
              {record.name} {record.id === currentUser?.id && <Tag color="cyan" className="ml-1 text-[9px]">Bạn</Tag>}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">{record.email}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Quyền hệ thống',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          value={role}
          disabled={record.id === currentUser?.id || updateRoleMutation.isPending}
          onChange={(newRole) => updateRoleMutation.mutate({ id: record.id, role: newRole })}
          className="w-32"
          options={[
            { value: 'ADMIN', label: 'Quản trị viên' },
            { value: 'LEADER', label: 'Trưởng nhóm' },
            { value: 'MEMBER', label: 'Thành viên' },
          ]}
        />
      ),
    },
    {
      title: 'Trạng thái tài khoản',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: User) => (
        <Space size={8}>
          <Switch
            checked={isActive}
            disabled={record.id === currentUser?.id || updateStatusMutation.isPending}
            onChange={(checked) => updateStatusMutation.mutate({ id: record.id, isActive: checked })}
          />
          <span className={`text-xs font-semibold ${isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isActive ? 'Đang hoạt động' : 'Đã khóa'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span className="text-sm text-[var(--text-secondary)]">{formatDate(date)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-h)] flex items-center gap-2">
            <SafetyCertificateOutlined className="text-indigo-500" /> Hệ thống Quản trị
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Xem số liệu hoạt động và quản lý tài khoản người dùng của hệ thống TaskFlow
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} className="font-semibold">
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Bento Grid KPI Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-[var(--border)] relative overflow-hidden notebook-card h-full" styles={{ body: { padding: 20 } }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block mb-1">
                  Tổng người dùng
                </span>
                <span className="text-3xl font-extrabold text-[var(--text-h)]">
                  {isLoadingStats ? <Spin size="small" /> : stats?.totalUsers.toLocaleString()}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <UserOutlined className="text-lg" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-[var(--border)] relative overflow-hidden notebook-card h-full" styles={{ body: { padding: 20 } }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block mb-1">
                  Trưởng nhóm (Leader)
                </span>
                <span className="text-3xl font-extrabold text-[var(--text-h)]">
                  {isLoadingStats ? <Spin size="small" /> : stats?.activeLeaders.toLocaleString()}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <SafetyCertificateOutlined className="text-lg" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-[var(--border)] relative overflow-hidden notebook-card h-full" styles={{ body: { padding: 20 } }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block mb-1">
                  Tổng số dự án
                </span>
                <span className="text-3xl font-extrabold text-[var(--text-h)]">
                  {isLoadingStats ? <Spin size="small" /> : stats?.totalProjects.toLocaleString()}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <ProjectOutlined className="text-lg" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-[var(--border)] relative overflow-hidden notebook-card h-full" styles={{ body: { padding: 20 } }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block mb-1">
                  Trạng thái hệ thống
                </span>
                <span className="text-lg font-extrabold text-[var(--text-h)] flex items-center gap-1.5 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  HOẠT ĐỘNG TỐT
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <CheckSquareOutlined className="text-lg" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* User Accounts Management Section */}
      <Card className="shadow-sm border border-[var(--border)] notebook-card">
        <h3 className="font-bold text-sm text-[var(--text-h)] uppercase tracking-wider mb-4">
          Danh sách người dùng hệ thống
        </h3>
        
        {/* Table Controls / Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input
            placeholder="Tìm theo tên hoặc email..."
            prefix={<SearchOutlined className="text-[var(--text-tertiary)]" />}
            value={searchText}
            onChange={handleSearchChange}
            className="w-full sm:max-w-xs"
          />
          <Select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="w-full sm:w-44"
            options={[
              { value: 'ALL', label: 'Tất cả vai trò' },
              { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
              { value: 'LEADER', label: 'Trưởng nhóm (LEADER)' },
              { value: 'MEMBER', label: 'Thành viên (MEMBER)' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full sm:w-44"
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'BANNED', label: 'Đã khóa' },
            ]}
          />
        </div>

        {/* Data List / Table */}
        {isLoadingUsers ? (
          <div className="flex justify-center p-12"><Spin size="large" /></div>
        ) : isMobile ? (
          <div>
            {(usersData?.data || []).length === 0 ? (
              <Empty description="Không tìm thấy người dùng" />
            ) : (
              <>
                <div className="space-y-4">
                  {(usersData?.data || []).map((record: User) => (
                    <div key={record.id} className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg space-y-3.5 shadow-xs">
                      <div className="flex items-center gap-3">
                        <Avatar src={record.avatar || undefined} icon={<UserOutlined />} className="bg-indigo-600 border border-[var(--border)] shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[var(--text-h)] text-sm truncate">
                            {record.name} {record.id === currentUser?.id && <Tag color="cyan" className="ml-1 text-[9px] inline-block">Bạn</Tag>}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] truncate">{record.email}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-[var(--border)]/60 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">Quyền hệ thống</span>
                          <Select
                            value={record.role}
                            disabled={record.id === currentUser?.id || updateRoleMutation.isPending}
                            onChange={(newRole) => updateRoleMutation.mutate({ id: record.id, role: newRole })}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'ADMIN', label: 'Quản trị viên' },
                              { value: 'LEADER', label: 'Trưởng nhóm' },
                              { value: 'MEMBER', label: 'Thành viên' },
                            ]}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">Trạng thái</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Switch
                              checked={record.isActive}
                              size="small"
                              disabled={record.id === currentUser?.id || updateStatusMutation.isPending}
                              onChange={(checked) => updateStatusMutation.mutate({ id: record.id, isActive: checked })}
                            />
                            <span className={`text-[11px] font-semibold ${record.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {record.isActive ? 'Hoạt động' : 'Khóa'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 text-[10px] text-[var(--text-tertiary)] flex justify-between">
                        <span>Ngày tham gia:</span>
                        <span className="font-medium text-[var(--text-secondary)]">{formatDate(record.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={page}
                    pageSize={10}
                    total={usersData?.meta?.total || 0}
                    onChange={(p) => setPage(p)}
                    simple
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <Table
            dataSource={usersData?.data || []}
            columns={columns}
            rowKey="id"
            loading={isLoadingUsers}
            pagination={{
              current: page,
              pageSize: 10,
              total: usersData?.meta?.total || 0,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;

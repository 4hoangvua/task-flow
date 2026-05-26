import React, { useState } from 'react';
import { Card, Col, Row, Statistic, Select, Avatar, Space, Empty, Spin, Tabs } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/statsApi';
import { formatDate } from '../utils/helpers';

const STATUS_COLORS = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#10b981',
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Personal statistics (For MEMBER or general overview)
  const mySummaryQuery = useQuery({
    queryKey: ['mySummary'],
    queryFn: statsApi.getMySummary,
  });

  // Projects list
  const { projects, isLoading: isLoadingProjects } = useProjects({ limit: 100 });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // If projects load, default to first project
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Project statistics query
  const projectStatsQuery = useQuery({
    queryKey: ['projectStats', selectedProjectId],
    queryFn: () => statsApi.getProjectStats(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const stats = projectStatsQuery.data;
  const isLoadingStats = projectStatsQuery.isLoading;

  // Prepare Bar chart data (Tasks per Project)
  const barChartData = projects.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
    'Số lượng task': p._count?.tasks || 0,
  }));

  // Prepare Pie chart data (Status distribution)
  const pieChartData = stats
    ? Object.keys(stats.byStatus).map((key) => ({
        name: key === 'TODO' ? 'Cần làm' : key === 'IN_PROGRESS' ? 'Đang chạy' : key === 'REVIEW' ? 'Đánh giá' : 'Đã xong',
        value: stats.byStatus[key as keyof typeof stats.byStatus],
        statusKey: key,
      }))
    : [];

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="notebook-card p-3 rounded-lg shadow-xl border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-h)] mb-1">{label || payload[0].name}</p>
          <p className="text-xs text-[var(--accent)] font-bold">
            Số lượng: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const personalSummary = mySummaryQuery.data;

  const personalTabContent = mySummaryQuery.isLoading ? (
    <div className="flex justify-center items-center p-12 min-h-[200px]"><Spin size="large" /></div>
  ) : (
    <Row gutter={[20, 20]} className="mt-4">
      <Col xs={24} sm={8}>
        <Card 
          variant="borderless" 
          className="premium-card bg-[var(--bg-card)] border border-[var(--border)] shadow-sm"
        >
          <Statistic
            title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Nhiệm vụ được giao</span>}
            value={personalSummary?.assigned || 0}
            styles={{ content: { fontSize: '28px', fontWeight: 800, color: 'var(--text-h)' } }}
            prefix={
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] mr-3 border border-[var(--accent-border)]">
                <FileTextOutlined className="text-lg" />
              </div>
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card 
          variant="borderless" 
          className="premium-card bg-[var(--bg-card)] border border-[var(--border)] shadow-sm"
        >
          <Statistic
            title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Đã hoàn thành</span>}
            value={personalSummary?.completed || 0}
            styles={{ content: { fontSize: '28px', fontWeight: 800, color: '#10b981' } }}
            prefix={
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3 border border-emerald-100/30 dark:border-emerald-900/30">
                <CheckCircleOutlined className="text-lg" />
              </div>
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card 
          variant="borderless" 
          className="premium-card bg-[var(--bg-card)] border border-[var(--border)] shadow-sm"
        >
          <Statistic
            title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Quá hạn</span>}
            value={personalSummary?.overdue || 0}
            styles={{ content: { 
              fontSize: '28px', 
              fontWeight: 800, 
              color: personalSummary?.overdue && personalSummary.overdue > 0 ? '#ef4444' : 'var(--text-h)' 
            } }}
            prefix={
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 border transition-colors ${
                personalSummary?.overdue && personalSummary.overdue > 0
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/30 dark:border-rose-900/30'
                  : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-tertiary)]'
              }`}>
                <ClockCircleOutlined className="text-lg" />
              </div>
            }
          />
        </Card>
      </Col>
    </Row>
  );

  const projectTabContent = isLoadingProjects ? (
    <div className="flex justify-center items-center p-12 min-h-[300px]"><Spin size="large" /></div>
  ) : projects.length === 0 ? (
    <Card className="shadow-sm rounded-lg border border-[var(--border)] notebook-card mt-4">
      <Empty description="Bạn chưa tham gia dự án nào. Hãy tạo dự án hoặc nhờ trưởng nhóm thêm vào dự án để xem thống kê!" />
    </Card>
  ) : (
    <div className="space-y-6 mt-4">
      {/* Project Selector Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-h)]">Tiến độ dự án</h2>
          <p className="text-[var(--text-secondary)] mt-1 text-xs">Thống kê chi tiết cho từng dự án của bạn.</p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1.5 px-3 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-semibold shrink-0">Xem dự án:</span>
          <Select
            value={selectedProjectId}
            onChange={(val) => setSelectedProjectId(val)}
            className="w-48 border-none"
            variant="borderless"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
      </div>

      {selectedProjectId && isLoadingStats ? (
        <div className="flex justify-center items-center p-12 min-h-[200px]"><Spin size="large" /></div>
      ) : (
        <Space orientation="vertical" size={20} className="w-full">
          {/* KPI Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card 
                variant="borderless" 
                className="notebook-card border border-[var(--border)] shadow-sm"
              >
                <Statistic
                  title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Tổng số task</span>}
                  value={stats?.total || 0}
                  styles={{ content: { fontSize: '24px', fontWeight: 850, color: 'var(--text-h)' } }}
                  prefix={
                    <div className="w-9 h-9 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] mr-2.5 border border-[var(--accent-border)]">
                      <FileTextOutlined className="text-sm" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card 
                variant="borderless" 
                className="notebook-card border border-[var(--border)] shadow-sm"
              >
                <Statistic
                  title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Đang thực hiện</span>}
                  value={(stats?.byStatus.IN_PROGRESS || 0) + (stats?.byStatus.REVIEW || 0)}
                  styles={{ content: { fontSize: '24px', fontWeight: 850, color: '#f59e0b' } }}
                  prefix={
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-2.5 border border-amber-100/30 dark:border-amber-900/30">
                      <ClockCircleOutlined className="text-sm" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card 
                variant="borderless" 
                className="notebook-card border border-[var(--border)] shadow-sm"
              >
                <Statistic
                  title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Đã hoàn thành</span>}
                  value={stats?.byStatus.DONE || 0}
                  styles={{ content: { fontSize: '24px', fontWeight: 850, color: '#10b981' } }}
                  prefix={
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-2.5 border border-emerald-100/30 dark:border-emerald-900/30">
                      <CheckCircleOutlined className="text-sm" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card 
                variant="borderless" 
                className="notebook-card border border-[var(--border)] shadow-sm"
              >
                <Statistic
                  title={<span className="text-[var(--text-secondary)] font-semibold tracking-wide text-xs uppercase">Task quá hạn</span>}
                  value={stats?.overdue || 0}
                  styles={{ content: { 
                    fontSize: '24px', 
                    fontWeight: 850, 
                    color: stats?.overdue && stats.overdue > 0 ? '#ef4444' : 'var(--text-h)' 
                  } }}
                  prefix={
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-2.5 border ${
                      stats?.overdue && stats.overdue > 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/30 dark:border-rose-900/30'
                        : 'bg-[var(--bg)] text-[var(--text-tertiary)] border border-[var(--border)]'
                    }`}>
                      <CalendarOutlined className="text-sm" />
                    </div>
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card 
                title={<span className="font-bold text-sm text-[var(--text-h)]">Số lượng task giữa các dự án</span>} 
                className="shadow-sm border border-[var(--border)] h-[360px] notebook-card"
              >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'var(--accent-bg)' }} />
                      <Bar dataKey="Số lượng task" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card 
                title={<span className="font-bold text-sm text-[var(--text-h)]">Trạng thái công việc hiện tại</span>} 
                className="shadow-sm border border-[var(--border)] h-[360px] notebook-card"
              >
                <div className="h-64 w-full flex flex-col justify-center items-center">
                  {pieChartData.every((d) => d.value === 0) ? (
                    <Empty description="Dự án chưa có task nào" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          innerRadius={60}
                          outerRadius={82}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey as keyof typeof STATUS_COLORS]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity */}
          <Card 
            title={<span className="font-bold text-sm text-[var(--text-h)]">Lịch sử hoạt động gần đây</span>} 
            className="shadow-sm border border-[var(--border)] notebook-card"
          >
            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">Không có hoạt động gần đây</div>
            ) : (
              <div className="space-y-1">
                {stats.recentActivity.map((item) => {
                  let activityDesc = '';
                  if (item.field === 'status') {
                    activityDesc = `đã chuyển trạng thái từ "${item.oldValue || 'Bắt đầu'}" sang "${item.newValue}"`;
                  } else {
                    activityDesc = `đã cập nhật trường "${item.field}" thành "${item.newValue}"`;
                  }

                  return (
                    <div key={item.id} className="border-b border-[var(--border)] last:border-0 py-3.5 px-1 hover:bg-[var(--bg)]/40 transition-all rounded-lg flex items-start gap-3">
                      <Avatar src={item.user.avatar} className="border border-[var(--border)] shadow-xs shrink-0" icon={<UserOutlined />}>
                        {item.user.name[0]}
                      </Avatar>
                      <div className="flex-grow min-w-0">
                        <div className="text-xs font-semibold text-[var(--text)] leading-relaxed">
                          <span className="font-bold text-[var(--text-h)]">{item.user.name} </span>
                          <span className="font-medium text-[var(--text-secondary)]">
                            {activityDesc} trên task{' '}
                          </span>
                          <span className="font-semibold text-[var(--accent)]">
                            "{item.task.title}"
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-medium mt-1">{formatDate(item.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Space>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-h)]">
          Chào mừng, {user?.name}!
        </h1>
        <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
          Tổng quan tiến độ và hiệu năng các công việc của bạn.
        </p>
      </div>

      {/* Tabs Layout */}
      <Tabs
        defaultActiveKey="personal"
        className="custom-tabs"
        items={[
          {
            key: 'personal',
            label: (
              <span className="flex items-center gap-2">
                <UserOutlined /> Cá nhân
              </span>
            ),
            children: personalTabContent,
          },
          {
            key: 'project',
            label: (
              <span className="flex items-center gap-2">
                <ProjectOutlined /> Dự án
              </span>
            ),
            children: projectTabContent,
          },
        ]}
      />
    </div>
  );
};

export default Dashboard;

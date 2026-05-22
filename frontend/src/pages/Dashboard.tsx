import React, { useState } from 'react';
import { Card, Col, Row, Statistic, Select, List, Avatar, Space, Empty, Spin } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
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
  const isMember = user?.role === 'MEMBER';

  // Personal statistics (For MEMBER or general overview)
  const mySummaryQuery = useQuery({
    queryKey: ['mySummary'],
    queryFn: statsApi.getMySummary,
  });

  // Projects list for LEADER
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

  if (isMember) {
    const summary = mySummaryQuery.data;
    const isLoading = mySummaryQuery.isLoading;

    return (
      <div className="space-y-8 pt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Chào mừng, {user?.name}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Dưới đây là tóm tắt tiến độ công việc và nhiệm vụ được giao của bạn.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12 min-h-[200px]"><Spin size="large" /></div>
        ) : (
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="premium-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Nhiệm vụ được giao</span>}
                  value={summary?.assigned || 0}
                  valueStyle={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-h)' }}
                  prefix={
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 border border-indigo-100/30 dark:border-indigo-900/30">
                      <FileTextOutlined className="text-lg" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="premium-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Đã hoàn thành</span>}
                  value={summary?.completed || 0}
                  valueStyle={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}
                  prefix={
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3 border border-emerald-100/30 dark:border-emerald-900/30">
                      <CheckCircleOutlined className="text-lg" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="premium-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Quá hạn</span>}
                  value={summary?.overdue || 0}
                  valueStyle={{ 
                    fontSize: '28px', 
                    fontWeight: 800, 
                    color: summary?.overdue && summary.overdue > 0 ? '#ef4444' : 'var(--text-h)' 
                  }}
                  prefix={
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 border transition-colors ${
                      summary?.overdue && summary.overdue > 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/30 dark:border-rose-900/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200/30 dark:border-slate-700/30'
                    }`}>
                      <ClockCircleOutlined className="text-lg" />
                    </div>
                  }
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  }

  // Leader / Admin Dashboard
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
        <div className="notebook-card p-3 rounded-xl shadow-xl border border-slate-200/30 dark:border-slate-800/30">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">{label || payload[0].name}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
            Số lượng: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Bảng Quản Trị</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Tổng quan tiến độ và hiệu năng toàn bộ dự án.</p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1.5 px-3 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">Xem dự án:</span>
            <Select
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
              className="w-48 border-none"
              variant="borderless"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        )}
      </div>

      {isLoadingProjects || (selectedProjectId && isLoadingStats) ? (
        <div className="flex justify-center items-center p-12 min-h-[300px]"><Spin size="large" /></div>
      ) : projects.length === 0 ? (
        <Card className="shadow-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 notebook-card">
          <Empty description="Bạn chưa có dự án nào. Chuyển sang tab Dự án để tạo mới!" />
        </Card>
      ) : (
        <Space direction="vertical" size={20} className="w-full">
          {/* KPI Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card 
                bordered={false} 
                className="notebook-card border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Tổng số task</span>}
                  value={stats?.total || 0}
                  valueStyle={{ fontSize: '24px', fontWeight: 850, color: 'var(--text-h)' }}
                  prefix={
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-2.5 border border-indigo-100/30 dark:border-indigo-900/30">
                      <FileTextOutlined className="text-sm" />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card 
                bordered={false} 
                className="notebook-card border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Đang thực hiện</span>}
                  value={(stats?.byStatus.IN_PROGRESS || 0) + (stats?.byStatus.REVIEW || 0)}
                  valueStyle={{ fontSize: '24px', fontWeight: 850, color: '#f59e0b' }}
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
                bordered={false} 
                className="notebook-card border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Đã hoàn thành</span>}
                  value={stats?.byStatus.DONE || 0}
                  valueStyle={{ fontSize: '24px', fontWeight: 850, color: '#10b981' }}
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
                bordered={false} 
                className="notebook-card border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
              >
                <Statistic
                  title={<span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wide text-xs uppercase">Task quá hạn</span>}
                  value={stats?.overdue || 0}
                  valueStyle={{ 
                    fontSize: '24px', 
                    fontWeight: 850, 
                    color: stats?.overdue && stats.overdue > 0 ? '#ef4444' : 'var(--text-h)' 
                  }}
                  prefix={
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-2.5 border ${
                      stats?.overdue && stats.overdue > 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/30 dark:border-rose-900/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200/30 dark:border-slate-700/30'
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
                title={<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Số lượng task giữa các dự án</span>} 
                className="shadow-sm border border-slate-200/50 dark:border-slate-800/50 h-[360px] notebook-card"
              >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                      <Bar dataKey="Số lượng task" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card 
                title={<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Trạng thái công việc hiện tại</span>} 
                className="shadow-sm border border-slate-200/50 dark:border-slate-800/50 h-[360px] notebook-card"
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
            title={<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Lịch sử hoạt động gần đây</span>} 
            className="shadow-sm border border-slate-200/50 dark:border-slate-800/50 notebook-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={stats?.recentActivity || []}
              locale={{ emptyText: 'Không có hoạt động gần đây' }}
              renderItem={(item) => {
                let activityDesc = '';
                if (item.field === 'status') {
                  activityDesc = `đã chuyển trạng thái từ "${item.oldValue || 'Bắt đầu'}" sang "${item.newValue}"`;
                } else {
                  activityDesc = `đã cập nhật trường "${item.field}" thành "${item.newValue}"`;
                }

                return (
                  <List.Item className="border-b border-slate-100 dark:border-slate-800 last:border-0 py-3.5 px-1 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all rounded-lg">
                    <List.Item.Meta
                      avatar={
                        <Avatar src={item.user.avatar} className="border border-slate-100 dark:border-slate-800 shadow-xs" icon={<UserOutlined />}>
                          {item.user.name[0]}
                        </Avatar>
                      }
                      title={
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.user.name} </span>
                          <span className="font-medium text-slate-500">
                            {activityDesc} trên task{' '}
                          </span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            "{item.task.title}"
                          </span>
                        </div>
                      }
                      description={<span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatDate(item.createdAt)}</span>}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Space>
      )}
    </div>
  );
};
export default Dashboard;

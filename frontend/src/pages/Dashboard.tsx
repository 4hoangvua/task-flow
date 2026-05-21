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
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chào mừng, {user?.name}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Dưới đây là tóm tắt tiến độ công việc của bạn.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={<span className="text-slate-400 font-medium">Nhiệm vụ được giao</span>}
                  value={summary?.assigned || 0}
                  prefix={<FileTextOutlined className="text-indigo-500 mr-2" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={<span className="text-slate-400 font-medium">Đã hoàn thành</span>}
                  value={summary?.completed || 0}
                  prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={<span className="text-slate-400 font-medium">Quá hạn</span>}
                  value={summary?.overdue || 0}
                  valueStyle={{ color: summary?.overdue && summary.overdue > 0 ? '#ef4444' : undefined }}
                  prefix={<ClockCircleOutlined className="text-red-500 mr-2" />}
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
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    'Số lượng task': p._count?.tasks || 0,
  }));

  // Prepare Pie chart data (Status distribution)
  const pieChartData = stats
    ? Object.keys(stats.byStatus).map((key) => ({
        name: key,
        value: stats.byStatus[key as keyof typeof stats.byStatus],
      }))
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bảng Quản Trị</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tổng quan tiến độ và hiệu năng toàn bộ dự án.</p>
        </div>

        {projects.length > 0 && (
          <Space>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Chọn dự án xem chi tiết:</span>
            <Select
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
              className="w-56"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Space>
        )}
      </div>

      {isLoadingProjects || (selectedProjectId && isLoadingStats) ? (
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      ) : projects.length === 0 ? (
        <Card className="shadow-sm">
          <Empty description="Bạn chưa có dự án nào. Chuyển sang tab Dự án để tạo mới!" />
        </Card>
      ) : (
        <Space direction="vertical" size={20} className="w-full">
          {/* KPI Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic
                  title={<span className="text-slate-400 font-medium font-sans">Tổng số task</span>}
                  value={stats?.total || 0}
                  prefix={<FileTextOutlined className="text-indigo-500 mr-2" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic
                  title={<span className="text-slate-400 font-medium font-sans">Đang thực hiện</span>}
                  value={(stats?.byStatus.IN_PROGRESS || 0) + (stats?.byStatus.REVIEW || 0)}
                  prefix={<ClockCircleOutlined className="text-amber-500 mr-2" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic
                  title={<span className="text-slate-400 font-medium font-sans">Đã hoàn thành</span>}
                  value={stats?.byStatus.DONE || 0}
                  prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic
                  title={<span className="text-slate-400 font-medium font-sans">Task quá hạn</span>}
                  value={stats?.overdue || 0}
                  valueStyle={{ color: stats?.overdue && stats.overdue > 0 ? '#ef4444' : undefined }}
                  prefix={<CalendarOutlined className="text-red-500 mr-2" />}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="So sánh số lượng task giữa các dự án" className="shadow-sm h-96">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Số lượng task" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Trạng thái công việc dự án hiện tại" className="shadow-sm h-96">
                <div className="h-72 w-full flex flex-col justify-center items-center">
                  {pieChartData.every((d) => d.value === 0) ? (
                    <Empty description="Dự án chưa có task nào" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity */}
          <Card title="Lịch sử hoạt động gần đây" className="shadow-sm">
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
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar src={item.user.avatar} icon={<UserOutlined />}>
                          {item.user.name[0]}
                        </Avatar>
                      }
                      title={
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <span>{item.user.name} </span>
                          <span className="font-normal text-slate-500">
                            {activityDesc} trên task{' '}
                          </span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            "{item.task.title}"
                          </span>
                        </div>
                      }
                      description={<span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>}
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

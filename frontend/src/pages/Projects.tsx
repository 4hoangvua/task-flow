import React, { useState } from 'react';
import { Card, Col, Row, Button, Input, Select, Table, Modal, Form, Space, Tag, Empty, Avatar, Spin } from 'antd';
import {
  ProjectOutlined,
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { formatDate } from '../utils/helpers';
import type { Project } from '../types';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLeaderOrAdmin = user?.role === 'LEADER' || user?.role === 'ADMIN';

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // API Hooks
  const { projects, isLoading, createProject, isCreating } = useProjects();

  const handleCreateProject = async (values: { name: string; description?: string }) => {
    try {
      await createProject(values);
      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      // Error handled by hook
    }
  };

  // Filter projects locally
  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <Space direction="vertical" size={2}>
          <a onClick={() => navigate(`/projects/${record.id}`)} className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">
            {text}
          </a>
          <span className="text-xs text-slate-400 line-clamp-1">{record.description || 'Không có mô tả'}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
        </Tag>
      ),
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: ['owner', 'name'],
      key: 'ownerName',
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Thành viên',
      key: 'membersCount',
      render: (_: any, record: Project) => record._count?.members || 0,
    },
    {
      title: 'Số công việc',
      key: 'tasksCount',
      render: (_: any, record: Project) => record._count?.tasks || 0,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Project) => (
        <Button
          type="primary"
          ghost
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ProjectOutlined className="text-indigo-600" /> Danh sách dự án
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý và xem tiến độ các dự án trong hệ thống.</p>
        </div>

        {isLeaderOrAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsModalVisible(true)}
          >
            Tạo dự án mới
          </Button>
        )}
      </div>

      {/* Filter and View toggles */}
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <Input
              placeholder="Tìm kiếm dự án..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              className="w-full sm:w-48"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'ARCHIVED', label: 'Đã lưu trữ' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 border-t md:border-none pt-3 md:pt-0">
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>
      </Card>

      {/* Projects List/Grid container */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      ) : filteredProjects.length === 0 ? (
        <Card className="shadow-sm">
          <Empty description="Không tìm thấy dự án nào" />
        </Card>
      ) : viewMode === 'grid' ? (
        <Row gutter={[20, 20]}>
          {filteredProjects.map((project: Project) => (
            <Col xs={24} sm={12} lg={8} key={project.id}>
              <Card
                hoverable
                className="shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-slate-800"
                actions={[
                  <div key="action-view" className="text-indigo-600 hover:text-indigo-800 font-semibold py-1 flex items-center justify-center gap-1.5" onClick={() => navigate(`/projects/${project.id}`)}>
                    Vào dự án <ArrowRightOutlined />
                  </div>
                ]}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="text-lg font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 cursor-pointer line-clamp-1 flex-1 mr-2"
                  >
                    {project.name}
                  </h3>
                  <Tag color={project.status === 'ACTIVE' ? 'success' : 'default'}>
                    {project.status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
                  </Tag>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 h-10 mb-4">
                  {project.description || 'Không có mô tả chi tiết cho dự án này.'}
                </p>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <Row gutter={12} className="mb-4">
                    <Col span={12}>
                      <span className="text-xs text-slate-400 block mb-1">THÀNH VIÊN</span>
                      <Space size={4}>
                        <Avatar icon={<UserOutlined />} size="small" className="bg-slate-200 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {project._count?.members || 0}
                        </span>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <span className="text-xs text-slate-400 block mb-1">CÔNG VIỆC</span>
                      <Space size={4}>
                        <ProjectOutlined className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {project._count?.tasks || 0}
                        </span>
                      </Space>
                    </Col>
                  </Row>

                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarOutlined /> {formatDate(project.createdAt).split(' ')[0]}
                    </span>
                    <span className="text-slate-500 font-medium">Chủ: {project.owner?.name || 'N/A'}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={filteredProjects}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {/* Create Project Modal */}
      <Modal
        title={<span className="text-lg font-bold text-slate-800 dark:text-slate-100">Tạo dự án mới</span>}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject} className="mt-4">
          <Form.Item
            label="Tên dự án"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên dự án!' },
              { min: 3, message: 'Tên dự án phải từ 3 ký tự trở lên!' },
            ]}
          >
            <Input placeholder="Nhập tên dự án..." />
          </Form.Item>

          <Form.Item label="Mô tả dự án" name="description">
            <Input.TextArea placeholder="Mô tả chi tiết dự án (không bắt buộc)..." rows={4} />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
                Tạo mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Projects;

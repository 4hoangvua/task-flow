import React, { useState } from 'react';
import { Card, Col, Row, Button, Input, Select, Table, Modal, Form, Space, Empty, Spin, Tabs } from 'antd';
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
import { ProjectStatusTag } from '../components/common/ProjectStatusTag';
import { SearchAutoComplete } from '../components/common/SearchAutoComplete';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'joined'>('all');
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
    
    let matchesTab = true;
    if (activeTab === 'owned') {
      matchesTab = project.ownerId === user?.id;
    } else if (activeTab === 'joined') {
      matchesTab = project.ownerId !== user?.id;
    }
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <Space orientation="vertical" size={2}>
          <a onClick={() => navigate(`/projects/${record.id}`)} className="font-semibold text-[var(--accent)] hover:text-[var(--accent)]/95 cursor-pointer">
            {text}
          </a>
          <span className="text-xs text-[var(--text-tertiary)] line-clamp-1">{record.description || 'Không có mô tả'}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <ProjectStatusTag status={status} />,
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
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-h)] flex items-center gap-2.5">
            <ProjectOutlined className="text-[var(--accent)]" /> Danh sách dự án
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-sm">Quản lý và xem tiến độ các dự án trong hệ thống.</p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="shadow-md font-semibold"
          onClick={() => setIsModalVisible(true)}
        >
          Tạo dự án mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        className="custom-tabs mb-6"
        items={[
          {
            key: 'all',
            label: `Tất cả (${projects.length})`,
          },
          {
            key: 'owned',
            label: `Dự án sở hữu (${projects.filter((p) => p.ownerId === user?.id).length})`,
          },
          {
            key: 'joined',
            label: `Dự án tham gia (${projects.filter((p) => p.ownerId !== user?.id).length})`,
          },
        ]}
      />

      {/* Filter and View toggles */}
      <Card className="mb-10 shadow-sm border border-[var(--border)] notebook-card">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <SearchAutoComplete
              placeholder="Tìm kiếm dự án..."
              value={searchText}
              onChange={setSearchText}
              dataSource={projects}
              searchFields={['name', 'description']}
              primaryField="name"
              className="w-full sm:max-w-xs"
              renderOption={(project) => (
                <div className="flex justify-between items-center py-0.5 px-1">
                  <span className="font-semibold text-xs text-[var(--text-h)]">{project.name}</span>
                  {project.description && (
                    <span className="text-[10px] text-[var(--text-tertiary)] max-w-[150px] truncate ml-3">
                      {project.description}
                    </span>
                  )}
                </div>
              )}
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

          <div className="hidden sm:flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 md:border-none pt-3 md:pt-0">
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
        <div className="flex justify-center items-center p-12 min-h-[250px]"><Spin size="large" /></div>
      ) : filteredProjects.length === 0 ? (
        <Card className="shadow-sm border border-[var(--border)]">
          <Empty description="Không tìm thấy dự án nào" />
        </Card>
      ) : (
        <>
          {/* Chế độ Grid - Luôn hiển thị trên Mobile, toggle trên Desktop */}
          <div className={viewMode === 'grid' ? 'block' : 'block sm:hidden'}>
            <Row gutter={[20, 20]} className='mt-6'>
              {filteredProjects.map((project: Project) => (
                <Col xs={24} sm={12} lg={8} key={project.id}>
                  <Card
                    className="premium-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 notebook-card rounded-lg flex flex-col justify-between border border-[var(--border)] overflow-hidden"
                    styles={{ body: { padding: '24px' } }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Header: Title & Status */}
                        <div className="flex items-start justify-between mb-3.5">
                          <h3
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="text-lg font-bold text-[var(--text-h)] hover:text-[var(--accent)] cursor-pointer line-clamp-1 flex-1 mr-3 transition-colors"
                          >
                            {project.name}
                          </h3>
                          <ProjectStatusTag status={project.status} />
                        </div>

                        {/* Description */}
                        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 h-10 mb-5 leading-relaxed">
                          {project.description || 'Không có mô tả chi tiết cho dự án này.'}
                        </p>

                        {/* Metrics Box */}
                        <div className="grid grid-cols-2 gap-3 mb-5 bg-[var(--bg)]/40 p-3 rounded-lg border border-[var(--border)]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/10 shrink-0">
                              <UserOutlined className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] text-[var(--text-tertiary)] block font-semibold uppercase tracking-wider leading-none mb-1">Thành viên</span>
                              <span className="text-sm font-bold text-[var(--text-h)] leading-none">
                                {project._count?.members || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/10 shrink-0">
                              <ProjectOutlined className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] text-[var(--text-tertiary)] block font-semibold uppercase tracking-wider leading-none mb-1">Công việc</span>
                              <span className="text-sm font-bold text-[var(--text-h)] leading-none">
                                {project._count?.tasks || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer & CTA */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-[var(--text-tertiary)] font-medium pt-2 border-t border-[var(--border)]/60">
                          <span className="flex items-center gap-1.5">
                            <CalendarOutlined className="text-sm" /> {formatDate(project.createdAt).split(' ')[0]}
                          </span>
                          <span className="truncate max-w-[140px]">
                            Chủ: <span className="font-semibold text-[var(--text-secondary)]">{project.owner?.name || 'N/A'}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="group w-full py-2.5 px-4 bg-[var(--bg)] hover:bg-[var(--accent-bg)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent)] font-bold text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs"
                        >
                          <span>Vào dự án</span>
                          <ArrowRightOutlined className="text-xs transform group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Chế độ List - Chỉ hiển thị trên Desktop khi chọn */}
          <div className={`mt-6 ${viewMode === 'list' ? 'hidden sm:block' : 'hidden'}`}>
            <Card className="shadow-sm overflow-hidden border border-[var(--border)]" styles={{ body: { padding: 0 } }}>
              <Table
                dataSource={filteredProjects}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>
        </>
      )}

      {/* Create Project Modal */}
      <Modal
        title={<span className="text-lg font-bold text-[var(--text-h)]">Tạo dự án mới</span>}
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

          <Form.Item className="mb-0 flex justify-end">
            <Space size={10}>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={isCreating} className="font-semibold">
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

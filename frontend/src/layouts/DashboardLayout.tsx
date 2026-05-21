import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Badge, Avatar, Space, List, Switch, theme } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  UserOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useUiStore } from '../stores/uiStore';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/helpers';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const themeMode = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { token } = theme.useToken();

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ limit: 5 });

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Dự án',
    },
    {
      key: '/my-tasks',
      icon: <CheckSquareOutlined />,
      label: 'Công việc của tôi',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Cấu hình',
    },
  ];

  // User Profile Dropdown Menu
  const userMenu = {
    items: [
      {
        key: 'profile',
        label: 'Thông tin cá nhân',
        icon: <UserOutlined />,
        onClick: () => navigate('/settings'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        label: 'Đăng xuất',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: () => logout(),
      },
    ],
  };

  // Notification Bell Dropdown Menu
  const notificationMenu = (
    <div className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Thông báo</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" className="p-0 text-indigo-600 dark:text-indigo-400" onClick={() => markAllAsRead()}>
            Đọc tất cả
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        <List
          dataSource={notifications}
          locale={{ emptyText: 'Không có thông báo mới' }}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                if (!item.isRead) markAsRead(item.id);
                if (item.projectId) navigate(`/projects/${item.projectId}`);
              }}
              className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                !item.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''
              }`}
            >
              <List.Item.Meta
                title={
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                }
                description={
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                }
              />
            </List.Item>
          )}
        />
      </div>
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/30">
        <span className="text-xs text-slate-400">Xem tất cả các thông báo trong dự án</span>
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {/* Sider (Sidebar) */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme={themeMode}
        className="shadow-md border-r border-slate-200/50 dark:border-slate-800/50"
        style={{
          background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200/40 dark:border-slate-800/40 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-slate-100 dark:to-indigo-400 bg-clip-text text-transparent">
                TaskFlow
              </span>
            )}
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          className="mt-4 border-none"
          style={{
            background: 'transparent',
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header
          className="flex justify-between items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300"
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="text-lg w-10 h-10 flex items-center justify-center"
          />

          <Space size={18} className="items-center">
            {/* Dark Mode Switch */}
            <Space size={4} className="mr-2">
              <BulbOutlined className="text-slate-400 text-sm" />
              <Switch
                size="small"
                checked={themeMode === 'dark'}
                onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </Space>

            {/* Notification Bell */}
            <Dropdown dropdownRender={() => notificationMenu} trigger={['click']} placement="bottomRight">
              <div className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center">
                <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, -2]}>
                  <BellOutlined className="text-lg text-slate-600 dark:text-slate-300" />
                </Badge>
              </div>
            </Dropdown>

            {/* User Dropdown */}
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
              <Space size={8} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 px-2.5 rounded-lg transition-colors">
                <Avatar
                  src={user?.avatar}
                  className="bg-indigo-600 border border-indigo-200 dark:border-slate-800"
                  size="small"
                >
                  {user ? getInitials(user.name) : 'U'}
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-none text-slate-800 dark:text-slate-200">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{user?.role}</span>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Area */}
        <Content className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

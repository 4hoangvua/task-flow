import React from 'react';
import { Outlet, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Badge, Avatar, Space, List } from 'antd';
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
  FolderOpenOutlined,
  HomeOutlined,
  SunOutlined,
  MoonOutlined,
  FileAddOutlined,
  EditOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useUiStore } from '../stores/uiStore';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useProjectDetail } from '../hooks/useProjects';
import { getInitials } from '../utils/helpers';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: projectId } = useParams<{ id: string }>();
  const { logout, user } = useAuth();
  const themeMode = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { project } = useProjectDetail(projectId || '');
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

  // User Profile Dropdown Card (Custom dropdownRender)
  const userMenuCard = () => (
    <div className="w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header Info */}
      <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center text-center">
        <Avatar
          src={user?.avatar || undefined}
          className="bg-indigo-600 border-2 border-indigo-200 dark:border-indigo-950 shadow-md mb-2 shrink-0 transition-transform duration-300 hover:scale-105"
          size={56}
        >
          {user ? getInitials(user.name) : 'U'}
        </Avatar>
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user?.name}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 mb-2.5 break-all">{user?.email}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
          user?.role === 'ADMIN' 
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
            : user?.role === 'LEADER'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        }`}>
          {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
        </span>
      </div>
      {/* Actions */}
      <div className="p-1.5 flex flex-col gap-0.5">
        <button
          onClick={() => navigate('/settings')}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <UserOutlined className="text-slate-400 dark:text-slate-500 text-sm shrink-0" />
          <span>Thông tin cá nhân</span>
        </button>
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
        <button
          onClick={() => logout()}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-xs text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium cursor-pointer"
        >
          <LogoutOutlined className="text-red-400 dark:text-red-500 text-sm shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
            <FileAddOutlined className="text-sm" />
          </div>
        );
      case 'TASK_UPDATED':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 shrink-0">
            <EditOutlined className="text-sm" />
          </div>
        );
      case 'COMMENT_ADDED':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <MessageOutlined className="text-sm" />
          </div>
        );
      case 'DEADLINE_APPROACHING':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 shrink-0">
            <ClockCircleOutlined className="text-sm" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
            <BellOutlined className="text-sm" />
          </div>
        );
    }
  };

  // Notification Bell Dropdown Menu
  const notificationMenu = () => (
    <div className="w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="p-3.5 border-b border-[var(--border)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Thông báo</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" className="p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium" onClick={() => markAllAsRead()}>
            Đọc tất cả
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        <List
          dataSource={notifications}
          locale={{ emptyText: <div className="py-8 text-center text-slate-400 dark:text-slate-600 text-xs">Không có thông báo mới</div> }}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                if (!item.isRead) markAsRead(item.id);
                if (item.projectId) navigate(`/projects/${item.projectId}`);
              }}
              className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                !item.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/5' : ''
              }`}
            >
              <div className="flex gap-3 w-full items-start">
                {getNotificationIcon(item.type)}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-1">{item.title}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/30 dark:bg-slate-800/10">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Xem tất cả các thông báo trong dự án</span>
      </div>
    </div>
  );

  const renderBreadcrumbs = () => {
    const path = location.pathname;
    const baseClass = "text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 no-underline";
    const activeClass = "text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5";

    const items = [];

    items.push(
      <Link key="home" to="/dashboard" className={baseClass}>
        <HomeOutlined className="text-sm shrink-0" />
      </Link>
    );

    if (path.startsWith('/dashboard')) {
      items.push(
        <span key="divider-dash" className="text-slate-300 dark:text-slate-800 shrink-0">/</span>,
        <span key="dash" className={activeClass}>
          <DashboardOutlined className="text-indigo-500 text-sm shrink-0" />
          <span>Tổng quan</span>
        </span>
      );
    } else if (path.startsWith('/projects')) {
      const isDetail = !!projectId;
      items.push(
        <span key="divider-proj" className="text-slate-300 dark:text-slate-800 shrink-0">/</span>,
        isDetail ? (
          <Link key="proj-list" to="/projects" className={baseClass}>
            <ProjectOutlined className="text-sm shrink-0" />
            <span>Dự án</span>
          </Link>
        ) : (
          <span key="proj-list-active" className={activeClass}>
            <ProjectOutlined className="text-indigo-500 text-sm shrink-0" />
            <span>Dự án</span>
          </span>
        )
      );

      if (isDetail) {
        items.push(
          <span key="divider-detail" className="text-slate-300 dark:text-slate-800 shrink-0">/</span>,
          <span key="proj-detail" className={activeClass}>
            <FolderOpenOutlined className="text-indigo-500 text-sm shrink-0" />
            <span className="max-w-[120px] sm:max-w-[200px] truncate">{project?.name || 'Chi tiết dự án'}</span>
            {project?.status && (
              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full ml-1 font-bold tracking-wider shrink-0 ${
                project.status === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}>
                {project.status === 'ACTIVE' ? 'Đang chạy' : 'Lưu trữ'}
              </span>
            )}
          </span>
        );
      }
    } else if (path.startsWith('/my-tasks')) {
      items.push(
        <span key="divider-tasks" className="text-slate-300 dark:text-slate-800 shrink-0">/</span>,
        <span key="tasks" className={activeClass}>
          <CheckSquareOutlined className="text-indigo-500 text-sm shrink-0" />
          <span>Công việc của tôi</span>
        </span>
      );
    } else if (path.startsWith('/settings')) {
      items.push(
        <span key="divider-settings" className="text-slate-300 dark:text-slate-800 shrink-0">/</span>,
        <span key="settings" className={activeClass}>
          <SettingOutlined className="text-indigo-500 text-sm shrink-0" />
          <span>Cấu hình</span>
        </span>
      );
    }

    return (
      <div className="hidden sm:flex items-center gap-2 ml-4 border-l border-slate-200 dark:border-slate-800 pl-4 h-5">
        {items}
      </div>
    );
  };

  return (
    <Layout className="h-screen overflow-hidden">
      {/* Sider (Sidebar) */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme={themeMode}
        className="shadow-md border-r border-slate-200/50 dark:border-slate-800/50 h-full overflow-y-auto z-50 notebook-card"
        style={{
          background: themeMode === 'dark' ? '#292929' : '#ffffff',
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
      <Layout className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          className="flex justify-between items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 z-40 notebook-card shrink-0"
          style={{
            background: themeMode === 'dark' ? '#292929' : '#ffffff',
            padding: '0 24px',
            height: 64,
          }}
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined className="text-indigo-600 dark:text-indigo-400" /> : <MenuFoldOutlined className="text-indigo-600 dark:text-indigo-400" />}
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
            />
            {renderBreadcrumbs()}
          </div>

          <Space size={14} className="items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(themeMode === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xs bg-[var(--bg-card)]"
              aria-label="Toggle Theme"
            >
              <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                <SunOutlined className={`text-lg text-amber-500 absolute transition-all duration-500 ${
                  themeMode === 'dark' ? 'transform translate-y-0 rotate-0 scale-100 opacity-100' : 'transform -translate-y-8 rotate-90 scale-50 opacity-0'
                }`} />
                <MoonOutlined className={`text-lg text-indigo-500 absolute transition-all duration-500 ${
                  themeMode === 'light' ? 'transform translate-y-0 rotate-0 scale-100 opacity-100' : 'transform translate-y-8 -rotate-90 scale-50 opacity-0'
                }`} />
              </div>
            </button>

            {/* Notification Bell */}
            <Dropdown dropdownRender={() => notificationMenu()} trigger={['click']} placement="bottomRight">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs bg-[var(--bg-card)] relative">
                <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, -2]} className="z-10">
                  <BellOutlined className={`text-lg text-slate-600 dark:text-slate-300 transition-colors ${unreadCount > 0 ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} />
                </Badge>
              </button>
            </Dropdown>

            {/* User Dropdown */}
            <Dropdown dropdownRender={() => userMenuCard()} trigger={['click']} placement="bottomRight">
              <button className="w-9 md:w-auto h-9 flex items-center justify-center md:justify-start gap-2 p-0 md:p-1.5 md:px-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 transition-all duration-200 cursor-pointer shadow-sm bg-[var(--bg-card)] outline-none text-left select-none shrink-0 leading-none">
                <Avatar
                  src={user?.avatar || undefined}
                  className="bg-indigo-600 border border-indigo-100 dark:border-slate-700 shadow-sm shrink-0"
                  size="small"
                >
                  {user ? getInitials(user.name) : 'U'}
                </Avatar>
                <div className="hidden md:flex flex-col text-left shrink-0 min-w-0 max-w-[120px]">
                  <span className="block text-xs font-semibold leading-none text-slate-800 dark:text-slate-200 truncate w-full">{user?.name}</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 uppercase tracking-wider leading-none">{user?.role === 'ADMIN' ? 'Admin' : user?.role === 'LEADER' ? 'Leader' : 'Member'}</span>
                </div>
              </button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Area */}
        <Content className="flex-1 overflow-y-auto px-6 pb-6 pt-0 transition-colors duration-300" style={{ background: themeMode === 'dark' ? '#1e1e1e' : '#fdfaf0' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

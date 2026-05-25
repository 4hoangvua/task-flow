import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Badge, Avatar, Space, Drawer } from 'antd';
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
  MenuOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useUiStore } from '../stores/uiStore';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useProjectDetail } from '../hooks/useProjects';
import { getInitials } from '../utils/helpers';
import { ProjectStatusTag } from '../components/common/ProjectStatusTag';

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

  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      toggleSidebar();
    }
  };

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
    ...(user?.role === 'ADMIN' ? [{
      key: '/admin',
      icon: <SafetyCertificateOutlined />,
      label: 'Quản trị hệ thống',
    }] : []),
  ];

  // User Profile Dropdown Card (Custom dropdownRender)
  const userMenuCard = () => (
    <div className="w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header Info */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/50 flex flex-col items-center text-center">
        <Avatar
          src={user?.avatar || undefined}
          className="bg-indigo-600 border-2 border-indigo-200 dark:border-indigo-950 shadow-md mb-2 shrink-0 transition-transform duration-300 hover:scale-105"
          size={56}
        >
          {user ? getInitials(user.name) : 'U'}
        </Avatar>
        <span className="font-semibold text-[var(--text-h)] text-sm">{user?.name}</span>
        <span className="text-xs text-[var(--text-secondary)] mb-2.5 break-all">{user?.email}</span>
        <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
          user?.role === 'ADMIN' 
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
            : user?.role === 'LEADER'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
            : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80'
        }`}>
          {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
        </span>
      </div>
      {/* Actions */}
      <div className="p-1.5 flex flex-col gap-0.5">
        <button
          onClick={() => navigate('/settings')}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text)] rounded-md hover:bg-[var(--bg)] transition-colors cursor-pointer"
        >
          <UserOutlined className="text-[var(--text-tertiary)] text-sm shrink-0" />
          <span>Thông tin cá nhân</span>
        </button>
        <div className="h-px bg-[var(--border)] my-1" />
        <button
          onClick={() => logout()}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium cursor-pointer"
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
      <div className="p-3.5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]/50">
        <span className="font-semibold text-[var(--text-h)] text-sm">Thông báo</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" className="p-0 text-sm text-[var(--accent)] hover:text-[var(--accent)]/90 font-medium" onClick={() => markAllAsRead()}>
            Đọc tất cả
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">Không có thông báo mới</div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markAsRead(item.id);
                  if (item.projectId) navigate(`/projects/${item.projectId}`);
                }}
                className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-[var(--bg)]/80 border-b border-[var(--border)] last:border-0 ${
                  !item.isRead ? 'bg-[var(--accent-bg)]' : ''
                }`}
              >
                <div className="flex gap-3 w-full items-start">
                  {getNotificationIcon(item.type)}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center text-sm font-semibold text-[var(--text)]">
                      <span className="truncate pr-1">{item.title}</span>
                      <span className="text-xs text-[var(--text-tertiary)] font-normal shrink-0">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-[var(--border)] text-center bg-[var(--bg)]/30">
        <span className="text-xs text-[var(--text-tertiary)]">Xem tất cả các thông báo trong dự án</span>
      </div>
    </div>
  );

  const renderBreadcrumbs = () => {
    const path = location.pathname;
    const baseClass = "text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-1.5 no-underline";
    const activeClass = "text-xs font-semibold text-[var(--text-h)] flex items-center gap-1.5";

    const items = [];

    items.push(
      <Link key="home" to="/dashboard" className={baseClass}>
        <HomeOutlined className="text-sm shrink-0" />
      </Link>
    );

    if (path.startsWith('/dashboard')) {
      items.push(
        <span key="divider-dash" className="text-[var(--border)] shrink-0">/</span>,
        <span key="dash" className={activeClass}>
          <DashboardOutlined className="text-indigo-500 text-sm shrink-0" />
          <span>Tổng quan</span>
        </span>
      );
    } else if (path.startsWith('/projects')) {
      const isDetail = !!projectId;
      items.push(
        <span key="divider-proj" className="text-[var(--border)] shrink-0">/</span>,
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
          <span key="divider-detail" className="text-[var(--border)] shrink-0">/</span>,
          <span key="proj-detail" className={activeClass}>
            <FolderOpenOutlined className="text-indigo-500 text-sm shrink-0" />
            <span className="max-w-[120px] sm:max-w-[200px] truncate">{project?.name || 'Chi tiết dự án'}</span>
            {project?.status && (
              <ProjectStatusTag status={project.status} className="ml-1 shrink-0" />
            )}
          </span>
        );
      }
    } else if (path.startsWith('/my-tasks')) {
      items.push(
        <span key="divider-tasks" className="text-[var(--border)] shrink-0">/</span>,
        <span key="tasks" className={activeClass}>
          <CheckSquareOutlined className="text-indigo-500 text-sm shrink-0" />
          <span>Công việc của tôi</span>
        </span>
      );
    } else if (path.startsWith('/settings')) {
      items.push(
        <span key="divider-settings" className="text-[var(--border)] shrink-0">/</span>,
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
      {/* Sider (Sidebar) - Desktop Only */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          theme={themeMode}
          className="shadow-md border-r border-slate-200/50 dark:border-slate-800/50 h-full overflow-y-auto z-50 notebook-card"
          style={{
            background: 'var(--bg-card)',
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
            selectedKeys={[location.pathname.startsWith('/projects') ? '/projects' : location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={menuItems}
            className="mt-4 border-none"
            style={{
              background: 'transparent',
            }}
          />
        </Sider>
      )}

      {/* Main Layout */}
      <Layout className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          className="flex justify-between items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 z-40 notebook-card shrink-0"
          style={{
            background: 'var(--bg-card)',
            padding: '0 24px',
            height: 64,
          }}
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={isMobile ? <MenuOutlined className="text-[var(--accent)]" /> : sidebarCollapsed ? <MenuUnfoldOutlined className="text-[var(--accent)]" /> : <MenuFoldOutlined className="text-[var(--accent)]" />}
              onClick={handleToggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg)] transition-all duration-200 cursor-pointer"
            />
            {renderBreadcrumbs()}
          </div>

          <Space size={14} className="items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(themeMode === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xs bg-[var(--bg-card)]"
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
            {isMobile ? (
              <button
                onClick={() => setNotificationDrawerOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs bg-[var(--bg-card)] relative"
              >
                <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, -2]} className="z-10">
                  <BellOutlined className={`text-lg text-slate-600 dark:text-slate-300 transition-colors ${unreadCount > 0 ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} />
                </Badge>
              </button>
            ) : (
              <Dropdown popupRender={() => notificationMenu()} trigger={['click']} placement="bottomRight">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs bg-[var(--bg-card)] relative">
                  <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, -2]} className="z-10">
                    <BellOutlined className={`text-lg text-slate-600 dark:text-slate-300 transition-colors ${unreadCount > 0 ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} />
                  </Badge>
                </button>
              </Dropdown>
            )}

            {/* User Dropdown */}
            <Dropdown popupRender={() => userMenuCard()} trigger={['click']} placement="bottomRight">
              <button className="w-9 md:w-auto h-9 flex items-center justify-center md:justify-start gap-2 p-0 md:p-1.5 md:px-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text-secondary)] transition-all duration-200 cursor-pointer shadow-sm bg-[var(--bg-card)] outline-none text-left select-none shrink-0 leading-none">
                <Avatar
                  src={user?.avatar || undefined}
                  className="bg-indigo-600 border border-indigo-100 dark:border-slate-700 shadow-sm shrink-0"
                  size="small"
                >
                  {user ? getInitials(user.name) : 'U'}
                </Avatar>
                <div className="hidden md:flex flex-col text-left shrink-0 min-w-0 max-w-[120px]">
                  <span className="block text-xs font-semibold leading-none text-[var(--text-h)] truncate w-full">{user?.name}</span>
                  <span className="block text-[11px] text-[var(--text-tertiary)] font-bold mt-1.5 uppercase tracking-wider leading-none">{user?.role === 'ADMIN' ? 'Admin' : user?.role === 'LEADER' ? 'Leader' : 'Member'}</span>
                </div>
              </button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Area */}
        <Content className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 sm:pb-8 pt-0 transition-colors duration-300" style={{ background: 'var(--bg)' }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-slate-100 dark:to-indigo-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
        styles={{ body: { padding: 0 } }}
        className="dark:bg-[#18181b] dark:text-white"
        style={{
          background: 'var(--bg-card)',
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname.startsWith('/projects') ? '/projects' : location.pathname]}
          onClick={({ key }) => {
            navigate(key);
            setDrawerOpen(false);
          }}
          items={menuItems}
          className="mt-4 border-none"
          style={{
            background: 'transparent',
          }}
        />
      </Drawer>

      {/* Mobile Notification Drawer */}
      <Drawer
        title={
          <div className="flex justify-between items-center w-full pr-4">
            <span className="font-semibold text-base text-[var(--text-h)]">Thông báo</span>
            {unreadCount > 0 && (
              <Button type="link" size="small" className="p-0 text-sm text-[var(--accent)] hover:text-[var(--accent)]/90 font-medium" onClick={() => markAllAsRead()}>
                Đọc tất cả
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setNotificationDrawerOpen(false)}
        open={notificationDrawerOpen}
        width={320}
        styles={{ body: { padding: 0 } }}
        className="dark:bg-[#18181b] dark:text-white"
        style={{
          background: 'var(--bg-card)',
        }}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-tertiary)] text-sm">Không có thông báo mới</div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) markAsRead(item.id);
                      if (item.projectId) navigate(`/projects/${item.projectId}`);
                      setNotificationDrawerOpen(false);
                    }}
                    className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-[var(--bg)]/80 border-b border-[var(--border)] last:border-0 ${
                      !item.isRead ? 'bg-[var(--accent-bg)]' : ''
                    }`}
                  >
                    <div className="flex gap-3 w-full items-start">
                      {getNotificationIcon(item.type)}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center text-sm font-semibold text-[var(--text)]">
                          <span className="truncate pr-1">{item.title}</span>
                          <span className="text-xs text-[var(--text-tertiary)] font-normal shrink-0">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[var(--border)] text-center bg-[var(--bg)]/30 shrink-0">
            <span className="text-xs text-[var(--text-tertiary)]">Xem tất cả các thông báo trong dự án</span>
          </div>
        </div>
      </Drawer>
    </Layout>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Select, Button, Space, Avatar, Badge, Tooltip, Empty, Tag } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  PlusOutlined,
  UserOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import type { Task, User } from '../../types';
import dayjs from 'dayjs';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';

interface TaskCalendarProps {
  projectId: string;
  isProjectLeader: boolean;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ projectId, isProjectLeader }) => {
  const { user: currentUser } = useAuth();
  const { members } = useProjectMembers(projectId);
  const { tasks } = useTasks(projectId);

  // States
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [statFilter, setStatFilter] = useState<string | null>(null); // 'ALL', 'URGENT', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'
  const [isMobile, setIsMobile] = useState(false);

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialDeadline, setFormInitialDeadline] = useState<dayjs.Dayjs | null>(null);

  // Listen to window size changes for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate 42 days grid for the calendar (6 weeks, starting on Monday)
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const dayOfWeek = startOfMonth.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get Monday
    const startOfWeek = startOfMonth.subtract(diff, 'day');

    const days = [];
    let currentDay = startOfWeek;
    for (let i = 0; i < 42; i++) {
      days.push(currentDay);
      currentDay = currentDay.add(1, 'day');
    }
    return days;
  }, [currentMonth]);

  // Statistics & Filter Logic for currently selected month
  const monthTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const deadline = dayjs(task.deadline);
      return deadline.isSame(currentMonth, 'month');
    });
  }, [tasks, currentMonth]);

  // Monthly stats
  const stats = useMemo(() => {
    const total = monthTasks.length;
    const urgent = monthTasks.filter((t) => t.priority === 'URGENT').length;
    const inProgress = monthTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVIEW').length;
    const completed = monthTasks.filter((t) => t.status === 'DONE').length;
    const overdue = monthTasks.filter((t) => t.status !== 'DONE' && dayjs(t.deadline).isBefore(dayjs())).length;

    return { total, urgent, inProgress, completed, overdue };
  }, [monthTasks]);

  // Filter tasks to display on the calendar grid
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Assignee Filter
      if (selectedAssigneeId && task.assigneeId !== selectedAssigneeId) return false;
      // 2. Priority Filter
      if (selectedPriority && task.priority !== selectedPriority) return false;
      // 3. Status Filter
      if (selectedStatus && task.status !== selectedStatus) return false;

      // 4. Quick Stat Card Filter
      if (statFilter) {
        const isCurrentMonth = task.deadline && dayjs(task.deadline).isSame(currentMonth, 'month');
        if (!isCurrentMonth) return false;

        switch (statFilter) {
          case 'URGENT':
            if (task.priority !== 'URGENT') return false;
            break;
          case 'IN_PROGRESS':
            if (task.status !== 'IN_PROGRESS' && task.status !== 'REVIEW') return false;
            break;
          case 'COMPLETED':
            if (task.status !== 'DONE') return false;
            break;
          case 'OVERDUE':
            const isOverdue = task.status !== 'DONE' && dayjs(task.deadline).isBefore(dayjs());
            if (!isOverdue) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [tasks, selectedAssigneeId, selectedPriority, selectedStatus, statFilter, currentMonth]);

  // Map of date string 'YYYY-MM-DD' -> tasks list
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach((task) => {
      if (!task.deadline) return;
      const dateStr = dayjs(task.deadline).format('YYYY-MM-DD');
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(task);
    });
    return map;
  }, [filteredTasks]);

  // Group tasks by date for the mobile view (only tasks within currently selected month)
  const groupedTasksForMobile = useMemo(() => {
    const filteredMonthTasks = filteredTasks.filter((task) => {
      if (!task.deadline) return false;
      return dayjs(task.deadline).isSame(currentMonth, 'month');
    });

    const groups: Record<string, Task[]> = {};
    filteredMonthTasks.forEach((task) => {
      const dateStr = dayjs(task.deadline).format('YYYY-MM-DD');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(task);
    });

    const sortedDates = Object.keys(groups).sort();
    return sortedDates.map((dateStr) => ({
      date: dayjs(dateStr),
      tasks: groups[dateStr],
    }));
  }, [filteredTasks, currentMonth]);

  // Month navigation helpers
  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const handleToday = () => setCurrentMonth(dayjs());

  // Task click handler
  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    setIsDetailOpen(true);
  };

  // Day double click/plus click handler to create task
  const handleCreateTaskAtDay = (date: dayjs.Dayjs) => {
    if (!isProjectLeader) return;
    // Set time to end of work hours or current time
    let deadline = date.set('hour', 17).set('minute', 0);
    // If date is today, ensure it's not in the past
    if (date.isSame(dayjs(), 'day') && deadline.isBefore(dayjs())) {
      deadline = dayjs().add(1, 'hour').startOf('hour');
    }
    setFormInitialDeadline(deadline);
    setIsFormOpen(true);
  };

  // Helper colors for priority
  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
          dot: 'bg-red-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
          dot: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Toolbar (Always visible, responsive) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-[var(--bg)]/40 border border-[var(--border)] rounded-xl gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-lg p-0.5 shadow-2xs">
            <Button type="text" size="small" icon={<LeftOutlined />} onClick={handlePrevMonth} className="text-[var(--text)]" />
            <Button type="text" size="small" onClick={handleToday} className="font-semibold text-xs text-[var(--text-secondary)]">
              Hôm nay
            </Button>
            <Button type="text" size="small" icon={<RightOutlined />} onClick={handleNextMonth} className="text-[var(--text)]" />
          </div>
          <h2 className="text-lg font-black text-[var(--text-h)] uppercase tracking-wide">
            {currentMonth.format('Tháng MM, YYYY')}
          </h2>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
          <Select
            className="w-full select-obsidian"
            placeholder="Chọn người thực hiện"
            allowClear
            value={selectedAssigneeId}
            onChange={setSelectedAssigneeId}
            options={members.map((member) => ({
              value: member.user?.id,
              label: (
                <div className="flex items-center gap-2">
                  <Avatar size={16} src={member.user?.avatar} icon={<UserOutlined />} className="bg-[var(--accent)] text-[9px]" />
                  <span className="text-xs truncate">{member.user?.name}</span>
                </div>
              ),
            }))}
          />
          <Select
            className="w-full select-obsidian"
            placeholder="Độ ưu tiên"
            allowClear
            value={selectedPriority}
            onChange={setSelectedPriority}
            options={[
              { value: 'LOW', label: 'Thấp' },
              { value: 'MEDIUM', label: 'Trung bình' },
              { value: 'HIGH', label: 'Cao' },
              { value: 'URGENT', label: 'Khẩn cấp' },
            ]}
          />
          <Select
            className="w-full select-obsidian"
            placeholder="Trạng thái"
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'TODO', label: 'Cần làm' },
              { value: 'IN_PROGRESS', label: 'Đang làm' },
              { value: 'REVIEW', label: 'Đánh giá' },
              { value: 'DONE', label: 'Hoàn thành' },
            ]}
          />
        </div>
      </div>

      {/* 2. Main split layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Statistics block */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          <div className="p-4 bg-[var(--bg)]/40 border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CalendarOutlined className="text-[var(--accent)] text-lg" />
              <h3 className="font-extrabold text-sm text-[var(--text-h)] uppercase tracking-wider">Thống kê tháng</h3>
            </div>
            
            {/* Stats list with horizontal scroll on mobile, vertical stack on desktop */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2.5 pb-2 md:pb-0 no-scrollbar">
              {[
                { key: null, label: 'TỔNG CÔNG VIỆC', count: stats.total, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', icon: <CalendarOutlined className="text-xs" /> },
                { key: 'URGENT', label: 'KHẨN CẤP', count: stats.urgent, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: <AlertOutlined className="text-xs text-red-500" /> },
                { key: 'IN_PROGRESS', label: 'ĐANG LÀM', count: stats.inProgress, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: <ClockCircleOutlined className="text-xs text-blue-500" /> },
                { key: 'OVERDUE', label: 'QUÁ HẠN', count: stats.overdue, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', icon: <ClockCircleOutlined className="text-xs text-rose-500" /> },
                { key: 'COMPLETED', label: 'HOÀN THÀNH', count: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircleOutlined className="text-xs text-emerald-500" /> },
              ].map((item) => (
                <button
                  key={item.key as any}
                  onClick={() => setStatFilter(statFilter === item.key ? null : item.key)}
                  className={`p-3 text-left border rounded-lg transition-all shrink-0 w-36 md:w-full ${
                    statFilter === item.key
                      ? `${item.bg} border-${item.color.split('-')[1]}-500/50 ${item.color} font-bold shadow-2xs`
                      : 'bg-[var(--bg)]/50 border-[var(--border)] hover:border-slate-500/30 text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="text-[9px] uppercase font-bold tracking-wider opacity-85">{item.label}</div>
                  <div className="text-lg font-black mt-1.5 flex justify-between items-center">
                    <span>{item.count}</span>
                    {item.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Legend (Hidden on mobile for cleaner screen) */}
          <div className="hidden md:block p-4 bg-[var(--bg)]/40 border border-[var(--border)] rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <InfoCircleOutlined className="text-[var(--text-tertiary)] text-sm" />
              <h4 className="font-bold text-xs text-[var(--text-secondary)] uppercase tracking-wider">Chú thích</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[var(--text-secondary)] font-medium">Khẩn cấp (Urgent)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[var(--text-secondary)] font-medium">Cao (High)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[var(--text-secondary)] font-medium">Trung bình (Medium)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-[var(--text-secondary)] font-medium">Thấp (Low)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Calendar Grid or Mobile list view */}
        <div className="col-span-12 md:col-span-9">
          {isMobile ? (
            /* === Mobile Day-Grouped List View === */
            <div className="space-y-4">
              {groupedTasksForMobile.length === 0 ? (
                <Card className="shadow-xs border border-[var(--border)] bg-[var(--bg)]/20 py-8">
                  <Empty description="Không có công việc nào trong tháng này khớp với bộ lọc." />
                </Card>
              ) : (
                groupedTasksForMobile.map((group) => {
                  const dateStr = group.date.format('YYYY-MM-DD');
                  const isToday = group.date.isSame(dayjs(), 'day');
                  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                  const dayName = daysOfWeek[group.date.day()];
                  const formattedDate = `${dayName}, ${group.date.format('DD/MM/YYYY')}`;

                  return (
                    <div key={dateStr} className="space-y-2">
                      {/* Date Header */}
                      <div className="flex justify-between items-center px-2 py-1 bg-[var(--bg)]/30 border-l-2 border-[var(--accent)] rounded-r-md">
                        <span className="text-xs font-bold text-[var(--text-h)] flex items-center gap-2">
                          {formattedDate}
                          {isToday && (
                            <Tag color="blue" className="text-[9px] font-bold m-0 uppercase py-0 px-1 border-none">Hôm nay</Tag>
                          )}
                        </span>
                        {isProjectLeader && (
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined className="text-xs" />}
                            onClick={() => handleCreateTaskAtDay(group.date)}
                            className="text-[var(--accent)] flex items-center justify-center p-0 h-6 w-6 rounded-full"
                          />
                        )}
                      </div>

                      {/* Day Tasks List */}
                      <div className="grid grid-cols-1 gap-2 pl-2">
                        {group.tasks.map((task) => {
                          const colors = getPriorityColors(task.priority);
                          const isCompleted = task.status === 'DONE';
                          const assigneeUser = members.find((m) => m.userId === task.assigneeId)?.user;

                          return (
                            <div
                              key={task.id}
                              onClick={(e) => handleTaskClick(task.id, e)}
                              className="p-3 bg-[var(--bg)]/40 hover:bg-[var(--bg)]/80 border border-[var(--border)] rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                            >
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                                  <span className={`text-sm font-semibold truncate text-[var(--text-h)] ${isCompleted ? 'line-through opacity-65' : ''}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-[var(--text-tertiary)]">
                                  <Tag color={colors.dot.split('-')[1]} className="text-[9px] font-bold m-0 border-none px-1 py-0">{task.priority}</Tag>
                                  <span>•</span>
                                  <span>Trạng thái: {task.status === 'TODO' ? 'Cần làm' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'REVIEW' ? 'Đánh giá' : 'Hoàn thành'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {assigneeUser && (
                                  <Tooltip title={assigneeUser.name}>
                                    <Avatar size={20} src={assigneeUser.avatar} icon={<UserOutlined />} className="bg-[var(--accent)] text-[10px]" />
                                  </Tooltip>
                                )}
                                {isCompleted && (
                                  <CheckCircleOutlined className="text-emerald-500 text-sm" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* === Desktop Calendar Grid View === */
            <Card className="shadow-xs overflow-hidden border border-[var(--border)] bg-[var(--bg)]/20" styles={{ body: { padding: 0 } }}>
              <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg)]/40 text-center font-bold text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] py-2">
                <div>Thứ 2</div>
                <div>Thứ 3</div>
                <div>Thứ 4</div>
                <div>Thứ 5</div>
                <div>Thứ 6</div>
                <div>Thứ 7</div>
                <div>Chủ Nhật</div>
              </div>

              <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-[var(--border)] border-l border-t border-[var(--border)]">
                {calendarDays.map((day, idx) => {
                  const dateStr = day.format('YYYY-MM-DD');
                  const dayTasks = tasksByDate[dateStr] || [];
                  const isCurrentMonth = day.isSame(currentMonth, 'month');
                  const isToday = day.isSame(dayjs(), 'day');

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCreateTaskAtDay(day)}
                      className={`group relative flex flex-col p-2 min-h-[115px] transition-all cursor-pointer ${
                        isCurrentMonth ? 'bg-[var(--bg)]/10' : 'bg-slate-500/[0.03] text-slate-500'
                      } hover:bg-slate-500/[0.06] dark:hover:bg-slate-300/[0.04]`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[11px] font-bold ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center'
                              : isCurrentMonth
                              ? 'text-[var(--text-secondary)]'
                              : 'text-[var(--text-tertiary)] opacity-60'
                          }`}
                        >
                          {day.date()}
                        </span>

                        {isProjectLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTaskAtDay(day);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:scale-110 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)] transition-all cursor-pointer shadow-sm"
                          >
                            <PlusOutlined style={{ fontSize: '9px' }} />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar">
                        {dayTasks.map((task) => {
                          const colors = getPriorityColors(task.priority);
                          const isCompleted = task.status === 'DONE';
                          return (
                            <div
                              key={task.id}
                              onClick={(e) => handleTaskClick(task.id, e)}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-semibold border rounded-sm truncate transition-all ${colors.bg} ${
                                isCompleted ? 'opacity-55 line-through' : 'shadow-xs'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                              <span className="truncate flex-1">{task.title}</span>
                              {isCompleted && (
                                <CheckCircleOutlined className="text-[9px] text-emerald-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals for creation and view */}
      {selectedTaskId && isDetailOpen && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          open={isDetailOpen}
          isProjectLeader={isProjectLeader}
          onCancel={() => {
            setIsDetailOpen(false);
            setSelectedTaskId(null);
          }}
        />
      )}

      {isFormOpen && (
        <TaskFormModal
          projectId={projectId}
          open={isFormOpen}
          initialDeadline={formInitialDeadline}
          onCancel={() => {
            setIsFormOpen(false);
            setFormInitialDeadline(null);
          }}
        />
      )}
    </div>
  );
};
export default TaskCalendar;

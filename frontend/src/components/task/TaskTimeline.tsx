import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input, Select, Space, Avatar, Tooltip, Empty, Spin, Button, Tag } from 'antd';
import { SearchOutlined, UserOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjects';
import type { Task } from '../../types';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import { getPriorityColor } from '../../utils/helpers';
import { TaskStatusTag } from '../common/TaskStatusTag';
import { PriorityTag } from '../common/PriorityTag';

interface TaskTimelineProps {
  projectId: string;
  isProjectLeader: boolean;
  onOpenTaskDetail: (taskId: string) => void;
  onOpenCreateTask: (startDate?: string | null) => void;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({
  projectId,
  isProjectLeader,
  onOpenTaskDetail,
  onOpenCreateTask,
}) => {
  const { tasks, isLoading } = useTasks(projectId);
  const { members, isLoading: isLoadingMembers } = useProjectMembers(projectId);

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);

  // Timeline view range adjustments
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');

  // Track scroll sync
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);

  // Sync scroll between header and content
  const handleContentScroll = () => {
    if (timelineContentRef.current && timelineHeaderRef.current) {
      timelineHeaderRef.current.scrollLeft = timelineContentRef.current.scrollLeft;
    }
  };

  // Filter tasks locally to build Gantt data while keeping unfiltered reference for coordinates
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()));
      const matchAssignee = selectedAssignee ? task.assigneeId === selectedAssignee : true;
      const matchStatus = selectedStatus ? task.status === selectedStatus : true;
      const matchPriority = selectedPriority ? task.priority === selectedPriority : true;
      return matchSearch && matchAssignee && matchStatus && matchPriority;
    });
  }, [tasks, searchText, selectedAssignee, selectedStatus, selectedPriority]);

  // Determine date bounds of the timeline
  const timelineBounds = useMemo(() => {
    if (tasks.length === 0) {
      const start = dayjs().startOf('day');
      return {
        start,
        end: start.add(30, 'day'),
        days: 30,
      };
    }

    let minDate = dayjs();
    let maxDate = dayjs().add(14, 'day');

    tasks.forEach((t) => {
      const taskStart = t.startDate ? dayjs(t.startDate) : dayjs(t.createdAt);
      const taskEnd = t.deadline ? dayjs(t.deadline) : taskStart.add(2, 'day');
      
      if (taskStart.isBefore(minDate)) {
        minDate = taskStart;
      }
      if (taskEnd.isAfter(maxDate)) {
        maxDate = taskEnd;
      }
    });

    // Buffer: 3 days before earliest start, 7 days after latest deadline
    const start = minDate.subtract(3, 'day').startOf('day');
    const end = maxDate.add(7, 'day').endOf('day');
    const days = end.diff(start, 'day') + 1;

    return { start, end, days };
  }, [tasks]);

  // Width variables
  const dayWidth = zoomLevel === 'day' ? 50 : 20;
  const trackHeight = 52;
  const headerHeight = 44;

  // Generate date columns
  const datesList = useMemo(() => {
    const dates = [];
    let current = timelineBounds.start;
    while (current.isBefore(timelineBounds.end) || current.isSame(timelineBounds.end, 'day')) {
      dates.push(current);
      current = current.add(1, 'day');
    }
    return dates;
  }, [timelineBounds]);

  // Generate week/month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; span: number; left: number }[] = [];
    let current = timelineBounds.start;
    let span = 0;
    let left = 0;
    let currentMonth = current.format('MMMM YYYY');

    datesList.forEach((date, index) => {
      const monthStr = date.format('MMMM YYYY');
      if (monthStr !== currentMonth) {
        markers.push({
          label: currentMonth,
          span,
          left,
        });
        currentMonth = monthStr;
        left = index * dayWidth;
        span = 0;
      }
      span += dayWidth;
    });

    // Push last month
    markers.push({
      label: currentMonth,
      span,
      left,
    });

    return markers;
  }, [datesList, timelineBounds, dayWidth]);

  // Calculate coordinates of task bars
  const taskPositions = useMemo(() => {
    const positions: Record<string, { left: number; width: number; startDayIndex: number; endDayIndex: number }> = {};
    
    tasks.forEach((t) => {
      const taskStart = t.startDate ? dayjs(t.startDate) : dayjs(t.createdAt);
      const taskEnd = t.deadline ? dayjs(t.deadline) : taskStart.add(2, 'day');

      let startDayIndex = taskStart.diff(timelineBounds.start, 'day');
      let endDayIndex = taskEnd.diff(timelineBounds.start, 'day');

      if (startDayIndex < 0) startDayIndex = 0;
      if (endDayIndex < startDayIndex) endDayIndex = startDayIndex + 1;

      const left = startDayIndex * dayWidth;
      const width = Math.max((endDayIndex - startDayIndex + 1) * dayWidth - 4, 16); // Padding between bars

      positions[t.id] = { left, width, startDayIndex, endDayIndex };
    });

    return positions;
  }, [tasks, timelineBounds, dayWidth]);

  // Draw Dependency SVG Paths
  const svgPaths = useMemo(() => {
    const paths: { d: string; isCompleted: boolean; id: string; key: string }[] = [];
    
    // Build quick lookup for vertical index of filtered tasks
    const taskIndexLookup: Record<string, number> = {};
    filteredTasks.forEach((t, i) => {
      taskIndexLookup[t.id] = i;
    });

    filteredTasks.forEach((task, index) => {
      const deps = task.dependencies || [];
      deps.forEach((dep) => {
        const prereqId = dep.dependsOnId;
        const prereqIndex = taskIndexLookup[prereqId];
        
        // Only draw connection if both tasks are visible/filtered
        if (prereqIndex !== undefined && taskPositions[prereqId] && taskPositions[task.id]) {
          const prereqPos = taskPositions[prereqId];
          const taskPos = taskPositions[task.id];

          const startX = prereqPos.left + prereqPos.width;
          const startY = prereqIndex * trackHeight + trackHeight / 2;

          const endX = taskPos.left;
          const endY = index * trackHeight + trackHeight / 2;

          let d = '';
          const arrowOffset = 6;

          if (startX + 15 < endX) {
            // S-curve connector: goes right, drops down, goes right
            const midX = startX + (endX - startX) / 2;
            d = `M ${startX} ${startY} L ${midX} ${startY} C ${midX + 10} ${startY}, ${midX - 10} ${endY}, ${midX} ${endY} L ${endX - arrowOffset} ${endY}`;
          } else {
            // Loopback connector: goes right, loops back, goes right
            const loopX = startX + 12;
            const midY = startY + (endY - startY) / 2;
            const loopLeft = Math.min(prereqPos.left, taskPos.left) - 15;
            d = `M ${startX} ${startY} L ${loopX} ${startY} C ${loopX + 10} ${startY + 10}, ${loopX} ${midY}, ${loopLeft} ${midY} L ${loopLeft} ${endY} L ${endX - arrowOffset} ${endY}`;
          }

          paths.push({
            d,
            isCompleted: dep.dependsOn.status === 'DONE',
            id: dep.id,
            key: `${prereqId}-${task.id}`,
          });
        }
      });
    });

    return paths;
  }, [filteredTasks, taskPositions, trackHeight]);

  const getStatusColorHex = (status: string) => {
    switch (status) {
      case 'TODO': return '#71717a'; // Zinc
      case 'IN_PROGRESS': return '#6366f1'; // Indigo
      case 'REVIEW': return '#8b5cf6'; // Violet
      case 'DONE': return '#10b981'; // Emerald
      default: return '#71717a';
    }
  };

  const statusOptions = [
    { value: 'TODO', label: 'Cần làm' },
    { value: 'IN_PROGRESS', label: 'Đang làm' },
    { value: 'REVIEW', label: 'Đánh giá' },
    { value: 'DONE', label: 'Hoàn thành' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Thấp' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HIGH', label: 'Cao' },
    { value: 'URGENT', label: 'Khẩn cấp' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-[var(--bg)] dark:bg-[var(--bg)]">
        <Spin size="large" description="Đang tải sơ đồ lịch biểu..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-container)] rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
      
      {/* FILTER HEADER */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <Space wrap className="flex-1 min-w-0" size={12}>
          <Input
            placeholder="Tìm kiếm công việc..."
            prefix={<SearchOutlined className="text-zinc-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-56"
            allowClear
          />
          <Select
            placeholder="Người thực hiện"
            value={selectedAssignee}
            onChange={setSelectedAssignee}
            className="w-44"
            allowClear
            options={members.map((m) => ({
              value: m.user?.id,
              label: m.user?.name || m.user?.email,
            }))}
            loading={isLoadingMembers}
          />
          <Select
            placeholder="Trạng thái"
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-36"
            allowClear
            options={statusOptions}
          />
          <Select
            placeholder="Độ ưu tiên"
            value={selectedPriority}
            onChange={setSelectedPriority}
            className="w-36"
            allowClear
            options={priorityOptions}
          />
        </Space>

        <Space className="shrink-0" size={8}>
          <Select
            value={zoomLevel}
            onChange={setZoomLevel}
            className="w-24"
            options={[
              { value: 'day', label: 'Ngày' },
              { value: 'week', label: 'Tuần' },
            ]}
          />
          {isProjectLeader && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onOpenCreateTask(null)}
            >
              Công việc mới
            </Button>
          )}
        </Space>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-24 bg-[var(--bg-container)] flex items-center justify-center">
          <Empty description={searchText || selectedAssignee || selectedStatus || selectedPriority ? "Không tìm thấy công việc nào khớp bộ lọc" : "Chưa có công việc nào trong dự án này"} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* LEFT SIDEBAR: Tasks list */}
          <div className="w-[300px] sm:w-[350px] shrink-0 border-r border-[var(--border)] bg-[var(--bg)]/90 flex flex-col z-20 shadow-lg">
            {/* Header placeholder to align with scrollable dates header */}
            <div 
              className="px-4 border-b border-[var(--border)] flex items-center bg-[var(--bg)]/80 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider select-none"
              style={{ height: headerHeight }}
            >
              <span>Nhiệm vụ</span>
            </div>
            
            {/* Left tasks cells */}
            <div className="flex-1 overflow-y-hidden">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskDetail(task.id)}
                  className="px-4 border-b border-[var(--border)]/60 hover:bg-[var(--accent-bg)]/20 cursor-pointer transition-colors flex items-center justify-between min-w-0"
                  style={{ height: trackHeight }}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-xs font-semibold text-[var(--text-h)] truncate hover:text-[var(--accent)] transition-colors">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[var(--text-tertiary)]">
                      <ClockCircleOutlined />
                      <span>{task.startDate ? dayjs(task.startDate).format('DD/MM') : 'Chưa set'}</span>
                      <span>→</span>
                      <span>{task.deadline ? dayjs(task.deadline).format('DD/MM') : 'Không hạn'}</span>
                    </div>
                  </div>
                  <Space className="shrink-0" size={6}>
                    <Tooltip title={task.assignee?.name || 'Chưa gán'}>
                      <Avatar src={task.assignee?.avatar} size={18} icon={<UserOutlined />} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300" />
                    </Tooltip>
                    <div className="scale-75 origin-right">
                      <PriorityTag priority={task.priority} />
                    </div>
                  </Space>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR: Gantt timeline view */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-container)]">
            
            {/* Timeline Header (dates) */}
            <div 
              ref={timelineHeaderRef}
              className="overflow-x-hidden border-b border-[var(--border)] bg-[var(--bg)]/95 select-none scroll-smooth flex flex-col z-10 shrink-0"
              style={{ height: headerHeight }}
            >
              {/* Months Row */}
              <div className="h-6 flex border-b border-[var(--border)]/40 relative">
                {monthMarkers.map((m, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-r border-[var(--border)]/40 flex items-center px-2 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider"
                    style={{ left: m.left, width: m.span }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Days/Weeks Row */}
              <div className="h-5 flex relative" style={{ width: datesList.length * dayWidth }}>
                {datesList.map((date, idx) => {
                  const isToday = date.isSame(dayjs(), 'day');
                  const isWeekend = date.day() === 0 || date.day() === 6;
                  return (
                    <div
                      key={idx}
                      className={`absolute top-0 bottom-0 text-[8px] font-bold flex items-center justify-center border-r border-[var(--border)]/20 
                        ${isToday ? 'bg-indigo-500/10 text-indigo-400 font-extrabold' : isWeekend ? 'bg-zinc-500/5 text-zinc-400' : 'text-zinc-500'}
                      `}
                      style={{ left: idx * dayWidth, width: dayWidth }}
                    >
                      {zoomLevel === 'day' ? date.format('D') : date.format('D') === '1' || idx % 7 === 0 ? `W${date.week()}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Content Rows */}
            <div 
              ref={timelineContentRef}
              onScroll={handleContentScroll}
              className="flex-1 overflow-auto relative custom-scrollbar bg-[var(--bg-container)]"
            >
              {/* Timeline Grid (vertical day lines) */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none" 
                style={{ width: datesList.length * dayWidth }}
              >
                {datesList.map((date, idx) => {
                  const isToday = date.isSame(dayjs(), 'day');
                  const isWeekend = date.day() === 0 || date.day() === 6;
                  return (
                    <div
                      key={idx}
                      className={`absolute top-0 bottom-0 border-r border-[var(--border)]/10 
                        ${isToday ? 'border-l border-r border-indigo-500/30 bg-indigo-500/5' : isWeekend ? 'bg-zinc-500/[0.02]' : ''}
                      `}
                      style={{ left: idx * dayWidth, width: dayWidth }}
                    />
                  );
                })}
              </div>

              {/* DEPENDENCY LINES SVG OVERLAY */}
              <svg 
                className="absolute inset-0 pointer-events-none z-10 overflow-visible"
                style={{ width: datesList.length * dayWidth, height: filteredTasks.length * trackHeight }}
              >
                {/* SVG Marker definitions for connection arrows */}
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#818cf8" opacity="0.8" />
                  </marker>
                  <marker
                    id="arrow-done"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#34d399" opacity="0.6" />
                  </marker>
                </defs>

                {svgPaths.map((path) => (
                  <path
                    key={path.key}
                    d={path.d}
                    fill="none"
                    stroke={path.isCompleted ? '#34d399' : '#818cf8'}
                    strokeWidth={1.5}
                    strokeDasharray={path.isCompleted ? 'none' : '4 2'}
                    opacity={path.isCompleted ? 0.6 : 0.8}
                    markerEnd={`url(#${path.isCompleted ? 'arrow-done' : 'arrow'})`}
                  />
                ))}
              </svg>

              {/* GANTT BARS CONTAINER */}
              <div 
                className="relative" 
                style={{ width: datesList.length * dayWidth, height: filteredTasks.length * trackHeight }}
              >
                {filteredTasks.map((task, idx) => {
                  const pos = taskPositions[task.id];
                  if (!pos) return null;

                  const statusColor = getStatusColorHex(task.status);
                  
                  return (
                    <div
                      key={task.id}
                      className="absolute left-0 right-0 flex items-center border-b border-[var(--border)]/40 hover:bg-[var(--accent-bg)]/[0.04] transition-colors"
                      style={{ top: idx * trackHeight, height: trackHeight }}
                    >
                      {/* Gantt Bar */}
                      <Tooltip
                        title={
                          <div className="p-1 space-y-1">
                            <div className="font-bold text-xs border-b border-white/20 pb-1 mb-1">{task.title}</div>
                            <div className="text-[10px]">Trạng thái: <TaskStatusTag status={task.status} /></div>
                            <div className="text-[10px]">Độ ưu tiên: <PriorityTag priority={task.priority} /></div>
                            <div className="text-[10px]">Bắt đầu: {task.startDate ? dayjs(task.startDate).format('DD/MM/YYYY') : 'Chưa set'}</div>
                            <div className="text-[10px]">Hạn chót: {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : 'Không hạn'}</div>
                            <div className="text-[10px]">Người gán: {task.assignee?.name || 'Chưa gán'}</div>
                          </div>
                        }
                        color="var(--bg-container)"
                        styles={{ root: { maxWidth: 280 } }}
                        mouseEnterDelay={0.3}
                      >
                        <div
                          onClick={() => onOpenTaskDetail(task.id)}
                          className="absolute h-7 rounded-md cursor-pointer transition-transform hover:scale-[1.02] flex items-center px-2 select-none border shadow-md font-medium text-[10px]"
                          style={{
                            left: pos.left,
                            width: pos.width,
                            backgroundColor: `${statusColor}22`, // 15% opacity tint background
                            borderColor: statusColor,
                            color: statusColor,
                          }}
                        >
                          {/* Inner bar indicator */}
                          <div 
                            className="absolute top-0 bottom-0 left-0 w-1 rounded-l-md" 
                            style={{ backgroundColor: statusColor }} 
                          />
                          <span className="truncate pl-1 flex-1 text-[10px] font-semibold tracking-wide">
                            {task.title}
                          </span>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};
export default TaskTimeline;

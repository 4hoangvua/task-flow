import React, { useState } from 'react';
import { Card, Col, Row, Tag, Avatar, Space, Button, Input, Select, Spin, Tooltip, message } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import type { Task, TaskStatus } from '../../types';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';
import { PriorityTag } from '../common/PriorityTag';
import { TaskIdBadge } from '../common/TaskIdBadge';

interface TaskBoardProps {
  projectId: string;
  isProjectLeader?: boolean;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; border: string; dot: string }[] = [
  { id: 'TODO', title: 'Cần làm', color: 'board-column-solid', border: 'border-[var(--border)]', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'Đang thực hiện', color: 'board-column-solid', border: 'border-[var(--border)]', dot: 'bg-indigo-500' },
  { id: 'REVIEW', title: 'Chờ đánh giá', color: 'board-column-solid', border: 'border-[var(--border)]', dot: 'bg-amber-500' },
  { id: 'DONE', title: 'Hoàn thành', color: 'board-column-solid', border: 'border-[var(--border)]', dot: 'bg-emerald-500' },
];

// Pure Visual Task Card
const TaskCard = React.forwardRef<HTMLDivElement, {
  task: Task;
  onClick?: () => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragProps?: any;
}>(({ task, onClick, style, isDragging, isOverlay, dragProps }, ref) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';

  return (
    <div
      ref={ref}
      style={style}
      onClick={onClick}
      {...(dragProps || {})}
      className={`p-4 mb-3.5 bg-[var(--bg-card)] border rounded-lg shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing premium-card select-none ${isOverdue
        ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/5 dark:bg-rose-950/5'
        : 'border-[var(--border)]'
        } ${isOverlay ? 'shadow-2xl rotate-2 border-indigo-500 dark:border-indigo-600 scale-[1.03] cursor-grabbing active:cursor-grabbing opacity-95 z-[9999]' : ''}`}
    >
      <div className="flex justify-between items-center gap-2 mb-3">
        <PriorityTag priority={task.priority} />
        {task.deadline && (
          <span className={`text-xs flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-tertiary)]'}`}>
            <CalendarOutlined className="text-sm" /> {new Date(task.deadline).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>

      <h4 className="text-base font-bold text-[var(--text-h)] line-clamp-2 mb-4 leading-relaxed">
        {task.title}
      </h4>

      <div className="flex justify-end items-center border-t border-[var(--border)] pt-3 mt-3">
        <Space size={6}>
          {task.assignee ? (
            <Tooltip title={`Người thực hiện: ${task.assignee.name}`}>
              <Avatar src={task.assignee.avatar} size={24} className="bg-[var(--accent)] border border-[var(--border)] shadow-sm text-[11px] font-semibold">
                {task.assignee.name[0].toUpperCase()}
              </Avatar>
            </Tooltip>
          ) : (
            <Tooltip title="Chưa gán người thực hiện">
              <Avatar size={24} icon={<UserOutlined />} className="bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)] shadow-xs" />
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
  );
});

// Draggable Task Card Wrapper
const SortableTaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      task={task}
      onClick={onClick}
      isDragging={isDragging}
      dragProps={{ ...attributes, ...listeners }}
    />
  );
};

// Droppable Column Wrapper
const DroppableColumn = ({
  column,
  tasks,
  onTaskClick,
  onAddTaskClick,
  isProjectLeader = false,
}: {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onAddTaskClick: () => void;
  isProjectLeader?: boolean;
}) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-lg border ${column.border} ${column.color} p-4 min-h-[500px]`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <h3 className="font-bold text-sm text-[var(--text-h)] uppercase tracking-wide">
            {column.title}
          </h3>
          <span className="bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {column.id === 'TODO' && isProjectLeader && (
          <Button
            type="text"
            icon={<PlusOutlined />}
            size="small"
            onClick={onAddTaskClick}
            className="text-[var(--accent)] hover:bg-[var(--bg)]"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[var(--border)] rounded-lg bg-[var(--bg)]/10">
              <span className="text-xs text-[var(--text-tertiary)]">Không có công việc</span>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ projectId, isProjectLeader = false }) => {
  const { user: currentUser } = useAuth();
  const { members } = useProjectMembers(projectId);

  // Filters state
  const [searchText, setSearchText] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Tasks Query
  const { tasks, isLoading, reorderTasks } = useTasks(projectId);

  // Detail & Form Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Drag active state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Configure DndKit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // allows clicking without starting dragging
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let targetStatus: TaskStatus;
    let newOrder = 0;

    if (['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(overId)) {
      targetStatus = overId as TaskStatus;
      const targetTasks = tasks.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
      newOrder = targetTasks.length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;

      const targetTasks = tasks.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
      const index = targetTasks.findIndex((t) => t.id === overId);
      newOrder = index !== -1 ? index : targetTasks.length;
    }

    // Intercept drag-and-drop to enforce permissions on column transition
    if (targetStatus !== activeTask.status) {
      const isAssignee = activeTask.assigneeId === currentUser?.id;
      if (!isProjectLeader && !isAssignee) {
        message.error('Chỉ người thực hiện hoặc quản trị dự án mới có thể chuyển trạng thái công việc!');
        return;
      }
    }

    reorderTasks({
      taskId: activeId,
      newOrder,
      status: targetStatus,
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const getColumnTasks = (status: TaskStatus) => {
    return filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <div className="h-full">
      {/* Board Controls */}
      <Card className="mb-10 shadow-sm border border-[var(--border)] notebook-card">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <Input
              placeholder="Tìm công việc..."
              prefix={<SearchOutlined className="text-[var(--text-tertiary)]" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Select
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              className="w-full sm:w-48"
              placeholder="Người thực hiện"
              options={[
                { value: 'ALL', label: 'Tất cả thành viên' },
                ...members.map((m) => ({
                  value: m.user?.id,
                  label: m.user?.name || m.user?.email,
                })),
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              className="w-full sm:w-40"
              placeholder="Độ ưu tiên"
              options={[
                { value: 'ALL', label: 'Mọi độ ưu tiên' },
                { value: 'LOW', label: 'Thấp' },
                { value: 'MEDIUM', label: 'Trung bình' },
                { value: 'HIGH', label: 'Cao' },
                { value: 'URGENT', label: 'Khẩn cấp' },
              ]}
            />
          </div>

          {isProjectLeader && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsFormOpen(true)}
            >
              Thêm công việc
            </Button>
          )}
        </div>
      </Card>

      {/* Kanban Columns */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4 w-full">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1 min-w-[280px] max-w-[320px] shrink-0">
                <DroppableColumn
                  column={column}
                  tasks={getColumnTasks(column.id)}
                  onTaskClick={(id) => {
                    setSelectedTaskId(id);
                    setIsDetailOpen(true);
                  }}
                  onAddTaskClick={() => setIsFormOpen(true)}
                  isProjectLeader={isProjectLeader}
                />
              </div>
            ))}
          </div>

          <DragOverlay adjustScale={false}>
            {activeDragId ? (
              <TaskCard
                task={tasks.find((t) => t.id === activeDragId)!}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
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
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};
export default TaskBoard;

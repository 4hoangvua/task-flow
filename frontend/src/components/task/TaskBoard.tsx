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
import { getPriorityColor } from '../../utils/helpers';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';

interface TaskBoardProps {
  projectId: string;
  isProjectLeader?: boolean;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; border: string; dot: string }[] = [
  { id: 'TODO', title: 'Cần làm', color: 'bg-slate-50 dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-800', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'Đang thực hiện', color: 'bg-blue-50/20 dark:bg-blue-950/5', border: 'border-blue-100 dark:border-blue-950/40', dot: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Chờ đánh giá', color: 'bg-amber-50/20 dark:bg-amber-950/5', border: 'border-amber-100 dark:border-amber-950/40', dot: 'bg-amber-500' },
  { id: 'DONE', title: 'Hoàn thành', color: 'bg-emerald-50/20 dark:bg-emerald-950/5', border: 'border-emerald-100 dark:border-emerald-950/40', dot: 'bg-emerald-500' },
];

// Draggable Task Card
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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-4 mb-3 bg-white dark:bg-slate-900 border rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${
        isOverdue ? 'border-red-200 dark:border-red-950 bg-red-50/10' : 'border-slate-100 dark:border-slate-800/80'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <Tag color={getPriorityColor(task.priority)} className="m-0 text-[10px] font-semibold py-0.5 px-1.5 rounded">
          {task.priority}
        </Tag>
        {task.deadline && (
          <span className={`text-[10px] flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
            <CalendarOutlined /> {new Date(task.deadline).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-3">
        {task.title}
      </h4>

      <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800/50 pt-2.5 mt-2">
        <span className="text-[10px] text-slate-400 font-mono">#{task.id.substring(0, 8)}</span>
        <Space size={6}>
          {task.assignee ? (
            <Tooltip title={`Người thực hiện: ${task.assignee.name}`}>
              <Avatar src={task.assignee.avatar} size={20} className="bg-indigo-600 text-[10px]">
                {task.assignee.name[0].toUpperCase()}
              </Avatar>
            </Tooltip>
          ) : (
            <Tooltip title="Chưa gán người thực hiện">
              <Avatar size={20} icon={<UserOutlined />} className="bg-slate-100 text-slate-400 border border-slate-200 dark:border-slate-800" />
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
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
      className={`flex flex-col h-full rounded-2xl border ${column.border} ${column.color} p-4 min-h-[500px]`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {column.title}
          </h3>
          <span className="bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {column.id === 'TODO' && isProjectLeader && (
          <Button
            type="text"
            icon={<PlusOutlined />}
            size="small"
            onClick={onAddTaskClick}
            className="text-indigo-600 dark:text-indigo-400 hover:bg-slate-200/40"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/20 dark:bg-slate-900/10">
              <span className="text-xs text-slate-400">Không có công việc</span>
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

  // Configure DndKit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // allows clicking without starting dragging
      },
    })
  );

  const handleDragEnd = (event: any) => {
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
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <Input
              placeholder="Tìm công việc..."
              prefix={<SearchOutlined className="text-slate-400" />}
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
              className="bg-indigo-600 hover:bg-indigo-700"
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Row gutter={[16, 16]} className="flex-nowrap overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <Col xs={24} sm={12} md={8} lg={6} key={column.id} className="min-w-[280px]">
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
              </Col>
            ))}
          </Row>
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

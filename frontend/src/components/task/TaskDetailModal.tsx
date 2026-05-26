import React, { useState, useEffect } from 'react';
import { Modal, Tag, Avatar, Space, Button, Input, Divider, Select, Spin, Tooltip, Popconfirm, Checkbox, Progress } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HistoryOutlined,
  CommentOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useTaskDetail, useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { useProjectDetail, useProjectMembers } from '../../hooks/useProjects';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { TaskFormModal } from './TaskFormModal';
import { PriorityTag } from '../common/PriorityTag';
import { TaskStatusTag } from '../common/TaskStatusTag';

interface TaskDetailModalProps {
  taskId: string;
  projectId: string;
  open: boolean;
  onCancel: () => void;
  isProjectLeader?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  projectId,
  open,
  onCancel,
  isProjectLeader,
}) => {
  const { user: currentUser } = useAuth();
  const {
    task,
    isLoading,
    comments,
    addComment,
    isAddingComment,
    deleteComment,
    deleteTask,
    isDeleting,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    addDependency,
    isAddingDependency,
    removeDependency,
  } = useTaskDetail(taskId);

  const { project } = useProjectDetail(projectId);
  const { members } = useProjectMembers(projectId);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const computedIsProjectLeader = isProjectLeader !== undefined
    ? isProjectLeader
    : (currentMember?.role === 'LEADER' || currentUser?.role === 'ADMIN' || project?.ownerId === currentUser?.id);

  const { updateStatus, tasks: projectTasks } = useTasks(projectId);

  // States
  const [commentContent, setCommentContent] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    try {
      await addComment(commentContent);
      setCommentContent('');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteComment(id);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleStatusChange = async (value: string) => {
    try {
      await updateStatus({ id: taskId, status: value });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask();
      onCancel();
    } catch (err) {
      // Error handled by hook
    }
  };

  // Subtask Handlers
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await createSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isDone: boolean) => {
    try {
      await updateSubtask({ id: subtaskId, isDone });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleUpdateSubtaskTitle = async (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) return;
    try {
      await updateSubtask({ id: subtaskId, title: editingSubtaskTitle.trim() });
      setEditingSubtaskId(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(subtaskId);
    } catch (err) {
      // Error handled by hook
    }
  };

  // Dependency Handlers
  const handleAddDependency = async (dependsOnId: string) => {
    try {
      await addDependency(dependsOnId);
    } catch (err) {
      // Handled by hook
    }
  };

  const handleRemoveDependency = async (dependsOnId: string) => {
    try {
      await removeDependency(dependsOnId);
    } catch (err) {
      // Handled by hook
    }
  };

  const existingDepIds = task?.dependencies?.map((d) => d.dependsOnId) || [];
  const existingDependentIds = task?.dependents?.map((d) => d.taskId) || [];

  // Check if targetId is reachable from startId in the dependency graph
  const isReachable = (startId: string, targetId: string, visited = new Set<string>()): boolean => {
    if (startId === targetId) return true;
    visited.add(startId);

    const startTask = projectTasks.find((pt) => pt.id === startId);
    if (!startTask || !startTask.dependencies) return false;

    for (const dep of startTask.dependencies) {
      if (!visited.has(dep.dependsOnId)) {
        if (isReachable(dep.dependsOnId, targetId, visited)) {
          return true;
        }
      }
    }
    return false;
  };

  const availableTasksOptions = projectTasks
    .filter((t) => {
      if (t.id === taskId) return false;
      if (existingDepIds.includes(t.id)) return false;
      if (existingDependentIds.includes(t.id)) return false;
      return !isReachable(t.id, taskId);
    })
    .map((t) => ({
      value: t.id,
      label: t.title,
    }));

  if (isLoading || !task) {
    return (
      <Modal open={open} onCancel={onCancel} footer={null} width={700}>
        <div className="flex justify-center p-12"><Spin size="large" /></div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={850}
        title={
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center pr-6">
            <span className="text-xl font-bold text-[var(--text-h)] flex items-center gap-2">
              Chi tiết công việc
            </span>
            {computedIsProjectLeader && (
              <Space className="w-full sm:w-auto justify-start sm:justify-end">
                <Button
                  type="primary"
                  ghost
                  icon={<EditOutlined />}
                  onClick={() => setIsEditModalOpen(true)}
                  size={isMobile ? 'small' : 'middle'}
                >
                  Chỉnh sửa
                </Button>
                <Popconfirm
                  title="Xóa nhiệm vụ"
                  description="Bạn có chắc chắn muốn xóa nhiệm vụ này?"
                  onConfirm={handleDeleteTask}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true, loading: isDeleting }}
                >
                  <Button
                    type="primary"
                    danger
                    ghost
                    icon={<DeleteOutlined />}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </div>
        }
      >
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Area (Title, Description, Comments) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-h)]">{task.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-[var(--text-secondary)] font-medium">Độ ưu tiên:</span>
                <PriorityTag priority={task.priority} />
                <span className="text-xs text-[var(--text-secondary)] font-medium ml-2">Trạng thái:</span>
                <TaskStatusTag status={task.status} />
              </div>
              {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Nhãn:</span>
                  {task.labels.map((lbl) => (
                    <Tag key={lbl.id} color={lbl.color} style={{ border: 'none', borderRadius: '4px', fontWeight: 500 }}>
                      {lbl.name}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">MÔ TẢ CÔNG VIỆC</h3>
              <div className="bg-[var(--bg)]/50 p-4 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] whitespace-pre-wrap min-h-24 shadow-inner">
                {task.description || 'Không có mô tả chi tiết cho công việc này.'}
              </div>
            </div>

            <Divider className="my-2 border-[var(--border)]" />

            {/* Checklist / Subtask Section */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckSquareOutlined /> CÔNG VIỆC CON (CHECKLIST)
              </h3>
              
              {/* Progress Bar */}
              {task.subtasks && task.subtasks.length > 0 && (() => {
                const total = task.subtasks.length;
                const completed = task.subtasks.filter((s) => s.isDone).length;
                const percent = Math.round((completed / total) * 100);
                return (
                  <div className="mb-4">
                    <Progress 
                      percent={percent} 
                      strokeColor="var(--accent)" 
                      trailColor="var(--border)"
                      size="small"
                      format={() => `${completed}/${total} hoàn thành (${percent}%)`}
                    />
                  </div>
                );
              })()}

              {/* Subtasks List */}
              <div className="space-y-1 mb-4">
                {task.subtasks && task.subtasks.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="group flex items-center justify-between p-2 hover:bg-[var(--bg)]/60 rounded-lg border border-transparent hover:border-[var(--border)] transition-all"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Checkbox 
                        checked={sub.isDone} 
                        onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                        disabled={!computedIsProjectLeader && task.assigneeId !== currentUser?.id}
                      />
                      {editingSubtaskId === sub.id ? (
                        <Input
                          size="small"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onPressEnter={() => handleUpdateSubtaskTitle(sub.id)}
                          onBlur={() => handleUpdateSubtaskTitle(sub.id)}
                          className="py-0.5 px-1.5 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className={`text-sm truncate ${sub.isDone ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text)]'}`}
                          onClick={() => {
                            if (computedIsProjectLeader || task.assigneeId === currentUser?.id) {
                              setEditingSubtaskId(sub.id);
                              setEditingSubtaskTitle(sub.title);
                            }
                          }}
                          style={{ cursor: (computedIsProjectLeader || task.assigneeId === currentUser?.id) ? 'pointer' : 'default' }}
                        >
                          {sub.title}
                        </span>
                      )}
                    </div>
                    
                    {(computedIsProjectLeader || task.assigneeId === currentUser?.id) && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined className="text-xs" />}
                          onClick={() => {
                            setEditingSubtaskId(sub.id);
                            setEditingSubtaskTitle(sub.title);
                          }}
                          className="h-6 w-6 flex items-center justify-center p-0"
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined className="text-xs" />}
                          onClick={() => handleDeleteSubtask(sub.id)}
                          className="h-6 w-6 flex items-center justify-center p-0"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              {(computedIsProjectLeader || task.assigneeId === currentUser?.id) && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm công việc con mới..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onPressEnter={handleAddSubtask}
                    prefix={<PlusOutlined className="text-[var(--text-tertiary)]" />}
                    className="rounded-lg text-sm"
                  />
                  <Button 
                    type="primary" 
                    ghost
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="flex items-center"
                  >
                    Thêm
                  </Button>
                </div>
              )}
            </div>

            <Divider className="my-2 border-[var(--border)]" />

            {/* Task Dependencies Section */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <ClockCircleOutlined /> CÔNG VIỆC TIÊN QUYẾT (PHỤ THUỘC)
              </h3>

              {/* List of prerequisites (tasks this task depends on) */}
              <div className="space-y-2 mb-4">
                {task.dependencies && task.dependencies.length > 0 ? (
                  task.dependencies.map((dep) => {
                    const isCompleted = dep.dependsOn.status === 'DONE';
                    return (
                      <div 
                        key={dep.id} 
                        className="flex items-center justify-between p-2 bg-[var(--bg)]/40 border border-[var(--border)] rounded-lg text-sm"
                      >
                        <Space className="min-w-0 flex-1">
                          {!isCompleted && (
                            <Tooltip title="Công việc này cần hoàn thành trước">
                              <Tag color="warning" className="m-0 py-0.5 px-1.5" style={{ fontSize: '10px', borderRadius: '4px', border: 'none' }}>CẦN TRƯỚC</Tag>
                            </Tooltip>
                          )}
                          <span className="text-sm text-[var(--text)] font-medium truncate">
                            {dep.dependsOn.title}
                          </span>
                        </Space>

                        <Space size={8}>
                          <Tooltip title={dep.dependsOn.assignee?.name || 'Chưa gán'}>
                            <Avatar src={dep.dependsOn.assignee?.avatar} size="small" icon={<UserOutlined />} />
                          </Tooltip>
                          <TaskStatusTag status={dep.dependsOn.status} />
                          {(computedIsProjectLeader || task.assigneeId === currentUser?.id) && (
                            <Popconfirm
                              title="Gỡ bỏ liên kết phụ thuộc"
                              description="Bạn có chắc muốn gỡ bỏ liên kết này?"
                              onConfirm={() => handleRemoveDependency(dep.dependsOnId)}
                              okText="Gỡ"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined className="text-xs" />}
                                className="h-6 w-6 flex items-center justify-center p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                              />
                            </Popconfirm>
                          )}
                        </Space>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2 text-xs text-[var(--text-tertiary)] italic">Không có công việc tiên quyết.</div>
                )}
              </div>

              {/* List of dependents (tasks that depend on this task) */}
              {task.dependents && task.dependents.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Công việc bị ảnh hưởng (Bị phụ thuộc)</h4>
                  <div className="space-y-1.5">
                    {task.dependents.map((dep) => (
                      <div 
                        key={dep.id} 
                        className="flex items-center justify-between p-2 bg-[var(--bg)]/20 border border-[var(--border)] rounded-lg text-xs"
                      >
                        <span className="text-[var(--text-secondary)] truncate">{dep.task?.title}</span>
                        <Space>
                          <Avatar src={dep.task?.assignee?.avatar} size="small" icon={<UserOutlined />} />
                          <TaskStatusTag status={dep.task?.status || 'TODO'} />
                        </Space>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Dependency Select Dropdown */}
              {(computedIsProjectLeader || task.assigneeId === currentUser?.id) && (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Thêm công việc tiên quyết:</span>
                  <Select
                    showSearch
                    placeholder="Tìm kiếm công việc trong dự án..."
                    optionFilterProp="label"
                    value={null}
                    onChange={handleAddDependency}
                    loading={isAddingDependency}
                    className="flex-1"
                    options={availableTasksOptions}
                    notFoundContent="Không có công việc phù hợp"
                  />
                </div>
              )}
            </div>

            <Divider className="my-2 border-[var(--border)]" />

            {/* Comments Section */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <CommentOutlined /> BÌNH LUẬN ({comments.length})
              </h3>

              <div className="flex gap-3 mb-6">
                <Avatar src={currentUser?.avatar} className="bg-[var(--accent)] text-white font-semibold">
                  {currentUser?.name ? currentUser.name[0] : 'U'}
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Input.TextArea
                    placeholder="Viết bình luận hoặc ý kiến phản hồi của bạn..."
                    rows={2}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="rounded-xl"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      onClick={handleAddComment}
                      loading={isAddingComment}
                    >
                      Bình luận
                    </Button>
                  </div>
                </div>
              </div>

              {comments.length === 0 ? (
                <div className="py-4 text-center text-xs text-[var(--text-tertiary)]">Chưa có bình luận nào</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {comments.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3.5 bg-[var(--bg)]/40 border border-[var(--border)] rounded-lg hover:shadow-xs transition-shadow">
                      <Avatar src={item.user?.avatar} className="bg-[var(--accent-bg)] text-[var(--accent)] font-semibold mt-0.5">
                        {item.user?.name ? item.user.name[0] : 'U'}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-semibold text-[var(--text-h)]">
                            {item.user?.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-tertiary)]">{formatDate(item.createdAt)}</span>
                            {(currentUser?.id === item.userId || computedIsProjectLeader) && (
                              <Tooltip title="Xóa bình luận">
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined className="text-xs" />}
                                  size="small"
                                  className="h-6 w-6 flex items-center justify-center p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                  onClick={() => handleDeleteComment(item.id)}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          {item.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Area (Metadata details, History logs) */}
          <div className="space-y-6 lg:border-l lg:border-[var(--border)] lg:pl-6">
            <div className="bg-[var(--bg)]/30 border border-[var(--border)] rounded-lg p-4.5 space-y-4">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1.5 uppercase font-bold tracking-wider">TRẠNG THÁI</span>
                <Select
                  value={task.status}
                  onChange={handleStatusChange}
                  className="w-full"
                  disabled={!computedIsProjectLeader && task.assigneeId !== currentUser?.id}
                  options={[
                    { value: 'TODO', label: 'Cần làm' },
                    { value: 'IN_PROGRESS', label: 'Đang làm' },
                    { value: 'REVIEW', label: 'Đánh giá' },
                    { value: 'DONE', label: 'Hoàn thành' },
                  ]}
                />
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">HẠN CHÓT</span>
                <Space size={6} className="mt-1.5 text-[var(--text-secondary)]">
                  <CalendarOutlined className="text-xs" />
                  <span className="text-sm font-medium">
                    {task.deadline ? formatDate(task.deadline).split(' ')[0] : 'Không có'}
                  </span>
                </Space>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">NGƯỜI THỰC HIỆN</span>
                <Space size={6} className="mt-1.5">
                  <Avatar src={task.assignee?.avatar} icon={<UserOutlined />} size="small" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {task.assignee?.name || 'Chưa gán'}
                  </span>
                </Space>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">NGƯỜI TẠO</span>
                <Space size={6} className="mt-1.5">
                  <Avatar src={task.creator?.avatar} icon={<UserOutlined />} size="small" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {task.creator?.name || 'N/A'}
                  </span>
                </Space>
              </div>
            </div>


            <Divider className="my-2" />

            {/* Task History logs */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HistoryOutlined /> Lịch sử thay đổi
              </h3>
              {task.history && task.history.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {task.history.map((log) => {
                    let logText = '';
                    if (log.field === 'status') {
                      logText = `chuyển trạng thái từ "${log.oldValue || 'Bắt đầu'}" sang "${log.newValue}"`;
                    } else if (log.field === 'assigneeId') {
                      logText = `thay đổi người thực hiện`;
                    } else {
                      logText = `cập nhật trường "${log.field}" thành "${log.newValue}"`;
                    }

                    return (
                      <div key={log.id} className="text-[11px] leading-relaxed border-b border-[var(--border)] pb-2 last:border-0">
                        <span className="font-semibold text-[var(--text)]">{log.user?.name} </span>
                        <span className="text-[var(--text-secondary)]">{logText}</span>
                        <div className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                          <ClockCircleOutlined /> {formatDate(log.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-[var(--text-tertiary)]">Chưa có lịch sử thay đổi</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Task Form Modal for editing */}
      <TaskFormModal
        projectId={projectId}
        task={task}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
      />
    </>
  );
};
export default TaskDetailModal;

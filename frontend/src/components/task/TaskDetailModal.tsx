import React, { useState } from 'react';
import { Modal, Tag, Avatar, Space, Button, Input, Divider, Select, Spin, Tooltip, Popconfirm } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HistoryOutlined,
  CommentOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
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
  } = useTaskDetail(taskId);

  const { project } = useProjectDetail(projectId);
  const { members } = useProjectMembers(projectId);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const computedIsProjectLeader = isProjectLeader !== undefined
    ? isProjectLeader
    : (currentMember?.role === 'LEADER' || currentUser?.role === 'ADMIN' || project?.ownerId === currentUser?.id);

  const { updateStatus } = useTasks(projectId);

  // States
  const [commentContent, setCommentContent] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
          <div className="flex justify-between items-center pr-6">
            <span className="text-xl font-bold text-[var(--text-h)] flex items-center gap-2">
              Chi tiết công việc
            </span>
            {computedIsProjectLeader && (
              <Space>
                <Button
                  type="primary"
                  ghost
                  icon={<EditOutlined />}
                  onClick={() => setIsEditModalOpen(true)}
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
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">MÔ TẢ CÔNG VIỆC</h3>
              <div className="bg-[var(--bg)]/50 p-4 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] whitespace-pre-wrap min-h-24 shadow-inner">
                {task.description || 'Không có mô tả chi tiết cho công việc này.'}
              </div>
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
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">NGƯỜI THỰC HIỆN</span>
                <Space size={6} className="mt-1.5">
                  <Avatar src={task.assignee?.avatar} icon={<UserOutlined />} size="small" className="bg-[var(--accent-bg)] text-[var(--accent)] font-semibold" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {task.assignee?.name || 'Chưa gán'}
                  </span>
                </Space>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block mb-1 uppercase font-bold tracking-wider">HẠN CHÓT</span>
                <Space size={6} className="mt-1.5 text-[var(--text-secondary)]">
                  <CalendarOutlined className="text-xs" />
                  <span className="text-sm font-medium">
                    {task.deadline ? formatDate(task.deadline) : 'Không có'}
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

import React, { useState } from 'react';
import { Modal, Tag, Avatar, Space, Button, Input, List, Divider, Select, Spin, Tooltip, Popconfirm } from 'antd';
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
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{task.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Tag color={getPriorityColor(task.priority)}>Độ ưu tiên: {task.priority}</Tag>
                <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">MÔ TẢ CÔNG VIỆC</h3>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-24 shadow-inner">
                {task.description || 'Không có mô tả chi tiết cho công việc này.'}
              </div>
            </div>

            <Divider className="my-2 border-slate-100 dark:border-slate-800" />

            {/* Comments Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CommentOutlined /> BÌNH LUẬN ({comments.length})
              </h3>

              <div className="flex gap-3 mb-6">
                <Avatar src={currentUser?.avatar} className="bg-indigo-600 text-white font-semibold">
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

              <List
                dataSource={comments}
                locale={{ emptyText: <span className="text-xs text-slate-400">Chưa có bình luận nào</span> }}
                renderItem={(item) => (
                  <div className="flex gap-3 p-3.5 mb-3 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-800/50 rounded-2xl hover:shadow-xs transition-shadow">
                    <Avatar src={item.user?.avatar} className="bg-indigo-100 text-indigo-700 font-semibold mt-0.5">
                      {item.user?.name ? item.user.name[0] : 'U'}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.user?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{formatDate(item.createdAt)}</span>
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
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {item.content}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Right Area (Metadata details, History logs) */}
          <div className="space-y-6 lg:border-l lg:border-slate-100/80 lg:dark:border-slate-800/80 lg:pl-6">
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4.5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1.5 uppercase font-bold tracking-wider">TRẠNG THÁI</span>
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
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold tracking-wider">NGƯỜI THỰC HIỆN</span>
                <Space size={6} className="mt-1.5">
                  <Avatar src={task.assignee?.avatar} icon={<UserOutlined />} size="small" className="bg-indigo-100 text-indigo-700 font-semibold" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {task.assignee?.name || 'Chưa gán'}
                  </span>
                </Space>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold tracking-wider">HẠN CHÓT</span>
                <Space size={6} className="mt-1.5 text-slate-600 dark:text-slate-400">
                  <CalendarOutlined className="text-xs" />
                  <span className="text-sm font-medium">
                    {task.deadline ? formatDate(task.deadline) : 'Không có'}
                  </span>
                </Space>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold tracking-wider">NGƯỜI TẠO</span>
                <Space size={6} className="mt-1.5">
                  <Avatar src={task.creator?.avatar} icon={<UserOutlined />} size="small" className="bg-slate-100 text-slate-700 font-semibold" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {task.creator?.name || 'N/A'}
                  </span>
                </Space>
              </div>
            </div>

            <Divider className="my-2" />

            {/* Task History logs */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                      <div key={log.id} className="text-[11px] leading-relaxed border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{log.user?.name} </span>
                        <span className="text-slate-500">{logText}</span>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <ClockCircleOutlined /> {formatDate(log.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Chưa có lịch sử thay đổi</span>
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

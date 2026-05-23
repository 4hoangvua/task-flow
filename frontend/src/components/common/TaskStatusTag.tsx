import React from 'react';
import { Tag } from 'antd';

interface TaskStatusTagProps {
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | string;
  className?: string;
}

export const TaskStatusTag: React.FC<TaskStatusTagProps> = ({ status, className = '' }) => {
  const label = status === 'TODO' 
    ? 'Cần làm' 
    : status === 'IN_PROGRESS' 
    ? 'Đang làm' 
    : status === 'REVIEW' 
    ? 'Chờ đánh giá' 
    : 'Hoàn thành';

  return (
    <Tag
      bordered={false}
      className={`inline-flex items-center m-0 text-xs font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full ${
        status === 'TODO'
          ? '!bg-slate-100 dark:!bg-zinc-800/60 !text-slate-500 dark:!text-slate-400 !border !border-slate-200 dark:!border-zinc-800/80'
          : status === 'IN_PROGRESS'
          ? '!bg-indigo-50 dark:!bg-indigo-950/30 !text-indigo-600 dark:!text-indigo-400 !border !border-indigo-100 dark:!border-indigo-900/50'
          : status === 'REVIEW'
          ? '!bg-amber-50 dark:!bg-amber-950/30 !text-amber-600 dark:!text-amber-400 !border !border-amber-100 dark:!border-amber-900/50'
          : '!bg-emerald-50 dark:!bg-emerald-950/20 !text-emerald-600 dark:!text-emerald-400 !border !border-emerald-100/50 dark:!border-emerald-900/50'
      } ${className}`}
    >
      {label}
    </Tag>
  );
};

export default TaskStatusTag;

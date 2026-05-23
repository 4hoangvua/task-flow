import React from 'react';
import { Tag } from 'antd';

interface ProjectStatusTagProps {
  status: 'ACTIVE' | 'ARCHIVED' | string;
  className?: string;
}

export const ProjectStatusTag: React.FC<ProjectStatusTagProps> = ({ status, className = '' }) => {
  const isActive = status === 'ACTIVE';

  return (
    <Tag
      bordered={false}
      className={`inline-flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
        isActive
          ? '!bg-emerald-500/15 !text-emerald-400 !border !border-emerald-500/30'
          : '!bg-zinc-800/40 !text-zinc-400 !border !border-zinc-800'
      } ${className}`}
    >
      {isActive ? 'Đang hoạt động' : 'Đã lưu trữ'}
    </Tag>
  );
};

export default ProjectStatusTag;

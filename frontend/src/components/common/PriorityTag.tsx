import React from 'react';
import { Tag } from 'antd';

interface PriorityTagProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  className?: string;
}

export const PriorityTag: React.FC<PriorityTagProps> = ({ priority, className = '' }) => {
  const isHighOrUrgent = priority === 'HIGH' || priority === 'URGENT';
  const isMedium = priority === 'MEDIUM';

  const label = priority === 'LOW' 
    ? 'Thấp' 
    : priority === 'MEDIUM' 
    ? 'Trung bình' 
    : priority === 'HIGH' 
    ? 'Cao' 
    : 'Khẩn cấp';

  return (
    <Tag
      bordered={false}
      className={`inline-flex items-center m-0 text-xs font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full ${
        isHighOrUrgent
          ? '!bg-rose-500/15 !text-rose-400 !border !border-rose-500/30'
          : isMedium
          ? '!bg-amber-500/15 !text-amber-400 !border !border-amber-500/30'
          : '!bg-zinc-800/40 !text-zinc-400 !border !border-zinc-800'
      } ${className}`}
    >
      {label}
    </Tag>
  );
};

export default PriorityTag;

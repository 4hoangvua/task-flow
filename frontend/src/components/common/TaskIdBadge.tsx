import React from 'react';

interface TaskIdBadgeProps {
  id: string;
  className?: string;
}

export const TaskIdBadge: React.FC<TaskIdBadgeProps> = ({ id, className = '' }) => {
  const displayId = id.substring(0, 8).toUpperCase();

  return (
    <span className={`inline-flex items-center font-mono text-xs bg-[var(--bg)] px-2 py-1 rounded text-[var(--text-secondary)] border border-[var(--border)]/50 select-all ${className}`}>
      #{displayId}
    </span>
  );
};

export default TaskIdBadge;

import type { Priority, TaskStatus, Role, MemberRole } from '../types';

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'LOW':
      return 'blue';
    case 'MEDIUM':
      return 'green';
    case 'HIGH':
      return 'orange';
    case 'URGENT':
      return 'red';
    default:
      return 'default';
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'TODO':
      return 'default';
    case 'IN_PROGRESS':
      return 'processing';
    case 'REVIEW':
      return 'warning';
    case 'DONE':
      return 'success';
    default:
      return 'default';
  }
}

export function getRoleColor(role: Role | MemberRole): string {
  switch (role) {
    case 'ADMIN':
      return 'purple';
    case 'LEADER':
      return 'gold';
    case 'MEMBER':
      return 'cyan';
    default:
      return 'default';
  }
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

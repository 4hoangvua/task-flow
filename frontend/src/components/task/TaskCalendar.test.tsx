import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskCalendar } from './TaskCalendar';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import React from 'react';
import dayjs from 'dayjs';

// Mock hooks
vi.mock('../../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

vi.mock('../../hooks/useProjects', () => ({
  useProjectMembers: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock Modals
vi.mock('./TaskDetailModal', () => ({
  TaskDetailModal: ({ open, onClose }: any) => open ? <div data-testid="detail-modal">Detail Modal <button onClick={onClose}>Close</button></div> : null,
}));

vi.mock('./TaskFormModal', () => ({
  TaskFormModal: ({ open, onClose }: any) => open ? <div data-testid="form-modal">Form Modal <button onClick={onClose}>Close</button></div> : null,
}));

describe('TaskCalendar Component', () => {
  const mockTasks = [
    {
      id: 'task-1',
      title: 'High Priority Task',
      deadline: dayjs().set('date', 15).toISOString(),
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: 'user-2',
      projectId: 'proj-1',
    },
    {
      id: 'task-2',
      title: 'Urgent Task',
      deadline: dayjs().set('date', 20).toISOString(),
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: 'user-1',
      projectId: 'proj-1',
    }
  ];

  const mockMembers = [
    {
      id: 'pm-1',
      userId: 'user-1',
      role: 'LEADER',
      user: { id: 'user-1', name: 'Leader User', email: 'leader@example.com' }
    },
    {
      id: 'pm-2',
      userId: 'user-2',
      role: 'MEMBER',
      user: { id: 'user-2', name: 'Member User', email: 'member@example.com' }
    }
  ];

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', name: 'Leader User', role: 'LEADER' },
    } as any);

    vi.mocked(useProjectMembers).mockReturnValue({
      members: mockMembers,
      loading: false,
    } as any);

    vi.mocked(useTasks).mockReturnValue({
      tasks: mockTasks,
      loading: false,
    } as any);
  });

  it('should render the calendar header and filters', () => {
    render(<TaskCalendar projectId="proj-1" isProjectLeader={true} />);
    
    // Check navigation and control buttons
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
    expect(screen.getByText(/Chọn người thực hiện/i)).toBeInTheDocument();
    expect(screen.getByText(/Độ ưu tiên/i)).toBeInTheDocument();
  });

  it('should display tasks on the calendar', () => {
    render(<TaskCalendar projectId="proj-1" isProjectLeader={true} />);
    
    expect(screen.getByText('High Priority Task')).toBeInTheDocument();
    expect(screen.getByText('Urgent Task')).toBeInTheDocument();
  });

  it('should open TaskDetailModal when a task is clicked', () => {
    render(<TaskCalendar projectId="proj-1" isProjectLeader={true} />);
    
    const taskBadge = screen.getByText('High Priority Task');
    fireEvent.click(taskBadge);
    
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
  });
});

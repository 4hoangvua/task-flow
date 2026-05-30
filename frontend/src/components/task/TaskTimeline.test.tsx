import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTimeline } from './TaskTimeline';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjects';
import React from 'react';
import dayjs from 'dayjs';

// Mock hooks
vi.mock('../../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

vi.mock('../../hooks/useProjects', () => ({
  useProjectMembers: vi.fn(),
}));

describe('TaskTimeline Component', () => {
  const mockTasks = [
    {
      id: 'task-1',
      title: 'Timeline Task A',
      startDate: dayjs().toISOString(),
      deadline: dayjs().add(5, 'day').toISOString(),
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: 'user-2',
      projectId: 'proj-1',
      dependencies: [],
    },
    {
      id: 'task-2',
      title: 'Timeline Task B',
      startDate: dayjs().add(2, 'day').toISOString(),
      deadline: dayjs().add(8, 'day').toISOString(),
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: 'user-1',
      projectId: 'proj-1',
      dependencies: [],
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

  const mockOpenTaskDetail = vi.fn();
  const mockOpenCreateTask = vi.fn();

  beforeEach(() => {
    vi.mocked(useProjectMembers).mockReturnValue({
      members: mockMembers,
      loading: false,
    } as any);

    vi.mocked(useTasks).mockReturnValue({
      tasks: mockTasks,
      loading: false,
    } as any);

    mockOpenTaskDetail.mockClear();
    mockOpenCreateTask.mockClear();
  });

  it('should render the timeline header, search input, and task rows', () => {
    render(
      <TaskTimeline
        projectId="proj-1"
        isProjectLeader={true}
        onOpenTaskDetail={mockOpenTaskDetail}
        onOpenCreateTask={mockOpenCreateTask}
      />
    );
    
    // Check filter inputs and zoom selector
    expect(screen.getByPlaceholderText('Tìm kiếm công việc...')).toBeInTheDocument();
    
    // Check task titles are rendered in the left pane list
    expect(screen.getAllByText('Timeline Task A')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Timeline Task B')[0]).toBeInTheDocument();
  });

  it('should trigger onOpenTaskDetail when clicking on a task item', () => {
    render(
      <TaskTimeline
        projectId="proj-1"
        isProjectLeader={true}
        onOpenTaskDetail={mockOpenTaskDetail}
        onOpenCreateTask={mockOpenCreateTask}
      />
    );
    
    const taskItem = screen.getAllByText('Timeline Task A')[0];
    fireEvent.click(taskItem);
    
    expect(mockOpenTaskDetail).toHaveBeenCalledWith('task-1');
  });

  it('should trigger onOpenCreateTask when clicking the Create Task button', () => {
    render(
      <TaskTimeline
        projectId="proj-1"
        isProjectLeader={true}
        onOpenTaskDetail={mockOpenTaskDetail}
        onOpenCreateTask={mockOpenCreateTask}
      />
    );
    
    const createBtn = screen.getByRole('button', { name: /Công việc mới/i });
    fireEvent.click(createBtn);
    
    expect(mockOpenCreateTask).toHaveBeenCalled();
  });
});

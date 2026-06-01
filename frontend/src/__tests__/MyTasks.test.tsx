// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MyTasks } from '../pages/intern/MyTasks';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/queries';
import api from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/queries', () => ({
  useTasks: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../components/common/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../components/common/Navbar', () => ({
  Navbar: ({ title }: { title: string }) => <div data-testid="navbar">{title}</div>,
}));

vi.mock('../components/common/Modal', () => ({
  Modal: ({ children, isOpen }: { children: any, isOpen: boolean }) => (
    isOpen ? <div data-testid="modal">{children}</div> : null
  ),
}));

describe('MyTasks', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern', intern: { id: 'intern-1' } },
    } as any);

    vi.mocked(useTasks).mockReturnValue({
      data: [
        {
          id: 't-1',
          title: 'Implement Unit Tests',
          description: 'Create frontend unit testing suite',
          priority: 'HIGH',
          status: 'TODO',
          dueDate: '2026-06-30T00:00:00.000Z',
          internId: 'intern-1',
          intern: { user: { name: 'Charlie Intern' } },
          mentor: { user: { name: 'Bob Mentor' } },
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'c-1', comment: 'Looks good!', userId: 'u-1', createdAt: new Date().toISOString(), user: { name: 'Charlie Intern' } }
        ],
      },
    });
  });

  it('should render the Kanban board with Todo tasks', async () => {
    render(<MyTasks />);
    expect(screen.getByText('Implement Unit Tests')).toBeTruthy();
    expect(screen.getByText('Create frontend unit testing suite')).toBeTruthy();
  });

  it('should support starting a task', async () => {
    render(<MyTasks />);
    
    // Open detailed task view (click on the card)
    const taskCard = screen.getByText('Implement Unit Tests');
    fireEvent.click(taskCard);

    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText('Start Task')).toBeTruthy();

    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });

    const startBtn = screen.getByText('Start Task');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/tasks/t-1', { status: 'IN_PROGRESS' });
    });
  });

  it('should support task discussions and posting comments', async () => {
    render(<MyTasks />);


    const discussionTab = screen.getByText('Discussions & Feedback Thread');
    fireEvent.click(discussionTab);

    await waitFor(() => {
      expect(screen.getByText(/Looks good!/)).toBeTruthy();
    });

    const commentInput = screen.getByPlaceholderText('Ask your mentor or leave updates...');
    fireEvent.change(commentInput, { target: { value: 'Almost finished task!' } });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'c-2', comment: 'Almost finished task!', userId: 'u-1', createdAt: new Date().toISOString(), user: { name: 'Charlie Intern' } }
      }
    });

    const sendBtn = screen.getByRole('button', { name: '' }); // the send button has svg only
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tasks/t-1/comments', { comment: 'Almost finished task!' });
      expect(screen.getByText(/Almost finished task!/)).toBeTruthy();
    });
  });
});

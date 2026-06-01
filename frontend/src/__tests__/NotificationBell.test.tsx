// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { NotificationBell } from '../components/common/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../store/useNotificationStore';
import { useInternByUser } from '../hooks/queries';
import { useNavigate } from 'react-router-dom';


vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../store/useNotificationStore', () => ({
  useNotificationStore: vi.fn(),
}));

vi.mock('../hooks/queries', () => ({
  useInternByUser: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('NotificationBell', () => {
  let mockNavigate: any;
  let mockMarkAsRead: any;
  let mockMarkAllAsRead: any;
  let mockFetchNotifications: any;

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern' },
    } as any);

    vi.mocked(useInternByUser).mockReturnValue({
      data: { mentor: { user: { name: 'Bob Mentor' } } },
    } as any);

    mockMarkAsRead = vi.fn().mockResolvedValue(true);
    mockMarkAllAsRead = vi.fn().mockResolvedValue(true);
    mockFetchNotifications = vi.fn();

    vi.mocked(useNotificationStore).mockReturnValue({
      notifications: [
        { id: 'n-1', title: 'New Task Assigned', message: 'You have a new task.', type: 'TASK', isRead: false, createdAt: new Date().toISOString() },
        { id: 'n-2', title: 'Leave Approved', message: 'Your leave has been approved.', type: 'LEAVE', isRead: false, createdAt: new Date().toISOString() },
        { id: 'n-3', title: 'Bob Mentor', message: 'Hello intern', type: 'CHAT', isRead: false, createdAt: new Date().toISOString() },
      ],
      unreadCount: 3,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      fetchNotifications: mockFetchNotifications,
    } as any);
  });

  it('should render the bell icon and show the unread badge', () => {
    render(<NotificationBell />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(mockFetchNotifications).toHaveBeenCalled();
  });

  it('should toggle notifications dropdown on click', () => {
    render(<NotificationBell />);
    
    // Dropdown should not be visible initially
    expect(screen.queryByText('Notifications')).toBeNull();

    // Click the bell
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Dropdown should be visible now
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('New Task Assigned')).toBeTruthy();
  });

  it('should support mark all as read action', () => {
    render(<NotificationBell />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    const markReadBtn = screen.getByText('Mark read');
    fireEvent.click(markReadBtn);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should support clicking on a notification to mark as read and navigate', async () => {
    render(<NotificationBell />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    const firstNotification = screen.getByText('New Task Assigned');
    fireEvent.click(firstNotification);

    expect(mockMarkAsRead).toHaveBeenCalledWith('n-1');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/intern/tasks');
    });
  });

  it('should support chat notification formatting and navigation', async () => {
    render(<NotificationBell />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Bob Mentor (Mentor)')).toBeTruthy();

    const chatNotification = screen.getByText('Bob Mentor (Mentor)');
    fireEvent.click(chatNotification);

    expect(mockMarkAsRead).toHaveBeenCalledWith('n-3');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/shared/communication');
    });
  });
});

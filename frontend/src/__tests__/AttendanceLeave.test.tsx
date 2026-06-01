// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { AttendanceLeave } from '../pages/shared/attendance/AttendanceLeave';
import { useAuth } from '../hooks/useAuth';
import { useLeaves, useAttendance } from '../hooks/queries';
import api from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/queries', () => ({
  useLeaves: vi.fn(),
  useAttendance: vi.fn(),
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
    promise: vi.fn(),
  },
}));

vi.mock('../components/common/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../components/common/Navbar', () => ({
  Navbar: ({ title }: { title: string }) => <div data-testid="navbar">{title}</div>,
}));

describe('AttendanceLeave', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
    } as any);

    vi.mocked(useLeaves).mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAttendance).mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as any);

    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/attendance/today') return { data: { success: true, data: null } };
      if (url === '/attendance/settings') {
        return {
          data: {
            success: true,
            data: {
              internshipStartDate: '2026-05-01',
              internshipEndDate: '2026-08-31',
              lateThreshold: '09:15',
            },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });
  });

  it('should render locked state for pending onboarding intern', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern', intern: { status: 'PENDING' } },
    } as any);

    render(<AttendanceLeave />);

    await waitFor(() => {
      expect(screen.getByText(/Onboarding verification pending/i)).toBeTruthy();
    });
  });

  it('should render punch in option for active intern', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern', intern: { status: 'ACTIVE' } },
    } as any);

    render(<AttendanceLeave />);

    await waitFor(() => {
      expect(screen.getByText('Record Check-In')).toBeTruthy();
    });
  });

  it('should support checking in and typing notes', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern', intern: { status: 'ACTIVE' } },
    } as any);

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: { checkIn: new Date().toISOString(), status: 'PRESENT' } },
    });

    render(<AttendanceLeave />);

    await waitFor(() => {
      expect(screen.getByText('Record Check-In')).toBeTruthy();
    });

    const notesInput = screen.getByPlaceholderText('What are you working on today?');
    fireEvent.change(notesInput, { target: { value: 'Working on testing suite' } });

    const checkInBtn = screen.getByText('Record Check-In');
    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/attendance/checkin', { notes: 'Working on testing suite' });
    });
  });

  it('should render leave application form for interns', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Charlie Intern', role: 'intern', intern: { status: 'ACTIVE' } },
    } as any);

    render(<AttendanceLeave />);

    await waitFor(() => {
      expect(screen.getByText('Apply for Leave')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Apply for Leave'));

    await waitFor(() => {
      expect(screen.getByText('Request Absence Leave')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Please provide a clear and detailed description/i)).toBeTruthy();
    });
  });

  it('should render pending approvals for mentors', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'm-1', name: 'Bob Mentor', role: 'mentor', mentor: { id: 'ment-1' } },
    } as any);

    vi.mocked(useLeaves).mockReturnValue({
      data: [
        {
          id: 'l-1',
          leaveType: 'SICK',
          startDate: '2026-06-10',
          endDate: '2026-06-11',
          reason: 'Sick leave request',
          status: 'Pending Mentor',
          mentorId: 'ment-1',
          user: { name: 'Charlie Intern' },
        },
      ],
      refetch: vi.fn(),
    } as any);

    render(<AttendanceLeave />);

    await waitFor(() => {
      expect(screen.getByText('Leave Approvals Inbox')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Leave Approvals Inbox'));

    await waitFor(() => {
      expect(screen.getByText(/Sick leave request/)).toBeTruthy();
    });

    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });
    const approveBtn = screen.getByTitle('Approve Request');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/leaves/mentor-approve', { id: 'l-1', reason: 'Authorized by Bob Mentor' });
    });
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { AIFeedback } from '../pages/shared/feedback/AIFeedback';
import { useSubmitFeedback, useInterns } from '../hooks/queries';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/queries', () => ({
  useSubmitFeedback: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useInterns: vi.fn(() => ({
    data: [],
  })),
}));

vi.mock('../components/common/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../components/common/Navbar', () => ({
  Navbar: ({ title }: { title: string }) => <div data-testid="navbar">{title}</div>,
}));

describe('AIFeedback Component Conditional Role Rendering', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render only Insights tab for HR role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'hr-1', name: 'Alice HR', role: 'hr' },
    } as any);

    render(<AIFeedback />);
    
    expect(screen.getByText('AI Insights Dashboard')).toBeTruthy();
    expect(screen.queryByText('Mentor Feedback Submission')).toBeNull();
    expect(screen.queryByText('Intern Self Evaluation')).toBeNull();
  });

  it('should render Mentor and Insights tabs for Mentor role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'm-1', name: 'Bob Mentor', role: 'mentor' },
    } as any);

    vi.mocked(useInterns).mockReturnValue({
      data: [
        { id: 'int-1', user: { name: 'Charlie Intern' }, mentor: { user: { name: 'Bob Mentor' } } },
      ],
    } as any);

    render(<AIFeedback />);
    
    expect(screen.getByText('AI Insights Dashboard')).toBeTruthy();
    expect(screen.getByText('Mentor Feedback Submission')).toBeTruthy();
    expect(screen.queryByText('Intern Self Evaluation')).toBeNull();
  });

  it('should render Intern and Insights tabs for Intern role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'int-1', name: 'Charlie Intern', role: 'intern' },
    } as any);

    render(<AIFeedback />);
    
    expect(screen.getByText('AI Insights Dashboard')).toBeTruthy();
    expect(screen.queryByText('Mentor Feedback Submission')).toBeNull();
    expect(screen.getByText('Intern Self Evaluation')).toBeTruthy();
  });
});

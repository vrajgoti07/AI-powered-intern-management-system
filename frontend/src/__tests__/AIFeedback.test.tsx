// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIFeedback } from '../pages/shared/feedback/AIFeedback';
import { useSubmitFeedback, useInterns } from '../hooks/queries';
import { useAuth } from '../hooks/useAuth';

vi.mock('../services/api', () => ({
  API_BASE_URL: 'http://localhost:5000/api/v1',
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          insights: {
            averageRating: 4.5,
            sentimentDistribution: { positive: 70, neutral: 20, constructive: 10 },
            executiveInsight: 'Strong progress across all targets.',
            keywords: ['initiative', 'proactive'],
            trends: [
              { week: 'W1', rating: 4.2, sentimentScore: 80 }
            ],
            internSummaries: [
              { internId: 'int-1', name: 'Charlie Intern', department: 'Engineering', averageRating: 4.5, riskLevel: 'LOW', activeActionItems: 1, lastEvaluationDate: '2026-06-01' }
            ]
          },
          actionItems: [
            { id: 'act-1', task: 'Follow up on design guidelines', status: 'TODO', intern: { user: { name: 'Charlie Intern' } } }
          ],
          feedbackHistory: []
        }
      }
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

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
  useDepartments: vi.fn(() => ({
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

  it('should render only Insights tab for HR role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'hr-1', name: 'Alice HR', role: 'hr' },
    } as any);

    render(
      <MemoryRouter>
        <AIFeedback />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Executive Analytics Portal')).toBeTruthy();
    expect(screen.queryByText('Mentor Evaluation Console')).toBeNull();
    expect(screen.queryByText('Your Cohort Progress Dashboard')).toBeNull();
  });

  it('should render Mentor and Insights tabs for Mentor role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'm-1', name: 'Bob Mentor', role: 'mentor' },
    } as any);

    vi.mocked(useInterns).mockReturnValue({
      data: [
        { id: 'int-1', user: { name: 'Charlie Intern' }, mentor: { user: { name: 'Bob Mentor' } } },
      ],
    } as any);

    render(
      <MemoryRouter>
        <AIFeedback />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Mentor Evaluation Console')).toBeTruthy();
    expect(screen.queryByText('Executive Analytics Portal')).toBeNull();
    expect(screen.queryByText('Your Cohort Progress Dashboard')).toBeNull();
  });

  it('should render Intern and Insights tabs for Intern role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'int-1', name: 'Charlie Intern', role: 'intern' },
    } as any);

    render(
      <MemoryRouter>
        <AIFeedback />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Your Cohort Progress Dashboard')).toBeTruthy();
    expect(screen.queryByText('Executive Analytics Portal')).toBeNull();
    expect(screen.queryByText('Mentor Evaluation Console')).toBeNull();
  });
});

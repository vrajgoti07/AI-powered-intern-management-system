// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIChatbot } from '../pages/intern/AIChatbot';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  }
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useApp', () => ({
  useApp: vi.fn(),
}));

vi.mock('../hooks/queries', () => ({
  useInternByUser: vi.fn(() => ({ data: null })),
  useTasks: vi.fn(() => ({ data: [] })),
}));

vi.mock('../components/common/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../components/common/Navbar', () => ({
  Navbar: ({ title }: { title: string }) => <div data-testid="navbar">{title}</div>,
}));

describe('AIChatbot Sources and Modal Rendering', () => {
  let mockDispatch = vi.fn();

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    mockDispatch = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', name: 'John Doe', role: 'intern' },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render message list and "No references" label when bot message has no sources', () => {
    vi.mocked(useApp).mockReturnValue({
      state: {
        chatHistory: [
          { sender: 'bot', text: 'Hello! I am your AI assistant.' }
        ]
      },
      dispatch: mockDispatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <MemoryRouter>
        <AIChatbot />
      </MemoryRouter>
    );

    // Verify label "No references" is displayed
    expect(screen.getByTestId('no-references')).toBeTruthy();
    expect(screen.getByText('No references')).toBeTruthy();
  });

  it('should render source pills when bot message has sources', () => {
    vi.mocked(useApp).mockReturnValue({
      state: {
        chatHistory: [
          {
            sender: 'bot',
            text: 'Here is the information you requested.',
            sources: [
              {
                source_file: 'company_handbook.pdf',
                page_number: 5,
                chunk_text: 'Matched chunk content for handbook.',
                file_url: 'https://cloudinary.com/handbook.pdf'
              }
            ]
          }
        ]
      },
      dispatch: mockDispatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <MemoryRouter>
        <AIChatbot />
      </MemoryRouter>
    );

    // Verify source pill is displayed
    const sourcesContainer = screen.getByTestId('sources-container');
    expect(sourcesContainer).toBeTruthy();
    
    const sourcePill = screen.getByTestId('source-pill');
    expect(sourcePill).toBeTruthy();
    expect(screen.getByText('company_handbook.pdf')).toBeTruthy();
    expect(screen.getByText('p. 5')).toBeTruthy();
  });

  it('should open modal/drawer when clicking a source pill', async () => {
    vi.mocked(useApp).mockReturnValue({
      state: {
        chatHistory: [
          {
            sender: 'bot',
            text: 'Refer to company guidelines.',
            sources: [
              {
                source_file: 'guidelines.pdf',
                page_number: 12,
                chunk_text: 'Policy detail content goes here.',
                file_url: 'https://cloudinary.com/guidelines.pdf'
              }
            ]
          }
        ]
      },
      dispatch: mockDispatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <MemoryRouter>
        <AIChatbot />
      </MemoryRouter>
    );

    // Click source pill
    const sourcePill = screen.getByTestId('source-pill');
    fireEvent.click(sourcePill);

    // Verify modal is open and has correct content
    const modal = screen.getByTestId('source-modal');
    expect(modal).toBeTruthy();
    expect(screen.getByTestId('modal-source-file').textContent).toBe('guidelines.pdf');
    expect(screen.getByTestId('modal-page-number').textContent).toBe('Page 12');
    expect(screen.getByTestId('modal-chunk-text').textContent).toContain('Policy detail content goes here.');

    const pdfLink = screen.getByTestId('modal-pdf-link') as HTMLAnchorElement;
    expect(pdfLink).toBeTruthy();
    expect(pdfLink.href).toBe('https://cloudinary.com/guidelines.pdf');

    // Close modal
    const closeBtn = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeBtn);

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByTestId('source-modal')).toBeNull();
    });
  });
});

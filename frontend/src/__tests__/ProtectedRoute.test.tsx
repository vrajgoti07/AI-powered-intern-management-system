// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import { render, screen, cleanup } from '@testing-library/react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>,
}));

vi.mock('../pages/shared/AccessDenied', () => ({
  AccessDenied: () => <div data-testid="access-denied">Access Denied</div>,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePermission).mockReturnValue({
      hasPermission: () => true,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });


  it('should display spinner when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as any);

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should redirect to login if user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as any);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate').textContent).toContain('/login');
  });

  it('should render children if user is authenticated and no roles are specified', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Intern', role: 'intern' },
      isLoading: false,
    } as any);

    render(
      <ProtectedRoute>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content').textContent).toBe('Protected Content');
  });

  it('should permit access if user role matches allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Intern', role: 'INTERN' },
      isLoading: false,
    } as any);

    render(
      <ProtectedRoute allowedRoles={['intern']}>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content').textContent).toBe('Protected Content');
  });

  it('should deny access if user role does not match allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Intern', role: 'INTERN' },
      isLoading: false,
    } as any);

    render(
      <ProtectedRoute allowedRoles={['hr']}>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('access-denied').textContent).toBe('Access Denied');
  });

  it('should permit access if permission matches', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Intern', role: 'INTERN' },
      isLoading: false,
    } as any);

    vi.mocked(usePermission).mockReturnValue({
      hasPermission: () => true,
    } as any);

    render(
      <ProtectedRoute requiredPermission="some-perm">
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content').textContent).toBe('Protected Content');
  });

  it('should deny access if permission is missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', name: 'Intern', role: 'INTERN' },
      isLoading: false,
    } as any);

    vi.mocked(usePermission).mockReturnValue({
      hasPermission: () => false,
    } as any);

    render(
      <ProtectedRoute requiredPermission="missing-perm">
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('access-denied').textContent).toBe('Access Denied');
  });
});

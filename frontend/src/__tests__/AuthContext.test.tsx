// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useContext } from 'react';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const TestComponent = () => {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No Auth Context</div>;
  return (
    <div>
      <div data-testid="auth-loading">{auth.isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="auth-user">{auth.user ? auth.user.name : 'no-user'}</div>
      <button data-testid="login-btn" onClick={() => auth.login('test@test.com', 'pass')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
      <button data-testid="otp-btn" onClick={() => auth.sendLoginOtp('test@test.com', 'pass')}>
        Send OTP
      </button>
      <button data-testid="verify-btn" onClick={() => auth.verifyLoginOtp('test@test.com', 'pass', '123456')}>
        Verify OTP
      </button>
      <button data-testid="logoutall-btn" onClick={() => auth.logoutAll()}>
        Logout All
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });


  it('should initialize with no user', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    });
    expect(screen.getByTestId('auth-user').textContent).toBe('no-user');
  });

  it('should load user if token is present in localStorage', async () => {
    localStorage.setItem('internflow_access_token', 'mock-token');
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'u-1',
          name: 'Alice',
          email: 'alice@test.com',
          role: 'HR',
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Alice');
    });
  });

  it('should support login flow', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: 'u-2', name: 'Bob', email: 'bob@test.com', role: 'INTERN' },
          accessToken: 'at-1',
          refreshToken: 'rt-1',
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'pass',
    });
    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Bob');
    });
    expect(localStorage.getItem('internflow_access_token')).toBe('at-1');
  });

  it('should support logout flow', async () => {
    localStorage.setItem('internflow_access_token', 'mock-token');
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'u-1', name: 'Alice', email: 'alice@test.com', role: 'HR' },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Alice');
    });

    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('no-user');
    });
    expect(localStorage.getItem('internflow_access_token')).toBeNull();
  });

  it('should support sending login OTP', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: { directLogin: false },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    });

    await act(async () => {
      screen.getByTestId('otp-btn').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/send-otp', expect.any(Object));
  });

  it('should support verifying login OTP', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: 'u-3', name: 'Charlie', email: 'charlie@test.com', role: 'MENTOR' },
          accessToken: 'at-2',
          refreshToken: 'rt-2',
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    });

    await act(async () => {
      screen.getByTestId('verify-btn').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', expect.any(Object));
    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Charlie');
    });
  });

  it('should support logoutAll flow', async () => {
    localStorage.setItem('internflow_access_token', 'mock-token');
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'u-1', name: 'Alice', email: 'alice@test.com', role: 'HR' },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Alice');
    });

    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      screen.getByTestId('logoutall-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('no-user');
    });
  });
});

import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Dynamic secure multi-step email OTP functions with smart session bypass
  sendLoginOtp: (email: string, pass: string) => Promise<{ success: boolean; directLogin?: boolean }>;
  verifyLoginOtp: (email: string, pass: string, otpCode: string) => Promise<boolean | { requiresTOTP: true; pendingToken: string }>;
  logoutAll: () => Promise<boolean>;
  verify2FA: (pendingToken: string, code: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate persistent device fingerprint locally
const getDeviceFingerprint = (): string => {
  let fingerprint = localStorage.getItem('internflow_device_fingerprint');
  if (!fingerprint) {
    fingerprint = 'df-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('internflow_device_fingerprint', fingerprint);
  }
  return fingerprint;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inactivity tracking refs
  const lastActivityRef = useRef<number>(Date.now());
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('internflow_access_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.data) {
            const fullUser = res.data.data;
            const mappedUser: User = {
              ...fullUser,
              role: fullUser.role.toLowerCase() === 'department_head' ? 'mentor' : fullUser.role.toLowerCase(),
              originalRole: fullUser.role,
              headedDepartment: fullUser.headedDepartment
            };
            setUser(mappedUser);
            localStorage.setItem('internflow_user', JSON.stringify(mappedUser));
          }
        } catch (err) {
          console.error('Authentication check failed:', err);
          localStorage.removeItem('internflow_access_token');
          localStorage.removeItem('internflow_refresh_token');
          localStorage.removeItem('internflow_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // background keep-alive check + inactivity timeout loop (3 Hours = 10,800,000 ms)
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen to user interactions
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    const checkInterval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Inactivity trigger: 3 hours
      if (timeSinceLastActivity >= 3 * 60 * 60 * 1000) {
        toast.error('Session expired due to 3 hours of inactivity. Please login again.');
        logout();
        return;
      }

      // Auto Session Refresh keep-alive: active check every 10 minutes
      const timeSinceLastRefresh = now - lastRefreshRef.current;
      if (timeSinceLastRefresh >= 10 * 60 * 1000 && timeSinceLastActivity < 10 * 60 * 1000) {
        try {
          const deviceFingerprint = getDeviceFingerprint();
          const res = await api.post('/auth/refresh-session', { deviceFingerprint });
          if (res.data.success && res.data.data) {
            const { accessToken, refreshToken } = res.data.data;
            localStorage.setItem('internflow_access_token', accessToken);
            localStorage.setItem('internflow_refresh_token', refreshToken);
            lastRefreshRef.current = now;
            console.log('Trusted session extended automatically in the background.');
          }
        } catch (err: any) {
          console.error('Auto session refresh failed:', err);
          if (err.response?.status === 401) {
            toast.error('Session invalidated. Please login again.');
            logout();
          }
        }
      }
    }, 60 * 1000); // Poll every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(checkInterval);
    };
  }, [user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password: pass });

      if (res.data.success && res.data.data) {
        const { user: loggedInUser, accessToken, refreshToken } = res.data.data;

        localStorage.setItem('internflow_access_token', accessToken);
        localStorage.setItem('internflow_refresh_token', refreshToken);

        const mappedUser: User = {
          ...loggedInUser,
          role: loggedInUser.role.toLowerCase() === 'department_head' ? 'mentor' : loggedInUser.role.toLowerCase(),
          originalRole: loggedInUser.role,
          headedDepartment: loggedInUser.headedDepartment
        };

        setUser(mappedUser);
        localStorage.setItem('internflow_user', JSON.stringify(mappedUser));

        // Reset activity tracking
        lastActivityRef.current = Date.now();
        lastRefreshRef.current = Date.now();

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login request failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to authenticate.';
      toast.error(errMsg);
      return false;
    }
  };

  const sendLoginOtp = async (email: string, pass: string): Promise<{ success: boolean; directLogin?: boolean }> => {
    try {
      const deviceFingerprint = getDeviceFingerprint();
      const res = await api.post('/auth/send-otp', { email, password: pass, deviceFingerprint });
      if (res.data.success && res.data.data) {
        const { directLogin, user: loggedInUser, accessToken, refreshToken } = res.data.data;
        if (directLogin) {
          localStorage.setItem('internflow_access_token', accessToken);
          localStorage.setItem('internflow_refresh_token', refreshToken);

          const mappedUser: User = {
            ...loggedInUser,
            role: loggedInUser.role.toLowerCase() === 'department_head' ? 'mentor' : loggedInUser.role.toLowerCase(),
            originalRole: loggedInUser.role,
            headedDepartment: loggedInUser.headedDepartment
          };

          setUser(mappedUser);
          localStorage.setItem('internflow_user', JSON.stringify(mappedUser));

          // Reset activity tracking
          lastActivityRef.current = Date.now();
          lastRefreshRef.current = Date.now();

          return { success: true, directLogin: true };
        }
        return { success: true, directLogin: false };
      }
      return { success: false };
    } catch (err: any) {
      console.error('OTP request failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to request verification code.';
      toast.error(errMsg);
      return { success: false };
    }
  };

  const verifyLoginOtp = async (email: string, pass: string, otpCode: string): Promise<boolean | { requiresTOTP: true; pendingToken: string }> => {
    try {
      const deviceFingerprint = getDeviceFingerprint();
      const res = await api.post('/auth/verify-otp', { email, password: pass, otpCode, deviceFingerprint });
      
      if (res.status === 202 && res.data?.data?.requiresTOTP) {
        return {
          requiresTOTP: true,
          pendingToken: res.data.data.pendingToken,
        };
      }

      if (res.data.success && res.data.data) {
        const { user: loggedInUser, accessToken, refreshToken } = res.data.data;

        localStorage.setItem('internflow_access_token', accessToken);
        localStorage.setItem('internflow_refresh_token', refreshToken);

        const mappedUser: User = {
          ...loggedInUser,
          role: loggedInUser.role.toLowerCase() === 'department_head' ? 'mentor' : loggedInUser.role.toLowerCase(),
          originalRole: loggedInUser.role,
          headedDepartment: loggedInUser.headedDepartment
        };

        setUser(mappedUser);
        localStorage.setItem('internflow_user', JSON.stringify(mappedUser));

        // Reset activity tracking
        lastActivityRef.current = Date.now();
        lastRefreshRef.current = Date.now();

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Invalid verification passcode.';
      toast.error(errMsg);
      return false;
    }
  };

  const verify2FA = async (pendingToken: string, code: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/2fa/verify', { pendingToken, code });
      if (res.data.success && res.data.data) {
        const { user: loggedInUser, accessToken, refreshToken } = res.data.data;

        localStorage.setItem('internflow_access_token', accessToken);
        localStorage.setItem('internflow_refresh_token', refreshToken);

        const mappedUser: User = {
          ...loggedInUser,
          role: loggedInUser.role.toLowerCase() === 'department_head' ? 'mentor' : loggedInUser.role.toLowerCase(),
          originalRole: loggedInUser.role,
          headedDepartment: loggedInUser.headedDepartment
        };

        setUser(mappedUser);
        localStorage.setItem('internflow_user', JSON.stringify(mappedUser));

        // Reset activity tracking
        lastActivityRef.current = Date.now();
        lastRefreshRef.current = Date.now();

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('2FA verification failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Invalid 2FA passcode.';
      toast.error(errMsg);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Backend logout call failed:', err);
    } finally {
      // Disconnect socket connection
      try {
        import('../services/socket.service').then(({ socketService }) => {
          socketService.disconnect();
        });
      } catch (socketErr) {
        console.warn('Failed to disconnect socket on logout:', socketErr);
      }

      setUser(null);
      localStorage.removeItem('internflow_access_token');
      localStorage.removeItem('internflow_refresh_token');
      localStorage.removeItem('internflow_user');
      toast.success('Logged out successfully.');
    }
  };

  const logoutAll = async (): Promise<boolean> => {
    try {
      const res = await api.delete('/security/logout-all');
      if (res.data.success) {
        // Disconnect socket connection
        try {
          import('../services/socket.service').then(({ socketService }) => {
            socketService.disconnect();
          });
        } catch (socketErr) {
          console.warn('Failed to disconnect socket on logoutAll:', socketErr);
        }

        setUser(null);
        localStorage.removeItem('internflow_access_token');
        localStorage.removeItem('internflow_refresh_token');
        localStorage.removeItem('internflow_user');
        toast.success('Logged out from all devices successfully.');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Logout all devices failed:', err);
      const errMsg = err.message || err.response?.data?.message || 'Failed to logout from all devices.';
      toast.error(errMsg);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, sendLoginOtp, verifyLoginOtp, logoutAll, verify2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

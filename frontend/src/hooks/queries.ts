import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// --- INTERNS ---
export const useInterns = (filters?: any) => {
  return useQuery({
    queryKey: ['interns', filters],
    queryFn: async () => {
      const { data } = await api.get('/interns', { params: filters });
      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    },
  });
};

export const useIntern = (id: string) => {
  return useQuery({
    queryKey: ['intern', id],
    queryFn: async () => {
      const { data } = await api.get(`/interns/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useInternByUser = (userId: string) => {
  return useQuery({
    queryKey: ['interns', 'user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/interns/user/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });
};

// --- MENTORS ---
export const useMentors = (filters?: any) => {
  return useQuery({
    queryKey: ['mentors', filters],
    queryFn: async () => {
      const { data } = await api.get('/mentors', { params: filters });
      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    },
  });
};

// --- DEPARTMENTS ---
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments/list');
      return data.data;
    },
  });
};

export const useReports = (filters?: any) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const response = await api.get('/reports/internship-summary', {
        params: { internId: filters?.internId, ...filters },
      });
      return response.data.data;
    },
  });
};

export const useHRFeedbacks = () => {
  return useQuery({
    queryKey: ['hr-feedbacks'],
    queryFn: async () => {
      const response = await api.get('/feedback/hr');
      return response.data.data;
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { rating: number; comment: string; category?: string }) => {
      const response = await api.post('/feedback', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-feedbacks'] });
    },
  });
};

// --- TASKS ---
export const useTasks = (filters?: any) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params: filters });
      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    },
  });
};

export const useTaskAnalytics = () => {
  return useQuery({
    queryKey: ['tasks', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/analytics');
      return data.data;
    },
  });
};

// --- LEAVES ---
export const useLeaves = (filters?: any) => {
  return useQuery({
    queryKey: ['leaves', filters],
    queryFn: async () => {
      const { data } = await api.get('/leave', { params: filters });
      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    },
  });
};

// --- ATTENDANCE ---
export const useAttendance = (filters?: any) => {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const { data } = await api.get('/attendance', { params: filters });
      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    },
  });
};

export const useAttendanceAnalytics = (filters?: any) => {
  return useQuery({
    queryKey: ['attendance', 'analytics', filters],
    queryFn: async () => {
      const { data } = await api.get('/attendance/analytics', { params: filters });
      return data.data;
    },
  });
};

// --- ANALYTICS ---
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data.data;
    },
  });
};

// --- NOTIFICATIONS ---
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.notifications || [];
    },
    refetchInterval: 3000, // Poll every 3 seconds for live updates
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// --- GAMIFICATION ---
export const useGamificationStats = () => {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/gamification/stats');
      return data.data;
    },
  });
};

export const useGamificationLeaderboard = () => {
  return useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/gamification/leaderboard');
      return data.data;
    },
  });
};

export const useAllBadges = () => {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: async () => {
      const { data } = await api.get('/gamification/badges');
      return data.data;
    },
  });
};

// --- DAILY STANDUPS ---
export const useTodayStandup = () => {
  return useQuery({
    queryKey: ['standups', 'today'],
    queryFn: async () => {
      const { data } = await api.get('/standups/today');
      return data.data;
    },
  });
};

export const useSubmitStandup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { yesterday: string; today: string; blockers?: string; mood: string }) => {
      const response = await api.post('/standups/submit', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standups', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
    },
  });
};

export const useStandupHistory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['standups', 'history', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/standups/my-history', { params: { page, limit } });
      return data.data;
    },
  });
};

export const useTeamStandups = (dateString?: string) => {
  return useQuery({
    queryKey: ['standups', 'team', dateString],
    queryFn: async () => {
      const { data } = await api.get('/standups/team', { params: { date: dateString } });
      return data.data;
    },
  });
};

export const useStandupSettings = () => {
  return useQuery({
    queryKey: ['standups', 'settings'],
    queryFn: async () => {
      const { data } = await api.get('/standups/settings');
      return data.data;
    },
  });
};

export const useUpdateStandupSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      isEnabled?: boolean;
      promptTime?: string;
      cutoffTime?: string;
      timezone?: string;
      missedAlertThreshold?: number;
      weekendsEnabled?: boolean;
    }) => {
      const response = await api.put('/standups/settings', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standups', 'settings'] });
    },
  });
};



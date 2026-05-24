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

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get('/reports');
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

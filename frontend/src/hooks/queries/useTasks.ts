import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export const useTasks = (internId?: string, filters?: any) => {
  return useQuery({
    queryKey: ['tasks', internId, filters],
    queryFn: async () => {
      const params = { ...filters, internId };
      const { data } = await api.get('/tasks', { params });
      return data;
    },
  });
};

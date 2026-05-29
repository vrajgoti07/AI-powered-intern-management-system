import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export const useAttendance = (internId: string, month: string) => {
  return useQuery({
    queryKey: ['attendance', internId, month],
    queryFn: async () => {
      const { data } = await api.get('/attendance', { params: { internId, month } });
      return data;
    },
    enabled: !!internId && !!month,
  });
};

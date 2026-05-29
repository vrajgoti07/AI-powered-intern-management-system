import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });
};

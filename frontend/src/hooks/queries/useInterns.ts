import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export const useInterns = (filters?: any) => {
  return useQuery({
    queryKey: ['interns', filters],
    queryFn: async () => {
      const { data } = await api.get('/interns', { params: filters });
      return data;
    },
  });
};

export const useIntern = (id: string) => {
  return useQuery({
    queryKey: ['interns', id],
    queryFn: async () => {
      const { data } = await api.get(`/interns/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateIntern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIntern: any) => {
      const { data } = await api.post('/interns', newIntern);
      return data;
    },
    onMutate: async (newIntern) => {
      await queryClient.cancelQueries({ queryKey: ['interns'] });
      const previousInterns = queryClient.getQueryData(['interns']);
      
      // Optimistic update
      // We might not have the full structure, but we append it
      queryClient.setQueryData(['interns'], (old: any) => {
        if (!old) return old;
        return {
           ...old,
           data: [...(old.data || []), { ...newIntern, id: 'temp-id' }]
        };
      });

      return { previousInterns };
    },
    onError: (err, newIntern, context) => {
      if (context?.previousInterns) {
        queryClient.setQueryData(['interns'], context.previousInterns);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['interns'] });
    },
  });
};

export const useUpdateIntern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data } = await api.patch(`/interns/${id}`, updateData);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      queryClient.invalidateQueries({ queryKey: ['interns', variables.id] });
    },
  });
};

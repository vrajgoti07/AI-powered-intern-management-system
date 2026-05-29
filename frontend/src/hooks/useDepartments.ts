import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../services/departmentApi';
import { useDepartmentStore } from '../store/useDepartmentStore';

export const useDepartments = () => {
  const filters = useDepartmentStore((state) => state.filters);

  return useQuery({
    queryKey: ['departments', filters],
    queryFn: () => departmentApi.getDepartments(filters),
  });
};

export const useDepartmentById = (id: string | null) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentApi.getDepartmentById(id!),
    enabled: !!id,
  });
};

export const useDepartmentDashboard = (id: string | null) => {
  return useQuery({
    queryKey: ['departmentDashboard', id],
    queryFn: () => departmentApi.getDashboard(id!),
    enabled: !!id,
  });
};

export const useDepartmentInterns = (id: string | null) => {
  return useQuery({
    queryKey: ['departmentInterns', id],
    queryFn: () => departmentApi.getInterns(id!),
    enabled: !!id,
  });
};

export const useDepartmentReports = (id: string | null) => {
  return useQuery({
    queryKey: ['departmentReports', id],
    queryFn: () => departmentApi.getReports(id!),
    enabled: !!id,
  });
};

export const useDepartmentProjects = (id: string | null) => {
  return useQuery({
    queryKey: ['departmentProjects', id],
    queryFn: () => departmentApi.getProjects(id!),
    enabled: !!id,
  });
};

export const useCreateDepartmentProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => departmentApi.createProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departmentProjects', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['departmentDashboard', variables.id] });
    },
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => departmentApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => departmentApi.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

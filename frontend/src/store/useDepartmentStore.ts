import { create } from 'zustand';

interface DepartmentFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

interface DepartmentState {
  selectedDepartmentId: string | null;
  filters: DepartmentFilters;
  dashboardTab: 'overview' | 'interns' | 'mentors' | 'projects' | 'reports';
  
  setSelectedDepartmentId: (id: string | null) => void;
  setFilters: (filters: Partial<DepartmentFilters>) => void;
  setDashboardTab: (tab: 'overview' | 'interns' | 'mentors' | 'projects' | 'reports') => void;
  resetFilters: () => void;
}

const initialFilters: DepartmentFilters = {
  search: '',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
};

export const useDepartmentStore = create<DepartmentState>((set) => ({
  selectedDepartmentId: null,
  filters: initialFilters,
  dashboardTab: 'overview',
  
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  resetFilters: () => set({ filters: initialFilters }),
}));

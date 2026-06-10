import { create } from 'zustand';

interface ReportFilters {
  departmentId?: string;
  status?: string;
  cgpaMin?: number;
  cgpaMax?: number;
  scoreMin?: number;
  scoreMax?: number;
  attendanceMin?: number;
  attendanceMax?: number;
  joinedDateStart?: string;
  joinedDateEnd?: string;
  skills?: string[];
}

interface ReportBuilderState {
  step: number;
  selectedColumns: string[];
  filters: ReportFilters;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  previewData: any[];
  previewCount: number;
  loading: boolean;
  
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedColumns: (columns: string[]) => void;
  toggleColumn: (column: string) => void;
  setFilters: (filters: ReportFilters) => void;
  updateFilter: (key: keyof ReportFilters, value: any) => void;
  setSort: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  setPreviewData: (data: any[], count: number) => void;
  setLoading: (loading: boolean) => void;
  resetBuilder: () => void;
}

const initialFilters: ReportFilters = {
  departmentId: '',
  status: '',
  cgpaMin: undefined,
  cgpaMax: undefined,
  scoreMin: undefined,
  scoreMax: undefined,
  attendanceMin: undefined,
  attendanceMax: undefined,
  joinedDateStart: '',
  joinedDateEnd: '',
  skills: [],
};

const defaultColumns = ['name', 'email', 'status', 'departmentName', 'score', 'attendance'];

export const useReportBuilderStore = create<ReportBuilderState>((set) => ({
  step: 1,
  selectedColumns: defaultColumns,
  filters: initialFilters,
  sortBy: 'joinedDate',
  sortOrder: 'DESC',
  previewData: [],
  previewCount: 0,
  loading: false,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(3, state.step + 1) })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  setSelectedColumns: (selectedColumns) => set({ selectedColumns }),
  toggleColumn: (column) => set((state) => {
    const isSelected = state.selectedColumns.includes(column);
    const updated = isSelected
      ? state.selectedColumns.filter(c => c !== column)
      : [...state.selectedColumns, column];
    // Keep at least one column selected
    return { selectedColumns: updated.length > 0 ? updated : state.selectedColumns };
  }),
  setFilters: (filters) => set({ filters }),
  updateFilter: (key, value) => set((state) => ({
    filters: {
      ...state.filters,
      [key]: value === '' ? undefined : value,
    }
  })),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setPreviewData: (previewData, previewCount) => set({ previewData, previewCount }),
  setLoading: (loading) => set({ loading }),
  resetBuilder: () => set({
    step: 1,
    selectedColumns: defaultColumns,
    filters: initialFilters,
    sortBy: 'joinedDate',
    sortOrder: 'DESC',
    previewData: [],
    previewCount: 0,
    loading: false,
  }),
}));

import { create } from 'zustand';

interface TenantOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  plan: string;
  maxInterns: number;
  maxMentors: number;
  isActive: boolean;
}

interface TenantState {
  organization: TenantOrganization | null;
  isLoading: boolean;
  error: string | null;
  setOrganization: (org: TenantOrganization | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

/**
 * Zustand store for multi-tenant organization context.
 * Populated from subdomain resolution or API response.
 */
export const useTenantStore = create<TenantState>((set) => ({
  organization: null,
  isLoading: false,
  error: null,
  setOrganization: (org) => set({ organization: org, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clear: () => set({ organization: null, isLoading: false, error: null }),
}));

import { create } from 'zustand';

export interface TelemetryData {
  // Intern Role
  tasksTotal?: number;
  tasksCompleted?: number;
  completionRate?: number;
  avgScore?: number;
  attendanceRate?: number;
  presentDays?: number;
  totalDays?: number;
  standupsCount?: number;
  moodCounts?: Record<string, number>;
  blockers?: string[];
  
  // Mentor Role
  internsCount?: number;
  overdueTasksCount?: number;
  atRiskCount?: number;
  interns?: Array<{
    internId: string;
    name: string;
    completionRate: number;
    avgScore: number;
    attendanceRate: number;
    overdueCount: number;
    isAtRisk: boolean;
  }>;
  
  // HR Role
  activeInternsCount?: number;
  activeMentorsCount?: number;
  taskCompletionRate?: number;
  atRiskInterns?: Array<{
    internId: string;
    name: string;
    attendanceRate: number;
    avgScore: number;
    overdueCount: number;
    reason: string;
  }>;
}

export interface DigestPayload {
  role: string;
  weekRange: string;
  telemetry: TelemetryData;
  aiInsight: string;
}

interface DigestStore {
  isOpen: boolean;
  digestData: DigestPayload | null;
  openDigest: (data: DigestPayload) => void;
  closeDigest: () => void;
}

export const useDigestStore = create<DigestStore>((set) => ({
  isOpen: false,
  digestData: null,
  openDigest: (data) => set({ isOpen: true, digestData: data }),
  closeDigest: () => set({ isOpen: false, digestData: null }),
}));

import api from './api';
import type {
  MentorDetails,
  MentorAnalyticsData,
  MentorDocumentData,
  MentorActivityData,
  MentorWorkloadData,
  MentorInternData,
  MentorAIAnalysis,
} from '../types';

const BASE = '/hr/mentors';

/** Get comprehensive mentor details */
export const fetchMentorDetails = async (mentorId: string): Promise<MentorDetails> => {
  const res = await api.get(`${BASE}/${mentorId}/details`);
  return res.data.data;
};

/** Update mentor profile */
export const updateMentorProfile = async (
  mentorId: string,
  data: Record<string, any>
): Promise<MentorDetails> => {
  const res = await api.put(`${BASE}/${mentorId}/profile`, data);
  return res.data.data;
};

/** Get mentor analytics */
export const fetchMentorAnalytics = async (mentorId: string): Promise<MentorAnalyticsData> => {
  const res = await api.get(`${BASE}/${mentorId}/analytics`);
  return res.data.data;
};

/** Refresh (recompute) mentor analytics */
export const refreshMentorAnalytics = async (mentorId: string): Promise<MentorAnalyticsData> => {
  const res = await api.post(`${BASE}/${mentorId}/analytics/refresh`);
  return res.data.data;
};

/** Get mentor activity timeline */
export const fetchMentorActivity = async (
  mentorId: string,
  page: number = 1,
  limit: number = 20,
  activityType?: string
): Promise<{ data: MentorActivityData[]; pagination: any }> => {
  const params: any = { page, limit };
  if (activityType) params.activityType = activityType;
  const res = await api.get(`${BASE}/${mentorId}/activity`, { params });
  return res.data.data;
};

/** Get assigned interns with performance data */
export const fetchMentorInterns = async (mentorId: string): Promise<MentorInternData[]> => {
  const res = await api.get(`${BASE}/${mentorId}/interns`);
  return res.data.data;
};

/** Assign intern to mentor */
export const assignIntern = async (
  mentorId: string,
  internId: string
): Promise<any> => {
  const res = await api.post(`${BASE}/${mentorId}/assign-intern`, { internId });
  return res.data.data;
};

/** Remove intern from mentor */
export const removeIntern = async (
  mentorId: string,
  internId: string
): Promise<any> => {
  const res = await api.delete(`${BASE}/${mentorId}/remove-intern/${internId}`);
  return res.data.data;
};

/** Upload mentor document */
export const uploadDocument = async (
  mentorId: string,
  file: File,
  fileType: string
): Promise<MentorDocumentData> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  const res = await api.post(`${BASE}/${mentorId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

/** Get mentor documents */
export const fetchDocuments = async (mentorId: string): Promise<MentorDocumentData[]> => {
  const res = await api.get(`${BASE}/${mentorId}/documents`);
  return res.data.data;
};

/** Delete mentor document */
export const deleteDocument = async (
  mentorId: string,
  docId: string
): Promise<any> => {
  const res = await api.delete(`${BASE}/${mentorId}/documents/${docId}`);
  return res.data.data;
};

/** Get mentor workload analysis */
export const fetchWorkload = async (mentorId: string): Promise<MentorWorkloadData> => {
  const res = await api.get(`${BASE}/${mentorId}/workload`);
  return res.data.data;
};

/** Trigger AI analysis */
export const triggerAIAnalysis = async (mentorId: string): Promise<MentorAIAnalysis> => {
  const res = await api.post(`${BASE}/${mentorId}/ai-analysis`);
  return res.data.data;
};

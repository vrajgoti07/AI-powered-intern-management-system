import api from './api';

export interface InternDocument {
  id: string;
  internId: string;
  type: 'CERTIFICATE' | 'OFFER_LETTER' | 'PERFORMANCE_REPORT';
  name: string;
  url: string;
  publicId: string;
  metadata?: any;
  createdAt: string;
}

export const documentApi = {
  getInternDocuments: async (internId: string): Promise<InternDocument[]> => {
    const response = await api.get(`/documents/${internId}`);
    return response.data;
  },

  generateCertificate: async (internId: string): Promise<{ message: string, document: InternDocument }> => {
    const response = await api.post(`/documents/certificate/${internId}`);
    return response.data;
  },

  generateOfferLetter: async (internId: string): Promise<{ message: string, document: InternDocument }> => {
    const response = await api.post(`/documents/offer-letter/${internId}`);
    return response.data;
  },

  generatePerformanceReport: async (internId: string, month?: string, year?: number): Promise<{ message: string, document: InternDocument }> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year.toString());
    
    const response = await api.post(`/documents/performance-report/${internId}?${params.toString()}`);
    return response.data;
  }
};

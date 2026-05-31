import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useOnboardingStatus = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['onboardingStatus'],
    queryFn: async () => {
      const { data } = await api.get('/onboarding/status');
      return data.data; // OnboardingProgress object
    },
    staleTime: 0, // Always fetch latest to prevent bypassing locks
    enabled,
  });
};

export const useSubmitOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { offerAccepted: boolean }) => {
      const { data } = await api.post('/onboarding/offer', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit offer');
    }
  });
};

export const useSubmitPersonalInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/onboarding/personal-info', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Personal info saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save personal info');
    }
  });
};

export const useSubmitEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/onboarding/education', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Education details saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save education details');
    }
  });
};

export const useSubmitEmergency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/onboarding/emergency', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Emergency contacts saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save emergency contacts');
    }
  });
};

export const useSubmitDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/onboarding/upload-documents');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Documents verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit documents');
    }
  });
};

export const useSubmitAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { signedName: string, agreementAccepted: boolean }) => {
      const { data } = await api.post('/onboarding/agreement', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Agreement accepted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept agreement');
    }
  });
};

export const useSubmitFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/onboarding/final-submit');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      toast.success('Onboarding submitted for HR review!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit onboarding');
    }
  });
};

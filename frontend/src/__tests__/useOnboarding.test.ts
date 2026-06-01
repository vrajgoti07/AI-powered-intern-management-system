// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  useOnboardingStatus, 
  useSubmitOffer, 
  useSubmitPersonalInfo, 
  useSubmitEducation,
  useSubmitEmergency,
  useSubmitDocuments,
  useSubmitAgreement,
  useSubmitFinal
} from '../hooks/useOnboarding';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cleanup } from '@testing-library/react';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useOnboarding', () => {
  let mockQueryClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    cleanup();
  });


  it('should fetch onboarding status correctly', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { currentStep: 2, offerAccepted: true },
      isLoading: false,
    } as any);

    const { data, isLoading } = useOnboardingStatus();
    expect(isLoading).toBe(false);
    expect(data.currentStep).toBe(2);
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['onboardingStatus'],
    }));
  });

  it('should support submitting offer acceptance', async () => {
    let mutationFnCalled: any = null;
    let onSuccessCallback: any = null;

    vi.mocked(useMutation).mockImplementation((options: any) => {
      mutationFnCalled = options.mutationFn;
      onSuccessCallback = options.onSuccess;
      return {
        mutateAsync: vi.fn(),
      } as any;
    });

    useSubmitOffer();

    expect(mutationFnCalled).toBeTruthy();
    expect(onSuccessCallback).toBeTruthy();

    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { status: 'ACCEPTED' } } });
    await mutationFnCalled({ offerAccepted: true });
    expect(api.post).toHaveBeenCalledWith('/onboarding/offer', { offerAccepted: true });

    onSuccessCallback();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['onboardingStatus'] });
  });

  it('should support submitting personal info and display toast', async () => {
    let mutationFnCalled: any = null;
    let onSuccessCallback: any = null;

    vi.mocked(useMutation).mockImplementation((options: any) => {
      mutationFnCalled = options.mutationFn;
      onSuccessCallback = options.onSuccess;
      return {
        mutateAsync: vi.fn(),
      } as any;
    });

    useSubmitPersonalInfo();

    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });
    await mutationFnCalled({ phone: '1234567890' });
    expect(api.post).toHaveBeenCalledWith('/onboarding/personal-info', { phone: '1234567890' });

    onSuccessCallback();
    expect(toast.success).toHaveBeenCalledWith('Personal info saved successfully');
  });

  it('should support final submission and trigger HR review warning', async () => {
    let mutationFnCalled: any = null;
    let onSuccessCallback: any = null;

    vi.mocked(useMutation).mockImplementation((options: any) => {
      mutationFnCalled = options.mutationFn;
      onSuccessCallback = options.onSuccess;
      return {
        mutateAsync: vi.fn(),
      } as any;
    });

    useSubmitFinal();

    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });
    await mutationFnCalled();
    expect(api.post).toHaveBeenCalledWith('/onboarding/final-submit');

    onSuccessCallback();
    expect(toast.success).toHaveBeenCalledWith('Onboarding submitted for HR review!');
  });
});

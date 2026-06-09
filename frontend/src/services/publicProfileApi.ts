import axios from 'axios';
import api, { API_BASE_URL } from './api';
import type { PublicProfileData, PublicProfileSettings } from '../types';

/**
 * Fetch a public profile by username.
 * Uses raw axios (no auth token) since this is a public endpoint.
 */
export const fetchPublicProfile = async (
  username: string
): Promise<PublicProfileData> => {
  const res = await axios.get(`${API_BASE_URL}/public/profile/${username}`);
  return res.data.data;
};

/**
 * Get the current user's public profile privacy settings.
 * Requires authentication.
 */
export const getPublicSettings = async (): Promise<PublicProfileSettings> => {
  const res = await api.get('/profile/public-settings');
  return res.data.data;
};

/**
 * Update the current user's public profile privacy settings.
 * Requires authentication.
 */
export const updatePublicSettings = async (
  data: Partial<Omit<PublicProfileSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<PublicProfileSettings> => {
  const res = await api.put('/profile/public-settings', data);
  return res.data.data;
};

/**
 * Get the current user's public profile URL.
 * Generates a username if one doesn't exist.
 * Requires authentication.
 */
export const getMyPublicUrl = async (): Promise<string> => {
  const res = await api.get('/profile/my-public-url');
  return res.data.data.url;
};

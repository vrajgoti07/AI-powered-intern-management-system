import { useEffect } from 'react';
import { useTenantStore } from '../store/useTenantStore';
import axios from 'axios';

// Base API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useTenant = () => {
  const { organization, isLoading, error, setOrganization, setLoading, setError } = useTenantStore();

  useEffect(() => {
    if (organization) return;

    const resolveTenant = async () => {
      setLoading(true);
      try {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        let slug = 'default';

        // Check subdomain first (excluding www and api)
        if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
          slug = parts[0];
        } else {
          // Fallback to query param in development: ?org=slug
          const params = new URLSearchParams(window.location.search);
          const queryOrg = params.get('org');
          if (queryOrg) {
            slug = queryOrg;
          }
        }

        // Check if organization exists by slug
        const checkRes = await axios.get(`${API_URL}/api/v1/organizations/slug/${slug}`);
        
        if (checkRes.data.success && checkRes.data.data.available === false) {
          // Organization slug exists -> fetch full context
          const detailRes = await axios.get(`${API_URL}/api/v1/organizations/me`, {
            headers: {
              'X-Organization-Slug': slug,
            },
          });
          
          if (detailRes.data.success) {
            setOrganization(detailRes.data.data);
          } else {
            setError('Organization is registered but details could not be loaded');
          }
        } else {
          setError('Organization not found or inactive');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Tenant context resolution error');
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [organization, setOrganization, setLoading, setError]);

  return { organization, isLoading, error };
};

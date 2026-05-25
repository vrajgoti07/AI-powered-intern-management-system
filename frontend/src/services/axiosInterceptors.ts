import { AxiosResponse, AxiosError } from 'axios';
import api from './api';

export const setupAxiosInterceptors = () => {
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<any>) => {
      const status = error.response?.status || 500;
      let message = 'An unexpected error occurred.';

      if (error.response?.data) {
        const data = error.response.data;
        message = data.message || data.error || error.message || message;
      } else if (error.message) {
        message = error.message;
      }

      return Promise.reject({ message, status });
    }
  );
};

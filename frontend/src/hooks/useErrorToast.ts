import toast from 'react-hot-toast';

export const useErrorToast = () => {
  const showErrorToast = (error: any) => {
    const message = error?.message || (typeof error === 'string' ? error : 'An error occurred.');
    toast.error(message, {
      id: 'error-toast',
      style: {
        borderRadius: '16px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'sans-serif',
        padding: '12px 18px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#f43f5e',
        secondary: '#1e293b',
      },
    });
  };

  return { showErrorToast };
};

import toast from 'react-hot-toast';

export const useToast = () => {
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const options = {
      duration: 4000,
      position: 'top-right' as const,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast(message, {
          ...options,
          icon: '⚠️',
          style: {
            background: '#fff3cd',
            color: '#856404',
          },
        });
        break;
      case 'info':
      default:
        toast(message, {
          ...options,
          icon: 'ℹ️',
          style: {
            background: '#cce5ff',
            color: '#004085',
          },
        });
        break;
    }
  };

  return {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message),
    info: (message: string) => showToast('info', message),
  };
};

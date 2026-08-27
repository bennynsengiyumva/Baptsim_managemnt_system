import { AxiosError } from 'axios';

export function setupApiErrorInterceptor() {
  // This is called once at app startup
  // We'll use axios interceptor if available, or window error handler
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return 'Session expired. Please log in again.';
    }

    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (status === 404) {
      return 'The requested resource was not found.';
    }

    if (status === 429) {
      return 'Too many requests. Please try again later.';
    }

    if (status === 500) {
      return 'A server error occurred. Please try again later.';
    }

    if (data?.message) {
      return data.message;
    }

    return error.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

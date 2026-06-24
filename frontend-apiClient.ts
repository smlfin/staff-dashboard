// src/utils/apiClient.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 Unauthorized and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.client.post('/api/auth/refresh');
            const { accessToken } = response.data;

            // Update token in store
            useAuthStore.setState({ accessToken });

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth Endpoints
  register = (data: {
    employeeCode: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    branch: string;
    designation: string;
  }) => this.client.post('/api/auth/register', data);

  login = (employeeCode: string, password: string) =>
    this.client.post('/api/auth/login', { employeeCode, password });

  logout = () => this.client.post('/api/auth/logout');

  // Protected Endpoints
  getProfile = () => this.client.get('/api/profile');

  getDashboardSummary = () => this.client.get('/api/dashboard/summary');

  getAnalytics = () => this.client.get('/api/dashboard/analytics');

  getRecords = (page: number = 1, limit: number = 20) =>
    this.client.get('/api/records', { params: { page, limit } });

  exportData = (format: 'csv' | 'excel' = 'csv') => {
    const responseType = format === 'csv' ? 'text' : 'arraybuffer';
    return this.client.get(`/api/records/export?format=${format}`, {
      responseType: responseType as any
    });
  };
}

export const apiClient = new ApiClient();

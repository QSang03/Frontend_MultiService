import axiosInstance from '@/lib/axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Service,
  Order,
  PaginatedResponse,
} from '@/types';

// Auth APIs
export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get('/v1/auth/me');
    return response.data;
  },

  changePassword: async (payload: { old_password: string; new_password: string }): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.put('/v1/auth/me/password', payload);
    return response.data;
  },
};

// User APIs
export const userApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get('/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.patch('/v1/auth/me', data);
    return response.data;
  },
};

// Service APIs
export const serviceApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
  }): Promise<ApiResponse<PaginatedResponse<Service>>> => {
    const response = await axiosInstance.get('/services', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Service>> => {
    const response = await axiosInstance.get(`/services/${id}`);
    return response.data;
  },
};

// Order APIs
export const orderApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const response = await axiosInstance.get('/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: {
    serviceId: string;
    description?: string;
    scheduledDate?: Date;
  }): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.post('/orders', data);
    return response.data;
  },

  cancel: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

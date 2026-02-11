import axiosInstance from '@/lib/axios';
import {
  mockUsers,
  mockServices,
  mockOrders,
  validateCredentials,
  createMockAuthResponse,
  delay,
} from '@/lib/mock-data';
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

// Toggle between mock and real API
const USE_MOCK_API = false;

// Auth APIs
export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    if (USE_MOCK_API) {
      await delay(800); // Simulate network delay
      
      const user = validateCredentials(data.email, data.password);
      
      if (user) {
        return {
          success: true,
          data: createMockAuthResponse(user),
          message: 'Đăng nhập thành công',
        };
      }
      
      return {
        success: false,
        error: 'Email hoặc mật khẩu không đúng',
      };
    }
    
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    if (USE_MOCK_API) {
      await delay(800);
      
      // Check if email already exists
      const existingUser = mockUsers.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase()
      );
      
      if (existingUser) {
        return {
          success: false,
          error: 'Email đã được sử dụng',
        };
      }
      
      // Create new user
      const newUser: User = {
        id: String(mockUsers.length + 1),
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add to mock database (in real app, this would be stored in backend)
      mockUsers.push({ ...newUser, password: data.password });
      
      return {
        success: true,
        data: createMockAuthResponse(newUser),
        message: 'Đăng ký thành công',
      };
    }
    
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    if (USE_MOCK_API) {
      await delay(300);
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    }
    
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    if (USE_MOCK_API) {
      await delay(300);
      // In real app, this would validate token and return user
      return {
        success: false,
        error: 'Chưa đăng nhập',
      };
    }
    const response = await axiosInstance.get('/v1/auth/me');
    return response.data;
  },
  changePassword: async (payload: { old_password: string; new_password: string; }): Promise<ApiResponse<null>> => {
    if (USE_MOCK_API) {
      await delay(400);
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!storedUser) return { success: false, error: 'Chưa đăng nhập' };
      const user = JSON.parse(storedUser) as User;
      // Find mock user by email
      const found = mockUsers.find(u => u.email.toLowerCase() === (user.email || '').toLowerCase());
      if (!found) return { success: false, error: 'Người dùng không tồn tại' };
      if (found.password !== payload.old_password) {
        return { success: false, error: 'Mật khẩu hiện tại không đúng' };
      }
      // Update mock password
      found.password = payload.new_password;
      return { success: true, message: 'Password changed successfully' };
    }

    const response = await axiosInstance.put('/v1/auth/me/password', payload);
    return response.data;
  },
};

// User APIs
export const userApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    if (USE_MOCK_API) {
      await delay(300);
      // Get user from localStorage
      const storedUser = typeof window !== 'undefined' 
        ? localStorage.getItem('user') 
        : null;
      
      if (storedUser) {
        return {
          success: true,
          data: JSON.parse(storedUser),
        };
      }
      
      return {
        success: false,
        error: 'Chưa đăng nhập',
      };
    }
    
    const response = await axiosInstance.get('/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    if (USE_MOCK_API) {
      await delay(500);
      const storedUser = typeof window !== 'undefined' 
        ? localStorage.getItem('user') 
        : null;
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...data, updatedAt: new Date() };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          success: true,
          data: updatedUser,
          message: 'Cập nhật thành công',
        };
      }
      
      return {
        success: false,
        error: 'Chưa đăng nhập',
      };
    }
    
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
    if (USE_MOCK_API) {
      await delay(500);
      
      let filteredServices = [...mockServices];
      
      if (params?.category) {
        filteredServices = filteredServices.filter(
          (s) => s.category === params.category
        );
      }
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedServices = filteredServices.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          data: paginatedServices,
          total: filteredServices.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredServices.length / pageSize),
        },
      };
    }
    
    const response = await axiosInstance.get('/services', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Service>> => {
    if (USE_MOCK_API) {
      await delay(300);
      const service = mockServices.find((s) => s.id === id);
      
      if (service) {
        return {
          success: true,
          data: service,
        };
      }
      
      return {
        success: false,
        error: 'Không tìm thấy dịch vụ',
      };
    }
    
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
    if (USE_MOCK_API) {
      await delay(500);
      
      // Get current user
      const storedUser = typeof window !== 'undefined' 
        ? localStorage.getItem('user') 
        : null;
      
      if (!storedUser) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }
      
      const user = JSON.parse(storedUser);
      let filteredOrders = mockOrders.filter((o) => o.userId === user.id);
      
      if (params?.status) {
        filteredOrders = filteredOrders.filter((o) => o.status === params.status);
      }
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          data: paginatedOrders,
          total: filteredOrders.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredOrders.length / pageSize),
        },
      };
    }
    
    const response = await axiosInstance.get('/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK_API) {
      await delay(300);
      const order = mockOrders.find((o) => o.id === id);
      
      if (order) {
        return {
          success: true,
          data: order,
        };
      }
      
      return {
        success: false,
        error: 'Không tìm thấy đơn hàng',
      };
    }
    
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: {
    serviceId: string;
    description?: string;
    scheduledDate?: Date;
  }): Promise<ApiResponse<Order>> => {
    if (USE_MOCK_API) {
      await delay(500);
      
      const storedUser = typeof window !== 'undefined' 
        ? localStorage.getItem('user') 
        : null;
      
      if (!storedUser) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }
      
      const user = JSON.parse(storedUser);
      const service = mockServices.find((s) => s.id === data.serviceId);
      
      if (!service) {
        return {
          success: false,
          error: 'Không tìm thấy dịch vụ',
        };
      }
      
      const newOrder: Order = {
        id: String(mockOrders.length + 1),
        userId: user.id,
        serviceId: data.serviceId,
        status: 'pending',
        description: data.description,
        scheduledDate: data.scheduledDate,
        totalAmount: service.price,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockOrders.push(newOrder);
      
      return {
        success: true,
        data: newOrder,
        message: 'Đặt dịch vụ thành công',
      };
    }
    
    const response = await axiosInstance.post('/orders', data);
    return response.data;
  },

  cancel: async (id: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK_API) {
      await delay(500);
      const orderIndex = mockOrders.findIndex((o) => o.id === id);
      
      if (orderIndex === -1) {
        return {
          success: false,
          error: 'Không tìm thấy đơn hàng',
        };
      }
      
      mockOrders[orderIndex].status = 'cancelled';
      mockOrders[orderIndex].updatedAt = new Date();
      
      return {
        success: true,
        data: mockOrders[orderIndex],
        message: 'Hủy đơn hàng thành công',
      };
    }
    
    const response = await axiosInstance.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

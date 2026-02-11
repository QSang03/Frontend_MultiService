// User types
export interface User {
  id: string;
  email: string;
  name: string;
  // Optional alternative full name key returned by some APIs
  full_name?: string;
  // If user belongs to an organization
  organization_id?: string;
  organizationId?: string; // Proto field name
  phone?: string;
  avatar?: string;
  avatar_url?: string; // Proto field name
  role: 'user' | 'admin' | 'technician' | 'USER_ROLE_ADMIN' | 'USER_ROLE_SALE' | 'USER_ROLE_TECH' | 'USER_ROLE_USER' | number | string; // Support both string and UserRole enum
  mfa_enabled?: boolean; // MFA status
  createdAt: Date;
  updatedAt: Date;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory = 
  | 'repair'
  | 'maintenance'
  | 'installation'
  | 'consultation'
  | 'network'
  | 'software'
  | 'hardware';

// Order types
export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  status: OrderStatus;
  description?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  // Optional organization data for business accounts
  organization?: {
    name?: string;
    tax_code?: string;
    address?: string;
    // extendable: contact_person, phone, etc.
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

import type { User, Service, Order, AuthResponse } from '@/types';

// Mock Users Database
export const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@itmultiservice.vn',
    password: '123456',
    name: 'Admin',
    phone: '0123456789',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'user@gmail.com',
    password: '123456',
    name: 'Nguyễn Văn A',
    phone: '0987654321',
    role: 'user',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: '3',
    email: 'tech@itmultiservice.vn',
    password: '123456',
    name: 'Kỹ thuật viên Trần B',
    phone: '0912345678',
    role: 'technician',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Sửa chữa máy tính',
    description: 'Khắc phục các sự cố phần cứng và phần mềm trên máy tính của bạn. Bao gồm kiểm tra, chẩn đoán và sửa chữa.',
    price: 200000,
    category: 'repair',
    image: '/images/repair.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Cài đặt Windows',
    description: 'Cài đặt và cấu hình hệ điều hành Windows mới nhất. Bao gồm driver và phần mềm cơ bản.',
    price: 150000,
    category: 'installation',
    image: '/images/windows.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Bảo trì định kỳ',
    description: 'Vệ sinh, kiểm tra và tối ưu hóa hệ thống máy tính. Giúp máy chạy mượt mà hơn.',
    price: 100000,
    category: 'maintenance',
    image: '/images/maintenance.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Cài đặt mạng WiFi',
    description: 'Thiết lập và cấu hình mạng WiFi cho gia đình và văn phòng. Đảm bảo kết nối ổn định.',
    price: 300000,
    category: 'network',
    image: '/images/network.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Diệt virus & Malware',
    description: 'Quét và loại bỏ virus, malware, spyware. Cài đặt phần mềm bảo vệ máy tính.',
    price: 150000,
    category: 'software',
    image: '/images/antivirus.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Nâng cấp RAM/SSD',
    description: 'Tư vấn và nâng cấp RAM, ổ cứng SSD giúp máy tính chạy nhanh hơn.',
    price: 100000,
    category: 'hardware',
    image: '/images/upgrade.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '7',
    name: 'Tư vấn mua máy tính',
    description: 'Tư vấn cấu hình máy tính phù hợp với nhu cầu sử dụng và ngân sách của bạn.',
    price: 0,
    category: 'consultation',
    image: '/images/consultation.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '8',
    name: 'Cài đặt phần mềm văn phòng',
    description: 'Cài đặt bộ Office, phần mềm đồ họa, lập trình và các ứng dụng theo yêu cầu.',
    price: 100000,
    category: 'software',
    image: '/images/software.jpg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: '1',
    userId: '2',
    serviceId: '1',
    status: 'completed',
    description: 'Máy tính bị treo, không khởi động được',
    scheduledDate: new Date('2024-12-01'),
    completedDate: new Date('2024-12-01'),
    totalAmount: 200000,
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    userId: '2',
    serviceId: '2',
    status: 'in_progress',
    description: 'Cài đặt lại Windows 11',
    scheduledDate: new Date('2025-01-15'),
    totalAmount: 150000,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: '3',
    userId: '2',
    serviceId: '4',
    status: 'pending',
    description: 'Cài đặt WiFi cho văn phòng 3 phòng',
    scheduledDate: new Date('2025-01-20'),
    totalAmount: 300000,
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11'),
  },
];

// Helper functions
export function generateToken(): string {
  return 'mock_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function findUserByEmail(email: string) {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function validateCredentials(email: string, password: string) {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    // Return a properly typed User object without the password property
    const { password: _pw, ...rest } = user;
    void _pw;
    const safeUser: User = {
      id: rest.id,
      email: rest.email,
      name: rest.name,
      phone: rest.phone,
      avatar: rest.avatar,
      role: rest.role,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
    };
    return safeUser;
  }
  return null;
}

export function createMockAuthResponse(user: User): AuthResponse {
  return {
    user,
    accessToken: generateToken(),
    refreshToken: generateToken(),
  };
}

// Simulate network delay
export function delay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

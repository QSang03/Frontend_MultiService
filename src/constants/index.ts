// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// App Configuration
export const APP_NAME = 'IT Multi-Service';
export const APP_DESCRIPTION = 'Dịch vụ IT đa năng - Sửa chữa, bảo trì, cài đặt';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  // Admin portal
  DASHBOARD: '/admin/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_USERS: '/admin/users',
  ADMIN_FINANCE: '/admin/finance',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_CONTRACTS: '/admin/contract-esign',
  ADMIN_SERVICE_CONFIG: '/admin/service-config',
  ADMIN_TENANT_B2B: '/admin/tenant-b2b',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_SYSTEM_SETTINGS: '/admin/system-settings',
  ADMIN_PROFILE: '/admin/profile',
  // Sale portal
  SALE_DASHBOARD: '/sale/dashboard',
  SALE_ORDERS: '/sale/orders',
  SALE_CUSTOMERS: '/sale/customers',
  SALE_QUOTATIONS: '/sale/quotations',
  SALE_CONTRACTS: '/sale/contracts',
  SALE_REVENUE: '/sale/revenue',
  SALE_PROFILE: '/sale/profile',
  // Tech portal
  TECH_DASHBOARD: '/tech/dashboard',
  TECH_TASKS: '/tech/tasks',
  TECH_SCHEDULE: '/tech/schedule',
  TECH_INVENTORY: '/tech/inventory',
  TECH_KNOWLEDGE: '/tech/knowledge-base',
  TECH_PROFILE: '/tech/profile',
  // Customer B2C portal
  B2C_DASHBOARD: '/customer/b2c/dashboard',
  // Customer B2B portal
  B2B_DASHBOARD: '/customer/b2b/dashboard',
  // Legacy (redirected to admin portal as default)
  SERVICES: '/admin/service-config',
  ORDERS: '/admin/orders',
  PROFILE: '/admin/profile',
} as const;

// Service Categories
export const SERVICE_CATEGORIES = [
  { value: 'repair', label: 'Sửa chữa' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'installation', label: 'Cài đặt' },
  { value: 'consultation', label: 'Tư vấn' },
  { value: 'network', label: 'Mạng' },
  { value: 'software', label: 'Phần mềm' },
  { value: 'hardware', label: 'Phần cứng' },
] as const;

// Order Status
export const ORDER_STATUS = {
  pending: { label: 'Chờ xử lý', color: 'yellow' },
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  in_progress: { label: 'Đang thực hiện', color: 'orange' },
  completed: { label: 'Hoàn thành', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

// User Roles from backend protobuf enum
export const USER_ROLES = {
  ADMIN: 'USER_ROLE_ADMIN',
  SALE: 'USER_ROLE_SALE',
  TECH: 'USER_ROLE_TECH',
  TECH_SOFTWARE: 'USER_ROLE_TECH_SOFTWARE',
  TECH_HARDWARE: 'USER_ROLE_TECH_HARDWARE',
  MANAGER: 'USER_ROLE_MANAGER',
  MEMBER: 'USER_ROLE_MEMBER',
  ORG_ADMIN: 'USER_ROLE_ORG_ADMIN',
  CUSTOMER: 'USER_ROLE_CUSTOMER',
  // gRPC numeric enum values from backend proto
  CUSTOMER_NUM: '1',
  ORG_ADMIN_NUM: '2',
  MANAGER_NUM: '3',
  MEMBER_NUM: '4',
  SALE_NUM: '5',
  TECH_SOFTWARE_NUM: '6',
  TECH_HARDWARE_NUM: '7',
  ADMIN_NUM: '8',
} as const;

/**
 * Get the dashboard URL based on user role.
 * Maps backend role strings and numeric enums to the correct portal.
 */
export function getDashboardByRole(role?: string | number): string {
  if (!role) return ROUTES.ADMIN_DASHBOARD;
  
  const r = String(role).toUpperCase();
  console.log('[getDashboardByRole] Input role:', role, '| Uppercased:', r);
  
  // Customer B2C (USER_ROLE_CUSTOMER = 1)
  if (
    r === USER_ROLES.CUSTOMER ||
    r === 'CUSTOMER' ||
    r === USER_ROLES.CUSTOMER_NUM
  ) {
    console.log('[getDashboardByRole] Matched CUSTOMER, returning:', ROUTES.B2C_DASHBOARD);
    return ROUTES.B2C_DASHBOARD;
  }

  // Customer B2B: OrgAdmin (USER_ROLE_ORG_ADMIN = 2) and Member (USER_ROLE_MEMBER = 4)
  if (
    r === USER_ROLES.ORG_ADMIN ||
    r === 'ORG_ADMIN' ||
    r === USER_ROLES.ORG_ADMIN_NUM ||
    r === USER_ROLES.MEMBER ||
    r === 'MEMBER' ||
    r === USER_ROLES.MEMBER_NUM
  ) {
    console.log('[getDashboardByRole] Matched ORG_ADMIN/MEMBER, returning:', ROUTES.B2B_DASHBOARD);
    return ROUTES.B2B_DASHBOARD;
  }

  // Admin roles (USER_ROLE_ADMIN = 8)
  if (
    r === USER_ROLES.ADMIN ||
    r === 'ADMIN' ||
    r === USER_ROLES.ADMIN_NUM ||
    r.includes('_ADMIN')
  ) {
    console.log('[getDashboardByRole] Matched ADMIN, returning:', ROUTES.ADMIN_DASHBOARD);
    return ROUTES.ADMIN_DASHBOARD;
  }

  // Sale roles (USER_ROLE_SALE = 5)
  if (
    r === USER_ROLES.SALE ||
    r === 'SALE' ||
    r === USER_ROLES.SALE_NUM ||
    r.includes('SALE')
  ) {
    console.log('[getDashboardByRole] Matched SALE, returning:', ROUTES.SALE_DASHBOARD);
    return ROUTES.SALE_DASHBOARD;
  }

  // Tech roles (USER_ROLE_TECH_SOFTWARE = 6, USER_ROLE_TECH_HARDWARE = 7)
  if (
    r === USER_ROLES.TECH ||
    r === 'TECH' ||
    r === USER_ROLES.TECH_SOFTWARE ||
    r === USER_ROLES.TECH_HARDWARE ||
    r === USER_ROLES.TECH_SOFTWARE_NUM ||
    r === USER_ROLES.TECH_HARDWARE_NUM ||
    r.includes('TECH')
  ) {
    console.log('[getDashboardByRole] Matched TECH, returning:', ROUTES.TECH_DASHBOARD);
    return ROUTES.TECH_DASHBOARD;
  }

  // Manager - default to admin
  if (
    r === USER_ROLES.MANAGER ||
    r === USER_ROLES.MANAGER_NUM
  ) {
    console.log('[getDashboardByRole] Matched MANAGER, returning:', ROUTES.ADMIN_DASHBOARD);
    return ROUTES.ADMIN_DASHBOARD;
  }
  
  // Default: send to admin dashboard
  console.log('[getDashboardByRole] No match, defaulting to ADMIN');
  return ROUTES.ADMIN_DASHBOARD;
}

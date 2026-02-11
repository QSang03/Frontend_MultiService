export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  customerId?: string;
}

export interface AuthResponse {
  mfa_required: boolean;
  mfa_token?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  };
  user?: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string; // The backend response shows refresh_token is returned
  expires_in: number;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
  customerId?: string;
  [key: string]: unknown;
}

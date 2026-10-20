export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
  name: string;
  phone?: string;
  phone_verified?: boolean;
  active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  success: boolean;
}

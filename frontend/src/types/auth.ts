/**
 * Authentication type definitions
 */

export interface User {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string; // Optional, backend may or may not include it
  user: User;
}

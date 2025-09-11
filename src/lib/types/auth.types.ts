import { User } from '@/models';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthError {
  message: string;
  field?: string;
}

export interface AuthResponse {
  user?: User;
  error?: AuthError;
}

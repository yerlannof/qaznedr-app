export const APP_NAME = 'Qaznedr';
export const DEFAULT_LOCALE = 'en';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
} as const;

export const API_ROUTES = {
  AUTH: '/api/auth',
  REGISTER: '/api/auth/register',
} as const;

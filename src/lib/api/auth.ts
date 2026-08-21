import { get, patch, post } from './client';
import type { User } from '@/types';

export interface AuthPayload {
  user: User;
  accessToken: string;
}

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    marketingOptIn?: boolean;
    agreeTerms: true;
  }) => post<AuthPayload>('/auth/register', body),

  login: (body: { email: string; password: string; remember?: boolean }) =>
    post<AuthPayload>('/auth/login', body),

  refresh: () => post<AuthPayload>('/auth/refresh', {}),

  logout: () => post<{ loggedOut: boolean }>('/auth/logout', {}),

  me: () => get<User>('/auth/me'),

  updateProfile: (body: { name?: string; phone?: string; marketingOptIn?: boolean }) =>
    patch<User>('/auth/me', body),

  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    post<void>('/auth/change-password', body),
};

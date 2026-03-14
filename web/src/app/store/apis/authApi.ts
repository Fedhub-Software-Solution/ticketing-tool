import { baseApi } from './baseApi';
import type { User } from '@/app/types';
import { setCredentials, setUser } from '../slices/authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: string;
  companyName?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  emailSent?: boolean;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data.user, token: data.token }));
        } catch {
          // ignore
        }
      },
    }),
    register: build.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data && 'token' in data && (data as AuthResponse).token) {
            dispatch(setCredentials({ user: (data as AuthResponse).user, token: (data as AuthResponse).token }));
          }
        } catch {
          // ignore
        }
      },
    }),
    verifyEmail: build.mutation<{ success: boolean; message: string }, { token: string }>({
      query: ({ token }) => ({ url: `auth/verify-email?token=${encodeURIComponent(token)}`, method: 'GET' }),
    }),
    getMe: build.query<User, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // ignore
        }
      },
    }),
    changePassword: build.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: 'auth/change-password', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useVerifyEmailMutation, useGetMeQuery, useLazyGetMeQuery, useChangePasswordMutation } = authApi;

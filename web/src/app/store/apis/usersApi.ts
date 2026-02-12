import { baseApi } from './baseApi';
import type { User } from '@/app/types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => 'users',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'User', id: 'LIST' }] : [{ type: 'User', id: 'LIST' }],
    }),
    getUser: build.query<User, string>({
      query: (id) => `users/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'User', id }],
    }),
    updateUser: build.mutation<User, { id: string; body: Partial<Pick<User, 'name' | 'role' | 'zone' | 'branch' | 'location' | 'status'>> }>({
      query: ({ id, body }) => ({ url: `users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
  }),
});

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserMutation } = usersApi;

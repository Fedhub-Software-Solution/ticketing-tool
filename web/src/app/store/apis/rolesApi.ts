import { baseApi } from './baseApi';

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem?: boolean;
}

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<Role[], void>({
      query: () => 'roles',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Roles' as const, id })), { type: 'Roles', id: 'LIST' }]
          : [{ type: 'Roles', id: 'LIST' }],
    }),
    createRole: build.mutation<Role, { name: string; code?: string; description?: string; permissions?: string[] }>({
      query: (body) => ({ url: 'roles', method: 'POST', body }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: build.mutation<
      Role,
      { id: string; body: Partial<{ name: string; description: string; permissions: string[] }> }
    >({
      query: ({ id, body }) => ({ url: `roles/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Roles', id }, { type: 'Roles', id: 'LIST' }],
    }),
    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `roles/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Roles', id }, { type: 'Roles', id: 'LIST' }],
    }),
  }),
});

export const { useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } = rolesApi;

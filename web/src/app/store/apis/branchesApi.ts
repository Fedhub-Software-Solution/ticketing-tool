import { baseApi } from './baseApi';

export interface Branch {
  id: string;
  name: string;
  code?: string;
  zoneId: string;
  zone?: string;
  manager?: string;
  isActive: boolean;
}

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBranches: build.query<Branch[], void>({
      query: () => 'branches',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Branches' as const, id })), { type: 'Branches', id: 'LIST' }]
          : [{ type: 'Branches', id: 'LIST' }],
    }),
    createBranch: build.mutation<Branch, { name: string; code?: string; zoneId: string; manager?: string; isActive?: boolean }>({
      query: (body) => ({ url: 'branches', method: 'POST', body }),
      invalidatesTags: [{ type: 'Branches', id: 'LIST' }],
    }),
    updateBranch: build.mutation<
      Branch,
      { id: string; body: Partial<{ name: string; code: string; zoneId: string; manager: string; isActive: boolean }> }
    >({
      query: ({ id, body }) => ({ url: `branches/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Branches', id }, { type: 'Branches', id: 'LIST' }],
    }),
    deleteBranch: build.mutation<void, string>({
      query: (id) => ({ url: `branches/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Branches', id }, { type: 'Branches', id: 'LIST' }],
    }),
  }),
});

export const { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation, useDeleteBranchMutation } = branchesApi;

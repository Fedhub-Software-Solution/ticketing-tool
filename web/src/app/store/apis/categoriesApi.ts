import { baseApi } from './baseApi';
import type { Category } from '@/app/types';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => 'categories',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Categories' as const, id })), { type: 'Categories', id: 'LIST' }]
          : [{ type: 'Categories', id: 'LIST' }],
    }),
    createCategory: build.mutation<
      Category,
      { name: string; description?: string; icon?: string; color?: string; slaId?: string; parentId?: string; isActive?: boolean }
    >({
      query: (body) => ({ url: 'categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    updateCategory: build.mutation<
      Category,
      { id: string; body: Partial<{ name: string; description: string; icon: string; color: string; slaId: string; parentId: string; isActive: boolean }> }
    >({
      query: ({ id, body }) => ({ url: `categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Categories', id }, { type: 'Categories', id: 'LIST' }],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `categories/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Categories', id }, { type: 'Categories', id: 'LIST' }],
    }),
  }),
});

export const { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } = categoriesApi;

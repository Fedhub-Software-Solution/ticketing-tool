import { baseApi } from './baseApi';
import type { SLA } from '@/app/types';

export const slasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSLAs: build.query<SLA[], void>({
      query: () => 'slas',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'SLAs' as const, id })), { type: 'SLAs', id: 'LIST' }] : [{ type: 'SLAs', id: 'LIST' }],
    }),
    getSLA: build.query<SLA, string>({
      query: (id) => `slas/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'SLAs', id }],
    }),
    createSLA: build.mutation<SLA, { name: string; priority: string; responseTime: number; resolutionTime: number; category?: string }>({
      query: (body) => ({ url: 'slas', method: 'POST', body }),
      invalidatesTags: [{ type: 'SLAs', id: 'LIST' }],
    }),
    updateSLA: build.mutation<SLA, { id: string; body: Partial<{ name: string; priority: string; responseTime: number; resolutionTime: number; category: string }> }>({
      query: ({ id, body }) => ({ url: `slas/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'SLAs', id }, { type: 'SLAs', id: 'LIST' }],
    }),
    deleteSLA: build.mutation<void, string>({
      query: (id) => ({ url: `slas/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'SLAs', id }, { type: 'SLAs', id: 'LIST' }],
    }),
  }),
});

export const { useGetSLAsQuery, useGetSLAQuery, useCreateSLAMutation, useUpdateSLAMutation, useDeleteSLAMutation } = slasApi;

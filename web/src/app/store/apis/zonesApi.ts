import { baseApi } from './baseApi';

export interface Zone {
  id: string;
  name: string;
  code?: string;
  manager?: string;
  isActive: boolean;
}

export const zonesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getZones: build.query<Zone[], void>({
      query: () => 'zones',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Zones' as const, id })), { type: 'Zones', id: 'LIST' }] : [{ type: 'Zones', id: 'LIST' }],
    }),
    createZone: build.mutation<Zone, { name: string; code?: string; manager?: string; isActive?: boolean }>({
      query: (body) => ({ url: 'zones', method: 'POST', body }),
      invalidatesTags: [{ type: 'Zones', id: 'LIST' }],
    }),
    updateZone: build.mutation<Zone, { id: string; body: Partial<{ name: string; code: string; manager: string; isActive: boolean }> }>({
      query: ({ id, body }) => ({ url: `zones/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Zones', id }, { type: 'Zones', id: 'LIST' }],
    }),
    deleteZone: build.mutation<void, string>({
      query: (id) => ({ url: `zones/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Zones', id }, { type: 'Zones', id: 'LIST' }],
    }),
  }),
});

export const { useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation } = zonesApi;

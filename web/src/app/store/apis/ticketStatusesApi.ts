import { baseApi } from './baseApi';
import type { TicketStatus } from '@/app/types';

export const ticketStatusesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTicketStatuses: build.query<TicketStatus[], void>({
      query: () => 'ticket-statuses',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'TicketStatuses' as const, id })), { type: 'TicketStatuses', id: 'LIST' }]
          : [{ type: 'TicketStatuses', id: 'LIST' }],
    }),
    getTicketStatus: build.query<TicketStatus, string>({
      query: (id) => `ticket-statuses/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'TicketStatuses', id }],
    }),
  }),
});

export const { useGetTicketStatusesQuery, useGetTicketStatusQuery } = ticketStatusesApi;

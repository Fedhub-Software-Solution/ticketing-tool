import { baseApi } from './baseApi';
import type { Ticket } from '@/app/types';

export interface TicketListParams {
  status?: string;
  priority?: string;
  zone?: string;
  assignedTo?: string;
  limit?: number;
  offset?: number;
}

export interface CreateTicketBody {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  categoryId?: string;
  subCategory?: string;
  zone?: string;
  location?: string;
  branch?: string;
  branchCode?: string;
  assignedToId?: string;
  slaId?: string;
  slaDueDate?: string;
  tags?: string[];
  parentId?: string;
}

export interface UpdateTicketArg {
  id: string;
  body: Partial<
    CreateTicketBody & {
      status?: string;
      priority?: string;
      escalationLevel?: number;
      escalatedTo?: string;
      breachedSLA?: boolean;
      tags?: string[];
    }
  >;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTickets: build.query<Ticket[], TicketListParams | void>({
      query: (params = {}) => ({ url: 'tickets', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Tickets' as const, id })), { type: 'Tickets', id: 'LIST' }]
          : [{ type: 'Tickets', id: 'LIST' }],
    }),
    getTicket: build.query<Ticket, string>({
      query: (id) => `tickets/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Ticket', id }],
    }),
    createTicket: build.mutation<Ticket, CreateTicketBody>({
      query: (body) => ({ url: 'tickets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Tickets', id: 'LIST' }],
    }),
    updateTicket: build.mutation<Ticket, UpdateTicketArg>({
      query: ({ id, body }) => ({ url: `tickets/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Ticket', id }, { type: 'Tickets', id: 'LIST' }],
    }),
    deleteTicket: build.mutation<void, string>({
      query: (id) => ({ url: `tickets/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Ticket', id }, { type: 'Tickets', id: 'LIST' }],
    }),
    getComments: build.query<TicketComment[], string>({
      query: (ticketId) => `tickets/${ticketId}/comments`,
      providesTags: (_result, _err, ticketId) => [{ type: 'Comments', id: ticketId }],
    }),
    addComment: build.mutation<TicketComment, { ticketId: string; text: string }>({
      query: ({ ticketId, text }) => ({ url: `tickets/${ticketId}/comments`, method: 'POST', body: { text } }),
      invalidatesTags: (_result, _err, { ticketId }) => [{ type: 'Comments', id: ticketId }, { type: 'Ticket', id: ticketId }],
    }),
    updateComment: build.mutation<TicketComment, { ticketId: string; commentId: string; text: string }>({
      query: ({ ticketId, commentId, text }) => ({
        url: `tickets/${ticketId}/comments/${commentId}`,
        method: 'PATCH',
        body: { text },
      }),
      invalidatesTags: (_result, _err, { ticketId }) => [{ type: 'Comments', id: ticketId }, { type: 'Ticket', id: ticketId }],
    }),
    deleteComment: build.mutation<void, { ticketId: string; commentId: string }>({
      query: ({ ticketId, commentId }) => ({ url: `tickets/${ticketId}/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, { ticketId }) => [{ type: 'Comments', id: ticketId }, { type: 'Ticket', id: ticketId }],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = ticketsApi;

import { baseApi } from './baseApi';

export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'comment' | 'escalation' | 'warning' | 'success' | 'new_ticket';
  title: string;
  description: string;
  ticketId?: string | null;
  ticketNumber?: string | null;
  read: boolean;
  createdAt: string;
  time: string;
  synthetic?: boolean;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<Notification[], void>({
      query: () => 'notifications',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Notifications' as const, id })), { type: 'Notifications', id: 'LIST' }]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markAllNotificationsRead: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: 'notifications/read-all', method: 'POST' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { token?: string | null } };
      const token = state.auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Tickets', 'Ticket', 'Comments', 'SLAs', 'EscalationRules', 'Categories', 'Zones', 'Branches', 'Enterprise', 'Reports', 'Roles'],
  endpoints: () => ({}),
});

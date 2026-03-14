import { baseApi } from './baseApi';

export interface Priority {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
}

export const prioritiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPriorities: build.query<Priority[], void>({
      query: () => 'priorities',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Priorities' as const, id })), { type: 'Priorities', id: 'LIST' }]
          : [{ type: 'Priorities', id: 'LIST' }],
    }),
  }),
});

export const { useGetPrioritiesQuery } = prioritiesApi;

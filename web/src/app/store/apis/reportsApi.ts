import { baseApi } from './baseApi';

export interface ReportSummary {
  total: number;
  resolved: number;
  open: number;
  inProgress: number;
  escalated: number;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReportSummary: build.query<ReportSummary, { dateRange?: 'week' | 'month' | 'year' } | void>({
      query: (params) => ({ url: 'reports/summary', params: params ?? {} }),
      providesTags: ['Reports'],
    }),
  }),
});

export const { useGetReportSummaryQuery } = reportsApi;

import { baseApi } from './baseApi';

export interface ReportSummary {
  total: number;
  resolved: number;
  open: number;
  inProgress: number;
  onHold?: number;
  closed?: number;
  escalated: number;
}

export interface ReportRegionalRow {
  zoneName: string;
  total: number;
  resolved: number;
  open: number;
}

export interface DashboardData {
  summary: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
    breachedSLA: number;
    slaComplianceRate: number;
  };
  change: { totalChangePct: number; resolvedChangePct: number };
  trend: { date: string; day: string; opened: number; resolved: number }[];
  priority: { urgent: number; high: number; medium: number; low: number };
  category: { name: string; value: number }[];
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReportSummary: build.query<ReportSummary, { dateRange?: 'week' | 'month' | 'year' | 'all' } | void>({
      query: (params) => ({ url: 'reports/summary', params: params ?? {} }),
      providesTags: ['Reports'],
    }),
    getReportRegional: build.query<ReportRegionalRow[], { dateRange?: 'week' | 'month' | 'year' | 'all' } | void>({
      query: (params) => ({ url: 'reports/regional', params: params ?? {} }),
      providesTags: ['Reports'],
    }),
    getDashboard: build.query<DashboardData, { forUser?: string } | void>({
      query: (params) => ({ url: 'reports/dashboard', params: params ?? {} }),
      providesTags: ['Reports'],
    }),
  }),
});

export const { useGetReportSummaryQuery, useGetReportRegionalQuery, useGetDashboardQuery } = reportsApi;

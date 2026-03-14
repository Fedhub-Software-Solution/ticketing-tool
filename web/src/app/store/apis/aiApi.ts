import { baseApi } from './baseApi';

export interface ParsedTicketSuggestion {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export interface ParsedReportSuggestion {
  status?: string;
  assignedToName?: string;
  dateFrom?: string;
  dateTo?: string;
  zone?: string;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    parseTicketPrompt: build.mutation<ParsedTicketSuggestion, { prompt: string }>({
      query: (body) => ({
        url: 'ai/parse-ticket-prompt',
        method: 'POST',
        body,
      }),
    }),
    parseReportPrompt: build.mutation<ParsedReportSuggestion, { prompt: string }>({
      query: (body) => ({
        url: 'ai/parse-report-prompt',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useParseTicketPromptMutation, useParseReportPromptMutation } = aiApi;

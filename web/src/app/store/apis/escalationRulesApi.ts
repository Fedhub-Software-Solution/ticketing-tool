import { baseApi } from './baseApi';
import type { EscalationRule } from '@/app/types';

export const escalationRulesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEscalationRules: build.query<EscalationRule[], void>({
      query: () => 'escalation-rules',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'EscalationRules' as const, id })), { type: 'EscalationRules', id: 'LIST' }]
          : [{ type: 'EscalationRules', id: 'LIST' }],
    }),
    createEscalationRule: build.mutation<
      EscalationRule,
      { name: string; priority: string; triggerAfter: number; level1Escalate?: string; level2Escalate?: string; notifyUsers?: string[]; autoEscalate?: boolean }
    >({
      query: (body) => ({ url: 'escalation-rules', method: 'POST', body }),
      invalidatesTags: [{ type: 'EscalationRules', id: 'LIST' }],
    }),
    updateEscalationRule: build.mutation<
      EscalationRule,
      { id: string; body: Partial<EscalationRule> }
    >({
      query: ({ id, body }) => ({ url: `escalation-rules/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'EscalationRules', id }, { type: 'EscalationRules', id: 'LIST' }],
    }),
    deleteEscalationRule: build.mutation<void, string>({
      query: (id) => ({ url: `escalation-rules/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'EscalationRules', id }, { type: 'EscalationRules', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
} = escalationRulesApi;

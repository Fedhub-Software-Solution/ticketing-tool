import { baseApi } from './baseApi';

export interface EnterpriseConfig {
  companyName?: string;
  legalName?: string;
  regNumber?: string;
  taxId?: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export const enterpriseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEnterprise: build.query<EnterpriseConfig, void>({
      query: () => 'enterprise',
      providesTags: ['Enterprise'],
    }),
    updateEnterprise: build.mutation<EnterpriseConfig, EnterpriseConfig>({
      query: (body) => ({ url: 'enterprise', method: 'PATCH', body }),
      invalidatesTags: ['Enterprise'],
    }),
  }),
});

export const { useGetEnterpriseQuery, useUpdateEnterpriseMutation } = enterpriseApi;

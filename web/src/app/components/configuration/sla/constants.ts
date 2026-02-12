import { SLA_PRIORITIES } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';

export const DEFAULT_PRIORITY = SLA_PRIORITIES.find((p) => p.value === 'medium')!.value;

export const INITIAL_FORM = {
  name: '',
  priority: DEFAULT_PRIORITY as SLAPriorityValue,
  responseTime: 60,
  resolutionTime: 480,
} as const;

export type SLAFormData = {
  name: string;
  priority: SLAPriorityValue;
  responseTime: number;
  resolutionTime: number;
};

export const EMPTY_MESSAGE =
  'No SLA policies found. Try adjusting your filters or create a new policy.';

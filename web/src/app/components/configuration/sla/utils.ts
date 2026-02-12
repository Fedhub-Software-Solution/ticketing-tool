import { SLA_PRIORITIES } from '@/app/components/common/constants';

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function priorityLabel(value: string): string {
  return SLA_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

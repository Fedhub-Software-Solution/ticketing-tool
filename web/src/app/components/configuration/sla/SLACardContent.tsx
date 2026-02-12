import { Clock } from 'lucide-react';
import { Badge } from '@/app/components/common/ui/badge';
import { SLA_PRIORITY_COLORS } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';
import type { SLA } from '@/app/types';
import { formatTime, priorityLabel } from './utils';

export function SLACardContent({ sla }: { sla: SLA }) {
  return (
    <>
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
        <Clock className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-semibold text-slate-900">{sla.name}</h3>
          <Badge
            className={`${SLA_PRIORITY_COLORS[sla.priority as SLAPriorityValue] ?? 'bg-slate-100 text-slate-700 border-slate-200'} border font-medium px-2 py-0`}
          >
            {priorityLabel(sla.priority)}
          </Badge>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            Response:{' '}
            <span className="font-semibold text-slate-700">
              {formatTime(sla.responseTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            Resolution:{' '}
            <span className="font-semibold text-slate-700">
              {formatTime(sla.resolutionTime)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

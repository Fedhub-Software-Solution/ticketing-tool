import { TrendingUp, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/app/components/common/ui/badge';
import { SLA_PRIORITY_COLORS } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';
import type { EscalationRule } from '@/app/types';
import { formatTime, priorityLabel } from '@/app/components/common/utils';

export function EscalationCardContent({ rule }: { rule: EscalationRule }) {
  return (
    <>
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-orange-50 transition-colors shrink-0">
        <TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-orange-500 transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-semibold text-slate-900">{rule.name}</h3>
          <Badge
            className={`${SLA_PRIORITY_COLORS[rule.priority as SLAPriorityValue] ?? 'bg-slate-100 text-slate-700 border-slate-200'} border font-medium px-2 py-0`}
          >
            {priorityLabel(rule.priority)}
          </Badge>
          {rule.autoEscalate && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 border font-medium px-2 py-0">
              AUTO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            Trigger:{' '}
            <span className="font-semibold text-slate-700">
              {formatTime(rule.triggerAfter)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium text-slate-600">{rule.level1Escalate}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-orange-600">{rule.level2Escalate}</span>
          </div>
        </div>
      </div>
    </>
  );
}

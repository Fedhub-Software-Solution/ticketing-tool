import { TrendingUp, Users } from 'lucide-react';
import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/app/components/common/ui/badge';
import { SLA_PRIORITY_COLORS } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';
import type { EscalationRule } from '@/app/types';
import { formatTime, priorityLabel } from '@/app/components/common/utils';

export function getEscalationTableColumns(): MRT_ColumnDef<EscalationRule>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Rule Details',
      size: 260,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-900">{row.original.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              After {formatTime(row.original.triggerAfter)}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <Badge
          className={`${SLA_PRIORITY_COLORS[row.original.priority as SLAPriorityValue] ?? 'bg-slate-100 text-slate-700 border-slate-200'} border font-medium px-2 py-0`}
        >
          {priorityLabel(row.original.priority)}
        </Badge>
      ),
    },
    {
      accessorKey: 'level1Escalate',
      header: 'Level 1',
      size: 160,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users className="w-3 h-3" />
          {row.original.level1Escalate || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'level2Escalate',
      header: 'Level 2',
      size: 180,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
          <TrendingUp className="w-3 h-3" />
          {row.original.level2Escalate || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'autoEscalate',
      header: 'Status',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) =>
        row.original.autoEscalate ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
            AUTOMATIC
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold">
            MANUAL
          </Badge>
        ),
    },
  ];
}

import { Clock } from 'lucide-react';
import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/app/components/common/ui/badge';
import { SLA_PRIORITY_COLORS } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';
import type { SLA } from '@/app/types';
import { formatTime, priorityLabel } from '@/app/components/common/utils';

export function getSlaTableColumns(): MRT_ColumnDef<SLA>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Policy Details',
      size: 280,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <span className="font-medium text-slate-900">{row.original.name}</span>
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
      id: 'goals',
      header: 'Goals',
      size: 180,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">
            Response / Resolution
          </span>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">
              {formatTime(row.original.responseTime)}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600 font-bold">
              {formatTime(row.original.resolutionTime)}
            </span>
          </div>
        </div>
      ),
    },
  ];
}

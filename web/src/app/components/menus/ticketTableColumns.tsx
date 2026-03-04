import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/app/components/common/ui/badge';
import type { Ticket } from '@/app/types';
import { Globe, GitBranch } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'in-progress': 'bg-violet-50 text-violet-700 border-violet-100',
  'on-hold': 'bg-amber-50 text-amber-700 border-amber-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  closed: 'bg-slate-50 text-slate-600 border-slate-200',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-100',
  high: 'bg-orange-50 text-orange-700 border-orange-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-blue-50 text-blue-700 border-blue-100',
};

export function getTicketTableColumns(): MRT_ColumnDef<Ticket>[] {
  return [
    {
      accessorKey: 'title',
      header: 'TITLE',
      size: 220,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex flex-col max-w-[200px]">
          <p className="font-semibold text-slate-900 line-clamp-1">{row.original.title}</p>
          <p className="text-[10px] text-slate-400 line-clamp-1 truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: 'zone',
      header: 'ZONE',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          {row.original.zone && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit uppercase">
              <Globe className="w-2.5 h-2.5" /> {row.original.zone}
            </span>
          )}
          {row.original.branch && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit ml-2 uppercase tracking-tight">
              <GitBranch className="w-2.5 h-2.5" /> {row.original.branch}
            </span>
          )}
          {!row.original.zone && !row.original.branch && '—'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => {
        const status = row.original.status;
        const colorClass = statusColors[status] ?? 'bg-slate-50 text-slate-600';
        return (
          <Badge className={`${colorClass} rounded-full border px-2.5 py-0.5 shadow-sm text-[10px] capitalize inline-flex items-center gap-1.5`}>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'open'
                  ? 'bg-indigo-500 animate-pulse'
                  : status === 'in-progress'
                    ? 'bg-violet-500'
                    : status === 'resolved'
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
              }`}
            />
            {(status as string).replace('-', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      size: 110,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <Badge className={`${priorityColors[row.original.priority] ?? 'bg-slate-50'} rounded-lg border px-2.5 py-0.5 shadow-sm text-[10px] capitalize`}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'ASSIGNED',
      size: 140,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
            {row.original.assignedTo?.charAt(0) ?? '?'}
          </div>
          <span className="text-sm font-medium text-slate-700">{row.original.assignedTo ?? '—'}</span>
        </div>
      ),
    },
  ];
}

import { Shield } from 'lucide-react';
import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '../../../common/ui/badge';
import type { Role } from '@/app/store/apis/rolesApi';

export function getRoleColumns(): MRT_ColumnDef<Role>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Role Name',
      size: 200,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 shrink-0">
            <Shield className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{row.original.name}</div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">{row.original.code}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'userCount',
      header: 'Users',
      size: 100,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0">
          {row.original.userCount}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 240,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      muiTableBodyCellProps: { sx: { color: '#64748b', fontSize: '0.875rem' } },
      Cell: ({ row }) => (
        <p className="text-sm text-slate-500 leading-relaxed truncate max-w-[280px]">
          {row.original.description || '—'}
        </p>
      ),
    },
    {
      id: 'permissions',
      header: 'Key Permissions',
      size: 280,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => {
        const perms = row.original.permissions || [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {perms.slice(0, 3).map((perm) => (
              <span
                key={perm}
                className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap"
              >
                {perm}
              </span>
            ))}
            {perms.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">+{perms.length - 3} more</span>
            )}
            {perms.length === 0 && <span className="text-slate-400">—</span>}
          </div>
        );
      },
    },
  ];
}

import { Mail, Building2, MapPin } from 'lucide-react';
import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '../../../common/ui/badge';
import type { User } from '@/app/types';
import type { Role } from '@/app/store/apis/rolesApi';
import type { Zone } from '@/app/store/apis/zonesApi';
import type { Branch } from '@/app/store/apis/branchesApi';
import { ROLE_COLORS } from '../../../common/constants';

type RoleLike = Pick<Role, 'id' | 'code' | 'name'>;
type ZoneLike = Pick<Zone, 'id' | 'name'>;
type BranchLike = Pick<Branch, 'id' | 'name' | 'zoneId'>;

export function getUserColumns(
  rolesFromApi: RoleLike[],
  zonesFromApi: ZoneLike[],
  branchesFromApi: BranchLike[]
): MRT_ColumnDef<User>[] {
  return [
    {
      accessorKey: 'name',
      header: 'User',
      size: 260,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shrink-0">
            {row.original.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate">{row.original.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <Badge
          className={
            row.original.status === 'active'
              ? 'bg-green-100 text-green-700 border-green-200 shadow-none px-2 py-0'
              : 'bg-slate-100 text-slate-600 border-slate-200 shadow-none px-2 py-0'
          }
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.original.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => {
        const roleDef = rolesFromApi.find((r) => r.code === row.original.role) ?? {
          name: (row.original.role ?? '').charAt(0).toUpperCase() + (row.original.role ?? '').slice(1),
        };
        const label = roleDef?.name ?? row.original.role;
        return (
          <Badge
            className={`${ROLE_COLORS[row.original.role as keyof typeof ROLE_COLORS] ?? 'bg-slate-100 text-slate-700 border-slate-200'} shadow-none border font-medium px-2 py-0 capitalize`}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: 'zoneBranch',
      header: 'Zone / Branch',
      size: 180,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => {
        const zoneId = row.original.zone;
        const branchId = row.original.branch;
        const zone = zoneId ? zonesFromApi.find((z) => z.id === zoneId) : null;
        const branch = branchId ? branchesFromApi.find((b) => b.id === branchId) : null;
        if (!zone && !branch) return <span className="text-slate-400 text-sm italic">Not assigned</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {branch && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{branch.name}</span>
              </div>
            )}
            {zone && (
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{zone.name} Zone</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      size: 140,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{row.original.location || 'N/A'}</span>
        </div>
      ),
    },
  ];
}

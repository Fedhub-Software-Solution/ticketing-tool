import type { MRT_ColumnDef } from 'material-react-table';
import type { Zone } from '@/app/store/apis/zonesApi';
import type { Branch } from '@/app/store/apis/branchesApi';

type UserLike = { id: string; name: string };

export function getZoneColumns(
  users: UserLike[],
  branchesFromApi: Branch[]
): MRT_ColumnDef<Zone>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Zone Name',
      size: 200,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
      muiTableBodyCellProps: { sx: { color: '#334155' } },
    },
    {
      accessorKey: 'code',
      header: 'Code',
      size: 120,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
      muiTableBodyCellProps: { sx: { color: '#334155', fontFamily: 'monospace' } },
    },
    {
      accessorKey: 'manager',
      header: 'Manager',
      size: 180,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
      Cell: ({ row }) => {
        const managerId = row.original.manager;
        const managerUser = users.find((u) => u.id === managerId);
        return managerUser ? (
          <span className="text-[#1976D2] font-normal">{managerUser.name}</span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      id: 'branches',
      header: 'Branches',
      size: 200,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
      Cell: ({ row }) => {
        const zoneId = row.original.id;
        const zoneBranches = branchesFromApi.filter((b) => b.zoneId === zoneId);
        if (zoneBranches.length === 0) return <span className="text-slate-400">—</span>;
        return (
          <span className="text-slate-700 text-sm">
            {zoneBranches.map((b) => b.name).join(', ')}
          </span>
        );
      },
    },
  ];
}

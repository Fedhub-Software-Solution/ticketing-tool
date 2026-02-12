import type { MRT_ColumnDef } from 'material-react-table';
import type { Branch } from '@/app/store/apis/branchesApi';

type UserLike = { id: string; name: string };

export function getBranchColumns(users: UserLike[]): MRT_ColumnDef<Branch>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Branch Name',
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
      accessorKey: 'zone',
      header: 'Zone',
      size: 140,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
      muiTableBodyCellProps: { sx: { color: '#334155' } },
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
  ];
}

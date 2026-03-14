import type { MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/app/components/common/ui/badge';
import type { Category } from '@/app/types';
import { getCategoryIcon } from './categoryIcons';

export function getCategoryTableColumns(
  parentName: (id: string) => string | undefined
): MRT_ColumnDef<Category>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Category',
      size: 280,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: row.original.color }}
          >
            {getCategoryIcon(row.original.icon, 'w-4 h-4')}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-900">{row.original.name}</span>
            {row.original.categoryNumber && (
              <span className="text-[10px] text-slate-400 font-mono">
                {row.original.categoryNumber}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'categoryNumber',
      header: 'Category No.',
      size: 100,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <span className="text-sm font-mono font-medium text-slate-700">
          {row.original.categoryNumber ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate block max-w-[200px]" title={row.original.description}>
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'parentId',
      header: 'Type',
      size: 140,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700">
          {row.original.parentId
            ? `Sub of ${parentName(row.original.parentId) ?? '—'}`
            : 'Main Category'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: 100,
      muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
      Cell: () => (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-green-700">Active</span>
        </div>
      ),
    },
  ];
}

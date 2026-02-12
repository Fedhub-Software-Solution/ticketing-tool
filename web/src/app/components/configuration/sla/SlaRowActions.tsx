import { Edit, Trash2 } from 'lucide-react';
import type { MRT_Row } from 'material-react-table';
import { Button } from '@/app/components/common/ui/button';
import type { SLA } from '@/app/types';

type Size = 'sm' | 'icon';

export function SlaRowActions({
  row,
  onEdit,
  onDelete,
  size = 'sm',
}: {
  row: MRT_Row<SLA>;
  onEdit: (sla: SLA) => void;
  onDelete: (sla: SLA) => void;
  size?: Size;
}) {
  const iconClass = size === 'sm' ? 'h-8 w-8 p-0' : 'h-9 w-9 p-0';
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={`${iconClass} text-slate-400 hover:text-blue-600 hover:bg-blue-50`}
        onClick={() => onEdit(row.original)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${iconClass} text-slate-400 hover:text-red-600 hover:bg-red-50`}
        onClick={() => onDelete(row.original)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

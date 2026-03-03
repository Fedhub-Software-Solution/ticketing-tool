import { Badge } from '@/app/components/common/ui/badge';
import type { Category } from '@/app/types';
import { getCategoryIcon } from './categoryIcons';

type CategoryCardContentProps = {
  category: Category;
  parentName?: string;
  slaName: string;
};

export function CategoryCardContent({ category, parentName, slaName }: CategoryCardContentProps) {
  return (
    <>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
        style={{ backgroundColor: category.color }}
      >
        {getCategoryIcon(category.icon, 'w-6 h-6')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-bold text-slate-900 truncate">{category.name}</h3>
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-bold text-slate-400 border-slate-200 shrink-0"
          >
            {category.id}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 truncate pr-4">{category.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>
            Category Type:{' '}
            <span className="text-slate-700 font-semibold normal-case">
              {parentName ? `Sub of ${parentName}` : 'Main Category'}
            </span>
          </span>
          <span>
            SLA Policy:{' '}
            <span className="text-slate-700 font-semibold normal-case">{slaName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            Status:{' '}
            <span className="flex items-center gap-1 text-green-700 font-semibold normal-case">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active
            </span>
          </span>
        </div>
      </div>
    </>
  );
}

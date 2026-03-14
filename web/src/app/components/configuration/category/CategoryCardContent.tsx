import { Badge } from '@/app/components/common/ui/badge';
import type { Category } from '@/app/types';
import { getCategoryIcon } from './categoryIcons';

type CategoryCardContentProps = {
  category: Category;
  parentName?: string;
};

export function CategoryCardContent({ category, parentName }: CategoryCardContentProps) {
  const categoryType = parentName ? `Sub of ${parentName}` : 'Main Category';
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
          {category.categoryNumber && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium text-slate-500 border-slate-200 shrink-0 rounded"
            >
              {category.categoryNumber}
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate pr-4">{category.description || '—'}</p>
      </div>
      <div className="flex items-center gap-8 shrink-0 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex flex-col gap-0.5 text-left min-w-[100px]">
          <span className="text-slate-400">Category Type</span>
          <span className="font-semibold normal-case text-slate-700 text-left">{categoryType}</span>
        </div>
        <div className="flex flex-col gap-0.5 text-left min-w-[80px]">
          <span className="text-slate-400">Status</span>
          <span className="inline-flex items-center gap-1 text-green-700 font-semibold normal-case">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            Active
          </span>
        </div>
      </div>
    </>
  );
}

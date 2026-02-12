import { List, Table, Search, Filter } from 'lucide-react';
import { Button } from '@/app/components/common/ui/button';
import { Input } from '@/app/components/common/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/common/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/common/ui/tooltip';
import { SLA_PRIORITIES } from '@/app/components/common/constants';
import { SLAFormDialog } from './SLAFormDialog';
import type { SLAFormData } from '@/app/components/common/constants';
import type { SLA } from '@/app/types';

type ViewMode = 'list' | 'table';

export function SLAConfigToolbar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  viewMode,
  onViewModeChange,
  isDialogOpen,
  onDialogOpenChange,
  editingSLA,
  formData,
  onFormDataChange,
  onCreate,
  onUpdate,
  onResetForm,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  editingSLA: SLA | null;
  formData: SLAFormData;
  onFormDataChange: (data: SLAFormData) => void;
  onCreate: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onResetForm: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search SLA configurations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 h-10 focus-visible:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 h-10">
              <SelectValue placeholder="Priority Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {SLA_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onViewModeChange('list')}
                  className={`h-8 w-8 ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">List View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onViewModeChange('table')}
                  className={`h-8 w-8 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Table View</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <SLAFormDialog
          open={isDialogOpen}
          onOpenChange={onDialogOpenChange}
          editingSLA={editingSLA}
          formData={formData}
          onFormDataChange={onFormDataChange}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onReset={onResetForm}
        />
      </div>
    </div>
  );
}

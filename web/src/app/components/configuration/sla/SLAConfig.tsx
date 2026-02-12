import { useState, useMemo } from 'react';
import { Clock, Plus, Edit, Trash2, List, Table, Search, Filter } from 'lucide-react';
import type { MRT_ColumnDef, MRT_Row } from 'material-react-table';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import { Badge } from '../../common/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../common/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/tooltip';
import { useGetSLAsQuery, useCreateSLAMutation, useUpdateSLAMutation, useDeleteSLAMutation } from '@/app/store/apis/slasApi';
import { SLA } from '@/app/types';
import { SLA_PRIORITIES, SLA_PRIORITY_COLORS } from '../../common/constants';
import type { SLAPriorityValue } from '../../common/constants';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../common/ui/alert-dialog';
import { MaterialReactTableWrapper } from '@/app/components/common/mrt/MaterialReactTableWrapper';
import { MaterialReactTableCardListWrapper } from '@/app/components/common/mrt/MaterialReactTableCardListWrapper';

const DEFAULT_PRIORITY = SLA_PRIORITIES.find((p) => p.value === 'medium')!.value;

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function SLAConfig() {
  const { data: slas = [], isLoading: slasLoading } = useGetSLAsQuery();
  const [slaToDelete, setSlaToDelete] = useState<SLA | null>(null);
  const [createSLA] = useCreateSLAMutation();
  const [updateSLA] = useUpdateSLAMutation();
  const [deleteSLAMutation] = useDeleteSLAMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLA | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredSLAs = slas.filter(sla => {
    const matchesSearch = sla.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || sla.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const [formData, setFormData] = useState({
    name: '',
    priority: DEFAULT_PRIORITY as SLAPriorityValue,
    responseTime: 60,
    resolutionTime: 480,
  });

  const handleCreate = async () => {
    try {
      await createSLA({ name: formData.name, priority: formData.priority, responseTime: formData.responseTime, resolutionTime: formData.resolutionTime }).unwrap();
      setIsDialogOpen(false);
      resetForm();
      toast.success('SLA configuration created successfully');
    } catch {
      toast.error('Failed to create SLA');
    }
  };

  const handleUpdate = async () => {
    if (!editingSLA) return;
    try {
      await updateSLA({ id: editingSLA.id, body: formData }).unwrap();
      setEditingSLA(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('SLA configuration updated successfully');
    } catch {
      toast.error('Failed to update SLA');
    }
  };

  const handleDelete = async () => {
    if (!slaToDelete) return;
    try {
      await deleteSLAMutation(slaToDelete.id).unwrap();
      setSlaToDelete(null);
      toast.success('SLA configuration deleted');
    } catch {
      toast.error('Failed to delete SLA');
    }
  };

  const openEditDialog = (sla: SLA) => {
    setEditingSLA(sla);
    setFormData({
      name: sla.name,
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      priority: DEFAULT_PRIORITY,
      responseTime: 60,
      resolutionTime: 480,
    });
    setEditingSLA(null);
  };

  const priorityLabel = (value: string) => SLA_PRIORITIES.find((p) => p.value === value)?.label ?? value;

  const slaTableColumns: MRT_ColumnDef<SLA>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Policy Details',
        size: 280,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <span className="font-medium text-slate-900">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 120,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <Badge
            className={`${SLA_PRIORITY_COLORS[row.original.priority as SLAPriorityValue] ?? 'bg-slate-100 text-slate-700 border-slate-200'} border font-medium px-2 py-0`}
          >
            {priorityLabel(row.original.priority)}
          </Badge>
        ),
      },
      {
        id: 'goals',
        header: 'Goals',
        size: 180,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">Response / Resolution</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">{formatTime(row.original.responseTime)}</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600 font-bold">{formatTime(row.original.resolutionTime)}</span>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search SLA configurations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 h-10 focus-visible:ring-blue-500/20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                        onClick={() => setViewMode('list')}
                        className={`h-8 w-8 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
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
                        onClick={() => setViewMode('table')}
                        className={`h-8 w-8 ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <Table className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Table View</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
                    <Plus className="w-4 h-4" />
                    Add SLA
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingSLA ? 'Edit SLA' : 'New SLA'}</DialogTitle>
                    <DialogDescription>
                      Set response and resolution time targets for support requests.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">SLA Policy Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Enterprise Customer Support"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Target Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: SLAPriorityValue) =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLA_PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="responseTime">Response Goal (min)</Label>
                        <Input
                          id="responseTime"
                          type="number"
                          value={formData.responseTime || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({ ...formData, responseTime: isNaN(val) ? 0 : val });
                          }}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resolutionTime">Resolution Goal (min)</Label>
                        <Input
                          id="resolutionTime"
                          type="number"
                          value={formData.resolutionTime || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({ ...formData, resolutionTime: isNaN(val) ? 0 : val });
                          }}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }} className="h-10">
                      Cancel
                    </Button>
                    <Button onClick={editingSLA ? handleUpdate : handleCreate} className="h-10 bg-blue-600 hover:bg-blue-700 px-8">
                      {editingSLA ? 'Save Changes' : 'Create Policy'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* SLA List View - card list via MRT wrapper */}
          {viewMode === 'list' && (
            <MaterialReactTableCardListWrapper<SLA>
              data={filteredSLAs}
              isLoading={slasLoading}
              pageSize={10}
              emptyMessage="No SLA policies found. Try adjusting your filters or create a new policy."
              getRowId={(row: SLA) => row.id}
              renderCardContent={(sla: SLA) => (
                <>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
                    <Clock className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-slate-900">{sla.name}</h3>
                      <Badge className={`${SLA_PRIORITY_COLORS[sla.priority as SLAPriorityValue] ?? 'bg-slate-100 text-slate-700 border-slate-200'} border font-medium px-2 py-0`}>
                        {priorityLabel(sla.priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        Response: <span className="font-semibold text-slate-700">{formatTime(sla.responseTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        Resolution: <span className="font-semibold text-slate-700">{formatTime(sla.resolutionTime)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              renderRowActions={({ row }: { row: MRT_Row<SLA> }) => (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(row.original)}
                    className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSlaToDelete(row.original)}
                    className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            />
          )}

          {/* Table View - MaterialReactTableWrapper */}
          {viewMode === 'table' && (
            <MaterialReactTableWrapper<SLA>
              columns={slaTableColumns}
              data={filteredSLAs}
              isLoading={slasLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              emptyMessage="No SLA policies found. Try adjusting your filters or create a new policy."
              renderRowActions={({ row }: { row: MRT_Row<SLA> }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => openEditDialog(row.original)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setSlaToDelete(row.original)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            />
          )}

          <AlertDialog open={!!slaToDelete} onOpenChange={(open) => !open && setSlaToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete SLA policy?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{slaToDelete?.name}&quot;. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDelete()}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

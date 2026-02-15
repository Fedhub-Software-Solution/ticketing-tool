import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, List, Table } from 'lucide-react';
import type { MRT_Row } from 'material-react-table';
import { Button } from '@/app/components/common/ui/button';
import { Input } from '@/app/components/common/ui/input';
import { Label } from '@/app/components/common/ui/label';
import { Switch } from '@/app/components/common/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/common/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/common/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/common/ui/tooltip';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/common/ui/alert-dialog';
import { MaterialReactTableWrapper } from '@/app/components/common/mrt/MaterialReactTableWrapper';
import { MaterialReactTableCardListWrapper } from '@/app/components/common/mrt/MaterialReactTableCardListWrapper';
import { SLA_PRIORITIES } from '@/app/components/common/constants';
import type { SLAPriorityValue } from '@/app/components/common/constants';
import {
  useGetEscalationRulesQuery,
  useCreateEscalationRuleMutation,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
} from '@/app/store/apis/escalationRulesApi';
import type { EscalationRule } from '@/app/types';
import { toast } from 'sonner';
import { getEscalationTableColumns } from './escalationTableColumns';
import { EscalationCardContent } from './EscalationCardContent';
import { EscalationRowActions } from './EscalationRowActions';

const EMPTY_MESSAGE =
  'No escalation rules found. Try adjusting your filters or create a new rule.';

const INITIAL_FORM = {
  name: '',
  priority: 'medium' as EscalationRule['priority'],
  triggerAfter: 60,
  level1Escalate: '',
  level2Escalate: '',
  notifyUsers: '',
  autoEscalate: true,
};

type FormData = typeof INITIAL_FORM;

export function EscalationManagement() {
  const { data: rules = [], isLoading: rulesLoading } =
    useGetEscalationRulesQuery();
  const [createRule] = useCreateEscalationRuleMutation();
  const [updateRule] = useUpdateEscalationRuleMutation();
  const [deleteRule] = useDeleteEscalationRuleMutation();

  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<EscalationRule | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM });

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        const matchesSearch =
          rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.level1Escalate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.level2Escalate.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority =
          priorityFilter === 'all' || rule.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    [rules, searchQuery, priorityFilter]
  );

  const escalationColumns = useMemo(() => getEscalationTableColumns(), []);

  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM });
    setEditingRule(null);
  }, []);

  const openEditDialog = useCallback((rule: EscalationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      priority: rule.priority,
      triggerAfter: rule.triggerAfter,
      level1Escalate: rule.level1Escalate,
      level2Escalate: rule.level2Escalate,
      notifyUsers: rule.notifyUsers?.join(', ') ?? '',
      autoEscalate: rule.autoEscalate,
    });
    setIsDialogOpen(true);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      await createRule({
        name: formData.name,
        priority: formData.priority,
        triggerAfter: formData.triggerAfter,
        level1Escalate: formData.level1Escalate,
        level2Escalate: formData.level2Escalate,
        notifyUsers: formData.notifyUsers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        autoEscalate: formData.autoEscalate,
      }).unwrap();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Escalation rule created successfully');
    } catch {
      toast.error('Failed to create rule');
    }
  }, [createRule, formData, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingRule) return;
    try {
      await updateRule({
        id: editingRule.id,
        body: {
          ...formData,
          notifyUsers: formData.notifyUsers
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }).unwrap();
      setEditingRule(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Escalation rule updated successfully');
    } catch {
      toast.error('Failed to update rule');
    }
  }, [editingRule, formData, updateRule, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete.id).unwrap();
      setRuleToDelete(null);
      toast.success('Escalation rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  }, [ruleToDelete, deleteRule]);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search escalation rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 h-10 focus-visible:ring-orange-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 h-10">
                    <SelectValue placeholder="All Priorities" />
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
                        className={`h-8 w-8 ${
                          viewMode === 'list'
                            ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50'
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
                        onClick={() => setViewMode('table')}
                        className={`h-8 w-8 ${
                          viewMode === 'table'
                            ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50'
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
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-[425px]"
                  aria-describedby={undefined}
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {editingRule ? 'Edit Rule' : 'New Rule'}
                    </DialogTitle>
                    <DialogDescription>
                      Define when and how tickets should be escalated.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="esc-name">Rule Name</Label>
                      <Input
                        id="esc-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Critical Escalation"
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="esc-priority">Trigger Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value: SLAPriorityValue) =>
                            setFormData({ ...formData, priority: value })
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
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
                      <div className="space-y-2">
                        <Label htmlFor="esc-trigger">Trigger After (min)</Label>
                        <Input
                          id="esc-trigger"
                          type="number"
                          value={formData.triggerAfter || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setFormData({
                              ...formData,
                              triggerAfter: Number.isNaN(val) ? 0 : val,
                            });
                          }}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="esc-level1">Level 1 Escalate</Label>
                      <Input
                        id="esc-level1"
                        value={formData.level1Escalate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            level1Escalate: e.target.value,
                          })
                        }
                        placeholder="e.g., Senior Agent / Team Lead"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="esc-level2">Level 2 Escalate</Label>
                      <Input
                        id="esc-level2"
                        value={formData.level2Escalate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            level2Escalate: e.target.value,
                          })
                        }
                        placeholder="e.g., Department Manager"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="esc-notify">Notify Emails</Label>
                      <Input
                        id="esc-notify"
                        value={formData.notifyUsers}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifyUsers: e.target.value,
                          })
                        }
                        placeholder="email1@example.com, email2@example.com"
                        className="bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="esc-auto"
                          className="text-sm font-semibold"
                        >
                          Auto Escalate
                        </Label>
                        <p className="text-xs text-slate-500">
                          Automatically trigger escalation
                        </p>
                      </div>
                      <Switch
                        id="esc-auto"
                        checked={formData.autoEscalate}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            autoEscalate: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      className="h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingRule ? handleUpdate : handleCreate}
                      className="h-10 bg-orange-600 hover:bg-orange-700 px-8"
                    >
                      {editingRule ? 'Save Changes' : 'Create Rule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* List view */}
          {viewMode === 'list' && (
            <MaterialReactTableCardListWrapper<EscalationRule>
              data={filteredRules}
              isLoading={rulesLoading}
              pageSize={10}
              emptyMessage={EMPTY_MESSAGE}
              getRowId={(row: EscalationRule) => row.id}
              renderCardContent={(rule: EscalationRule) => (
                <EscalationCardContent rule={rule} />
              )}
              renderRowActions={({
                row,
              }: {
                row: MRT_Row<EscalationRule>;
              }) => (
                <EscalationRowActions
                  row={row}
                  onEdit={openEditDialog}
                  onDelete={setRuleToDelete}
                  size="icon"
                />
              )}
            />
          )}

          {/* Table view */}
          {viewMode === 'table' && (
            <MaterialReactTableWrapper<EscalationRule>
              columns={escalationColumns}
              data={filteredRules}
              isLoading={rulesLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              emptyMessage={EMPTY_MESSAGE}
              renderRowActions={({
                row,
              }: {
                row: MRT_Row<EscalationRule>;
              }) => (
                <EscalationRowActions
                  row={row}
                  onEdit={openEditDialog}
                  onDelete={setRuleToDelete}
                  size="sm"
                />
              )}
            />
          )}

          {/* Delete confirmation */}
          <AlertDialog
            open={!!ruleToDelete}
            onOpenChange={(open) => !open && setRuleToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete escalation rule?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{ruleToDelete?.name}&quot;.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => void handleDelete()}
                >
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

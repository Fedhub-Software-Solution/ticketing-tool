import { useState } from 'react';
import { TrendingUp, Plus, Edit, Trash2, Save, X, Bell, Users, AlertTriangle, Search, Filter, List, Table, ArrowRight } from 'lucide-react';
import { Card } from '../../common/ui/card';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import { Badge } from '../../common/ui/badge';
import { Switch } from '../../common/ui/switch';
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
import { useGetEscalationRulesQuery, useCreateEscalationRuleMutation, useUpdateEscalationRuleMutation, useDeleteEscalationRuleMutation } from '@/app/store/apis/escalationRulesApi';
import { EscalationRule } from '@/app/types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function EscalationManagement() {
  const { data: rules = [] } = useGetEscalationRulesQuery();
  const [createRule] = useCreateEscalationRuleMutation();
  const [updateRule] = useUpdateEscalationRuleMutation();
  const [deleteRule] = useDeleteEscalationRuleMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.level1Escalate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.level2Escalate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || rule.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const [formData, setFormData] = useState({
    name: '',
    priority: 'medium' as EscalationRule['priority'],
    triggerAfter: 60,
    level1Escalate: '',
    level2Escalate: '',
    notifyUsers: '',
    autoEscalate: true,
  });

  const handleCreate = async () => {
    try {
      await createRule({
        name: formData.name,
        priority: formData.priority,
        triggerAfter: formData.triggerAfter,
        level1Escalate: formData.level1Escalate,
        level2Escalate: formData.level2Escalate,
        notifyUsers: formData.notifyUsers.split(',').map(s => s.trim()).filter(Boolean),
        autoEscalate: formData.autoEscalate,
      }).unwrap();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Escalation rule created successfully');
    } catch {
      toast.error('Failed to create rule');
    }
  };

  const handleUpdate = async () => {
    if (!editingRule) return;
    try {
      await updateRule({
        id: editingRule.id,
        body: {
          ...formData,
          notifyUsers: formData.notifyUsers.split(',').map(s => s.trim()).filter(Boolean),
        },
      }).unwrap();
      setEditingRule(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Escalation rule updated successfully');
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule(id).unwrap();
      toast.success('Escalation rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const openEditDialog = (rule: EscalationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      priority: rule.priority,
      triggerAfter: rule.triggerAfter,
      level1Escalate: rule.level1Escalate,
      level2Escalate: rule.level2Escalate,
      notifyUsers: rule.notifyUsers.join(', '),
      autoEscalate: rule.autoEscalate,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 'medium',
      triggerAfter: 60,
      level1Escalate: '',
      level2Escalate: '',
      notifyUsers: '',
      autoEscalate: true,
    });
    setEditingRule(null);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`;
    }
    return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
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
                    <SelectValue placeholder="Priority Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
                        className={`h-8 w-8 ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
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
                        className={`h-8 w-8 ${viewMode === 'table' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
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
                  <Button className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingRule ? 'Edit Rule' : 'New Rule'}</DialogTitle>
                    <DialogDescription>
                      Define when and how tickets should be escalated.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Rule Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Critical Escalation"
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Trigger Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value: EscalationRule['priority']) => 
                            setFormData({ ...formData, priority: value })
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="triggerAfter">Trigger After (min)</Label>
                        <Input
                          id="triggerAfter"
                          type="number"
                          value={formData.triggerAfter || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({ ...formData, triggerAfter: isNaN(val) ? 0 : val });
                          }}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level1Escalate">Level 1 Escalate</Label>
                      <Input
                        id="level1Escalate"
                        value={formData.level1Escalate}
                        onChange={(e) => setFormData({ ...formData, level1Escalate: e.target.value })}
                        placeholder="e.g., Senior Agent / Team Lead"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level2Escalate">Level 2 Escalate</Label>
                      <Input
                        id="level2Escalate"
                        value={formData.level2Escalate}
                        onChange={(e) => setFormData({ ...formData, level2Escalate: e.target.value })}
                        placeholder="e.g., Department Manager"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notifyUsers">Notify Emails</Label>
                      <Input
                        id="notifyUsers"
                        value={formData.notifyUsers}
                        onChange={(e) => setFormData({ ...formData, notifyUsers: e.target.value })}
                        placeholder="email1@example.com, email2@example.com"
                        className="bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoEscalate" className="text-sm font-semibold">Auto Escalate</Label>
                        <p className="text-xs text-slate-500">Automatically trigger escalation</p>
                      </div>
                      <Switch
                        id="autoEscalate"
                        checked={formData.autoEscalate}
                        onCheckedChange={(checked) => setFormData({ ...formData, autoEscalate: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }} className="h-10">
                      Cancel
                    </Button>
                    <Button onClick={editingRule ? handleUpdate : handleCreate} className="h-10 bg-orange-600 hover:bg-orange-700 px-8">
                      {editingRule ? 'Save Changes' : 'Create Rule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Rules List View */}
          {viewMode === 'list' && (
            <div className="grid gap-4">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-5 hover:shadow-md transition-all border-slate-200 group bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                            <TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-slate-900">{rule.name}</h3>
                              <Badge className={`${priorityColors[rule.priority]} border font-medium px-2 py-0`}>
                                {rule.priority}
                              </Badge>
                              {rule.autoEscalate && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200 border font-medium px-2 py-0">
                                  AUTO
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Trigger: <span className="font-semibold text-slate-700">{formatTime(rule.triggerAfter)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-medium text-slate-600">{rule.level1Escalate}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-orange-600">{rule.level2Escalate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(rule)}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No escalation rules found</h3>
                  <p className="text-slate-500">Try adjusting your filters or create a new rule.</p>
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Details</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Level 1</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Level 2</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider pr-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.map((rule, index) => (
                      <motion.tr
                        key={rule.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{rule.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">After {formatTime(rule.triggerAfter)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${priorityColors[rule.priority]} border font-medium px-2 py-0`}>
                            {rule.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Users className="w-3 h-3" />
                            <span>{rule.level1Escalate}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <TrendingUp className="w-3 h-3" />
                            <span>{rule.level2Escalate}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {rule.autoEscalate ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">AUTOMATIC</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold">MANUAL</Badge>
                          )}
                        </td>
                        <td className="py-4 px-6 pr-10">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(rule)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

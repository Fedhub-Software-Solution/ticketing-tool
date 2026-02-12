import { useState } from 'react';
import { Clock, Plus, Edit, Trash2, Save, X, List, Table, Search, Filter } from 'lucide-react';
import { Card } from '../../common/ui/card';
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
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function SLAConfig() {
  const { data: slas = [] } = useGetSLAsQuery();
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
    priority: 'medium' as SLA['priority'],
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

  const handleDelete = async (id: string) => {
    try {
      await deleteSLAMutation(id).unwrap();
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
      priority: 'medium',
      responseTime: 60,
      resolutionTime: 480,
    });
    setEditingSLA(null);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
                        onValueChange={(value: SLA['priority']) => 
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

          {/* SLA List View */}
          {viewMode === 'list' && (
            <div className="grid gap-4">
              {filteredSLAs.length > 0 ? (
                filteredSLAs.map((sla, index) => (
                  <motion.div
                    key={sla.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-5 hover:shadow-md transition-all border-slate-200 group bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <Clock className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-base font-semibold text-slate-900">{sla.name}</h3>
                              <Badge className={`${priorityColors[sla.priority]} border font-medium px-2 py-0`}>
                                {sla.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Response: <span className="font-semibold text-slate-700">{formatTime(sla.responseTime)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Resolution: <span className="font-semibold text-slate-700">{formatTime(sla.resolutionTime)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(sla)}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sla.id)}
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
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No SLA policies found</h3>
                  <p className="text-slate-500">Try adjusting your filters or create a new policy.</p>
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
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Details</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Goals</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider pr-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSLAs.map((sla, index) => (
                      <motion.tr
                        key={sla.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="font-medium text-slate-900">{sla.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${priorityColors[sla.priority]} border font-medium px-2 py-0`}>
                            {sla.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">Response / Resolution</span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 font-bold">{formatTime(sla.responseTime)}</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-indigo-600 font-bold">{formatTime(sla.resolutionTime)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 pr-10">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(sla)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(sla.id)}
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

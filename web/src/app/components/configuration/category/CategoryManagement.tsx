import { useState } from 'react';
import { 
  FolderOpen, Plus, Edit, Trash2, Save, X, Tag as TagIcon, 
  Search, Filter, List, Table, Bug, Lightbulb, AlertCircle, 
  Zap, User, CreditCard, Mail, Lock, Settings, Database, 
  Globe, Shield, MoreVertical, Layers, CheckCircle2, Circle
} from 'lucide-react';
import { Card } from '../../common/ui/card';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import { Textarea } from '../../common/ui/textarea';
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
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '@/app/store/apis/categoriesApi';
import { useGetSLAsQuery } from '@/app/store/apis/slasApi';
import { Category } from '@/app/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const iconOptions = [
  { name: 'Folder', icon: FolderOpen },
  { name: 'Bug', icon: Bug },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Alert', icon: AlertCircle },
  { name: 'Zap', icon: Zap },
  { name: 'User', icon: User },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Mail', icon: Mail },
  { name: 'Lock', icon: Lock },
  { name: 'Settings', icon: Settings },
  { name: 'Database', icon: Database },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield }
];

const colorOptions = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
];

export function CategoryManagement() {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: slas = [] } = useGetSLAsQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategoryMutation] = useUpdateCategoryMutation();
  const [deleteCategoryMutation] = useDeleteCategoryMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'FolderOpen',
    color: '#3b82f6',
    slaId: 'none',
    parentId: 'none',
  });

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (category.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.id) || // Mocking active state as always true for now
                         (statusFilter === 'inactive' && !category.id);
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    try {
      await createCategory({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        slaId: formData.slaId === 'none' ? undefined : formData.slaId,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId,
      }).unwrap();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Category created successfully');
    } catch {
      toast.error('Failed to create category');
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    try {
      await updateCategoryMutation({
        id: editingCategory.id,
        body: {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          slaId: formData.slaId === 'none' ? undefined : formData.slaId,
          parentId: formData.parentId === 'none' ? undefined : formData.parentId,
        },
      }).unwrap();
      setEditingCategory(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Category updated successfully');
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoryMutation(id).unwrap();
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      slaId: category.slaId || 'none',
      parentId: category.parentId || 'none',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'FolderOpen',
      color: '#3b82f6',
      slaId: 'none',
      parentId: 'none',
    });
    setEditingCategory(null);
  };

  const getIcon = (iconName: string) => {
    const option = iconOptions.find(o => o.name === iconName) || iconOptions[0];
    const IconComponent = option.icon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">With SLA Rules</p>
                <p className="text-2xl font-bold text-slate-900">{categories.filter(c => c.slaId).length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Status</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 h-10 focus-visible:ring-indigo-500/20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 h-10">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
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
                        className={`h-8 w-8 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
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
                        className={`h-8 w-8 ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
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
                  <Button className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
                    <Plus className="w-4 h-4" />
                    New Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Categories help organize support requests and apply appropriate SLA policies.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-semibold">Category Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Technical Hardware"
                        className="h-11 bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-700 font-semibold">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Define what kind of tickets fall into this category..."
                        rows={3}
                        className="bg-white border-slate-200 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon" className="text-slate-700 font-semibold">Icon</Label>
                        <Select
                          value={formData.icon}
                          onValueChange={(value) => setFormData({ ...formData, icon: value })}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((opt) => (
                              <SelectItem key={opt.name} value={opt.name}>
                                <div className="flex items-center gap-2">
                                  <opt.icon className="w-4 h-4" />
                                  <span>{opt.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parent" className="text-slate-700 font-semibold">Category Type</Label>
                        <Select
                          value={formData.parentId}
                          onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-200">
                            <SelectValue placeholder="Main Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Set as Main Category</SelectItem>
                            {categories
                              .filter(c => !editingCategory || c.id !== editingCategory.id)
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  Set as Sub-category of {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sla" className="text-slate-700 font-semibold">Associated SLA</Label>
                      <Select
                        value={formData.slaId}
                        onValueChange={(value) => setFormData({ ...formData, slaId: value })}
                      >
                        <SelectTrigger className="h-11 bg-white border-slate-200">
                          <SelectValue placeholder="Select SLA" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Default Policy</SelectItem>
                          {slas.map((sla) => (
                            <SelectItem key={sla.id} value={sla.id}>
                              {sla.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-semibold">Theme Color</Label>
                      <div className="grid grid-cols-9 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: color.value })}
                            className={`w-8 h-8 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${
                              formData.color === color.value ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:ring-1 hover:ring-slate-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {formData.color === color.value && <div className="w-2 h-2 rounded-full bg-white/50" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="border-t border-slate-100 pt-6 gap-3">
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }} className="h-11 px-6">
                      Cancel
                    </Button>
                    <Button 
                      onClick={editingCategory ? handleUpdate : handleCreate}
                      disabled={!formData.name.trim() || !formData.description.trim()}
                      className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md"
                    >
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Categories Content */}
          <div className="min-h-[400px]">
            {filteredCategories.length > 0 ? (
              viewMode === 'list' ? (
                <div className="grid gap-3">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-all border-slate-200 group bg-white">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                              style={{ backgroundColor: category.color }}
                            >
                              {getIcon(category.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-slate-900 truncate">{category.name}</h3>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">
                                  {category.id}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 truncate pr-4">
                                {category.description}
                              </p>
                            </div>
                            <div className="hidden lg:flex items-center gap-6 px-4 border-l border-slate-100">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Type</span>
                                <span className="text-sm font-semibold text-slate-700">
                                  {category.parentId ? `Sub of ${categories.find(c => c.id === category.parentId)?.name}` : 'Main Category'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Policy</span>
                                <span className="text-sm font-semibold text-slate-700">
                                  {category.slaId ? slas.find(s => s.id === category.slaId)?.name : 'Default Policy'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="text-xs font-bold text-green-700">Active</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(category)}
                              className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
                              className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Policy</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider pr-10">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCategories.map((category, index) => (
                          <motion.tr
                            key={category.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px]"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {getIcon(category.icon)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{category.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{category.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-600 font-medium">
                                {category.parentId ? 'Sub Category' : 'Main Category'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
                                {category.slaId ? slas.find(s => s.id === category.slaId)?.name : 'Default Policy'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs font-bold text-green-700">ACTIVE</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 pr-10">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(category)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(category.id)}
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
              )
            ) : (
              <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No categories found</h3>
                <p className="text-slate-500">Try adjusting your filters or create a new category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

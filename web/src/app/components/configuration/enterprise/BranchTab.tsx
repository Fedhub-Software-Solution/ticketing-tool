import { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../common/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select';
import { Switch } from '../../common/ui/switch';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../common/ui/alert-dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation, useDeleteBranchMutation } from '@/app/store/apis/branchesApi';
import type { Branch } from '@/app/store/apis/branchesApi';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import { getBranchColumns } from './columns/branchColumns';

const EMPTY_BRANCH_FORM = { name: '', code: '', zoneId: '', manager: '', isActive: true };

export function BranchTab() {
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [branchFormData, setBranchFormData] = useState(EMPTY_BRANCH_FORM);

  const { data: zonesFromApi = [] } = useGetZonesQuery(undefined);
  const { data: branchesFromApi = [], isLoading: branchesLoading } = useGetBranchesQuery(undefined);
  const { data: users = [] } = useGetUsersQuery(undefined);
  const [createBranch, { isLoading: branchCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: branchUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const branchColumns = useMemo(() => getBranchColumns(users), [users]);

  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery.trim()) return branchesFromApi;
    const q = branchSearchQuery.toLowerCase();
    return branchesFromApi.filter((b) => {
      const managerName = b.manager ? users.find((u) => u.id === b.manager)?.name?.toLowerCase() ?? '' : '';
      return (
        b.name.toLowerCase().includes(q) ||
        (b.code ?? '').toLowerCase().includes(q) ||
        (b.zone ?? '').toLowerCase().includes(q) ||
        managerName.includes(q)
      );
    });
  }, [branchesFromApi, branchSearchQuery, users]);

  const handleCreateBranch = async () => {
    try {
      await createBranch({
        name: branchFormData.name.trim(),
        code: branchFormData.code || undefined,
        zoneId: branchFormData.zoneId,
        manager: branchFormData.manager || undefined,
        isActive: branchFormData.isActive,
      }).unwrap();
      setIsBranchDialogOpen(false);
      setBranchFormData(EMPTY_BRANCH_FORM);
      toast.success('Branch created successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || 'Failed to create branch');
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch) return;
    try {
      await updateBranch({
        id: editingBranch.id,
        body: {
          name: branchFormData.name.trim(),
          code: branchFormData.code || undefined,
          zoneId: branchFormData.zoneId || undefined,
          manager: branchFormData.manager || undefined,
          isActive: branchFormData.isActive,
        },
      }).unwrap();
      setEditingBranch(null);
      setIsBranchDialogOpen(false);
      setBranchFormData(EMPTY_BRANCH_FORM);
      toast.success('Branch updated successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || 'Failed to update branch');
    }
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      await deleteBranch(branchToDelete.id).unwrap();
      setBranchToDelete(null);
      toast.success('Branch deleted successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || 'Failed to delete branch');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
            <DialogDescription>Enter the details for the branch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Branch Name</Label>
              <Input
                value={branchFormData.name}
                onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                placeholder="e.g. Chennai Main"
              />
            </div>
            <div>
              <Label>Branch Code</Label>
              <Input
                value={branchFormData.code}
                onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value })}
                placeholder="e.g. CHN-M"
              />
            </div>
            <div>
              <Label>Zone</Label>
              <Select
                value={branchFormData.zoneId}
                onValueChange={(val) => setBranchFormData({ ...branchFormData, zoneId: val })}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zonesFromApi.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch Manager</Label>
              <Select
                value={branchFormData.manager || 'none'}
                onValueChange={(v) => setBranchFormData({ ...branchFormData, manager: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select a user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.email ? `(${u.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={branchFormData.isActive}
                onCheckedChange={(v) => setBranchFormData({ ...branchFormData, isActive: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBranchDialogOpen(false);
                setEditingBranch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingBranch ? handleUpdateBranch : handleCreateBranch}
              disabled={
                branchCreating ||
                branchUpdating ||
                !branchFormData.name.trim() ||
                !branchFormData.zoneId
              }
            >
              {branchCreating || branchUpdating ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search branches..."
            value={branchSearchQuery}
            onChange={(e) => setBranchSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200 h-10"
          />
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
          onClick={() => {
            setEditingBranch(null);
            setBranchFormData(EMPTY_BRANCH_FORM);
            setIsBranchDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      <MaterialReactTableWrapper<Branch>
        columns={branchColumns}
        data={filteredBranches}
        isLoading={branchesLoading}
        enableTopToolbar={false}
        enableRowActions
        positionActionsColumn="last"
        renderRowActions={({ row }) => (
          <div className="flex items-center justify-start gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => {
                const branch = row.original;
                setEditingBranch(branch);
                setBranchFormData({
                  name: branch.name,
                  code: branch.code ?? '',
                  zoneId: branch.zoneId,
                  manager: branch.manager ?? '',
                  isActive: branch.isActive,
                });
                setIsBranchDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => setBranchToDelete(row.original)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the branch &quot;{branchToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteBranch()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

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
import { useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation } from '@/app/store/apis/zonesApi';
import type { Zone } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import { getZoneColumns } from './columns/zoneColumns';

const EMPTY_ZONE_FORM = { name: '', code: '', manager: '', isActive: true };

export function ZoneTab() {
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [zoneFormData, setZoneFormData] = useState(EMPTY_ZONE_FORM);

  const { data: zonesFromApi = [], isLoading: zonesLoading } = useGetZonesQuery(undefined);
  const { data: users = [] } = useGetUsersQuery(undefined);
  const { data: branchesFromApi = [] } = useGetBranchesQuery(undefined);
  const [createZone, { isLoading: zoneCreating }] = useCreateZoneMutation();
  const [updateZone, { isLoading: zoneUpdating }] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();

  const zoneColumns = useMemo(
    () => getZoneColumns(users, branchesFromApi),
    [users, branchesFromApi]
  );

  const filteredZones = useMemo(() => {
    if (!zoneSearchQuery.trim()) return zonesFromApi;
    const q = zoneSearchQuery.toLowerCase();
    return zonesFromApi.filter((z) => {
      const managerName = z.manager ? users.find((u) => u.id === z.manager)?.name?.toLowerCase() ?? '' : '';
      return (
        z.name.toLowerCase().includes(q) ||
        (z.code ?? '').toLowerCase().includes(q) ||
        managerName.includes(q)
      );
    });
  }, [zonesFromApi, zoneSearchQuery, users]);

  const handleCreateZone = async () => {
    try {
      await createZone({
        name: zoneFormData.name,
        code: zoneFormData.code || undefined,
        manager: zoneFormData.manager || undefined,
        isActive: zoneFormData.isActive,
      }).unwrap();
      setIsZoneDialogOpen(false);
      setZoneFormData(EMPTY_ZONE_FORM);
      toast.success('Zone created successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || 'Failed to create zone');
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    try {
      await updateZone({
        id: editingZone.id,
        body: {
          name: zoneFormData.name,
          code: zoneFormData.code || undefined,
          manager: zoneFormData.manager || undefined,
          isActive: zoneFormData.isActive,
        },
      }).unwrap();
      setEditingZone(null);
      setIsZoneDialogOpen(false);
      setZoneFormData(EMPTY_ZONE_FORM);
      toast.success('Zone updated successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || 'Failed to update zone');
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      await deleteZone(zoneToDelete.id).unwrap();
      setZoneToDelete(null);
      toast.success('Zone deleted successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || 'Failed to delete zone');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
            <DialogDescription>Enter the details for the zone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Zone Name</Label>
              <Input
                value={zoneFormData.name}
                onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                placeholder="e.g. North"
              />
            </div>
            <div>
              <Label>Zone Code</Label>
              <Input
                value={zoneFormData.code}
                onChange={(e) => setZoneFormData({ ...zoneFormData, code: e.target.value })}
                placeholder="e.g. N"
              />
            </div>
            <div>
              <Label>Zone Manager</Label>
              <Select
                value={zoneFormData.manager || 'none'}
                onValueChange={(v) => setZoneFormData({ ...zoneFormData, manager: v === 'none' ? '' : v })}
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
                checked={zoneFormData.isActive}
                onCheckedChange={(v) => setZoneFormData({ ...zoneFormData, isActive: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsZoneDialogOpen(false);
                setEditingZone(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingZone ? handleUpdateZone : handleCreateZone}
              disabled={zoneCreating || zoneUpdating || !zoneFormData.name.trim()}
            >
              {zoneCreating || zoneUpdating ? 'Saving...' : editingZone ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search zones..."
            value={zoneSearchQuery}
            onChange={(e) => setZoneSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200 h-10"
          />
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
          onClick={() => {
            setEditingZone(null);
            setZoneFormData(EMPTY_ZONE_FORM);
            setIsZoneDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Zone
        </Button>
      </div>

      <MaterialReactTableWrapper<Zone>
        columns={zoneColumns}
        data={filteredZones}
        isLoading={zonesLoading}
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
                const zone = row.original;
                setEditingZone(zone);
                setZoneFormData({
                  name: zone.name,
                  code: zone.code ?? '',
                  manager: zone.manager ?? '',
                  isActive: zone.isActive,
                });
                setIsZoneDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => setZoneToDelete(row.original)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      <AlertDialog open={!!zoneToDelete} onOpenChange={(open) => !open && setZoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete zone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the zone &quot;{zoneToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteZone()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

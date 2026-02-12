import { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Edit, Trash2, Save, X, Mail, Users as UsersIcon, UserCheck, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Globe, MapPin, Building, Phone, Info, LayoutGrid, GitBranch } from 'lucide-react';
import { Card } from '../../common/ui/card';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import { Textarea } from '../../common/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../common/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../common/ui/alert-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useGetEnterpriseQuery, useUpdateEnterpriseMutation } from '../../../store/apis/enterpriseApi';
import type { EnterpriseConfig } from '../../../store/apis/enterpriseApi';
import { useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation } from '../../../store/apis/zonesApi';
import type { Zone } from '../../../store/apis/zonesApi';
import { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation, useDeleteBranchMutation } from '../../../store/apis/branchesApi';
import type { Branch } from '../../../store/apis/branchesApi';
import { useGetUsersQuery } from '../../../store/apis/usersApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import type { MRT_ColumnDef } from 'material-react-table';

const emptyEnterprise: EnterpriseConfig = {
  companyName: '',
  legalName: '',
  regNumber: '',
  taxId: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  address: '',
};

export function EnterpriseManagement() {
  const [activeTab, setActiveTab] = useState<'enterprise' | 'zone' | 'branch'>('enterprise');
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');

  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    code: '',
    manager: '',
    isActive: true,
  });

  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    zoneId: '',
    manager: '',
    isActive: true,
  });

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseConfig>(emptyEnterprise);

  const { data: enterpriseFromApi, isLoading: enterpriseLoading } = useGetEnterpriseQuery(undefined, { skip: activeTab !== 'enterprise' });
  const [updateEnterprise, { isLoading: enterpriseSaving }] = useUpdateEnterpriseMutation();

  const { data: zonesFromApi = [], isLoading: zonesLoading } = useGetZonesQuery(undefined);
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: activeTab !== 'zone' && activeTab !== 'branch' });
  const [createZone, { isLoading: zoneCreating }] = useCreateZoneMutation();
  const [updateZone, { isLoading: zoneUpdating }] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  const { data: branchesFromApi = [], isLoading: branchesLoading } = useGetBranchesQuery(undefined, { skip: activeTab === 'enterprise' });
  const [createBranch, { isLoading: branchCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: branchUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  useEffect(() => {
    if (enterpriseFromApi && activeTab === 'enterprise') {
      setEnterpriseData({
        ...emptyEnterprise,
        ...enterpriseFromApi,
      });
    }
  }, [enterpriseFromApi, activeTab]);

  const handleSaveEnterprise = async () => {
    try {
      await updateEnterprise(enterpriseData).unwrap();
      toast.success('Enterprise settings saved');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save enterprise settings');
    }
  };

  const handleCreateZone = async () => {
    try {
      await createZone({
        name: zoneFormData.name,
        code: zoneFormData.code || undefined,
        manager: zoneFormData.manager || undefined,
        isActive: zoneFormData.isActive,
      }).unwrap();
      setIsZoneDialogOpen(false);
      setZoneFormData({ name: '', code: '', manager: '', isActive: true });
      toast.success('Zone created successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create zone');
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
      setZoneFormData({ name: '', code: '', manager: '', isActive: true });
      toast.success('Zone updated successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update zone');
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      await deleteZone(zoneToDelete.id).unwrap();
      setZoneToDelete(null);
      toast.success('Zone deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete zone');
    }
  };

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
      setBranchFormData({ name: '', code: '', zoneId: '', manager: '', isActive: true });
      toast.success('Branch created successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Failed to create branch');
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
      setBranchFormData({ name: '', code: '', zoneId: '', manager: '', isActive: true });
      toast.success('Branch updated successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Failed to update branch');
    }
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      await deleteBranch(branchToDelete.id).unwrap();
      setBranchToDelete(null);
      toast.success('Branch deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Failed to delete branch');
    }
  };

  const zoneColumns: MRT_ColumnDef<Zone>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Zone Name',
        size: 200,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        muiTableBodyCellProps: { sx: { color: '#334155' } },
      },
      {
        accessorKey: 'code',
        header: 'Code',
        size: 120,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        muiTableBodyCellProps: { sx: { color: '#334155', fontFamily: 'monospace' } },
      },
      {
        accessorKey: 'manager',
        header: 'Manager',
        size: 180,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        Cell: ({ row }) => {
          const managerId = row.original.manager;
          const managerUser = users.find((u) => u.id === managerId);
          return managerUser ? (
            <span className="text-[#1976D2] font-normal">{managerUser.name}</span>
          ) : (
            <span className="text-slate-400">—</span>
          );
        },
      },
      {
        id: 'branches',
        header: 'Branches',
        size: 200,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        Cell: ({ row }) => {
          const zoneId = row.original.id;
          const zoneBranches = branchesFromApi.filter((b) => b.zoneId === zoneId);
          if (zoneBranches.length === 0) return <span className="text-slate-400">—</span>;
          return (
            <span className="text-slate-700 text-sm">
              {zoneBranches.map((b) => b.name).join(', ')}
            </span>
          );
        },
      },
    ],
    [users, branchesFromApi]
  );

  const branchColumns: MRT_ColumnDef<Branch>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Branch Name',
        size: 200,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        muiTableBodyCellProps: { sx: { color: '#334155' } },
      },
      {
        accessorKey: 'code',
        header: 'Code',
        size: 120,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        muiTableBodyCellProps: { sx: { color: '#334155', fontFamily: 'monospace' } },
      },
      {
        accessorKey: 'zone',
        header: 'Zone',
        size: 140,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        muiTableBodyCellProps: { sx: { color: '#334155' } },
      },
      {
        accessorKey: 'manager',
        header: 'Manager',
        size: 180,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' } },
        Cell: ({ row }) => {
          const managerId = row.original.manager;
          const managerUser = users.find((u) => u.id === managerId);
          return managerUser ? (
            <span className="text-[#1976D2] font-normal">{managerUser.name}</span>
          ) : (
            <span className="text-slate-400">—</span>
          );
        },
      },
    ],
    [users]
  );

  const tabs = [
    { id: 'enterprise', label: 'Enterprise', icon: Building },
    { id: 'zone', label: 'Zone', icon: Globe },
    { id: 'branch', label: 'Branch', icon: GitBranch },
  ];

  return (
    <div className="h-full overflow-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {activeTab === 'enterprise' && (
            <Button
              onClick={handleSaveEnterprise}
              disabled={enterpriseSaving || enterpriseLoading}
              className="bg-[#0f766e] hover:bg-[#0d6d65] text-white shadow-sm flex items-center gap-2 h-10 px-8 rounded-lg font-medium transition-all active:scale-95 shrink-0 disabled:opacity-70"
            >
              <Save className="w-4 h-4" /> {enterpriseSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        {activeTab === 'enterprise' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {enterpriseLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-40 mb-8" />
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-11 bg-slate-100 rounded" />
                    ))}
                  </div>
                </Card>
                <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-40 mb-8" />
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-11 bg-slate-100 rounded" />
                    ))}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-8 px-1">Company Information</h3>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-bold text-slate-900 mb-2 block">Company Name</Label>
                      <Input value={enterpriseData.companyName ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, companyName: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-slate-900 mb-2 block">Legal Name</Label>
                      <Input value={enterpriseData.legalName ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, legalName: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-slate-900 mb-2 block">Registration Number</Label>
                      <Input value={enterpriseData.regNumber ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, regNumber: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11 font-mono text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-slate-900 mb-2 block">Tax ID / VAT Number</Label>
                      <Input value={enterpriseData.taxId ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, taxId: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11 font-mono text-sm" />
                    </div>
                  </div>
                </Card>

                <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-8 px-1">Contact Information</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-slate-900" /><Label className="text-sm font-bold text-slate-900">Email Address</Label></div>
                      <Input value={enterpriseData.email ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, email: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2"><Phone className="w-4 h-4 text-slate-900" /><Label className="text-sm font-bold text-slate-900">Phone Number</Label></div>
                      <Input value={enterpriseData.phone ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, phone: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-slate-900" /><Label className="text-sm font-bold text-slate-900">Website</Label></div>
                      <Input value={enterpriseData.website ?? ''} onChange={(e) => setEnterpriseData({ ...enterpriseData, website: e.target.value })} className="bg-slate-50/80 border-slate-100 h-11" />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'zone' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>{editingZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
                  <DialogDescription>
                    Enter the details for the zone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label>Zone Name</Label><Input value={zoneFormData.name} onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })} placeholder="e.g. North" /></div>
                  <div><Label>Zone Code</Label><Input value={zoneFormData.code} onChange={(e) => setZoneFormData({ ...zoneFormData, code: e.target.value })} placeholder="e.g. N" /></div>
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
                    <Switch checked={zoneFormData.isActive} onCheckedChange={(v) => setZoneFormData({ ...zoneFormData, isActive: v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setIsZoneDialogOpen(false); setEditingZone(null); }}>Cancel</Button>
                  <Button onClick={editingZone ? handleUpdateZone : handleCreateZone} disabled={zoneCreating || zoneUpdating || !zoneFormData.name.trim()}>
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
                  setZoneFormData({ name: '', code: '', manager: '', isActive: true });
                  setIsZoneDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Add Zone
              </Button>
            </div>
            <MaterialReactTableWrapper<Zone>
              columns={zoneColumns}
              data={zonesFromApi.filter((z) => {
                if (!zoneSearchQuery.trim()) return true;
                const q = zoneSearchQuery.toLowerCase();
                const managerName = z.manager ? users.find((u) => u.id === z.manager)?.name?.toLowerCase() ?? '' : '';
                return (
                  z.name.toLowerCase().includes(q) ||
                  (z.code ?? '').toLowerCase().includes(q) ||
                  managerName.includes(q)
                );
              })}
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
          </motion.div>
        )}

        {activeTab === 'branch' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
                  <DialogDescription>Enter the details for the branch.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label>Branch Name</Label><Input value={branchFormData.name} onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })} placeholder="e.g. Chennai Main" /></div>
                  <div><Label>Branch Code</Label><Input value={branchFormData.code} onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value })} placeholder="e.g. CHN-M" /></div>
                  <div>
                    <Label>Zone</Label>
                    <Select value={branchFormData.zoneId} onValueChange={(val) => setBranchFormData({ ...branchFormData, zoneId: val })}>
                      <SelectTrigger className="w-full mt-1.5"><SelectValue placeholder="Select Zone" /></SelectTrigger>
                      <SelectContent>{(zonesFromApi ?? []).map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch Manager</Label>
                    <Select value={branchFormData.manager || 'none'} onValueChange={(v) => setBranchFormData({ ...branchFormData, manager: v === 'none' ? '' : v })}>
                      <SelectTrigger className="w-full mt-1.5"><SelectValue placeholder="Select a user (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No manager</SelectItem>
                        {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={branchFormData.isActive} onCheckedChange={(v) => setBranchFormData({ ...branchFormData, isActive: v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setIsBranchDialogOpen(false); setEditingBranch(null); }}>Cancel</Button>
                  <Button onClick={editingBranch ? handleUpdateBranch : handleCreateBranch} disabled={branchCreating || branchUpdating || !branchFormData.name.trim() || !branchFormData.zoneId}>
                    {branchCreating || branchUpdating ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input placeholder="Search branches..." value={branchSearchQuery} onChange={(e) => setBranchSearchQuery(e.target.value)} className="pl-10 bg-white border-slate-200 h-10" />
              </div>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => { setEditingBranch(null); setBranchFormData({ name: '', code: '', zoneId: '', manager: '', isActive: true }); setIsBranchDialogOpen(true); }}>
                <Plus className="w-4 h-4" /> Add Branch
              </Button>
            </div>
            <MaterialReactTableWrapper<Branch>
              columns={branchColumns}
              data={branchesFromApi.filter((b) => {
                if (!branchSearchQuery.trim()) return true;
                const q = branchSearchQuery.toLowerCase();
                const managerName = b.manager ? users.find((u) => u.id === b.manager)?.name?.toLowerCase() ?? '' : '';
                return b.name.toLowerCase().includes(q) || (b.code ?? '').toLowerCase().includes(q) || (b.zone ?? '').toLowerCase().includes(q) || managerName.includes(q);
              })}
              isLoading={branchesLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              renderRowActions={({ row }) => (
                <div className="flex items-center justify-start gap-1">
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => { const branch = row.original; setEditingBranch(branch); setBranchFormData({ name: branch.name, code: branch.code ?? '', zoneId: branch.zoneId, manager: branch.manager ?? '', isActive: branch.isActive }); setIsBranchDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => setBranchToDelete(row.original)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              )}
            />
          </motion.div>
        )}
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
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteZone()}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteBranch()}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

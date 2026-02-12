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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../common/ui/table';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useGetEnterpriseQuery, useUpdateEnterpriseMutation } from '../../../store/apis/enterpriseApi';
import type { EnterpriseConfig } from '../../../store/apis/enterpriseApi';
import { useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation } from '../../../store/apis/zonesApi';
import type { Zone } from '../../../store/apis/zonesApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import type { MRT_ColumnDef } from 'material-react-table';

const initialBranches = [
  { id: 'BR-001', name: 'Adyar Branch', code: 'CHN-001', zone: 'Chennai', manager: 'Arun Kumar', isActive: true },
  { id: 'BR-002', name: 'T Nagar Branch', code: 'CHN-002', zone: 'Chennai', manager: 'Priya Mani', isActive: true },
  { id: 'BR-003', name: 'Velachery Branch', code: 'CHN-003', zone: 'Chennai', manager: 'Rajesh V', isActive: true },
  { id: 'BR-004', name: 'Indiranagar Branch', code: 'BLR-001', zone: 'Bangalore', manager: 'Suresh Raina', isActive: true },
  { id: 'BR-005', name: 'Koramangala Branch', code: 'BLR-002', zone: 'Bangalore', manager: 'Deepika P', isActive: true },
];

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
  const [branches, setBranches] = useState(initialBranches);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    code: '',
    manager: '',
    isActive: true,
  });

  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    zone: '',
    manager: '',
    isActive: true,
  });

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseConfig>(emptyEnterprise);

  const { data: enterpriseFromApi, isLoading: enterpriseLoading } = useGetEnterpriseQuery(undefined, { skip: activeTab !== 'enterprise' });
  const [updateEnterprise, { isLoading: enterpriseSaving }] = useUpdateEnterpriseMutation();

  const { data: zonesFromApi = [], isLoading: zonesLoading } = useGetZonesQuery(undefined);
  const [createZone, { isLoading: zoneCreating }] = useCreateZoneMutation();
  const [updateZone, { isLoading: zoneUpdating }] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

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

  useEffect(() => {
    // Reset filters on tab change
  }, [activeTab]);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.zone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? branch.isActive : !branch.isActive);

    return matchesSearch && matchesStatus;
  });

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

  const handleCreateBranch = () => {
    const newBranch = {
      id: `BR-${String(branches.length + 1).padStart(3, '0')}`,
      ...branchFormData,
    };
    setBranches([...branches, newBranch]);
    setIsBranchDialogOpen(false);
    setBranchFormData({ name: '', code: '', zone: '', manager: '', isActive: true });
    toast.success('Branch created successfully');
  };

  const handleUpdateBranch = () => {
    if (!editingBranch) return;
    setBranches(branches.map(b => b.id === editingBranch.id ? { ...editingBranch, ...branchFormData } : b));
    setEditingBranch(null);
    setIsBranchDialogOpen(false);
    setBranchFormData({ name: '', code: '', zone: '', manager: '', isActive: true });
    toast.success('Branch updated successfully');
  };

  const handleDeleteBranch = (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
    toast.success('Branch deleted');
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
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          return val ? (
            <span className="text-[#1976D2] cursor-pointer hover:underline font-normal">{val}</span>
          ) : (
            <span className="text-slate-400">—</span>
          );
        },
      },
      {
        id: 'branches',
        header: 'Branches',
        size: 140,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a', textAlign: 'center', whiteSpace: 'nowrap' } },
        Cell: () => (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #d0d0d0',
              fontSize: '0.8125rem',
              color: '#334155',
            }}
          >
            —
          </span>
        ),
      },
    ],
    []
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
                  <div><Label>Zone Manager</Label><Input value={zoneFormData.manager} onChange={(e) => setZoneFormData({ ...zoneFormData, manager: e.target.value })} placeholder="Optional" /></div>
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
              data={zonesFromApi.filter(
                (z) =>
                  !zoneSearchQuery.trim() ||
                  z.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()) ||
                  (z.code ?? '').toLowerCase().includes(zoneSearchQuery.toLowerCase()) ||
                  (z.manager ?? '').toLowerCase().includes(zoneSearchQuery.toLowerCase())
              )}
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
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search branches..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white" />
                </div>
              </div>
              <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => {
                    setEditingBranch(null);
                    setBranchFormData({ name: '', code: '', zone: '', manager: '', isActive: true });
                  }}>
                    <Plus className="w-4 h-4" /> Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
                    <DialogDescription>
                      Enter the details for the branch.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label>Branch Name</Label><Input value={branchFormData.name} onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})} /></div>
                    <div><Label>Branch Code</Label><Input value={branchFormData.code} onChange={(e) => setBranchFormData({...branchFormData, code: e.target.value})} /></div>
                    <div>
                      <Label>Zone</Label>
                      <Select value={branchFormData.zone} onValueChange={(val) => setBranchFormData({...branchFormData, zone: val})}>
                        <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                        <SelectContent>{(zonesFromApi ?? []).map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Branch Manager</Label><Input value={branchFormData.manager} onChange={(e) => setBranchFormData({...branchFormData, manager: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>Cancel</Button>
                    <Button onClick={editingBranch ? handleUpdateBranch : handleCreateBranch}>{editingBranch ? 'Update' : 'Create'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white mb-8">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="py-4 pl-6 text-slate-900 font-bold">Branch Name</TableHead>
                    <TableHead className="py-4 text-slate-900 font-bold">Code</TableHead>
                    <TableHead className="py-4 text-slate-900 font-bold">Zone</TableHead>
                    <TableHead className="py-4 text-slate-900 font-bold">Manager</TableHead>
                    <TableHead className="text-right py-4 pr-6 text-slate-900 font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-900 py-4 pl-6">{branch.name}</TableCell>
                      <TableCell className="py-4 font-mono text-xs">{branch.code}</TableCell>
                      <TableCell className="py-4 text-slate-700">{branch.zone}</TableCell>
                      <TableCell className="py-4 text-slate-700">{branch.manager}</TableCell>
                      <TableCell className="text-right py-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingBranch(branch);
                            setBranchFormData({ name: branch.name, code: branch.code, zone: branch.zone, manager: branch.manager, isActive: branch.isActive });
                            setIsBranchDialogOpen(true);
                          }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBranch(branch.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
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
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => void handleDeleteZone()}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

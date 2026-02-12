import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Mail, Shield, MapPin, Building2, Edit2, Trash2, Users as UsersIcon, Filter, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { Label } from '../common/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../common/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../common/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../common/ui/tabs';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '@/app/store/apis/usersApi';
import { useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from '@/app/store/apis/rolesApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import type { Role } from '@/app/store/apis/rolesApi';
import { MaterialReactTableWrapper } from '../common/mrt/MaterialReactTableWrapper';
import type { MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { User } from '@/app/types';

const ROLE_PERMISSIONS_OPTIONS = [
  'View Tickets', 'Edit Tickets', 'Delete Tickets', 'Assign Tickets',
  'Manage SLA', 'View Reports', 'Manage Users', 'System Settings', 'Customer Data',
];

const RESERVED_ROLE_CODES = ['admin', 'manager', 'agent', 'customer'];

function slugFromName(name: string): string {
  return name
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery(undefined, { skip: activeTab !== 'users' });
  const [createUserMutation, { isLoading: userCreating }] = useCreateUserMutation();
  const [updateUserMutation, { isLoading: userUpdating }] = useUpdateUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();
  const { data: rolesFromApi = [], isLoading: rolesLoading } = useGetRolesQuery(undefined);
  const { data: zonesFromApi = [] } = useGetZonesQuery(undefined, { skip: activeTab !== 'users' });
  const { data: branchesFromApi = [] } = useGetBranchesQuery(undefined, { skip: activeTab !== 'users' });
  const [createRole, { isLoading: roleCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: roleUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'agent',
    zone: '',
    branch: '',
    location: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
    color: '#6366f1'
  });

  /** All roles from DB for dropdown; backend maps code to enum when saving. */
  const rolesForUserDropdown = rolesFromApi;

  const emptyUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '' as string,
    zone: '',
    branch: '',
    location: '',
    status: 'active' as 'active' | 'inactive',
  };

  /** Resolve user enum role to a role code that exists in the list so dropdown shows correct selection. */
  const getRoleCodeForEnum = (enumRole: string, roles: { code: string }[]) => {
    const exact = roles.find((r) => r.code === enumRole);
    if (exact) return exact.code;
    const c = (enumRole || '').toLowerCase();
    if (c === 'admin') return roles.find((r) => ['administrator', 'admin'].includes(r.code))?.code ?? enumRole;
    if (c === 'manager') return roles.find((r) => ['manager', 'mm'].includes(r.code))?.code ?? enumRole;
    if (c === 'agent') return roles.find((r) => r.code === 'agent' || r.code.startsWith('agent'))?.code ?? enumRole;
    if (c === 'customer') return roles.find((r) => r.code === 'customer' || r.code.startsWith('customer'))?.code ?? enumRole;
    return enumRole;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  useEffect(() => {
    if (editingUser) {
      const nameParts = editingUser.name.split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: editingUser.email,
        password: '',
        role: getRoleCodeForEnum(editingUser.role, rolesFromApi) as User['role'],
        zone: editingUser.zone || '',
        branch: editingUser.branch || '',
        location: editingUser.location || '',
        status: editingUser.status
      });
    } else {
      setFormData(emptyUserForm);
    }
  }, [editingUser, isAddUserOpen, rolesFromApi]);

  const roleColors = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    agent: 'bg-green-100 text-green-700 border-green-200',
    customer: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  useEffect(() => {
    if (editingRole) {
      setRoleFormData({
        name: editingRole.name,
        code: editingRole.code ?? '',
        description: editingRole.description,
        permissions: editingRole.permissions ?? [],
        color: '#6366f1',
      });
    } else {
      setRoleFormData({
        name: '',
        code: '',
        description: '',
        permissions: [],
        color: '#6366f1',
      });
    }
  }, [editingRole, isAddRoleOpen]);

  const roleEffectiveCode = roleFormData.code.trim() || slugFromName(roleFormData.name);
  const isReservedCode = roleEffectiveCode && RESERVED_ROLE_CODES.includes(roleEffectiveCode);
  const roleCodeConflict = !editingRole && isReservedCode;

  const handleEditRoleClick = (role: Role) => {
    setEditingRole(role);
    setIsAddRoleOpen(true);
  };

  const handleAddRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRole && roleCodeConflict) {
      toast.error('Choose a different role name or enter a custom role code (e.g. branch-manager).');
      return;
    }
    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          body: {
            name: roleFormData.name.trim(),
            description: roleFormData.description || undefined,
            permissions: roleFormData.permissions,
          },
        }).unwrap();
        toast.success('Role updated successfully');
      } else {
        await createRole({
          name: roleFormData.name.trim(),
          code: roleFormData.code.trim() || undefined,
          description: roleFormData.description || undefined,
          permissions: roleFormData.permissions,
        }).unwrap();
        toast.success('Role created successfully');
      }
      setIsAddRoleOpen(false);
      setEditingRole(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || (editingRole ? 'Failed to update role' : 'Failed to create role'));
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id).unwrap();
      setRoleToDelete(null);
      toast.success('Role deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Failed to delete role');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsAddUserOpen(true);
  };

  const handleAddUserClick = () => {
    setEditingUser(null);
    setFormData(emptyUserForm);
    setIsAddUserOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    try {
      if (editingUser) {
        await updateUserMutation({
          id: editingUser.id,
          body: {
            name,
            role: formData.role as User['role'],
            zone: formData.zone || undefined,
            branch: formData.branch || undefined,
            location: formData.location || undefined,
            status: formData.status,
          },
        }).unwrap();
        toast.success('User updated successfully', { description: `Changes to ${name} have been saved.` });
      } else {
        if (!formData.password.trim()) {
          toast.error('Password is required for new users');
          return;
        }
        await createUserMutation({
          name,
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          zone: formData.zone || undefined,
          branch: formData.branch || undefined,
          location: formData.location || undefined,
          status: formData.status,
        }).unwrap();
        toast.success('User created successfully', { description: `${name} has been added.` });
      }
      setIsAddUserOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation(userToDelete.id).unwrap();
      setUserToDelete(null);
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Failed to delete user');
    }
  };

  const filteredRoles = useMemo(() => {
    return rolesFromApi.filter((role) => {
      const q = roleSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        role.code.toLowerCase().includes(q) ||
        (role.description || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || role.id === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [rolesFromApi, roleSearchQuery, roleFilter]);

  const roleColumns: MRT_ColumnDef<Role>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Role Name',
        size: 200,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 shrink-0">
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{row.original.name}</div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">{row.original.code}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'userCount',
        header: 'Users',
        size: 100,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0">
            {row.original.userCount}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 240,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        muiTableBodyCellProps: { sx: { color: '#64748b', fontSize: '0.875rem' } },
        Cell: ({ row }) => (
          <p className="text-sm text-slate-500 leading-relaxed truncate max-w-[280px]">
            {row.original.description || '—'}
          </p>
        ),
      },
      {
        id: 'permissions',
        header: 'Key Permissions',
        size: 280,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => {
          const perms = row.original.permissions || [];
          return (
            <div className="flex flex-wrap gap-1.5">
              {perms.slice(0, 3).map((perm) => (
                <span
                  key={perm}
                  className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap"
                >
                  {perm}
                </span>
              ))}
              {perms.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium">+{perms.length - 3} more</span>
              )}
              {perms.length === 0 && <span className="text-slate-400">—</span>}
            </div>
          );
        },
      },
    ],
    []
  );

  const userColumns: MRT_ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        size: 260,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shrink-0">
              {row.original.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{row.original.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{row.original.email}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <Badge
            className={
              row.original.status === 'active'
                ? 'bg-green-100 text-green-700 border-green-200 shadow-none px-2 py-0'
                : 'bg-slate-100 text-slate-600 border-slate-200 shadow-none px-2 py-0'
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.original.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
            {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
          </Badge>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 120,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => {
          const roleDef = rolesFromApi.find((r) => r.code === row.original.role) ?? { name: (row.original.role ?? '').charAt(0).toUpperCase() + (row.original.role ?? '').slice(1) };
          const label = roleDef?.name ?? row.original.role;
          return (
            <Badge className={`${roleColors[row.original.role as keyof typeof roleColors]} shadow-none border font-medium px-2 py-0 capitalize`}>
              {label}
            </Badge>
          );
        },
      },
      {
        id: 'zoneBranch',
        header: 'Zone / Branch',
        size: 180,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => {
          const zoneId = row.original.zone;
          const branchId = row.original.branch;
          const zone = zoneId ? zonesFromApi.find((z) => z.id === zoneId) : null;
          const branch = branchId ? branchesFromApi.find((b) => b.id === branchId) : null;
          if (!zone && !branch) return <span className="text-slate-400 text-sm italic">Not assigned</span>;
          return (
            <div className="flex flex-col gap-0.5">
              {branch && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{branch.name}</span>
                </div>
              )}
              {zone && (
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{zone.name} Zone</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 140,
        muiTableHeadCellProps: { sx: { fontWeight: 700, color: '#0f172a' } },
        Cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{row.original.location || 'N/A'}</span>
          </div>
        ),
      },
    ],
    [rolesFromApi, zonesFromApi, branchesFromApi]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Tab Navigation - Header moved to App level */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100/80 p-1 h-11 rounded-xl border border-slate-200 shadow-inner max-w-fit">
              <TabsTrigger 
                value="users" 
                className="h-9 px-6 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/50 gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                System Users
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="h-9 px-6 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/50 gap-2"
              >
                <Shield className="w-4 h-4" />
                Access Roles
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="users" className="h-full mt-0 flex flex-col gap-6 outline-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name, email or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-10 focus-visible:ring-blue-500/20"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-white border-slate-200 h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="bg-blue-600 hover:bg-blue-700 shadow-md h-10 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleAddUserClick}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </div>

            <MaterialReactTableWrapper<User>
              columns={userColumns}
              data={filteredUsers}
              isLoading={usersLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              renderRowActions={({ row }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleEditClick(row.original)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setUserToDelete(row.original)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="roles" className="h-full mt-0 flex flex-col gap-6 outline-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by role name, ID or description..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-10 focus-visible:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200 h-10">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {rolesFromApi.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-10 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => { setEditingRole(null); setIsAddRoleOpen(true); }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Add New Role
              </Button>
            </div>
            <MaterialReactTableWrapper<Role>
              columns={roleColumns}
              data={filteredRoles}
              isLoading={rolesLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              renderRowActions={({ row }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleEditRoleClick(row.original)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!row.original.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setRoleToDelete(row.original)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit User Modal */}
      <Dialog
        open={isAddUserOpen}
        onOpenChange={(open) => {
          setIsAddUserOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData(emptyUserForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
          <form onSubmit={handleAddUser}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Update the user's profile and system access." 
                  : "Invite a new team member to your workspace."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    required 
                    className="bg-white" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    required 
                    className="bg-white"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  required 
                  className="bg-white"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    required={!editingUser}
                    className="bg-white"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Role</Label>
                  <Select
                    value={formData.role || undefined}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue
                        placeholder={
                          rolesLoading ? 'Loading roles...' : rolesForUserDropdown.length === 0 ? 'No roles in database' : 'Select Role'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesForUserDropdown.map((r) => (
                        <SelectItem key={r.id} value={r.code}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val as 'active' | 'inactive' })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Select
                    value={formData.zone}
                    onValueChange={(val) => setFormData({ ...formData, zone: val, branch: '' })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select zone" />
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
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(val) => setFormData({ ...formData, branch: val })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesFromApi
                        .filter((b) => !formData.zone || b.zoneId === formData.zone)
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="e.g. London, UK" 
                  className="bg-white"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8" disabled={userCreating || userUpdating}>
                {userCreating || userUpdating ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Role Modal */}
      <Dialog open={isAddRoleOpen} onOpenChange={(open) => {
        setIsAddRoleOpen(open);
        if (!open) setEditingRole(null);
      }}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
          <form onSubmit={handleAddRole}>
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Update the permissions for this role.' : 'Define a new set of permissions for specific team functions.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              {roleCodeConflict && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span className="shrink-0">⚠</span>
                  <span>Role name &quot;{roleFormData.name}&quot; produces a reserved code (<code className="font-mono text-amber-700">{roleEffectiveCode}</code>). Enter a custom code below (e.g. branch-manager) to create this role.</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input 
                  id="roleName" 
                  placeholder="e.g. Senior Support Lead" 
                  required 
                  className="bg-white" 
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleCode">Role code (optional)</Label>
                <Input 
                  id="roleCode" 
                  placeholder={editingRole ? undefined : "e.g. branch-manager (leave empty to use name)"}
                  className="bg-white font-mono text-sm"
                  value={roleFormData.code}
                  onChange={(e) => setRoleFormData({ ...roleFormData, code: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  readOnly={!!editingRole}
                />
                {editingRole && <p className="text-xs text-slate-500">Role code cannot be changed after creation.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description</Label>
                <Input 
                  id="roleDesc" 
                  placeholder="Briefly describe what this role does..." 
                  className="bg-white"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {ROLE_PERMISSIONS_OPTIONS.map((perm) => (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                      <input 
                        type="checkbox" 
                        id={perm} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={roleFormData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleFormData({...roleFormData, permissions: [...roleFormData.permissions, perm]});
                          } else {
                            setRoleFormData({...roleFormData, permissions: roleFormData.permissions.filter(p => p !== perm)});
                          }
                        }}
                      />
                      <label htmlFor={perm} className="text-sm font-medium text-slate-700 cursor-pointer">{perm}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8" disabled={roleCodeConflict || roleCreating || roleUpdating}>
                {roleCreating || roleUpdating ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user &quot;{userToDelete?.name}&quot; ({userToDelete?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteUser()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the role &quot;{roleToDelete?.name}&quot;. This action cannot be undone. System roles cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => void handleDeleteRole()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

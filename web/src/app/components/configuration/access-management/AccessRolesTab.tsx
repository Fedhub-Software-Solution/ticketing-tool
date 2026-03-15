import { useState, useEffect, useMemo } from 'react';
import { Search, Shield, Filter, Edit2, Trash2, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../common/ui/alert-dialog';
import { useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from '@/app/store/apis/rolesApi';
import type { Role } from '@/app/store/apis/rolesApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import { toast } from 'sonner';
import { slugFromName } from '../../common/utils';
import { getRoleColumns } from './columns/roleColumns';
import { RoleFormModal, type RoleFormData } from './RoleFormModal';

type AccessRolesTabProps = {
  isActive: boolean;
};

export function AccessRolesTab({ isActive }: AccessRolesTabProps) {
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    description: '',
    permissions: [],
    color: '#6366f1',
  });

  const { data: rolesFromApi = [], isLoading: rolesLoading } = useGetRolesQuery(undefined);
  const [createRole, { isLoading: roleCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: roleUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

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
  const roleCodeConflict = !editingRole && !!roleEffectiveCode && rolesFromApi.some((r) => r.code === roleEffectiveCode);

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

  const roleColumns = useMemo(() => getRoleColumns(), []);

  const handleEditRoleClick = (role: Role) => {
    setEditingRole(role);
    setIsAddRoleOpen(true);
  };

  const handleAddRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRole && roleCodeConflict) {
      toast.error('A role with this code already exists. Use a different name or code.');
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
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || (editingRole ? 'Failed to update role' : 'Failed to create role'));
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id).unwrap();
      setRoleToDelete(null);
      toast.success('Role deleted successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || 'Failed to delete role');
    }
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* Role hierarchy map - workflow style */}
        <div className="shrink-0">
          <p className="text-sm font-bold text-slate-800 mb-3">Role Hierarchy:</p>
          <div className="flex flex-wrap items-center gap-0">
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-900">Manager</span>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 mx-1 shrink-0" aria-hidden />
            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-900">Team Lead</span>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 mx-1 shrink-0" aria-hidden />
            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-900">Agent</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between shrink-0">
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
            onClick={() => {
              setEditingRole(null);
              setIsAddRoleOpen(true);
            }}
          >
            <Shield className="w-4 h-4 mr-2" />
            Add New Role
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col min-h-[260px] max-h-[calc(100vh-320px)] overflow-auto">
          <MaterialReactTableWrapper<Role>
            columns={roleColumns}
            data={filteredRoles}
            isLoading={rolesLoading}
            enableTopToolbar={false}
            enableBottomToolbar={true}
            enableRowActions
            positionActionsColumn="last"
            pageSize={4}
            maxHeight="460px"
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setRoleToDelete(row.original)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
          />
        </div>
      </div>

      <RoleFormModal
        open={isAddRoleOpen}
        onOpenChange={(open) => {
          setIsAddRoleOpen(open);
          if (!open) setEditingRole(null);
        }}
        editingRole={editingRole}
        roleFormData={roleFormData}
        setRoleFormData={setRoleFormData}
        onSubmit={handleAddRole}
        roleCodeConflict={roleCodeConflict}
        roleEffectiveCode={roleEffectiveCode}
        loading={roleCreating || roleUpdating}
      />

      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the role &quot;{roleToDelete?.name}&quot;. This action cannot be undone.
              System roles cannot be deleted.
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
    </>
  );
}

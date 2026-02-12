import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Filter, Edit2, Trash2 } from 'lucide-react';
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
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '@/app/store/apis/usersApi';
import { useGetRolesQuery } from '@/app/store/apis/rolesApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import { MaterialReactTableWrapper } from '../../common/mrt/MaterialReactTableWrapper';
import { toast } from 'sonner';
import type { User } from '@/app/types';
import { EMPTY_USER_FORM } from '../../common/constants';
import { getRoleCodeForEnum } from '../../common/utils';
import { getUserColumns } from './columns/userColumns';
import { UserFormModal, type UserFormData } from './UserFormModal';

type SystemUsersTabProps = {
  isActive: boolean;
};

export function SystemUsersTab({ isActive }: SystemUsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_USER_FORM);

  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery(undefined, { skip: !isActive });
  const [createUserMutation, { isLoading: userCreating }] = useCreateUserMutation();
  const [updateUserMutation, { isLoading: userUpdating }] = useUpdateUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();
  const { data: rolesFromApi = [], isLoading: rolesLoading } = useGetRolesQuery(undefined);
  const { data: zonesFromApi = [] } = useGetZonesQuery(undefined, { skip: !isActive });
  const { data: branchesFromApi = [] } = useGetBranchesQuery(undefined, { skip: !isActive });

  const rolesForUserDropdown = rolesFromApi;

  useEffect(() => {
    if (editingUser) {
      const nameParts = editingUser.name.split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: editingUser.email,
        password: '',
        role: getRoleCodeForEnum(editingUser.role, rolesFromApi),
        zone: editingUser.zone || '',
        branch: editingUser.branch || '',
        location: editingUser.location || '',
        status: editingUser.status,
      });
    } else {
      setFormData(EMPTY_USER_FORM);
    }
  }, [editingUser, isAddUserOpen, rolesFromApi]);

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

  const userColumns = useMemo(
    () => getUserColumns(rolesFromApi, zonesFromApi, branchesFromApi),
    [rolesFromApi, zonesFromApi, branchesFromApi]
  );

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsAddUserOpen(true);
  };

  const handleAddUserClick = () => {
    setEditingUser(null);
    setFormData(EMPTY_USER_FORM);
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
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation(userToDelete.id).unwrap();
      setUserToDelete(null);
      toast.success('User deleted successfully');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <>
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

      <UserFormModal
        open={isAddUserOpen}
        onOpenChange={(open) => {
          setIsAddUserOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData(EMPTY_USER_FORM);
          }
        }}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddUser}
        loading={userCreating || userUpdating}
        rolesForUserDropdown={rolesForUserDropdown}
        rolesLoading={rolesLoading}
        zonesFromApi={zonesFromApi}
        branchesFromApi={branchesFromApi}
        emptyUserForm={EMPTY_USER_FORM}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user &quot;{userToDelete?.name}&quot; ({userToDelete?.email}). This
              action cannot be undone.
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
    </>
  );
}

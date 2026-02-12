import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../common/ui/dialog';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select';
import type { User } from '@/app/types';
import type { Role } from '@/app/store/apis/rolesApi';
import type { Zone } from '@/app/store/apis/zonesApi';
import type { Branch } from '@/app/store/apis/branchesApi';

export type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  zone: string;
  branch: string;
  location: string;
  status: 'active' | 'inactive';
};

type RoleLike = Pick<Role, 'id' | 'code' | 'name'>;
type ZoneLike = Pick<Zone, 'id' | 'name'>;
type BranchLike = Pick<Branch, 'id' | 'name' | 'zoneId'>;

type UserFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  rolesForUserDropdown: RoleLike[];
  rolesLoading: boolean;
  zonesFromApi: ZoneLike[];
  branchesFromApi: BranchLike[];
  emptyUserForm: UserFormData;
};

export function UserFormModal({
  open,
  onOpenChange,
  editingUser,
  formData,
  setFormData,
  onSubmit,
  loading,
  rolesForUserDropdown,
  rolesLoading,
  zonesFromApi,
  branchesFromApi,
  emptyUserForm,
}: UserFormModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setFormData(emptyUserForm);
      }}
    >
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update the user's profile and system access."
                : 'Invite a new team member to your workspace.'}
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
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        rolesLoading
                          ? 'Loading roles...'
                          : rolesForUserDropdown.length === 0
                            ? 'No roles in database'
                            : 'Select Role'
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8" disabled={loading}>
              {loading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

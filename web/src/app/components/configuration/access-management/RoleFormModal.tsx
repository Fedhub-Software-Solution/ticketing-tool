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
import { ROLE_PERMISSIONS_OPTIONS } from '../../common/constants';
import type { Role } from '@/app/store/apis/rolesApi';

export type RoleFormData = {
  name: string;
  code: string;
  description: string;
  permissions: string[];
  color: string;
};

type RoleFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: Role | null;
  roleFormData: RoleFormData;
  setRoleFormData: React.Dispatch<React.SetStateAction<RoleFormData>>;
  onSubmit: (e?: React.FormEvent) => void;
  roleCodeConflict: boolean;
  roleEffectiveCode: string;
  loading: boolean;
};

export function RoleFormModal({
  open,
  onOpenChange,
  editingRole,
  roleFormData,
  setRoleFormData,
  onSubmit,
  roleCodeConflict,
  roleEffectiveCode,
  loading,
}: RoleFormModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the permissions for this role.'
                : 'Define a new set of permissions for specific team functions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            {roleCodeConflict && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="shrink-0">⚠</span>
                <span>
                  Role name &quot;{roleFormData.name}&quot; produces a reserved code (
                  <code className="font-mono text-amber-700">{roleEffectiveCode}</code>). Enter a custom code below
                  (e.g. branch-manager) to create this role.
                </span>
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
                placeholder={editingRole ? undefined : 'e.g. branch-manager (leave empty to use name)'}
                className="bg-white font-mono text-sm"
                value={roleFormData.code}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    code: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                  })
                }
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
                  <div
                    key={perm}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={perm}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={roleFormData.permissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoleFormData({ ...roleFormData, permissions: [...roleFormData.permissions, perm] });
                        } else {
                          setRoleFormData({
                            ...roleFormData,
                            permissions: roleFormData.permissions.filter((p) => p !== perm),
                          });
                        }
                      }}
                    />
                    <label htmlFor={perm} className="text-sm font-medium text-slate-700 cursor-pointer">
                      {perm}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 px-8"
              disabled={roleCodeConflict || loading}
            >
              {loading ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

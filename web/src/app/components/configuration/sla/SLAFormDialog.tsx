import { Plus } from 'lucide-react';
import { Button } from '@/app/components/common/ui/button';
import { Input } from '@/app/components/common/ui/input';
import { Label } from '@/app/components/common/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/common/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/common/ui/dialog';
import { useGetPrioritiesQuery } from '@/app/store/apis/prioritiesApi';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import type { SLA } from '@/app/types';
import type { SLAFormData } from '@/app/components/common/constants';

export function SLAFormDialog({
  open,
  onOpenChange,
  editingSLA,
  formData,
  onFormDataChange,
  onCreate,
  onUpdate,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSLA: SLA | null;
  formData: SLAFormData;
  onFormDataChange: (data: SLAFormData) => void;
  onCreate: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onReset: () => void;
}) {
  const { data: priorities = [] } = useGetPrioritiesQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const typedCategories = categories as { id: string; name: string; parentId?: string | null }[];
  const parentCategories = typedCategories.filter((c) => !c.parentId);
  const selectedParentId = parentCategories.find((c) => c.name === formData.category)?.id ?? null;
  const subCategories = typedCategories.filter((c) => c.parentId === selectedParentId);
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) onReset();
  };

  const handleSubmit = editingSLA ? onUpdate : onCreate;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
          <Plus className="w-4 h-4" />
          Add SLA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingSLA ? 'Edit SLA' : 'New SLA'}
          </DialogTitle>
          <DialogDescription>
            Set response and resolution time targets for support requests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sla-name">SLA Policy Name</Label>
            <Input
              id="sla-name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Enterprise Customer Support"
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sla-category">Category</Label>
              <Select
                value={formData.category || 'none'}
                onValueChange={(value) =>
                  onFormDataChange({
                    ...formData,
                    category: value === 'none' ? '' : value,
                    subCategory: '',
                  })
                }
              >
                <SelectTrigger id="sla-category" className="bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla-subcategory">Sub Category</Label>
              <Select
                value={formData.subCategory || 'none'}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, subCategory: value === 'none' ? '' : value })
                }
                disabled={!selectedParentId}
              >
                <SelectTrigger id="sla-subcategory" className="bg-white">
                  <SelectValue placeholder="Select sub category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subCategories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sla-priority">Target Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, priority: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.id} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sla-response">Response Goal (min)</Label>
              <Input
                id="sla-response"
                type="number"
                value={formData.responseTime || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onFormDataChange({
                    ...formData,
                    responseTime: Number.isNaN(val) ? 0 : val,
                  });
                }}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla-resolution">Resolution Goal (min)</Label>
              <Input
                id="sla-resolution"
                type="number"
                value={formData.resolutionTime || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onFormDataChange({
                    ...formData,
                    resolutionTime: Number.isNaN(val) ? 0 : val,
                  });
                }}
                className="bg-white"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            className="h-10 bg-blue-600 hover:bg-blue-700 px-8"
          >
            {editingSLA ? 'Save Changes' : 'Create Policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

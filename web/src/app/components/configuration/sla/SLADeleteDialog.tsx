import { Button } from '@/app/components/common/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/common/ui/alert-dialog';
import type { SLA } from '@/app/types';

export function SLADeleteDialog({
  sla,
  open,
  onOpenChange,
  onConfirm,
}: {
  sla: SLA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete SLA policy?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove &quot;{sla?.name}&quot;. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => void onConfirm()}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

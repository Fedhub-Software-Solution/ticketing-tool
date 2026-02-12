import { useState, useMemo, useCallback } from 'react';
import type { MRT_Row } from 'material-react-table';
import { Button } from '@/app/components/common/ui/button';
import { MaterialReactTableWrapper } from '@/app/components/common/mrt/MaterialReactTableWrapper';
import { MaterialReactTableCardListWrapper } from '@/app/components/common/mrt/MaterialReactTableCardListWrapper';
import {
  useGetSLAsQuery,
  useCreateSLAMutation,
  useUpdateSLAMutation,
  useDeleteSLAMutation,
} from '@/app/store/apis/slasApi';
import type { SLA } from '@/app/types';
import { toast } from 'sonner';
import {
  SLA_EMPTY_MESSAGE,
  SLA_INITIAL_FORM,
  type SLAFormData,
} from '@/app/components/common/constants';
import { getSlaTableColumns } from './slaTableColumns';
import { SLACardContent } from './SLACardContent';
import { SlaRowActions } from './SlaRowActions';
import { SLAConfigToolbar } from './SLAConfigToolbar';
import { SLADeleteDialog } from './SLADeleteDialog';

export function SLAConfig() {
  const { data: slas = [], isLoading: slasLoading } = useGetSLAsQuery();
  const [createSLA] = useCreateSLAMutation();
  const [updateSLA] = useUpdateSLAMutation();
  const [deleteSLAMutation] = useDeleteSLAMutation();

  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLA | null>(null);
  const [slaToDelete, setSlaToDelete] = useState<SLA | null>(null);
  const [formData, setFormData] = useState<SLAFormData>({ ...SLA_INITIAL_FORM });

  const filteredSLAs = useMemo(
    () =>
      slas.filter((sla) => {
        const matchesSearch = sla.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesPriority =
          priorityFilter === 'all' || sla.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    [slas, searchQuery, priorityFilter]
  );

  const slaTableColumns = useMemo(() => getSlaTableColumns(), []);

  const resetForm = useCallback(() => {
    setFormData({ ...SLA_INITIAL_FORM });
    setEditingSLA(null);
  }, []);

  const openEditDialog = useCallback((sla: SLA) => {
    setEditingSLA(sla);
    setFormData({
      name: sla.name,
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
    });
    setIsDialogOpen(true);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      await createSLA({
        name: formData.name,
        priority: formData.priority,
        responseTime: formData.responseTime,
        resolutionTime: formData.resolutionTime,
      }).unwrap();
      setIsDialogOpen(false);
      resetForm();
      toast.success('SLA configuration created successfully');
    } catch {
      toast.error('Failed to create SLA');
    }
  }, [createSLA, formData, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingSLA) return;
    try {
      await updateSLA({ id: editingSLA.id, body: formData }).unwrap();
      setEditingSLA(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('SLA configuration updated successfully');
    } catch {
      toast.error('Failed to update SLA');
    }
  }, [editingSLA, formData, updateSLA, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!slaToDelete) return;
    try {
      await deleteSLAMutation(slaToDelete.id).unwrap();
      setSlaToDelete(null);
      toast.success('SLA configuration deleted');
    } catch {
      toast.error('Failed to delete SLA');
    }
  }, [slaToDelete, deleteSLAMutation]);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <SLAConfigToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isDialogOpen={isDialogOpen}
            onDialogOpenChange={setIsDialogOpen}
            editingSLA={editingSLA}
            formData={formData}
            onFormDataChange={setFormData}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onResetForm={resetForm}
          />

          {viewMode === 'list' && (
            <MaterialReactTableCardListWrapper<SLA>
              data={filteredSLAs}
              isLoading={slasLoading}
              pageSize={10}
              emptyMessage={SLA_EMPTY_MESSAGE}
              getRowId={(row: SLA) => row.id}
              renderCardContent={(sla: SLA) => <SLACardContent sla={sla} />}
              renderRowActions={({ row }: { row: MRT_Row<SLA> }) => (
                <SlaRowActions
                  row={row}
                  onEdit={openEditDialog}
                  onDelete={setSlaToDelete}
                  size="icon"
                />
              )}
            />
          )}

          {viewMode === 'table' && (
            <MaterialReactTableWrapper<SLA>
              columns={slaTableColumns}
              data={filteredSLAs}
              isLoading={slasLoading}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              emptyMessage={SLA_EMPTY_MESSAGE}
              renderRowActions={({ row }: { row: MRT_Row<SLA> }) => (
                <SlaRowActions
                  row={row}
                  onEdit={openEditDialog}
                  onDelete={setSlaToDelete}
                  size="sm"
                />
              )}
            />
          )}

          <SLADeleteDialog
            sla={slaToDelete}
            open={!!slaToDelete}
            onOpenChange={(open) => !open && setSlaToDelete(null)}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

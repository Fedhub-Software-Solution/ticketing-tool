import { useState, useEffect } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_Row,
  type MRT_RowData,
  type MRT_TableInstance,
} from 'material-react-table';
import type { Updater } from '@tanstack/react-table';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import { Card } from '../ui/card';

export interface MaterialReactTableCardListWrapperProps<T extends Record<string, any>> {
  data: T[];
  /** Render the main card content (icon, title, badge, details). */
  renderCardContent: (row: T) => React.ReactNode;
  /** Optional row actions (e.g. edit, delete buttons). */
  renderRowActions?: (params: { row: MRT_Row<T> }) => React.ReactNode;
  isLoading?: boolean;
  error?: unknown;
  enableBottomToolbar?: boolean;
  pageSize?: number;
  maxHeight?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  /** Optional: enable sorting by a field (uses first column for display). */
  getRowId?: (row: T) => string;
  renderBottomToolbarCustomActions?: (params: { table: MRT_TableInstance<T> }) => React.ReactNode;
  state?: {
    pagination?: MRT_PaginationState;
  };
  onPaginationChange?: (updater: Updater<MRT_PaginationState>) => void;
}

function renderPaginationToolbar<T extends MRT_RowData>(table: MRT_TableInstance<T>, renderBottomToolbarCustomActions?: (params: { table: MRT_TableInstance<T> }) => React.ReactNode) {
  const { getState, getRowCount, getPageCount, previousPage, nextPage, firstPage, lastPage, setPageIndex } = table;
  const { pageIndex = 0, pageSize = 2 } = getState().pagination ?? {};
  const totalRowCount = getRowCount();
  const pageCount = getPageCount();
  const firstRow = totalRowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(pageIndex * pageSize + pageSize, totalRowCount);
  const disableFirst = pageIndex <= 0;
  const disablePrev = pageIndex <= 0;
  const disableNext = pageIndex >= pageCount - 1;
  const disableLast = pageCount <= 1 || pageIndex >= pageCount - 1;

  const maxVisiblePages = 5;
  const pageNumbers =
    pageCount <= 0
      ? []
      : (() => {
          let startPage = Math.max(0, pageIndex - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(pageCount - 1, startPage + maxVisiblePages - 1);
          if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
          }
          return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
        })();

  return (
    <Box
      sx={(theme) => ({
        alignItems: 'center',
        boxShadow: `0 1px 2px -1px ${alpha(theme.palette.grey[700], 0.5)} inset`,
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        p: '0.5rem 16px',
        width: '100%',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {renderBottomToolbarCustomActions?.({ table })}
        <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
          Showing <strong>{firstRow}</strong> to <strong>{lastRow}</strong> of <strong>{totalRowCount}</strong> results
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button size="small" onClick={() => firstPage()} disabled={disableFirst} sx={{ color: 'text.secondary', borderColor: 'divider', minWidth: 36, '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }} variant="outlined" aria-label="First page">
          <FirstPageIcon fontSize="small" />
        </Button>
        <Button size="small" startIcon={<ChevronLeftIcon />} onClick={() => previousPage()} disabled={disablePrev} sx={{ color: 'text.secondary', borderColor: 'divider', '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }} variant="outlined">
          Previous
        </Button>
        {pageNumbers.map((num) => (
          <Button
            key={num}
            size="small"
            onClick={() => setPageIndex(num)}
            variant={pageIndex === num ? 'contained' : 'outlined'}
            sx={{ minWidth: 36, ...(pageIndex !== num && { color: 'text.secondary', borderColor: 'divider' }) }}
            aria-current={pageIndex === num ? 'page' : undefined}
            aria-label={`Page ${num + 1}`}
          >
            {num + 1}
          </Button>
        ))}
        <Button size="small" endIcon={<ChevronRightIcon />} onClick={() => nextPage()} disabled={disableNext} sx={{ color: 'text.secondary', borderColor: 'divider', '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }} variant="outlined">
          Next
        </Button>
        <Button size="small" onClick={() => lastPage()} disabled={disableLast} sx={{ color: 'text.secondary', borderColor: 'divider', minWidth: 36, '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }} variant="outlined" aria-label="Last page">
          <LastPageIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
}

export function MaterialReactTableCardListWrapper<T extends Record<string, any>>({
  data,
  renderCardContent,
  renderRowActions,
  isLoading = false,
  error = null,
  enableBottomToolbar = true,
  pageSize = 2,
  maxHeight = '600px',
  emptyMessage = 'No data available.',
  loadingMessage = 'Loading data...',
  errorMessage = 'Error loading data. Please try again.',
  getRowId,
  renderBottomToolbarCustomActions,
  state,
  onPaginationChange,
}: MaterialReactTableCardListWrapperProps<T>) {
  const [internalPagination, setInternalPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? 2,
  });
  const pagination = state?.pagination ?? internalPagination;

  // When pageSize prop changes, reset to first page so pageSize is applied
  useEffect(() => {
    if (state?.pagination === undefined) {
      setInternalPagination((prev) => (prev.pageSize === pageSize ? prev : { pageIndex: 0, pageSize }));
    }
  }, [pageSize, state?.pagination]);

  // Always use pageSize from prop so parent control (e.g. pageSize={2}) is respected
  const effectivePagination = {
    pageIndex: pagination.pageIndex ?? 0,
    pageSize,
  };

  // Slice data to current page so we control pageSize regardless of MRT's internal default (10)
  const pageStart = effectivePagination.pageIndex * effectivePagination.pageSize;
  const paginatedData = data.slice(pageStart, pageStart + effectivePagination.pageSize);

  const handlePaginationChange = (updater: Updater<MRT_PaginationState>) => {
    const next = typeof updater === 'function' ? updater(effectivePagination) : updater;
    const merged = { pageIndex: next.pageIndex ?? 0, pageSize };
    if (state?.pagination === undefined) setInternalPagination(merged);
    onPaginationChange?.(updater);
  };

  const columns: MRT_ColumnDef<T>[] = [
    {
      id: '_card',
      accessorFn: (row) => (getRowId ? getRowId(row) : (row as { id?: string }).id ?? ''),
      header: '',
      size: 0,
      enableSorting: false,
      enableColumnActions: false,
      Cell: ({ row }) => (
        <Card className="p-5 hover:shadow-md transition-all border-slate-200 group bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-6 min-w-0">
              {renderCardContent(row.original)}
            </div>
            {renderRowActions && (
              <div className="flex gap-1 shrink-0">
                {renderRowActions({ row })}
              </div>
            )}
          </div>
        </Card>
      ),
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: paginatedData,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableBottomToolbar,
    enableTopToolbar: false,
    enableRowActions: false,
    enablePagination: true,
    manualPagination: true,
    rowCount: data.length,
    onPaginationChange: handlePaginationChange,
    state: { pagination: effectivePagination },
    initialState: { pagination: { pageIndex: 0, pageSize } },
    muiTableContainerProps: { sx: { maxHeight } },
    muiTablePaperProps: { sx: { borderRadius: '12px', overflow: 'hidden', boxShadow: 'none' } },
    muiTableHeadCellProps: { sx: { border: 'none', p: 0, height: 0, display: 'none' } },
    muiTableHeadRowProps: { sx: { display: 'none' } },
    muiTableBodyRowProps: () => ({
      hover: false,
      sx: {
        '& td': { border: 'none', paddingBlock: '0.5rem', paddingInline: 0, verticalAlign: 'top' },
      },
    }),
    muiTableBodyCellProps: { sx: { border: 'none', padding: 0 } },
    renderBottomToolbar: enableBottomToolbar ? ({ table: t }) => renderPaginationToolbar(t, renderBottomToolbarCustomActions) : undefined,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-200" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <p className="mt-4 text-sm text-slate-500">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{errorMessage}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-6 text-center text-slate-500">{emptyMessage}</div>;
  }

  return <MaterialReactTable key={`card-list-pageSize-${pageSize}`} table={table} />;
}

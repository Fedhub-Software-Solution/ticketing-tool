import { useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableInstance,
  type MRT_TableOptions,
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

interface MaterialReactTableWrapperProps<T extends Record<string, any>> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  error?: any;
  enableColumnActions?: boolean;
  enableColumnFilters?: boolean;
  enableSorting?: boolean;
  enableBottomToolbar?: boolean;
  enableTopToolbar?: boolean;
  enableRowActions?: boolean;
  enableRowSelection?: boolean;
  enableExpanding?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  manualSorting?: boolean;
  pageSize?: number;
  maxHeight?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  rowCount?: number;
  initialState?: Partial<MRT_TableOptions<T>['initialState']>;
  muiTableContainerProps?: MRT_TableOptions<T>['muiTableContainerProps'];
  renderTopToolbarCustomActions?: MRT_TableOptions<T>['renderTopToolbarCustomActions'];
  renderBottomToolbarCustomActions?: MRT_TableOptions<T>['renderBottomToolbarCustomActions'];
  positionActionsColumn?: 'first' | 'last';
  renderRowActions?: MRT_TableOptions<T>['renderRowActions'];
  renderDetailPanel?: MRT_TableOptions<T>['renderDetailPanel'];
  onColumnFiltersChange?: (updater: Updater<MRT_ColumnFiltersState>) => void;
  onPaginationChange?: (updater: Updater<MRT_PaginationState>) => void;
  onSortingChange?: (updater: Updater<MRT_SortingState>) => void;
  state?: {
    columnFilters?: MRT_ColumnFiltersState;
    pagination?: MRT_PaginationState;
    sorting?: MRT_SortingState;
  };
}

export function MaterialReactTableWrapper<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = null,
  enableColumnActions = false,
  enableColumnFilters = false,
  enableSorting = true,
  enableBottomToolbar = true,
  enableTopToolbar = false,
  enableRowActions = false,
  enableRowSelection = false,
  enableExpanding = false,
  manualFiltering = false,
  manualPagination = false,
  manualSorting = false,
  pageSize = 10,
  maxHeight = '600px',
  emptyMessage = 'No data available.',
  loadingMessage = 'Loading data...',
  errorMessage = 'Error loading data. Please try again.',
  rowCount,
  initialState,
  muiTableContainerProps,
  renderTopToolbarCustomActions,
  renderBottomToolbarCustomActions,
  positionActionsColumn,
  renderRowActions,
  renderDetailPanel,
  onColumnFiltersChange,
  onPaginationChange,
  onSortingChange,
  state,
}: MaterialReactTableWrapperProps<T>) {
  // Table state - use external state if provided, otherwise use internal state
  const [internalColumnFilters, setInternalColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [internalPagination, setInternalPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [internalSorting, setInternalSorting] = useState<MRT_SortingState>([]);

  // Use external state if provided, otherwise use internal state
  const columnFilters = state?.columnFilters ?? internalColumnFilters;
  const pagination = state?.pagination ?? internalPagination;
  const sorting = state?.sorting ?? internalSorting;

  // Handle state changes
  const handleColumnFiltersChange = (updater: Updater<MRT_ColumnFiltersState>) => {
    const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
    if (state?.columnFilters === undefined) {
      setInternalColumnFilters(newFilters);
    }
    onColumnFiltersChange?.(updater);
  };

  const handlePaginationChange = (updater: Updater<MRT_PaginationState>) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
    if (state?.pagination === undefined) {
      setInternalPagination(newPagination);
    }
    onPaginationChange?.(updater);
  };

  const handleSortingChange = (updater: Updater<MRT_SortingState>) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    if (state?.sorting === undefined) {
      setInternalSorting(newSorting);
    }
    onSortingChange?.(updater);
  };

  // Create table instance
  const table = useMaterialReactTable({
    columns,
    data,
    enableColumnActions,
    enableColumnFilters,
    enableSorting,
    enableBottomToolbar,
    enableTopToolbar,
    enableRowActions,
    enableRowSelection,
    enableExpanding,
    manualFiltering,
    manualPagination,
    manualSorting,
    rowCount: rowCount !== undefined ? rowCount : data.length,
    onColumnFiltersChange: handleColumnFiltersChange,
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    state: {
      columnFilters,
      pagination,
      sorting,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: pageSize },
      ...initialState,
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: maxHeight,
      },
      ...muiTableContainerProps,
    },
    muiTablePaperProps: {
      sx: {
        borderRadius: '12px',
        overflow: 'hidden',
      },
    },
    muiTableHeadRowProps: {
      sx: {
        backgroundColor: 'var(--color-slate-50, oklch(98.4% 0.003 247.858))',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: 'var(--color-slate-50, oklch(98.4% 0.003 247.858))',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        textAlign: 'left',
      },
    },
    renderTopToolbarCustomActions,
    renderBottomToolbarCustomActions,
    positionActionsColumn,
    renderRowActions,
    renderDetailPanel,
    renderBottomToolbar: ({ table }: { table: MRT_TableInstance<T> }) => {
      const { getState, getRowCount, getPageCount, previousPage, nextPage, firstPage, lastPage, setPageIndex } = table;
      const { pageIndex = 0, pageSize = 10 } = getState().pagination ?? {};
      const totalRowCount = getRowCount();
      const pageCount = getPageCount();
      const firstRow = totalRowCount === 0 ? 0 : pageIndex * pageSize + 1;
      const lastRow = Math.min(pageIndex * pageSize + pageSize, totalRowCount);
      const disableFirst = pageIndex <= 0;
      const disablePrev = pageIndex <= 0;
      const disableNext = pageIndex >= pageCount - 1;
      const disableLast = pageCount <= 1 || pageIndex >= pageCount - 1;

      // Page number buttons: show a window around current page (e.g. 1 2 3 or 2 3 4)
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
            <Button
              size="small"
              onClick={() => firstPage()}
              disabled={disableFirst}
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                minWidth: 36,
                '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
              }}
              variant="outlined"
              aria-label="First page"
            >
              <FirstPageIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              startIcon={<ChevronLeftIcon />}
              onClick={() => previousPage()}
              disabled={disablePrev}
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
              }}
              variant="outlined"
            >
              Previous
            </Button>
            {pageNumbers.map((num) => (
              <Button
                key={num}
                size="small"
                onClick={() => setPageIndex(num)}
                variant={pageIndex === num ? 'contained' : 'outlined'}
                sx={{
                  minWidth: 36,
                  ...(pageIndex !== num && {
                    color: 'text.secondary',
                    borderColor: 'divider',
                  }),
                }}
                aria-current={pageIndex === num ? 'page' : undefined}
                aria-label={`Page ${num + 1}`}
              >
                {num + 1}
              </Button>
            ))}
            <Button
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={() => nextPage()}
              disabled={disableNext}
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
              }}
              variant="outlined"
            >
              Next
            </Button>
            <Button
              size="small"
              onClick={() => lastPage()}
              disabled={disableLast}
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                minWidth: 36,
                '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
              }}
              variant="outlined"
              aria-label="Last page"
            >
              <LastPageIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      );
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        {loadingMessage}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {errorMessage}
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Render table
  return <MaterialReactTable table={table} />;
}


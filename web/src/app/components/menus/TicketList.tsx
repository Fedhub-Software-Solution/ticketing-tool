import { useState, useMemo } from 'react';
import type { MRT_Row } from 'material-react-table';
import { Search, Filter, List, Table, MapPin, Edit2, Trash2, Globe, Tag, User, GitBranch, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { toast } from 'sonner';
import { User as UserType, Ticket } from '@/app/types';
import { useTickets } from '@/app/hooks/useTickets';
import { MaterialReactTableWrapper } from '@/app/components/common/mrt/MaterialReactTableWrapper';
import { MaterialReactTableCardListWrapper } from '@/app/components/common/mrt/MaterialReactTableCardListWrapper';
import { getTicketTableColumns } from './ticketTableColumns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../common/ui/collapsible';

interface TicketListProps {
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  onTrackTicket: (ticketId: string) => void;
  onNavigate?: (view: any) => void;
  currentUser: UserType;
  initialViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  listViewMode?: ViewMode;
  setListViewMode?: (mode: ViewMode) => void;
}

type ViewMode = 'list' | 'table';
type SortField = keyof Ticket;
type SortDirection = 'asc' | 'desc';

function DetailItem({
  label,
  value,
  mono,
  className,
  valueClassName,
}: { label: string; value: string; mono?: boolean; className?: string; valueClassName?: string }) {
  return (
    <div className={className}>
      <span className="text-slate-500 font-medium block mb-0.5">{label}</span>
      <span className={`text-slate-800 ${mono ? 'font-mono text-xs' : ''} ${valueClassName ?? ''}`}>{value}</span>
    </div>
  );
}

function TicketListCardContent({ ticket }: { ticket: Ticket }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const slaPast = ticket.slaDueDate ? new Date(ticket.slaDueDate) < new Date() : false;
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
        <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
        <Badge className={statusColors[ticket.status]}>{ticket.status.replace('-', ' ')}</Badge>
        <Badge variant="outline">{ticket.category}</Badge>
        {ticket.subCategory && <Badge variant="outline" className="bg-slate-50 border-slate-200">{ticket.subCategory}</Badge>}
        {ticket.zone && (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1">
            <Globe className="w-3 h-3" /> {ticket.zone}
          </Badge>
        )}
        {ticket.branch && (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {ticket.branch}
          </Badge>
        )}
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{ticket.title}</h3>
      <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.assignedTo ?? '—'}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
      </div>
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2 h-8 gap-1">
            {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{detailsOpen ? 'Hide details' : 'Show all details'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-4 mt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            <DetailItem label="ID" value={`#${ticket.id}`} mono />
            <DetailItem label="Title" value={ticket.title} />
            <DetailItem label="Description" value={ticket.description || '—'} className="sm:col-span-2 lg:col-span-3" />
            <DetailItem label="Status" value={(ticket.status as string).replace('-', ' ')} />
            <DetailItem label="Priority" value={ticket.priority} />
            <DetailItem label="Category" value={ticket.category ?? '—'} />
            <DetailItem label="Sub category" value={ticket.subCategory ?? '—'} />
            <DetailItem label="Zone" value={ticket.zone ?? '—'} />
            <DetailItem label="Branch" value={ticket.branch ?? '—'} />
            <DetailItem label="Location" value={ticket.location ?? '—'} />
            <DetailItem label="Assigned to" value={ticket.assignedTo ?? '—'} />
            <DetailItem label="Created by" value={ticket.createdBy ?? '—'} />
            <DetailItem label="Created" value={ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm') : '—'} />
            <DetailItem label="Updated" value={ticket.updatedAt ? format(new Date(ticket.updatedAt), 'dd/MM/yyyy HH:mm') : '—'} />
            <DetailItem
              label="SLA due"
              value={ticket.slaDueDate ? format(new Date(ticket.slaDueDate), 'dd/MM/yyyy HH:mm') : '—'}
              valueClassName={slaPast ? 'text-rose-600 font-semibold' : undefined}
            />
            {ticket.escalationLevel != null && (
              <DetailItem label="Escalation level" value={String(ticket.escalationLevel)} />
            )}
            {ticket.escalatedTo && <DetailItem label="Escalated to" value={ticket.escalatedTo} />}
            {ticket.breachedSLA != null && (
              <DetailItem label="SLA breached" value={ticket.breachedSLA ? 'Yes' : 'No'} valueClassName={ticket.breachedSLA ? 'text-rose-600' : undefined} />
            )}
            {ticket.tags?.length ? (
              <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-slate-500 font-medium">Tags:</span>
                {ticket.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-slate-100 border-slate-200">{tag}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-100 font-semibold',
  high: 'bg-orange-50 text-orange-700 border-orange-100 font-semibold',
  medium: 'bg-amber-50 text-amber-700 border-amber-100 font-semibold',
  low: 'bg-blue-50 text-blue-700 border-blue-100 font-semibold',
};

const statusColors: Record<string, string> = {
  open: 'bg-indigo-50 text-indigo-700 border-indigo-100 font-medium',
  'in-progress': 'bg-violet-50 text-violet-700 border-violet-100 font-medium',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-medium',
  closed: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
};

export function TicketList({ onViewTicket, onTrackTicket, onNavigate, currentUser, initialViewMode, onViewModeChange, listViewMode, setListViewMode }: TicketListProps) {
  const { tickets, deleteTicket, isLoading, isError } = useTickets();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Use controlled viewMode from parent if available, otherwise use local state
  const viewMode = listViewMode !== undefined ? listViewMode : (initialViewMode || 'table');

  const handleDeleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        await deleteTicket(ticketId);
        toast.success('Ticket deleted successfully');
      } catch {
        toast.error('Failed to delete ticket');
      }
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (setListViewMode) setListViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  // Filter tickets based on user role and regional assignment
  const getAccessibleTickets = () => {
    if (currentUser.role === 'admin') return tickets;
    if (currentUser.role === 'customer') return tickets.filter(ticket => ticket.createdBy === currentUser.name);
    if (currentUser.zone) {
      return tickets.filter(
        ticket => ticket.zone === currentUser.zone || ticket.createdBy === currentUser.name
      );
    }
    return tickets;
  };

  const accessibleTickets = getAccessibleTickets();
  const assignedCount = accessibleTickets.filter(ticket => ticket.assignedTo === currentUser.name).length;

  const filteredTickets = useMemo(() => {
    let result = accessibleTickets.filter((ticket) => {
      const matchesSearch = 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      const matchesZone = zoneFilter === 'all' || ticket.zone === zoneFilter;
      const matchesAssigned = !showOnlyAssigned || ticket.assignedTo === currentUser.name;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesZone && matchesAssigned;
    });

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue === bValue) return 0;
      const comparison = (aValue === undefined || aValue === null) ? -1 :
                         (bValue === undefined || bValue === null) ? 1 :
                         aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [accessibleTickets, searchQuery, statusFilter, priorityFilter, categoryFilter, zoneFilter, showOnlyAssigned, sortField, sortDirection, currentUser.name]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    toast.success('Exporting tickets...', {
      description: `Preparing ${filteredTickets.length} tickets for export as CSV`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="bg-white/40 backdrop-blur-md border-b border-slate-200/60 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl font-medium">
              <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl font-medium">
              <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl font-medium">
              <Tag className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter((c: { parentId?: string }) => !c.parentId).map((category: { id: string; name: string }) => (
                <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl font-medium">
              <Globe className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="East">East</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white/50 backdrop-blur-sm shadow-sm">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0 shadow-sm rounded-lg' : 'h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg'}
            >
              <Table className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0 shadow-sm rounded-lg' : 'h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === 'list' ? (
          <div className="">
          <Card className="overflow-hidden px-4 border-slate-200 shadow-sm rounded-xl">
            <MaterialReactTableCardListWrapper<Ticket>
              data={filteredTickets}
              isLoading={isLoading}
              error={isError ? new Error('Failed to load tickets') : null}
              pageSize={10}
              maxHeight="calc(100vh - 280px)"
              getRowId={(row) => row.id}
              emptyMessage={
                tickets.length === 0 && !searchQuery && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && zoneFilter === 'all'
                  ? 'No tickets yet. Create one with + New Ticket.'
                  : 'No tickets match your filters. Try adjusting search or filters.'
              }
              errorMessage="Failed to load tickets. Check that the API is running and you are logged in."
              renderCardContent={(ticket) => <TicketListCardContent ticket={ticket} />}
              renderRowActions={({ row }) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onViewTicket(row.original.id, true)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onTrackTicket(row.original.id)}><MapPin className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDeleteTicket(row.original.id, e)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              )}
            />
          </Card>
          </div>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
            <MaterialReactTableWrapper<Ticket>
              columns={getTicketTableColumns()}
              data={filteredTickets}
              isLoading={isLoading}
              error={isError ? new Error('Failed to load tickets') : null}
              enableTopToolbar={false}
              enableRowActions
              enableExpanding
              positionActionsColumn="last"
              maxHeight="calc(100vh - 280px)"
              pageSize={10}
              emptyMessage={
                tickets.length === 0 && !searchQuery && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && zoneFilter === 'all'
                  ? 'No tickets yet. Create one with + New Ticket.'
                  : 'No tickets match your filters. Try adjusting search or filters.'
              }
              errorMessage="Failed to load tickets. Check that the API is running and you are logged in."
              renderDetailPanel={({ row }) => {
                const t = row.original;
                const slaPast = t.slaDueDate ? new Date(t.slaDueDate) < new Date() : false;
                return (
                  <div className="p-6 bg-slate-50/80 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                      <DetailItem label="ID" value={`#${t.id}`} mono />
                      <DetailItem label="Title" value={t.title} />
                      <DetailItem label="Description" value={t.description || '—'} className="sm:col-span-2 lg:col-span-3" />
                      <DetailItem label="Status" value={(t.status as string).replace('-', ' ')} />
                      <DetailItem label="Priority" value={t.priority} />
                      <DetailItem label="Category" value={t.category ?? '—'} />
                      <DetailItem label="Sub category" value={t.subCategory ?? '—'} />
                      <DetailItem label="Zone" value={t.zone ?? '—'} />
                      <DetailItem label="Branch" value={t.branch ?? '—'} />
                      <DetailItem label="Location" value={t.location ?? '—'} />
                      <DetailItem label="Assigned to" value={t.assignedTo ?? '—'} />
                      <DetailItem label="Created by" value={t.createdBy ?? '—'} />
                      <DetailItem label="Created" value={t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm') : '—'} />
                      <DetailItem label="Updated" value={t.updatedAt ? format(new Date(t.updatedAt), 'dd/MM/yyyy HH:mm') : '—'} />
                      <DetailItem
                        label="SLA due"
                        value={t.slaDueDate ? format(new Date(t.slaDueDate), 'dd/MM/yyyy HH:mm') : '—'}
                        valueClassName={slaPast ? 'text-rose-600 font-semibold' : undefined}
                      />
                      {t.escalationLevel != null && (
                        <DetailItem label="Escalation level" value={String(t.escalationLevel)} />
                      )}
                      {t.escalatedTo && <DetailItem label="Escalated to" value={t.escalatedTo} />}
                      {t.breachedSLA != null && (
                        <DetailItem label="SLA breached" value={t.breachedSLA ? 'Yes' : 'No'} valueClassName={t.breachedSLA ? 'text-rose-600' : undefined} />
                      )}
                      {t.tags?.length ? (
                        <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-1.5 items-center">
                          <span className="text-slate-500 font-medium">Tags:</span>
                          {t.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-slate-100 border-slate-200">{tag}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }}
              renderRowActions={({ row }: { row: MRT_Row<Ticket> }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                    onClick={() => onViewTicket(row.original.id, true)}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                    onClick={() => onTrackTicket(row.original.id)}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 hover:text-rose-600"
                    onClick={(e) => handleDeleteTicket(row.original.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </div>
              )}
            />
          </Card>
        )}

      </div>
    </div>
  );
}

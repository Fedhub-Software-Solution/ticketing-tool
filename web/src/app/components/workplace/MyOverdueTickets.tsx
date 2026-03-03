import { useState, useMemo } from 'react';
import type { MRT_Row } from 'material-react-table';
import { User as UserType, Ticket } from '@/app/types';
import { Search, Filter, List, Table, MapPin, Edit2, Globe, Tag, User, GitBranch, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../common/ui/button';
import { Card } from '../common/ui/card';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { useTickets } from '@/app/hooks/useTickets';
import { format } from 'date-fns';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { MaterialReactTableWrapper } from '@/app/components/common/mrt/MaterialReactTableWrapper';
import { MaterialReactTableCardListWrapper } from '@/app/components/common/mrt/MaterialReactTableCardListWrapper';
import { getTicketTableColumns } from '../menus/ticketTableColumns';

const priorityColors: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-100 font-semibold',
  high: 'bg-orange-50 text-orange-700 border-orange-100 font-semibold',
  medium: 'bg-amber-50 text-amber-700 border-amber-100 font-semibold',
  low: 'bg-blue-50 text-blue-700 border-blue-100 font-semibold',
};

interface MyOverdueTicketsProps {
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  onTrackTicket: (ticketId: string) => void;
  currentUser: UserType;
}

export function MyOverdueTickets({ onViewTicket, onTrackTicket, currentUser }: MyOverdueTicketsProps) {
  const { data: zones = [] } = useGetZonesQuery();
  const { tickets, isLoading, isError } = useTickets();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');

  const zoneList = useMemo(() => zones as { id: string; name: string }[], [zones]);
  const userZoneName = useMemo(
    () => (currentUser.zone && zoneList.length ? zoneList.find((z) => z.id === currentUser.zone)?.name : null),
    [currentUser.zone, zoneList]
  );

  const overdueTickets = useMemo(() => {
    const now = new Date();
    return tickets.filter((t) => {
      if (t.status === 'closed' || t.status === 'resolved' || !t.slaDueDate) return false;
      return new Date(t.slaDueDate) < now;
    });
  }, [tickets]);

  const accessibleTickets = useMemo(() => {
    if (currentUser.role === 'admin') return overdueTickets;
    if (currentUser.role === 'customer') return overdueTickets.filter((t) => t.createdBy === currentUser.name);
    if (userZoneName) return overdueTickets.filter((t) => t.zone === userZoneName || t.assignedTo === currentUser.name);
    return overdueTickets.filter((t) => t.assignedTo === currentUser.name);
  }, [overdueTickets, currentUser, userZoneName]);

  const filteredTickets = useMemo(() => {
    return accessibleTickets.filter((ticket) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      const matchesZone = zoneFilter === 'all' || ticket.zone === zoneFilter;
      return matchesSearch && matchesPriority && matchesCategory && matchesZone;
    });
  }, [accessibleTickets, searchQuery, priorityFilter, categoryFilter, zoneFilter]);

  const zoneOptions = useMemo(() => zoneList.map((z) => z.name), [zoneList]);
  const categoryOptions = useMemo(() => (categories as { id: string; name: string; parentId?: string }[]).filter((c) => !c.parentId), [categories]);

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="bg-white/40 backdrop-blur-md border-b border-slate-200/60 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search overdue breaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all rounded-xl"
            />
          </div>

          <Badge className="bg-rose-100 text-rose-700 border-rose-200 px-4 h-10 rounded-xl font-bold uppercase tracking-wider shadow-none flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {filteredTickets.length} Breaches
          </Badge>

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
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
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
              {zoneOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white/50 backdrop-blur-sm shadow-sm">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0 shadow-sm rounded-lg text-white' : 'h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg'}
            >
              <Table className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0 shadow-sm rounded-lg text-white' : 'h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === 'list' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
            <MaterialReactTableCardListWrapper<Ticket>
              data={filteredTickets}
              isLoading={isLoading}
              error={isError ? new Error('Failed to load tickets') : null}
              pageSize={10}
              maxHeight="calc(100vh - 280px)"
              getRowId={(row) => row.id}
              emptyMessage={
                overdueTickets.length === 0 && !searchQuery && priorityFilter === 'all' && categoryFilter === 'all' && zoneFilter === 'all'
                  ? 'No overdue tickets (SLA breaches).'
                  : 'No overdue tickets match your filters.'
              }
              errorMessage="Failed to load overdue tickets. Check that the API is running and you are logged in."
              renderCardContent={(ticket) => (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                    <span className="font-mono text-slate-500">#{ticket.id}</span>
                    <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                    <Badge className="bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3" /> Overdue
                    </Badge>
                    {ticket.zone && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {ticket.zone}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{ticket.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-rose-600 font-bold">
                      <AlertTriangle className="w-3 h-3" /> Due: {ticket.slaDueDate ? format(new Date(ticket.slaDueDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {ticket.assignedTo}
                    </span>
                  </div>
                </>
              )}
              renderRowActions={({ row }) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onViewTicket(row.original.id, true)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onTrackTicket(row.original.id)}>
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              )}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
            <MaterialReactTableWrapper<Ticket>
              columns={getTicketTableColumns()}
              data={filteredTickets}
              isLoading={isLoading}
              error={isError ? new Error('Failed to load tickets') : null}
              enableTopToolbar={false}
              enableRowActions
              positionActionsColumn="last"
              maxHeight="calc(100vh - 280px)"
              pageSize={10}
              emptyMessage={
                overdueTickets.length === 0 && !searchQuery && priorityFilter === 'all' && categoryFilter === 'all' && zoneFilter === 'all'
                  ? 'No overdue tickets (SLA breaches).'
                  : 'No overdue tickets match your filters.'
              }
              errorMessage="Failed to load overdue tickets. Check that the API is running and you are logged in."
              renderRowActions={({ row }: { row: MRT_Row<Ticket> }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onViewTicket(row.original.id, true)}>
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onTrackTicket(row.original.id)}>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
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

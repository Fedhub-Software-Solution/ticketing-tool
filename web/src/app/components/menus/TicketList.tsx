import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Clock, User, Tag, ChevronDown, Building2, UserCircle, Download, List, Table, MapPin, ArrowUpDown, ChevronUp, Edit2, Trash2, Globe, GitBranch } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../common/ui/table';
import { toast } from 'sonner';
import { User as UserType, Ticket } from '@/app/types';
import { useTickets } from '@/app/hooks/useTickets';

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

export function TicketList({ onViewTicket, onTrackTicket, onNavigate, currentUser, initialViewMode, onViewModeChange, listViewMode, setListViewMode }: TicketListProps) {
  const { tickets, deleteTicket } = useTickets();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

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
    if (currentUser.zone) return tickets.filter(ticket => ticket.zone === currentUser.zone);
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

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const priorityColors = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-100 font-semibold',
    high: 'bg-orange-50 text-orange-700 border-orange-100 font-semibold',
    medium: 'bg-amber-50 text-amber-700 border-amber-100 font-semibold',
    low: 'bg-blue-50 text-blue-700 border-blue-100 font-semibold',
  };

  const statusColors = {
    open: 'bg-indigo-50 text-indigo-700 border-indigo-100 font-medium',
    'in-progress': 'bg-violet-50 text-violet-700 border-violet-100 font-medium',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-medium',
    closed: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
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
          <div className="space-y-3">
            {paginatedTickets.map((ticket, index) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="p-5 border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                        <span className="font-mono text-slate-500">{ticket.id}</span>
                        <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                        <Badge className={statusColors[ticket.status]}>{ticket.status.replace('-', ' ')}</Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                        {ticket.subCategory && <Badge variant="outline" className="bg-slate-50 border-slate-200">{ticket.subCategory}</Badge>}
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {ticket.zone}
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> {ticket.branch}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{ticket.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.assignedTo}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onViewTicket(ticket.id, true)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onTrackTicket(ticket.id)}><MapPin className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDeleteTicket(ticket.id, e)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
            <TableComponent>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead onClick={() => handleSort('id')} className="cursor-pointer py-4 pl-6 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      ID {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('title')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Title {getSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('zone')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Zone {getSortIcon('zone')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer py-4 group">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Status {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('priority')} className="cursor-pointer py-4 group">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Priority {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('assignedTo')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Assigned {getSortIcon('assignedTo')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('category')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Category {getSortIcon('category')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('subCategory')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Sub Category {getSortIcon('subCategory')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('updatedAt')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                      Updated Date {getSortIcon('updatedAt')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right py-4 pr-6 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((ticket, index) => (
                  <TableRow key={ticket.id} className="group hover:bg-blue-50/40 transition-all duration-200">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-6 rounded-full ${ticket.priority === 'urgent' ? 'bg-rose-500' : ticket.priority === 'high' ? 'bg-orange-500' : 'bg-transparent'}`} />
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">#{ticket.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col">
                        <p className="font-semibold text-slate-900 line-clamp-1">{ticket.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 truncate">{ticket.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit uppercase"><Globe className="w-2.5 h-2.5" /> {ticket.zone}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit ml-2 uppercase tracking-tight"><GitBranch className="w-2.5 h-2.5" /> {ticket.branch}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${statusColors[ticket.status]} rounded-full border px-2.5 py-0.5 shadow-sm text-[10px] capitalize inline-flex items-center gap-1.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open' ? 'bg-indigo-500 animate-pulse' : ticket.status === 'in-progress' ? 'bg-violet-500' : ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${priorityColors[ticket.priority]} rounded-lg border px-2.5 py-0.5 shadow-sm text-[10px] capitalize`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                          {ticket.assignedTo.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{ticket.assignedTo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100/50 px-2 py-1 rounded border border-slate-200/50">{ticket.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 italic px-2 py-1 bg-slate-50/50 rounded border border-slate-200/30">{ticket.subCategory || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">{format(new Date(ticket.updatedAt), 'dd/MM/yyyy')}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(ticket.updatedAt), 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onViewTicket(ticket.id, true)}><Edit2 className="w-3.5 h-3.5 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onTrackTicket(ticket.id)}><MapPin className="w-3.5 h-3.5 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 hover:text-rose-600" onClick={(e) => handleDeleteTicket(ticket.id, e)}><Trash2 className="w-3.5 h-3.5 text-slate-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}

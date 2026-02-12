import { useState, useMemo } from 'react';
import { User as UserType, Ticket } from '@/app/types';
import { Search, Filter, Clock, User, Tag, ChevronDown, List, Table, MapPin, ArrowUpDown, ChevronUp, Edit2, Globe, GitBranch, AlertTriangle } from 'lucide-react';
import { Button } from '../common/ui/button';
import { Card } from '../common/ui/card';
import { motion } from 'motion/react';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
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
import { useTickets } from '@/app/hooks/useTickets';
import { format, formatDistanceToNow } from 'date-fns';
import { mockCategories } from '@/app/data/mockData';

interface MyOverdueTicketsProps {
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  onTrackTicket: (ticketId: string) => void;
  currentUser: UserType;
}

type SortField = keyof Ticket;
type SortDirection = 'asc' | 'desc';

export function MyOverdueTickets({ onViewTicket, onTrackTicket, currentUser }: MyOverdueTicketsProps) {
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [sortField, setSortField] = useState<SortField>('slaDueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const overdueTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (ticket.status === 'closed' || ticket.status === 'resolved' || !ticket.slaDueDate) return false;
      const isOverdue = new Date(ticket.slaDueDate) < new Date();
      if (!isOverdue) return false;

      // Accessibility check
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'customer') return ticket.createdBy === currentUser.name || (ticket as any).customerEmail === currentUser.email;
      return ticket.zone === currentUser.zone || ticket.assignedTo === currentUser.name;
    });
  }, [tickets, currentUser]);

  const filteredTickets = useMemo(() => {
    let result = overdueTickets.filter((ticket) => {
      const matchesSearch = 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      const matchesZone = zoneFilter === 'all' || ticket.zone === zoneFilter;

      return matchesSearch && matchesPriority && matchesCategory && matchesZone;
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
  }, [overdueTickets, searchQuery, priorityFilter, categoryFilter, zoneFilter, sortField, sortDirection]);

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
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-red-600" /> : <ChevronDown className="w-3.5 h-3.5 text-red-600" />;
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
        {filteredTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <p className="font-bold text-lg">No Overdue Tickets Found</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket, index) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="p-5 border-slate-200 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                        <span className="font-mono text-slate-500">#{ticket.id}</span>
                        <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>{ticket.priority}</Badge>
                        <Badge className="bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1 font-bold">
                          <Clock className="w-3 h-3" /> Overdue
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {ticket.zone}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{ticket.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-rose-600 font-bold"><AlertTriangle className="w-3 h-3" /> Due: {ticket.slaDueDate ? format(new Date(ticket.slaDueDate), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.assignedTo}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onViewTicket(ticket.id, true)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onTrackTicket(ticket.id)}><MapPin className="w-4 h-4" /></Button>
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
                  <TableHead onClick={() => handleSort('slaDueDate')} className="cursor-pointer py-4 group">
                    <div className="flex items-center gap-1.5 font-bold text-red-500 uppercase text-[11px] tracking-wider">
                      Breach Date {getSortIcon('slaDueDate')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right py-4 pr-6 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket, index) => (
                  <TableRow key={ticket.id} className="group hover:bg-red-50/40 transition-all duration-200" onClick={() => onViewTicket(ticket.id)}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 rounded-full bg-rose-500" />
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
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit uppercase"><Globe className="w-2.5 h-2.5" /> {ticket.zone}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${priorityColors[ticket.priority as keyof typeof priorityColors]} rounded-lg border px-2.5 py-0.5 shadow-sm text-[10px] capitalize`}>
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
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-600">{ticket.slaDueDate ? format(new Date(ticket.slaDueDate), 'dd/MM/yyyy') : 'N/A'}</span>
                        <span className="text-[10px] text-rose-400">{ticket.slaDueDate ? format(new Date(ticket.slaDueDate), 'HH:mm') : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onViewTicket(ticket.id, true)}><Edit2 className="w-3.5 h-3.5 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" onClick={() => onTrackTicket(ticket.id)}><MapPin className="w-3.5 h-3.5 text-slate-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </Card>
        )}
      </div>
    </div>
  );
}

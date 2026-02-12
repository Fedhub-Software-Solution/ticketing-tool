import { useState, useMemo } from 'react';
import { Filter, Building2, UserCircle, AlertCircle, Search, Edit2, Plus, Globe, GitBranch } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { motion } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { User as UserType, Ticket, ViewType } from '@/app/types';
import { useTickets } from '@/app/hooks/useTickets';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface BoardProps {
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  onTrackTicket: (ticketId: string) => void;
  onNavigate: (view: ViewType) => void;
  currentUser: UserType;
}

const ItemTypes = {
  TICKET: 'ticket',
};

interface DraggableTicketProps {
  ticket: Ticket;
  index: number;
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  currentUser: UserType;
  priorityColors: Record<string, string>;
}

function DraggableTicket({ ticket, index, onViewTicket, currentUser, priorityColors }: DraggableTicketProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TICKET,
    item: { id: ticket.id, status: ticket.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [ticket.id, ticket.status]);

  return (
    <motion.div
      ref={(node) => { drag(node); }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
    >
      <Card
        className="p-4 border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 bg-white group"
      >
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs font-mono font-medium text-slate-500">{ticket.id}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewTicket(ticket.id, true);
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-opacity"
              title="Edit Ticket"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            {ticket.escalationLevel && ticket.escalationLevel > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs">
                <AlertCircle className="w-3 h-3" />
                L{ticket.escalationLevel}
              </Badge>
            )}
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority}
            </Badge>
          </div>
        </div>

        <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm">
          {ticket.title}
        </h4>

        <div className="space-y-2">
          {ticket.assignedTo === currentUser.name && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 text-xs">
              <UserCircle className="w-3 h-3" />
              Assigned to me
            </Badge>
          )}
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              <Globe className="w-3 h-3" />
              <span>{ticket.zone}</span>
              <span className="mx-1">•</span>
              <GitBranch className="w-3 h-3" />
              <span>{ticket.branch}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <UserCircle className="w-3 h-3" />
              <span className="truncate font-medium">{ticket.assignedTo}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  color: string;
  tickets: Ticket[];
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  currentUser: UserType;
  priorityColors: Record<string, string>;
  onMoveTicket: (ticketId: string, newStatus: string) => void;
}

function BoardColumn({ id, title, color, tickets, onViewTicket, currentUser, priorityColors, onMoveTicket }: ColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TICKET,
    drop: (item: { id: string, status: string }) => {
      if (item.status !== id) {
        onMoveTicket(item.id, id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [id, onMoveTicket]);

  return (
    <div 
      ref={(node) => { drop(node); }}
      className={`flex-shrink-0 w-80 flex flex-col transition-colors duration-200 rounded-lg ${isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <div className={`bg-gradient-to-r ${color} text-white px-4 py-3 rounded-t-lg shadow-md`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge className="bg-white/20 text-white border-0">
            {tickets.length}
          </Badge>
        </div>
      </div>

      <div className={`flex-1 rounded-b-lg p-3 overflow-y-auto space-y-3 min-h-[300px] transition-colors duration-200 ${isOver ? 'bg-blue-50/50' : 'bg-slate-100'}`}>
        {tickets.map((ticket, index) => (
          <DraggableTicket 
            key={ticket.id} 
            ticket={ticket} 
            index={index} 
            onViewTicket={onViewTicket} 
            currentUser={currentUser} 
            priorityColors={priorityColors}
          />
        ))}

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm italic">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function Board({ onViewTicket, onTrackTicket, onNavigate, currentUser }: BoardProps) {
  const { tickets, updateTicket } = useTickets();
  const { data: users = [] } = useGetUsersQuery();
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const accessibleTickets = useMemo(() => {
    if (currentUser.role === 'admin') return tickets;
    if (currentUser.role === 'customer') return tickets.filter(ticket => ticket.createdBy === currentUser.name);
    if (currentUser.zone) return tickets.filter(ticket => ticket.zone === currentUser.zone);
    return tickets;
  }, [tickets, currentUser]);

  const filteredTickets = accessibleTickets.filter((ticket) => {
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesZone = zoneFilter === 'all' || ticket.zone === zoneFilter;
    const matchesAssignee = assigneeFilter === 'all' || ticket.assignedTo === assigneeFilter;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesZone && matchesAssignee && matchesSearch;
  });

  const handleMoveTicket = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket(ticketId, { status: newStatus as any });
    } catch {
      toast.error('Failed to update ticket status');
    }
  };

  const columns = [
    { id: 'open', title: 'Open', color: 'from-slate-600 to-slate-700' },
    { id: 'in-progress', title: 'In Progress', color: 'from-purple-600 to-violet-600' },
    { id: 'resolved', title: 'Resolved', color: 'from-green-600 to-emerald-600' },
    { id: 'closed', title: 'Closed', color: 'from-gray-600 to-slate-600' },
  ];

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const uniqueZones = Array.from(new Set((users as { zone?: string }[]).map(u => u.zone).filter(Boolean)));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            {currentUser.zone && currentUser.role !== 'admin' && (
              <Badge 
                variant="outline"
                className="gap-1.5 border-blue-200 text-blue-600 bg-blue-50"
              >
                <Globe className="w-3 h-3" />
                {currentUser.zone} Zone
              </Badge>
            )}

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[160px]">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {uniqueZones.map(zone => (
                  <SelectItem key={zone} value={zone!}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px]">
                <UserCircle className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user: { id: string; name: string }) => (
                  <SelectItem key={user.name} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => onNavigate('create-ticket')}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tickets={filteredTickets.filter(t => t.status === column.id)}
                onViewTicket={onViewTicket}
                currentUser={currentUser}
                priorityColors={priorityColors}
                onMoveTicket={handleMoveTicket}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

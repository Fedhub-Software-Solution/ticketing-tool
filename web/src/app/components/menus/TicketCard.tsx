import { Card } from '../common/ui/card';
import { Badge } from '../common/ui/badge';
import { Button } from '../common/ui/button';
import { Building2, UserCircle, MapPin, Clock, Edit2, Globe, GitBranch } from 'lucide-react';
import { Ticket } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  onTrackTicket: (ticketId: string) => void;
}

export function TicketCard({ ticket, onViewTicket, onTrackTicket }: TicketCardProps) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusColors = {
    open: 'bg-green-100 text-green-700 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    resolved: 'bg-purple-100 text-purple-700 border-purple-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <Card
      className="p-5 border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono font-medium text-slate-500">{ticket.id}</span>
        <Badge className={priorityColors[ticket.priority]}>
          {ticket.priority}
        </Badge>
      </div>

      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{ticket.title}</h3>
      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{ticket.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={statusColors[ticket.status]}>
          {ticket.status.replace('-', ' ')}
        </Badge>
        <Badge variant="outline" className="gap-1 bg-blue-50/50 text-blue-600 border-blue-100">
          <Globe className="w-3 h-3" />
          {ticket.zone}
        </Badge>
        {ticket.branch && (
          <Badge variant="outline" className="gap-1 bg-indigo-50/50 text-indigo-600 border-indigo-100">
            <GitBranch className="w-3 h-3" />
            {ticket.branch}
          </Badge>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold">
              {ticket.assignedTo.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="truncate">
              <span className="text-slate-700 font-medium">{ticket.assignedTo}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewTicket(ticket.id, true)}
              className="hover:bg-blue-50 hover:text-blue-600 h-7 px-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTrackTicket(ticket.id)}
              className="hover:bg-blue-50 hover:text-blue-600 h-7 px-2"
            >
              <MapPin className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock className="w-2.5 h-2.5" />
          <span>Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Card>
  );
}

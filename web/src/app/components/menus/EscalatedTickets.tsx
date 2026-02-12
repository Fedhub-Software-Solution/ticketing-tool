import { useState } from 'react';
import { AlertTriangle, Clock, User, Tag, ArrowUp, Building2, Edit2, Globe, GitBranch } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { Button } from '../common/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { User as UserType } from '@/app/types';
import { useTickets } from '@/app/hooks/useTickets';

interface EscalatedTicketsProps {
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  currentUser: UserType;
}

export function EscalatedTickets({ onViewTicket, currentUser }: EscalatedTicketsProps) {
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');

  const getEscalatedTickets = () => {
    let escalated = tickets.filter(ticket => ticket.escalationLevel && ticket.escalationLevel > 0);
    if (currentUser.role === 'manager') escalated = escalated.filter(ticket => ticket.zone === currentUser.zone);
    else if (currentUser.role === 'agent') escalated = escalated.filter(ticket => ticket.assignedTo === currentUser.name);
    return escalated;
  };

  const filteredTickets = getEscalatedTickets().filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColors = { low: 'bg-blue-100 text-blue-700 border-blue-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', high: 'bg-orange-100 text-orange-700 border-orange-200', urgent: 'bg-red-100 text-red-700 border-red-200' };
  const statusColors = { open: 'bg-blue-100 text-blue-700 border-blue-200', 'in-progress': 'bg-purple-100 text-purple-700 border-purple-200', resolved: 'bg-green-100 text-green-700 border-green-200', closed: 'bg-slate-100 text-slate-700 border-slate-200' };

  const ticketsByLevel = {
    critical: filteredTickets.filter(t => (t.escalationLevel || 0) >= 3),
    level2: filteredTickets.filter(t => t.escalationLevel === 2),
    level1: filteredTickets.filter(t => t.escalationLevel === 1),
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <div><h1 className="text-2xl font-bold text-slate-900">Escalated Breaches</h1><p className="text-sm text-slate-600">{filteredTickets.length} active escalations detected</p></div>
        </div>
        <div className="w-64 relative"><Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><Input placeholder="Search escalations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {filteredTickets.length === 0 ? <div className="text-center py-20 opacity-50"><AlertTriangle className="w-12 h-12 mx-auto mb-4" /><p className="font-bold">No Escalated Tickets</p></div> : (
          <div className="space-y-8">
            {['critical', 'level2', 'level1'].map(lvl => {
              const list = (ticketsByLevel as any)[lvl];
              if (list.length === 0) return null;
              return (
                <div key={lvl}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lvl === 'critical' ? 'bg-red-600' : lvl === 'level2' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    {lvl === 'critical' ? 'Critical - Level 3+' : lvl === 'level2' ? 'High - Level 2' : 'Medium - Level 1'}
                  </h3>
                  <div className="space-y-3">{list.map((t: any) => (
                    <Card key={t.id} className="p-5 border-slate-200 hover:shadow-md transition-all bg-white group">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-slate-400">{t.id}</span>
                            <Badge className={priorityColors[t.priority as keyof typeof priorityColors]}>{t.priority}</Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1"><Globe className="w-3 h-3" /> {t.zone}</Badge>
                            {t.branch && <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1"><GitBranch className="w-3 h-3" /> {t.branch}</Badge>}
                          </div>
                          <h4 className="font-bold text-slate-900 mb-1">{t.title}</h4>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.assignedTo}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Escalated {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onViewTicket(t.id, true)}><Edit2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600" /></Button>
                      </div>
                    </Card>
                  ))}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

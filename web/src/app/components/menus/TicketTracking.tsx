import { useState } from 'react';
import { Search, MapPin, Clock, User, Tag, CheckCircle2, XCircle, AlertCircle, ArrowRight, Calendar, Building2, Filter, Download, RefreshCw, Globe, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '@/app/types';
import { useTickets } from '@/app/hooks/useTickets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { Separator } from '../common/ui/separator';
import { toast } from 'sonner';

interface TicketTrackingProps {
  onViewTicket: (ticketId: string) => void;
  currentUser: UserType;
  initialTicketId?: string | null;
  onBack?: () => void;
}

export function TicketTracking({ onViewTicket, currentUser, initialTicketId, onBack }: TicketTrackingProps) {
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(initialTicketId || null);
  const [showFullView] = useState(!initialTicketId);

  const accessibleTickets = tickets.filter(ticket => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'customer') return ticket.createdBy === currentUser.name;
    return ticket.zone === currentUser.zone || ticket.assignedTo === currentUser.name;
  });

  const filteredTickets = accessibleTickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTicketData = selectedTicket ? accessibleTickets.find(t => t.id === selectedTicket) : null;

  const priorityColors = { urgent: 'bg-red-100 text-red-700 border-red-200', high: 'bg-orange-100 text-orange-700 border-orange-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-blue-100 text-blue-700 border-blue-200' };
  const statusColors = { open: 'bg-slate-100 text-slate-700 border-slate-200', 'in-progress': 'bg-blue-100 text-blue-700 border-blue-200', resolved: 'bg-green-100 text-green-700 border-green-200', closed: 'bg-gray-100 text-gray-700 border-gray-200' };
  const statusIcons = { open: AlertCircle, 'in-progress': RefreshCw, resolved: CheckCircle2, closed: XCircle };

  const generateTimeline = (ticket: any) => {
    const events = [{ id: 1, type: 'created', title: 'Ticket Created', description: `Ticket created by ${ticket.createdBy}`, timestamp: ticket.createdAt, icon: AlertCircle, color: 'bg-blue-500' }];
    events.push({ id: 2, type: 'assigned', title: 'Ticket Assigned', description: `Assigned to ${ticket.assignedTo}`, timestamp: ticket.createdAt, icon: User, color: 'bg-purple-500' });
    if (ticket.status !== 'open') events.push({ id: 3, type: 'status-change', title: 'Work Started', description: 'Agent started investigating', timestamp: ticket.updatedAt, icon: RefreshCw, color: 'bg-blue-500' });
    if (ticket.status === 'resolved' || ticket.status === 'closed') events.push({ id: 4, type: 'status-change', title: 'Issue Resolved', description: 'Technical resolution applied', timestamp: ticket.updatedAt, icon: CheckCircle2, color: 'bg-green-500' });
    return events;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-auto">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Live Ticket Tracking</h1></div>
        <div className="flex gap-2">
          <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" /></div>
          <Button variant="outline" size="sm" onClick={() => toast.success('Tracking data refreshed')}><RefreshCw className="w-4 h-4 mr-2" />Sync</Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className={`grid ${showFullView ? 'grid-cols-12' : 'grid-cols-1'} gap-6 h-full`}>
          {showFullView && (
            <div className="col-span-4 h-full overflow-y-auto pr-2 scrollbar-thin">
              <div className="space-y-3">{filteredTickets.map(t => (
                <button key={t.id} onClick={() => setSelectedTicket(t.id)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTicket === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                  <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-mono font-bold opacity-70">{t.id}</span><Badge className={priorityColors[t.priority as keyof typeof priorityColors]}>{t.priority}</Badge></div>
                  <h3 className="font-bold text-sm mb-2 line-clamp-1">{t.title}</h3>
                  <div className="flex items-center gap-2 opacity-80 text-[10px]"><Clock className="w-3 h-3" /> <span>{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span></div>
                </button>
              ))}</div>
            </div>
          )}

          <div className={showFullView ? 'col-span-8' : 'col-span-1'}>
            <AnimatePresence mode="wait">
              {selectedTicketData ? (
                <motion.div key={selectedTicketData.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2"><span className="text-xs font-mono font-bold text-slate-400">{selectedTicketData.id}</span><Badge className={statusColors[selectedTicketData.status]}>{selectedTicketData.status}</Badge></div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedTicketData.title}</h2>
                      </div>
                      <div className="flex flex-col items-end gap-1"><span className="text-[10px] font-bold text-slate-400 uppercase">Operational Zone</span><div className="flex items-center gap-1.5 text-blue-600 font-bold"><Globe className="w-4 h-4" /> {selectedTicketData.zone}</div></div>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assignee</p><p className="text-sm font-bold text-slate-700">{selectedTicketData.assignedTo}</p></div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Branch</p><p className="text-sm font-bold text-slate-700">{selectedTicketData.branch}</p></div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Category</p><p className="text-sm font-bold text-slate-700">{selectedTicketData.category}</p></div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Resolution Timeline</h3>
                        <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 ml-2">
                          {generateTimeline(selectedTicketData).map(event => (
                            <div key={event.id} className="relative pb-2">
                              <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${event.color}`} />
                              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center mb-1"><h4 className="text-sm font-bold text-slate-800">{event.title}</h4><span className="text-[10px] text-slate-400">{format(new Date(event.timestamp), 'HH:mm')}</span></div>
                                <p className="text-xs text-slate-500">{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed"><div className="text-center opacity-40"><MapPin className="w-12 h-12 mx-auto mb-4" /><p className="font-bold">Select a ticket to track progress</p></div></Card>}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

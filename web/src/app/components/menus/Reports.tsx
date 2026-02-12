import { useState, useMemo } from 'react';
import { FileText, Download, Filter, Calendar, TrendingUp, TrendingDown, Users, Clock, AlertTriangle, CheckCircle2, XCircle, BarChart2, PieChart, Activity, Timer, Target, Zap, Globe } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { motion } from 'motion/react';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { format, subDays, isAfter } from 'date-fns';
import { User as UserType } from '@/app/types';
import { toast } from 'sonner';
import { useTickets } from '@/app/hooks/useTickets';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface ReportsProps {
  currentUser: UserType;
}

type ReportType = 'summary' | 'performance' | 'sla' | 'regional';
type DateRange = 'week' | 'month' | 'year' | 'all';

export function Reports({ currentUser }: ReportsProps) {
  const { tickets } = useTickets();
  const { data: users = [] } = useGetUsersQuery();
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const filteredTickets = useMemo(() => {
    let startDate: Date;
    const now = new Date();
    switch (dateRange) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case 'year': startDate = subDays(now, 365); break;
      default: return tickets;
    }
    return tickets.filter(t => isAfter(new Date(t.createdAt), startDate));
  }, [tickets, dateRange]);

  const stats = {
    total: filteredTickets.length,
    resolved: filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    open: filteredTickets.filter(t => t.status === 'open').length,
    escalated: filteredTickets.filter(t => (t.escalationLevel || 0) > 0).length,
  };

  const zones = Array.from(new Set((users as { zone?: string }[]).map(u => u.zone).filter(Boolean)));
  const zoneStats = zones.map(zone => {
    const zoneTickets = filteredTickets.filter(t => t.zone === zone);
    return { name: zone, tickets: zoneTickets.length, resolved: zoneTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length };
  });

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger className="w-[200px] h-10 font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Operational Summary</SelectItem>
              <SelectItem value="regional">Regional Breakdown</SelectItem>
              <SelectItem value="sla">SLA Compliance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[140px] h-10 border-slate-200"><Calendar className="w-4 h-4 mr-2 text-slate-400" /><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="week">Last 7 Days</SelectItem><SelectItem value="month">Last 30 Days</SelectItem><SelectItem value="year">Last Year</SelectItem></SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => toast.success('Report exported')} className="h-10 gap-2 font-bold"><Download className="w-4 h-4" /> Export Analytics</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 border-blue-100 bg-white"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total volume</p><p className="text-3xl font-bold text-slate-900">{stats.total}</p></Card>
          <Card className="p-6 border-green-100 bg-white"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</p><p className="text-3xl font-bold text-slate-900">{stats.resolved}</p></Card>
          <Card className="p-6 border-amber-100 bg-white"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Open</p><p className="text-3xl font-bold text-slate-900">{stats.open}</p></Card>
          <Card className="p-6 border-red-100 bg-white"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Escalations</p><p className="text-3xl font-bold text-slate-900">{stats.escalated}</p></Card>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <Card className="p-6"><h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase"><Globe className="w-4 h-4 text-blue-500" /> Regional Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Tickets" />
                <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-6"><h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase"><Activity className="w-4 h-4 text-purple-500" /> Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie data={[{name: 'Resolved', value: stats.resolved}, {name: 'Open', value: stats.open}]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  <Cell fill="#10b981" /><Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}

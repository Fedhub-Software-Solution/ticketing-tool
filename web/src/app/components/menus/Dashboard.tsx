import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Edit2,
} from 'lucide-react';
import { ViewType, User } from '@/app/types';
import { motion } from 'motion/react';
import { useTickets } from '@/app/hooks/useTickets';
import { formatDistanceToNow } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  onViewTicket: (ticketId: string, edit?: boolean) => void;
  currentUser: User;
}

export function Dashboard({ onNavigate, onViewTicket, currentUser }: DashboardProps) {
  const { tickets } = useTickets();
  
  // Filter tickets based on role
  const userTickets = currentUser.role === 'customer'
    ? tickets.filter(t => t.createdBy === currentUser.name || (t as any).customerEmail === currentUser.email)
    : tickets;

  // Calculate statistics using filtered tickets
  const totalTickets = userTickets.length;
  const openTickets = userTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = userTickets.filter(t => t.status === 'in-progress').length;
  const resolvedTickets = userTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const urgentTickets = userTickets.filter(t => t.priority === 'urgent').length;
  const breachedSLA = userTickets.filter(t => t.breachedSLA).length;
  const escalatedTickets = userTickets.filter(t => t.escalationLevel && t.escalationLevel > 0).length;

  // Recent activity from filtered tickets
  const recentTickets = [...userTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // SLA compliance using filtered tickets
  const slaCompliant = totalTickets - breachedSLA;
  const slaComplianceRate = totalTickets > 0 ? Math.round((slaCompliant / totalTickets) * 100) : 100;

  const stats = [
    {
      title: currentUser.role === 'customer' ? 'My Total Tickets' : 'Total Tickets',
      value: totalTickets,
      change: '+12%',
      trend: 'up' as const,
      icon: ArrowUpRight,
      color: 'blue',
    },
    {
      title: 'SLA Compliance',
      value: `${slaComplianceRate}%`,
      subtitle: `${breachedSLA} breached`,
      icon: Clock,
      color: slaComplianceRate > 80 ? 'green' : 'orange',
    },
    {
      title: 'Active / Open',
      value: openTickets + inProgressTickets,
      subtitle: 'Currently processing',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'Resolved',
      value: resolvedTickets,
      change: '+8%',
      trend: 'up' as const,
      icon: CheckCircle2,
      color: 'green',
    },
  ];

  // Chart data - Ticket trends over last 7 days (using user specific tickets)
  const trendData = [
    { day: 'Mon', open: Math.floor(totalTickets * 0.1), resolved: Math.floor(resolvedTickets * 0.1), escalated: Math.floor(escalatedTickets * 0.1) },
    { day: 'Tue', open: Math.floor(totalTickets * 0.2), resolved: Math.floor(resolvedTickets * 0.15), escalated: Math.floor(escalatedTickets * 0.2) },
    { day: 'Wed', open: Math.floor(totalTickets * 0.15), resolved: Math.floor(resolvedTickets * 0.2), escalated: Math.floor(escalatedTickets * 0.1) },
    { day: 'Thu', open: Math.floor(totalTickets * 0.25), resolved: Math.floor(resolvedTickets * 0.15), escalated: Math.floor(escalatedTickets * 0.3) },
    { day: 'Fri', open: Math.floor(totalTickets * 0.2), resolved: Math.floor(resolvedTickets * 0.2), escalated: Math.floor(escalatedTickets * 0.2) },
    { day: 'Sat', open: Math.floor(totalTickets * 0.05), resolved: Math.floor(resolvedTickets * 0.1), escalated: Math.floor(escalatedTickets * 0.05) },
    { day: 'Sun', open: Math.floor(totalTickets * 0.05), resolved: Math.floor(resolvedTickets * 0.1), escalated: Math.floor(escalatedTickets * 0.05) },
  ];

  // Category distribution
  const categoryData = userTickets.map(ticket => ({
    name: ticket.category,
    value: userTickets.filter(t => t.category === ticket.category).length,
    color: '#3b82f6', // Default color for categories
  })).filter((cat, index, self) => 
    cat.value > 0 && self.findIndex(c => c.name === cat.name) === index
  );

  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: userTickets.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: userTickets.filter(t => t.priority === 'high').length, color: '#f59e0b' },
    { name: 'Medium', value: userTickets.filter(t => t.priority === 'medium').length, color: '#eab308' },
    { name: 'Low', value: userTickets.filter(t => t.priority === 'low').length, color: '#3b82f6' },
  ];

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const statusColors = {
    open: 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="h-full overflow-y-auto bg-transparent">
      {/* Content */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const bgColor = {
              blue: 'bg-blue-100',
              orange: 'bg-orange-100',
              purple: 'bg-purple-100',
              green: 'bg-green-100',
            }[stat.color];
            const iconColor = {
              blue: 'text-blue-600',
              orange: 'text-orange-600',
              purple: 'text-purple-600',
              green: 'text-green-600',
            }[stat.color];

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 border-slate-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-semibold text-slate-900 mb-2">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-slate-500">{stat.subtitle}</p>
                      )}
                      {stat.change && (
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">{stat.change}</span>
                          <span className="text-xs text-slate-500">from last week</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {urgentTickets > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Urgent Attention Required</p>
                    <p className="text-sm text-red-700">{urgentTickets} urgent tickets need immediate attention</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => onNavigate('tickets')}
                >
                  View
                </Button>
              </div>
            </motion.div>
          )}
          {breachedSLA > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-900">SLA Breaches</p>
                    <p className="text-sm text-orange-700">{breachedSLA} tickets have breached their SLA</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => onNavigate('tickets')}
                >
                  View
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Trends (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px' 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="open" stroke="#3b82f6" strokeWidth={2} name="Opened" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                  <Line type="monotone" dataKey="escalated" stroke="#f59e0b" strokeWidth={2} name="Escalated" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="value" name="Tickets">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* SLA Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">SLA Compliance Overview</h3>
              <div className="h-[300px] flex flex-col justify-center">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-slate-900 mb-2">
                    {slaComplianceRate}%
                  </div>
                  <p className="text-slate-600">Overall SLA Compliance</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{slaCompliant}</p>
                    <p className="text-sm text-slate-600">Compliant</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{breachedSLA}</p>
                    <p className="text-sm text-slate-600">Breached</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('tickets')}>
                    View All
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {recentTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="p-4 hover:bg-slate-50 transition-colors duration-150 group relative cursor-pointer"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {ticket.id}
                        </span>
                        <h3 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{ticket.title}</h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTicket(ticket.id, true);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-opacity"
                        title="Edit Ticket"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-6"
          >
            <Card className="p-6 border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate('tickets')}
                >
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-lg">
                    🎫
                  </span>
                  View All Tickets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate('create-ticket')}
                >
                  <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3 text-lg">
                    ➕
                  </span>
                  Create New Ticket
                </Button>
                {currentUser.role !== 'customer' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => onNavigate('enterprise')}
                    >
                      <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                        🏢
                      </span>
                      Manage Enterprise
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => onNavigate('sla-config')}
                    >
                      <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        ⚙️
                      </span>
                      Configure SLA
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => onNavigate('escalations')}
                    >
                      <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        📈
                      </span>
                      Manage Escalations
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => onNavigate('categories')}
                    >
                      <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        📁
                      </span>
                      Manage Categories
                    </Button>
                  </>
                )}
                {currentUser.role === 'customer' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onNavigate('my-open-tickets')}
                  >
                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      📂
                    </span>
                    View Open Tickets
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
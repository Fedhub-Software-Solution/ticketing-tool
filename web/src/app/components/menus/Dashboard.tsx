import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  XCircle,
  Edit2,
} from 'lucide-react';
import { ViewType, User } from '@/app/types';
import { motion } from 'motion/react';
import { useGetTicketsQuery } from '@/app/store/apis/ticketsApi';
import { useGetDashboardQuery } from '@/app/store/apis/reportsApi';
import {
  LineChart,
  Line,
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

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#f59e0b',
  Medium: '#eab308',
  Low: '#3b82f6',
};

export function Dashboard({ onNavigate, onViewTicket, currentUser }: DashboardProps) {
  const dashboardParams =
    currentUser.role === 'customer' ? { forUser: currentUser.id } : undefined;
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboardQuery(dashboardParams);
  const { data: tickets = [] } = useGetTicketsQuery({ limit: 10 });

  const userTickets =
    currentUser.role === 'customer'
      ? (tickets as { createdBy?: string; id: string; title: string; updatedAt: string }[]).filter(
          (t) => t.createdBy === currentUser.name
        )
      : (tickets as { id: string; title: string; updatedAt: string }[]);
  const recentTickets = [...userTickets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  const summary = dashboard?.summary ?? {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    breachedSLA: 0,
    slaComplianceRate: 100,
  };
  const change = dashboard?.change ?? { totalChangePct: 0, resolvedChangePct: 0 };
  const trend = dashboard?.trend ?? [];
  const priority = dashboard?.priority ?? { urgent: 0, high: 0, medium: 0, low: 0 };
  const categoryFromApi = dashboard?.category ?? [];

  const stats = [
    {
      title: currentUser.role === 'customer' ? 'My Total Tickets' : 'Total Tickets',
      value: summary.total,
      change: change.totalChangePct !== 0 ? `${change.totalChangePct > 0 ? '+' : ''}${change.totalChangePct}%` : undefined,
      trend: (change.totalChangePct >= 0 ? 'up' : 'down') as const,
      icon: ArrowUpRight,
      color: 'blue' as const,
    },
    {
      title: 'SLA Compliance',
      value: `${summary.slaComplianceRate}%`,
      subtitle: `${summary.breachedSLA} breached`,
      icon: Clock,
      color: (summary.slaComplianceRate > 80 ? 'green' : 'orange') as const,
    },
    {
      title: 'Active / Open',
      value: summary.open + summary.inProgress,
      subtitle: 'Currently processing',
      icon: TrendingUp,
      color: 'purple' as const,
    },
    {
      title: 'Resolved',
      value: summary.resolved,
      change: change.resolvedChangePct !== 0 ? `${change.resolvedChangePct > 0 ? '+' : ''}${change.resolvedChangePct}%` : undefined,
      trend: (change.resolvedChangePct >= 0 ? 'up' : 'down') as const,
      icon: CheckCircle2,
      color: 'green' as const,
    },
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trendData =
    trend.length > 0
      ? trend.map((d) => ({
          day: d.day,
          open: d.opened,
          resolved: d.resolved,
        }))
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - (6 - i));
          return {
            day: dayLabels[d.getUTCDay()],
            open: 0,
            resolved: 0,
          };
        });

  const categoryData = categoryFromApi.map((c) => ({
    name: c.name,
    value: c.value,
    color: '#3b82f6',
  }));

  const priorityData = [
    { name: 'Urgent', value: priority.urgent, color: PRIORITY_COLORS.Urgent },
    { name: 'High', value: priority.high, color: PRIORITY_COLORS.High },
    { name: 'Medium', value: priority.medium, color: PRIORITY_COLORS.Medium },
    { name: 'Low', value: priority.low, color: PRIORITY_COLORS.Low },
  ].filter((p) => p.value > 0);

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

  if (dashboardLoading) {
    return (
      <div className="h-full overflow-y-auto bg-transparent flex items-center justify-center p-8">
        <p className="text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

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
                      {stat.change != null && stat.change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change}
                          </span>
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
          {summary.urgent > 0 && (
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
                    <p className="text-sm text-red-700">{summary.urgent} urgent tickets need immediate attention</p>
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
          {summary.breachedSLA > 0 && (
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
                    <p className="text-sm text-orange-700">{summary.breachedSLA} tickets have breached their SLA</p>
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
                  <YAxis
                    stroke="#64748b"
                    allowDecimals={false}
                    domain={[0, (max: number) => Math.max(1, max)]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="open" stroke="#3b82f6" strokeWidth={2} name="Opened" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
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
                {priorityData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Tickets']} />
                  </PieChart>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                    No priority data
                  </div>
                )}
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
                {categoryData.length > 0 ? (
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" name="Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                    No category data
                  </div>
                )}
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
                    {summary.slaComplianceRate}%
                  </div>
                  <p className="text-slate-600">Overall SLA Compliance</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{summary.total - summary.breachedSLA}</p>
                    <p className="text-sm text-slate-600">Compliant</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{summary.breachedSLA}</p>
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
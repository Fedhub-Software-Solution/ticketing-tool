import { LayoutDashboard, Ticket, Settings, BarChart3, Users, Tag, Building, LogOut, ChevronDown, AlertTriangle, MapPin, FileText, CheckCircle2, XCircle, Clock, Columns3, ChevronLeft, ChevronRight, UserCog, Globe } from 'lucide-react';
import { ViewType, User } from '@/app/types';
import { motion } from 'motion/react';
import { Badge } from './common/ui/badge';
import { useState, useMemo } from 'react';
import { useTickets } from '@/app/hooks/useTickets';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  currentUser: User;
  onLogout: () => void;
}

export function Sidebar({ currentView, onNavigate, currentUser, onLogout }: SidebarProps) {
  const { tickets } = useTickets();
  const { data: zones = [] } = useGetZonesQuery();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const zoneList = useMemo(() => zones as { id: string; name: string }[], [zones]);
  const userZoneName = useMemo(
    () => (currentUser.zone && zoneList.length ? zoneList.find((z) => z.id === currentUser.zone)?.name : null),
    [currentUser.zone, zoneList]
  );

  // API returns only tickets assigned to current user for non-admin; all for admin
  const accessibleTickets = tickets;

  // Escalated count: for non-admin, API already returns only assigned tickets
  const getEscalatedTicketsCount = () => {
    return tickets.filter(ticket => ticket.escalationLevel && ticket.escalationLevel > 0).length;
  };

  const escalatedCount = getEscalatedTicketsCount();

  // Open: status === 'open' (matches MyOpenTickets)
  const myOpenCount = useMemo(
    () => accessibleTickets.filter((t) => t.status === 'open').length,
    [accessibleTickets]
  );
  // Closed: closed or resolved (matches MyClosedTickets)
  const myClosedCount = useMemo(
    () => accessibleTickets.filter((t) => t.status === 'closed' || t.status === 'resolved').length,
    [accessibleTickets]
  );
  // Overdue: not closed/resolved, has SLA due date, past due (matches MyOverdueTickets)
  const myOverdueCount = useMemo(() => {
    const now = new Date();
    return accessibleTickets.filter((t) => {
      if (t.status === 'closed' || t.status === 'resolved' || !t.slaDueDate) return false;
      return new Date(t.slaDueDate) < now;
    }).length;
  }, [accessibleTickets]);

  // Menu visibility: admin always sees everything; others use permissions when available, else role list
  const hasPermission = (permission: string) => currentUser.permissions?.includes(permission);
  const canSee = (item: { requiredPermission?: string; roles: string[] }) => {
    if (currentUser.role === 'admin') return true;
    if (item.requiredPermission && currentUser.permissions) return hasPermission(item.requiredPermission);
    return item.roles.includes(currentUser.role);
  };

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Dashboard' },
      { id: 'tickets' as ViewType, icon: Ticket, label: 'Tickets', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Tickets' },
      { id: 'board' as ViewType, icon: Columns3, label: 'Board', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Board' },
      { id: 'reports' as ViewType, icon: FileText, label: 'Reports', roles: ['admin', 'manager', 'agent'], requiredPermission: 'Reports' },
    ];
    return baseItems.filter(canSee);
  };

  const getWorkplaceItems = () => {
    const items = [
      { id: 'my-open-tickets' as ViewType, icon: CheckCircle2, label: 'Open Tickets', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Open Tickets' },
      { id: 'my-closed-tickets' as ViewType, icon: XCircle, label: 'Closed Tickets', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Closed Tickets' },
      { id: 'my-overdue-tickets' as ViewType, icon: Clock, label: 'Overdue Tickets', roles: ['admin', 'manager', 'agent', 'customer'], requiredPermission: 'Overdue Tickets' },
    ];
    return items.filter(canSee);
  };

  const getSettingsItems = () => {
    const settingsItems = [
      { id: 'users' as ViewType, icon: UserCog, label: 'Access Management', roles: ['admin'], requiredPermission: 'Access Management' },
      { id: 'sla-config' as ViewType, icon: Settings, label: 'SLA Config', roles: ['admin', 'manager'], requiredPermission: 'SLA Config' },
      { id: 'escalations' as ViewType, icon: BarChart3, label: 'Escalations', roles: ['admin', 'manager'], requiredPermission: 'Escalations' },
      { id: 'categories' as ViewType, icon: Tag, label: 'Categories', roles: ['admin', 'manager'], requiredPermission: 'Categories' },
      { id: 'enterprise' as ViewType, icon: Globe, label: 'Enterprise Setup', roles: ['admin', 'manager'], requiredPermission: 'Enterprise Setup' },
    ];
    return settingsItems.filter(canSee);
  };

  const menuItems = getMenuItems();
  const workplaceItems = getWorkplaceItems();
  const settingsItems = getSettingsItems();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-slate-50/95 backdrop-blur-2xl border-r border-slate-200/50 flex flex-col shadow-[1px_0_20px_rgba(0,0,0,0.02)] z-30"
    >
      <div className={`p-5 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => onNavigate('create-ticket' as ViewType)}
          className={`
            flex items-center gap-3 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] 
            transition-all duration-300 active:scale-95 group relative overflow-hidden
            ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full px-5 py-3.5'}
          `}
          title="Create New Ticket"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center">
            <Ticket className="w-5 h-5 flex-shrink-0 transform group-hover:rotate-12 transition-transform duration-500" />
          </div>
          {!isCollapsed && <span className="font-extrabold text-sm tracking-wide">New Ticket</span>}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-9 overflow-y-auto no-scrollbar py-2">
        <div>
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
              Main Menu
            </p>
          )}
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full flex items-center relative group
                    ${isCollapsed ? 'justify-center py-3.5' : 'gap-3.5 px-4 py-3'} 
                    rounded-2xl transition-all duration-300
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.15)] scale-[1.02]' 
                      : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  {isActive && (
                    <motion.div layoutId="active-nav" className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
              Workplace
            </p>
          )}
          <div className="space-y-1.5">
            {workplaceItems.map((item) => {
              const count = item.id === 'my-open-tickets' ? myOpenCount : item.id === 'my-closed-tickets' ? myClosedCount : myOverdueCount;
              const activeColor = item.id === 'my-open-tickets' ? 'text-emerald-600' : item.id === 'my-closed-tickets' ? 'text-slate-600' : 'text-rose-600';
              const activeBg = item.id === 'my-open-tickets' ? 'bg-emerald-50' : item.id === 'my-closed-tickets' ? 'bg-slate-100' : 'bg-rose-50';
              return (
                <SidebarItem key={item.id} icon={item.icon} label={item.label} count={count} isActive={currentView === item.id} onClick={() => onNavigate(item.id)} isCollapsed={isCollapsed} activeColor={activeColor} activeBg={activeBg} />
              );
            })}
          </div>
        </div>

        {settingsItems.length > 0 && (
          <div>
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
                Configuration
              </p>
            )}
            <div className="space-y-1.5">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center relative group
                      ${isCollapsed ? 'justify-center py-3.5' : 'gap-3.5 px-4 py-3'} 
                      rounded-2xl transition-all duration-300
                      ${isActive ? 'bg-indigo-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.15)] scale-[1.02]' : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'}
                    `}
                    title={isCollapsed ? item.label : ''}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />}
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-5 border-t border-slate-100 bg-slate-50/30">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 text-slate-500 transition-all group active:scale-95"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /> : <><ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarItem({ icon: Icon, label, count, isActive, onClick, isCollapsed, activeColor, activeBg }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center relative group ${isCollapsed ? 'justify-center py-3.5' : 'justify-between px-4 py-3'} rounded-2xl transition-all duration-300 ${isActive ? `${activeBg} ${activeColor} shadow-sm border border-slate-100` : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'}`}
      title={isCollapsed ? label : ''}
    >
      <div className="flex items-center gap-3.5">
        {isActive && <div className={`absolute left-0 w-1.5 h-6 rounded-r-full ${activeColor.replace('text', 'bg')}`} />}
        <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? activeColor : 'text-slate-400 group-hover:text-slate-900'}`} />
        {!isCollapsed && <span className="text-sm font-bold tracking-tight">{label}</span>}
      </div>
      {!isCollapsed && (
        <Badge className={`${isActive ? `${activeColor} bg-white border border-slate-100` : 'bg-slate-100 text-slate-500'} border-0 min-w-[22px] h-5.5 px-2 flex items-center justify-center font-black text-[10px] rounded-lg transition-all duration-300 group-hover:scale-110`}>
          {count}
        </Badge>
      )}
    </button>
  );
}

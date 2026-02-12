import { Bell, Settings, HelpCircle, LogOut, User as UserIcon, Ticket, Clock, ChevronDown } from 'lucide-react';
import { Button } from './common/ui/button';
import { Badge } from './common/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './common/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './common/ui/popover';
import { User } from '@/app/types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (view: any) => void;
  currentView?: string;
}

// Mock notifications
const mockNotifications = [
  {
    id: '1',
    title: 'New ticket assigned',
    description: 'TKT-2043 has been assigned to you',
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    type: 'assignment' as const,
  },
  {
    id: '2',
    title: 'SLA breach warning',
    description: 'TKT-2019 is approaching SLA deadline',
    time: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    type: 'warning' as const,
  },
  {
    id: '3',
    title: 'Ticket escalated',
    description: 'TKT-2001 has been escalated to Level 2',
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    type: 'escalation' as const,
  },
  {
    id: '4',
    title: 'Comment added',
    description: 'New comment on TKT-2015',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    type: 'comment' as const,
  },
  {
    id: '5',
    title: 'Ticket resolved',
    description: 'TKT-1998 has been marked as resolved',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    type: 'success' as const,
  },
];

export function Header({ currentUser, onLogout, onNavigate, currentView }: HeaderProps) {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'warning':
        return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <Bell className={`${iconClass} text-orange-600`} />
        </div>;
      case 'escalation':
        return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <Bell className={`${iconClass} text-red-600`} />
        </div>;
      case 'success':
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Bell className={`${iconClass} text-green-600`} />
        </div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bell className={`${iconClass} text-blue-600`} />
        </div>;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'manager':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'agent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left side - App Title & View */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3.5 pr-6 border-r border-slate-200/60">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-[0_4px_12_rgba(37,99,235,0.3)] transform group-hover:scale-[1.02] active:scale-95 transition-all duration-200">
              <Ticket className="w-5.5 h-5.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
              TicketFlow
            </span>
            <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-[0.25em] leading-none mt-1.5">
              Service Desk
            </span>
          </div>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] border-l-2 border-slate-200 pl-6 py-1">
            Ticketing Tool Management
          </h1>
        </div>
      </div>

      {/* Center - Enhanced Search bar */}
      <div className="hidden md:flex flex-1 max-w-lg mx-12">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Settings className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search tickets, knowledge base or settings..."
            className="block w-full pl-11 pr-4 py-2.5 border border-slate-200/80 rounded-2xl leading-5 bg-white/80 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 sm:text-sm transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 border border-slate-200 rounded text-[10px] font-medium text-slate-400 bg-white">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-2 px-1 py-1 bg-slate-100/50 rounded-lg border border-slate-200/50">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-md transition-all">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-md transition-all">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-slate-500 hover:text-slate-900 relative rounded-full hover:bg-slate-100 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
                >
                  <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                </motion.div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 shadow-2xl border-slate-200/60 overflow-hidden rounded-2xl" align="end" sideOffset={8}>
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                    {unreadCount} New
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto bg-white">
              <AnimatePresence>
                {mockNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-all ${
                      !notification.read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-slate-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center text-[10px] font-medium text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(notification.time, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100">
              <Button variant="ghost" className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg uppercase tracking-wider">
                View All Notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 px-2 py-1.5 h-auto hover:bg-slate-100/80 rounded-full transition-all group">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md transform group-hover:scale-105 transition-transform border-2 border-white">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="text-left hidden xl:block pr-1">
                <p className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{currentUser.role}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-slate-200/60 rounded-2xl" sideOffset={8}>
            <DropdownMenuLabel className="p-3 mb-2 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-inner">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                  <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                  <p className="text-xs font-medium text-slate-500 truncate max-w-[140px]">{currentUser.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <Badge className={`w-full justify-center py-1 text-[10px] font-bold uppercase tracking-widest ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role} Account
                </Badge>
              </div>
            </DropdownMenuLabel>
            <div className="px-1 space-y-1">
              <DropdownMenuItem 
                onClick={() => onNavigate('profile')}
                className="rounded-lg py-2 cursor-pointer focus:bg-slate-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2 cursor-pointer focus:bg-slate-50 group">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">Help & Support</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-2 mx-1" />
            <div className="px-1">
              <DropdownMenuItem onClick={onLogout} className="rounded-lg py-2 cursor-pointer focus:bg-red-50 text-red-600 group">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
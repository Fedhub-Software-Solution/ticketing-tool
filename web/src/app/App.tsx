import { useState } from 'react';
import { ChevronLeft, Plus, Download } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Button } from './components/common/ui/button';
import { Dashboard } from './components/menus/Dashboard';
import { TicketList } from './components/menus/TicketList';
import { TicketDetail } from './components/menus/TicketDetail';
import { SLAConfig } from './components/configuration/SLAConfig';
import { EscalationManagement } from './components/configuration/EscalationManagement';
import { CategoryManagement } from './components/configuration/CategoryManagement';
import { EnterpriseManagement } from './components/configuration/enterprise/EnterpriseManagement';
import { EscalatedTickets } from './components/menus/EscalatedTickets';
import { TicketTracking } from './components/menus/TicketTracking';
import { Reports } from './components/menus/Reports';
import { MyOpenTickets } from './components/workplace/MyOpenTickets';
import { MyClosedTickets } from './components/workplace/MyClosedTickets';
import { MyOverdueTickets } from './components/workplace/MyOverdueTickets';
import { Board } from './components/menus/Board';
import { CreateTicket } from './components/menus/CreateTicket';
import { UserManagement } from './components/configuration/access-management/UserManagement';
import { Login } from './components/Login';
import { CustomerPortal } from './components/CustomerPortal';
import { Profile } from './components/Profile';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout as logoutAction } from '@/app/store/slices/authSlice';
import { useGetMeQuery } from '@/app/store/apis/authApi';
import { ViewType, User } from './types';

function AppContent() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector((state: { auth: { token: string | null } }) => state.auth.token);
  useGetMeQuery(undefined, { skip: !token });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isCustomerPortal, setIsCustomerPortal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [trackingTicketId, setTrackingTicketId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewType>('tickets');
  const [ticketListViewMode, setTicketListViewMode] = useState<'list' | 'table'>('table');
  const [previousTicketListViewMode, setPreviousTicketListViewMode] = useState<'list' | 'table'>('table');
  const [previousViewBeforeDetail, setPreviousViewBeforeDetail] = useState<ViewType>('tickets');
  const [mobilePreview, setMobilePreview] = useState(false);

  const [isEditingTicket, setIsEditingTicket] = useState(false);

  const handleViewTicket = (ticketId: string, edit: boolean = false) => {
    setPreviousTicketListViewMode(ticketListViewMode);
    setPreviousViewBeforeDetail(currentView);
    setSelectedTicketId(ticketId);
    if (edit) {
      setPreviousView(currentView);
      setCurrentView('create-ticket');
    } else {
      setIsEditingTicket(false);
      setCurrentView('ticket-detail');
    }
  };

  const handleNavigate = (view: ViewType) => {
    if (view === 'create-ticket') {
      setPreviousView(currentView);
      setSelectedTicketId(null); // Clear selected ticket when creating new
    }
    setCurrentView(view);
  };

  const handleTrackTicket = (ticketId: string) => {
    setPreviousView(currentView);
    setTrackingTicketId(ticketId);
    setCurrentView('ticket-tracking');
  };

  const handleBackToTickets = () => {
    setSelectedTicketId(null);
    setIsEditingTicket(false);
    if (previousViewBeforeDetail === 'board') {
      setCurrentView('board');
    } else {
      setTicketListViewMode(previousTicketListViewMode);
      setCurrentView('tickets');
    }
  };

  const handleBackFromTracking = () => {
    setTrackingTicketId(null);
    setCurrentView(previousView);
  };

  const handleLogin = (_user: User) => {
    setIsCustomerPortal(false);
  };

  const getViewTitle = (view: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'tickets': 'Support Tickets',
      'ticket-detail': 'Ticket Details',
      'sla-config': 'SLA Configuration',
      'escalations': 'Escalation Processes',
      'categories': 'Service Categories',
      'enterprise': 'Enterprise Structure',
      'escalated-tickets': 'High Priority Escalations',
      'ticket-tracking': 'Live Ticket Tracking',
      'reports': 'Analytics & Insights',
      'my-open-tickets': 'Open Tickets',
      'my-closed-tickets': 'Closed Tickets',
      'my-overdue-tickets': 'Overdue Tickets',
      'board': 'Kanban Board',
      'create-ticket': '',
      'users': 'Access Management',
      'profile': 'My Profile Settings',
    };
    return titles[view] || 'Service Desk';
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    setCurrentView('dashboard');
  };

  if (!currentUser) {
    if (isCustomerPortal) {
      return (
        <CustomerPortal
          onBack={() => setIsCustomerPortal(false)}
          onLogin={() => {}}
          autoShowQR={true}
        />
      );
    }
    return <Login onLogin={handleLogin} onOpenCustomerPortal={() => setIsCustomerPortal(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentView={currentView}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Content Header */}
          {!(currentView === 'create-ticket' || currentView === 'ticket-tracking') && (
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <motion.h2 
                    key={currentView}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold text-slate-900 tracking-tight"
                  >
                    {getViewTitle(currentView)}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-500 text-sm font-medium mt-1"
                  >
                    {currentView === 'my-open-tickets' 
                      ? 'Tickets currently assigned to you with Open status.' 
                      : currentView === 'my-closed-tickets'
                      ? 'History of tickets that have been completed and closed.'
                      : currentView === 'my-overdue-tickets'
                      ? 'Tickets that have exceeded their SLA deadline.'
                      : ''}
                  </motion.p>
                </div>
              </div>

              {currentView === 'tickets' && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => toast.success('Exporting tickets...', { description: 'Preparing data for download' })}
                    className="h-11 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:text-blue-600 transition-all gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-semibold">Export</span>
                  </Button>
                  <Button 
                    onClick={() => handleNavigate('create-ticket')}
                    className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">New Ticket</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView + (selectedTicketId || '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} onViewTicket={handleViewTicket} currentUser={currentUser} />}
                {currentView === 'tickets' && (
                  <TicketList 
                    onViewTicket={handleViewTicket} 
                    onTrackTicket={handleTrackTicket} 
                    onNavigate={handleNavigate}
                    currentUser={currentUser} 
                    listViewMode={ticketListViewMode} 
                    setListViewMode={setTicketListViewMode} 
                  />
                )}
                {currentView === 'ticket-detail' && selectedTicketId && (
                  <TicketDetail 
                    ticketId={selectedTicketId} 
                    onBack={handleBackToTickets} 
                    onTrackTicket={handleTrackTicket} 
                    onViewTicket={handleViewTicket} 
                    currentUser={currentUser} 
                    initialIsEditing={isEditingTicket}
                  />
                )}
                {currentView === 'sla-config' && <SLAConfig />}
                {currentView === 'escalations' && <EscalationManagement />}
                {currentView === 'categories' && <CategoryManagement />}
                {currentView === 'enterprise' && <EnterpriseManagement />}
                {currentView === 'escalated-tickets' && <EscalatedTickets onViewTicket={handleViewTicket} currentUser={currentUser} />}
                {currentView === 'ticket-tracking' && <TicketTracking onViewTicket={handleViewTicket} currentUser={currentUser} initialTicketId={trackingTicketId} onBack={handleBackFromTracking} />}
                {currentView === 'reports' && <Reports currentUser={currentUser} />}
                {currentView === 'my-open-tickets' && <MyOpenTickets onViewTicket={handleViewTicket} onTrackTicket={handleTrackTicket} currentUser={currentUser} />}
                {currentView === 'my-closed-tickets' && <MyClosedTickets onViewTicket={handleViewTicket} onTrackTicket={handleTrackTicket} currentUser={currentUser} />}
                {currentView === 'my-overdue-tickets' && <MyOverdueTickets onViewTicket={handleViewTicket} onTrackTicket={handleTrackTicket} currentUser={currentUser} />}
                {currentView === 'board' && <Board onViewTicket={handleViewTicket} onTrackTicket={handleTrackTicket} currentUser={currentUser} onNavigate={handleNavigate} />}
                {currentView === 'users' && <UserManagement />}
                {currentView === 'profile' && <Profile currentUser={currentUser} />}
                {currentView === 'create-ticket' && (
                  <CreateTicket
                    currentUser={currentUser}
                    onBack={() => setCurrentView(previousView)}
                    onSuccess={() => setCurrentView(previousView)}
                    ticketId={selectedTicketId ?? undefined}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster position="top-center" />
    </>
  );
}

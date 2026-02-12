import { createContext, useContext, useState, ReactNode } from 'react';
import { Ticket } from '@/app/types';
import { mockTickets } from '@/app/data/mockData';

interface TicketsContextType {
  tickets: Ticket[];
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
  deleteTicket: (ticketId: string) => void;
  getTicket: (ticketId: string) => Ticket | undefined;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

  const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, ...updates, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
  };

  const addTicket = (ticket: Ticket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  const getTicket = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  return (
    <TicketsContext.Provider value={{ tickets, updateTicket, addTicket, deleteTicket, getTicket }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
}

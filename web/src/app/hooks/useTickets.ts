import { useGetTicketsQuery, useUpdateTicketMutation, useCreateTicketMutation, useDeleteTicketMutation } from '@/app/store/apis/ticketsApi';
import type { Ticket } from '@/app/types';

/**
 * Adapter hook that mirrors the previous TicketsContext API using RTK Query.
 * Use this for components that expect tickets, updateTicket, addTicket, deleteTicket.
 * For single-ticket data use useGetTicketQuery(ticketId) instead of getTicket().
 */
export function useTickets(params?: { status?: string; priority?: string; zone?: string; assignedTo?: string }) {
  const { data: tickets = [], isLoading, isError, refetch } = useGetTicketsQuery(params ?? {});
  const [updateTicketMutation] = useUpdateTicketMutation();
  const [createTicketMutation] = useCreateTicketMutation();
  const [deleteTicketMutation] = useDeleteTicketMutation();

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    await updateTicketMutation({
      id: ticketId,
      body: {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        categoryId: (updates as any).categoryId,
        subCategory: updates.subCategory,
        zone: updates.zone,
        location: updates.location,
        branch: updates.branch,
        branchCode: updates.branchCode,
        assignedToId: (updates as any).assignedToId,
        slaId: updates.slaId,
        slaDueDate: updates.slaDueDate,
        escalationLevel: updates.escalationLevel,
        escalatedTo: updates.escalatedTo,
        breachedSLA: updates.breachedSLA,
        tags: updates.tags,
        parentId: updates.parentId,
      },
    }).unwrap();
  };

  const addTicket = async (ticket: Ticket) => {
    await createTicketMutation({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      categoryId: (ticket as any).categoryId,
      subCategory: ticket.subCategory,
      zone: ticket.zone,
      location: ticket.location,
      branch: ticket.branch,
      branchCode: ticket.branchCode,
      assignedToId: (ticket as any).assignedToId,
      slaId: ticket.slaId,
      slaDueDate: ticket.slaDueDate,
      tags: ticket.tags,
      parentId: ticket.parentId,
    }).unwrap();
  };

  const deleteTicket = async (ticketId: string) => {
    await deleteTicketMutation(ticketId).unwrap();
  };

  return {
    tickets: tickets as Ticket[],
    isLoading,
    isError,
    refetch,
    updateTicket,
    addTicket,
    deleteTicket,
  };
}

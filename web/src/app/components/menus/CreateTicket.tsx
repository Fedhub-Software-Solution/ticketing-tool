import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, UserCircle, Tag, Info, AlertCircle, Link as LinkIcon, Layers, Paperclip, X, FileText, Send, Clock, Shield, MapPin, Search, Sparkles, FolderTree, ClipboardCheck, Settings2, MessageSquare, Globe, GitBranch, Pencil, Trash2, Check, Plus } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { Label } from '../common/ui/label';
import { Textarea } from '../common/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { toast } from 'sonner';
import { User, Ticket } from '../../types';
import { useTickets } from '@/app/hooks/useTickets';
import {
  useGetTicketQuery,
  useGetAttachmentsQuery,
  useGetCommentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from '@/app/store/apis/ticketsApi';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import { useGetEscalationRulesQuery } from '@/app/store/apis/escalationRulesApi';
import { motion, AnimatePresence } from 'motion/react';

interface CreateTicketProps {
  currentUser: User;
  onBack: () => void;
  onSuccess: () => void;
  ticketId?: string; // When provided, fetch ticket for editing mode
  ticket?: Ticket; // Optional pre-loaded ticket (legacy)
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isCurrentUser: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
  urgent: 'Urgent Response',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return `${diffM} min ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH} hr ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7) return `${diffD} days ago`;
  return d.toLocaleDateString();
}

export function CreateTicket({ currentUser, onBack, onSuccess, ticketId, ticket: ticketProp }: CreateTicketProps) {
  const { addTicket, updateTicket, refetch: refetchTickets } = useTickets();
  const [uploadAttachment] = useUploadAttachmentMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncedTicketIdRef = useRef<string | null>(null);
  const { data: ticketFromApi } = useGetTicketQuery(ticketId!, { skip: !ticketId });
  const ticket = ticketProp ?? ticketFromApi;
  const effectiveTicketId = ticketId ?? ticket?.id;
  const isEditing = !!ticket;
  const { data: existingAttachments = [] } = useGetAttachmentsQuery(effectiveTicketId ?? '', { skip: !effectiveTicketId });
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const { data: apiComments = [] } = useGetCommentsQuery(effectiveTicketId ?? '', { skip: !effectiveTicketId });
  const [addCommentMutation] = useAddCommentMutation();
  const [updateCommentMutation] = useUpdateCommentMutation();
  const [deleteCommentMutation] = useDeleteCommentMutation();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: currentUser.role === 'customer' });
  const { data: zones = [] } = useGetZonesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: escalationRules = [] } = useGetEscalationRulesQuery();

  const [selectedBranch, setSelectedBranch] = useState<string>(ticket?.branch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ticket ? (categories.find((c: { name: string; id: string }) => c.name === ticket.category)?.id || categories[0]?.id || '') : (categories[0]?.id || '')
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(ticket?.subCategory || 'none');
  const [selectedRequestor, setSelectedRequestor] = useState<string>(ticket?.createdBy || currentUser.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(ticket?.childIds || []);
  const [attachments, setAttachments] = useState<{ file: File; id: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [statusValue, setStatusValue] = useState(ticket?.status || 'open');
  const [titleValue, setTitleValue] = useState(ticket?.title || '');
  const [descriptionValue, setDescriptionValue] = useState(ticket?.description || '');
  const [priorityValue, setPriorityValue] = useState(ticket?.priority || 'medium');
  const [assignedToValue, setAssignedToValue] = useState(ticket?.assignedTo || 'unassigned');
  const [zoneValue, setZoneValue] = useState(ticket?.zone || currentUser.zone || '');

  const parentCategories = useMemo(() => categories.filter((c: { parentId?: string }) => !c.parentId), [categories]);
  const subCategories = useMemo(
    () => categories.filter((c: { parentId?: string }) => c.parentId === selectedCategory),
    [categories, selectedCategory]
  );
  const criticalityOptions = useMemo(() => {
    const fromRules = [...new Set((escalationRules as { priority?: string }[]).map((r) => r.priority).filter(Boolean))];
    const order = ['low', 'medium', 'high', 'urgent'];
    const ordered = order.filter((p) => fromRules.includes(p));
    return ordered.length ? ordered : order;
  }, [escalationRules]);
  const selectedZoneId = useMemo(() => (zones as { id: string; name: string }[]).find((z) => z.name === zoneValue)?.id ?? null, [zones, zoneValue]);
  const branchesForZone = useMemo(
    () => (branches as { id: string; name: string; zoneId: string; code?: string }[]).filter((b) => b.zoneId === selectedZoneId),
    [branches, selectedZoneId]
  );
  const currentBranchCode = useMemo(
    () => branchesForZone.find((b) => b.name === selectedBranch)?.code ?? '',
    [branchesForZone, selectedBranch]
  );
  /** All users for Assigned Professional dropdown (show full list) */
  const usersForAssignment = useMemo(() => users, [users]);

  const displayComments = useMemo((): Comment[] => {
    if (effectiveTicketId && apiComments.length >= 0) {
      return apiComments.map((c: { id: string; author: string; authorId: string; text: string; createdAt: string }) => ({
        id: c.id,
        author: c.author,
        text: c.text,
        timestamp: formatCommentTime(c.createdAt),
        isCurrentUser: c.authorId === currentUser.id,
      }));
    }
    return comments;
  }, [effectiveTicketId, apiComments, comments, currentUser.id]);

  useEffect(() => {
    if (zones.length && !zoneValue) setZoneValue((zones as { name: string }[])[0]?.name ?? '');
  }, [zones, zoneValue]);

  useEffect(() => {
    if (parentCategories.length && !selectedCategory) setSelectedCategory(parentCategories[0]?.id ?? '');
  }, [parentCategories, selectedCategory]);

  useEffect(() => {
    const subNames = subCategories.map((c: { name: string }) => c.name);
    if (selectedSubCategory && selectedSubCategory !== 'none' && !subNames.includes(selectedSubCategory)) setSelectedSubCategory(subNames[0] ?? 'none');
  }, [selectedCategory, subCategories, selectedSubCategory]);

  useEffect(() => {
    const branchNames = branchesForZone.map((b) => b.name);
    if (selectedBranch && !branchNames.includes(selectedBranch)) setSelectedBranch(branchNames[0] ?? '');
  }, [zoneValue, branchesForZone, selectedBranch]);

  useEffect(() => {
    syncedTicketIdRef.current = null;
  }, [ticketId]);

  // Prepopulate all form fields when editing and ticket + lookups have loaded
  useEffect(() => {
    if (!ticket?.id || !isEditing) return;
    if (syncedTicketIdRef.current === ticket.id) return;
    setTitleValue(ticket.title);
    setDescriptionValue(ticket.description || '');
    setStatusValue(ticket.status);
    setPriorityValue(ticket.priority);
    setAssignedToValue(ticket.assignedTo || 'unassigned');
    setSelectedRequestor(ticket.createdBy || currentUser.name);
    setSelectedChildIds(ticket.childIds || []);
    const cats = categories as { id: string; name: string; parentId?: string }[];
    const zs = zones as { id: string; name: string }[];
    if (cats.length) {
      const catId = (ticket as Ticket & { categoryId?: string }).categoryId ?? cats.find((c) => c.name === ticket.category)?.id;
      if (catId) setSelectedCategory(catId);
      setSelectedSubCategory(ticket.subCategory || 'none');
    }
    if (zs.length && ticket.zone) setZoneValue(ticket.zone);
    if (ticket.branch) setSelectedBranch(ticket.branch);
    syncedTicketIdRef.current = ticket.id;
  }, [ticket, isEditing, categories, zones, currentUser.name]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const ticketData: Partial<Ticket> & { categoryId?: string } = {
        title: titleValue,
        description: descriptionValue,
        status: statusValue as any,
        priority: priorityValue as any,
        category: categories.find((c: { id: string; name: string }) => c.id === selectedCategory)?.name || 'General',
        categoryId: selectedCategory || undefined,
        subCategory: selectedSubCategory === 'none' ? undefined : selectedSubCategory,
        zone: zoneValue,
        location: zoneValue,
        branch: selectedBranch,
        branchCode: currentBranchCode,
        assignedTo: assignedToValue === 'unassigned' ? 'Unassigned' : assignedToValue,
        createdBy: selectedRequestor,
        updatedAt: new Date().toISOString(),
        childIds: selectedChildIds.length > 0 ? selectedChildIds : undefined,
      };

      let ticketIdToUse: string;
      if (isEditing && ticket) {
        await updateTicket(ticket.id, ticketData);
        ticketIdToUse = ticket.id;
        toast.success('Ticket updated successfully!');
      } else {
        const categoryName = categories.find((c: { id: string; name: string }) => c.id === selectedCategory)?.name || 'General';
        const assigneeId = assignedToValue === 'unassigned' ? undefined : users.find((u: User) => u.name === assignedToValue)?.id;
        const requesterId = users.find((u: User) => u.name === selectedRequestor)?.id;
        const created = await addTicket({
          ...ticketData,
          id: '',
          status: statusValue as Ticket['status'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          category: categoryName,
          assignedTo: assignedToValue === 'unassigned' ? 'Unassigned' : assignedToValue,
          createdBy: selectedRequestor,
          categoryId: selectedCategory,
          requesterId,
          assignedToId: assigneeId,
        } as Ticket & { categoryId?: string; requesterId?: string; assignedToId?: string });
        ticketIdToUse = created.id;
        if ((created as any).emailSent) {
          toast.success('Ticket created successfully!', {
            description: 'Notification emails have been sent to the requester and assignee.',
          });
        } else if ((created as any).emailError) {
          toast.success('Ticket created successfully!', {
            description: `Notification emails could not be sent. ${(created as any).emailError}`,
          });
        } else {
          toast.success('Ticket created successfully!');
        }
      }
      for (const { file } of attachments) {
        try {
          await uploadAttachment({ ticketId: ticketIdToUse, file }).unwrap();
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      await refetchTickets();
      onSuccess();
    } catch (error: any) {
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
      let message = 'Operation failed.';
      if (error?.status === 'FETCH_ERROR' || (error?.message && /failed to fetch|network error|load failed/i.test(error.message))) {
        message = `Cannot reach the API at ${apiUrl}. Start the backend with: cd backend && npm run dev`;
      } else if (error?.data) {
        message = error.data?.message ?? error.data?.error ?? (typeof error.data === 'string' ? error.data : message);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit} className="h-full">
          <div className="grid grid-cols-12 min-h-full">
            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-8 p-6 lg:p-10 space-y-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200/50"
                  >
                    {isEditing ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {isEditing ? `Edit Ticket ${ticket?.id}` : 'Create New Ticket'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      {isEditing ? 'Update service request details and status' : 'Fill in the details to submit a new service request'}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onBack}
                  className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-500"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                  <div className="px-8 py-5 border-b border-slate-100 bg-blue-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-sm shadow-inner"><FileText className="w-4 h-4" /></div>
                      <h3 className="font-bold text-white text-base tracking-tight">Core Information</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      {currentUser.role === 'admin' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requester:</span>
                          <Select value={selectedRequestor} onValueChange={setSelectedRequestor}>
                            <SelectTrigger className="h-8 min-w-[160px] text-xs font-semibold bg-white border-slate-200 hover:border-blue-400 transition-all rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                              {users.map((u: User) => (
                                <SelectItem key={u.id} value={u.name} className="text-xs font-medium focus:bg-blue-50 focus:text-blue-700">
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100">
                          <UserCircle className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-bold text-blue-700">{selectedRequestor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        Ticket Subject
                      </Label>
                      <Input 
                        value={titleValue} 
                        onChange={(e) => setTitleValue(e.target.value)} 
                        required 
                        className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white transition-all rounded-xl text-slate-900 font-medium placeholder:text-slate-400" 
                        placeholder="Briefly describe the issue (e.g., Workstation network connectivity problem)" 
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Description
                      </Label>
                      <Textarea 
                        value={descriptionValue} 
                        onChange={(e) => setDescriptionValue(e.target.value)} 
                        required 
                        className="min-h-[180px] border-slate-200 bg-slate-50/30 focus:bg-white transition-all rounded-xl p-4 text-slate-700 leading-relaxed placeholder:text-slate-400" 
                        placeholder="Provide as much detail as possible to help us resolve the issue quickly..." 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          Service Category
                        </Label>
                        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubCategory('none'); }}>
                          <SelectTrigger className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl transition-all">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            {parentCategories.map((c: { id: string; name: string }) => (
                              <SelectItem key={c.id} value={c.id} className="focus:bg-blue-50 focus:text-blue-700 py-2.5">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Technical Sub-Category
                        </Label>
                        <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                          <SelectTrigger className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl transition-all">
                            <SelectValue placeholder="Specify detail" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="none" className="py-2.5 italic text-slate-400">Not specified</SelectItem>
                            {subCategories.map((c: { id: string; name: string }) => (
                              <SelectItem key={c.id} value={c.name} className="focus:bg-blue-50 focus:text-blue-700 py-2.5">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
                  <div className="px-8 py-5 border-b border-indigo-100 bg-indigo-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shadow-inner backdrop-blur-sm">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-base tracking-tight">Communication & History</h3>
                    </div>
                    {displayComments.length > 0 && (
                      <Badge variant="outline" className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border-none backdrop-blur-sm">
                        {displayComments.length} Internal Note{displayComments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="space-y-6 mb-8">
                      {displayComments.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <MessageSquare className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="text-slate-400 text-sm font-medium">No internal communications yet</p>
                          <p className="text-slate-300 text-xs mt-1">Comments are only visible to support staff</p>
                        </div>
                      ) : (
                        <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                          {displayComments.map((c, index) => (
                            <motion.div 
                              key={c.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex gap-4 p-5 rounded-2xl border transition-all group ${c.isCurrentUser ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50/50 border-slate-100'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${c.isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                {c.author[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">{c.author}</span>
                                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {c.timestamp}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {c.isCurrentUser && (
                                      <>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingCommentId(c.id);
                                            setEditingCommentText(c.text);
                                          }}
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={async () => {
                                            if (effectiveTicketId) {
                                              try {
                                                await deleteCommentMutation({ ticketId: effectiveTicketId, commentId: c.id }).unwrap();
                                                toast.success('Comment deleted');
                                              } catch (err: any) {
                                                toast.error(err?.data?.error ?? err?.data?.message ?? 'Failed to delete comment');
                                              }
                                            } else {
                                              setComments(comments.filter(com => com.id !== c.id));
                                              toast.success('Comment deleted');
                                            }
                                          }}
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white shadow-sm transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {editingCommentId === c.id ? (
                                  <div className="flex gap-2 items-start mt-3">
                                    <Textarea
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="min-h-[80px] text-sm py-3 px-4 bg-white rounded-xl border-blue-200 shadow-sm"
                                    />
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        type="button"
                                        size="icon"
                                        onClick={async () => {
                                          if (effectiveTicketId) {
                                            try {
                                              await updateCommentMutation({ ticketId: effectiveTicketId, commentId: c.id, text: editingCommentText }).unwrap();
                                              setEditingCommentId(null);
                                              toast.success('Comment updated');
                                            } catch (err: any) {
                                              toast.error(err?.data?.error ?? err?.data?.message ?? 'Failed to update comment');
                                            }
                                          } else {
                                            setComments(comments.map(com =>
                                              com.id === c.id ? { ...com, text: editingCommentText } : com
                                            ));
                                            setEditingCommentId(null);
                                            toast.success('Comment updated');
                                          }
                                        }}
                                        className="h-9 w-9 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-100"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingCommentId(null)}
                                        className="h-9 w-9 text-slate-400 hover:text-slate-600 bg-white rounded-xl border border-slate-200"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {c.text}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative group">
                      <Textarea 
                        value={commentText} 
                        onChange={(e) => setCommentText(e.target.value)} 
                        placeholder="Add an internal note or update..." 
                        className="min-h-[120px] border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-2xl p-5 text-sm pr-16" 
                      />
                      <div className="absolute right-4 bottom-4">
                        <Button 
                          type="button" 
                          size="icon" 
                          disabled={!commentText.trim()}
                          onClick={async () => {
                            if (!commentText.trim()) return;
                            if (effectiveTicketId) {
                              try {
                                await addCommentMutation({ ticketId: effectiveTicketId, text: commentText.trim() }).unwrap();
                                setCommentText('');
                                toast.success('Note added');
                              } catch (err: any) {
                                const msg = err?.data?.error ?? err?.data?.message ?? err?.message ?? 'Failed to add comment';
                                toast.error(msg);
                              }
                            } else {
                              setComments([...comments, { id: Date.now().toString(), author: currentUser.name, text: commentText.trim(), timestamp: 'Just now', isCurrentUser: true }]);
                              setCommentText('');
                              toast.success('Note added');
                            }
                          }} 
                          className={`h-10 w-10 rounded-xl transition-all ${commentText.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar Inspector */}
            <div className="col-span-12 lg:col-span-4 p-6 lg:p-10 bg-slate-100/50 border-l border-slate-200/80 space-y-8 h-full">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                  <div className="px-8 py-5 border-b border-slate-100 bg-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-sm shadow-inner"><Settings2 className="w-4 h-4" /></div>
                    <h3 className="font-bold text-white text-base tracking-tight uppercase tracking-widest">Classification</h3>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Current Status
                        <Clock className="w-3 h-3" />
                      </Label>
                      <Select value={statusValue} onValueChange={setStatusValue}>
                        <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold capitalize bg-slate-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="open" className="font-bold text-indigo-600 bg-indigo-50/50 m-1 rounded-lg focus:bg-indigo-100">Open</SelectItem>
                          <SelectItem value="in-progress" className="font-bold text-violet-600 bg-violet-50/50 m-1 rounded-lg focus:bg-violet-100">In Progress</SelectItem>
                          <SelectItem value="on-hold" className="font-bold text-amber-600 bg-amber-50/50 m-1 rounded-lg focus:bg-amber-100">On Hold</SelectItem>
                          <SelectItem value="resolved" className="font-bold text-emerald-600 bg-emerald-50/50 m-1 rounded-lg focus:bg-emerald-100">Resolved</SelectItem>
                          <SelectItem value="closed" className="font-bold text-slate-600 bg-slate-100 m-1 rounded-lg focus:bg-slate-200">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Criticality
                        <AlertCircle className="w-3 h-3" />
                      </Label>
                      <Select value={priorityValue} onValueChange={setPriorityValue}>
                        <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold capitalize bg-slate-50/50">
                          <SelectValue placeholder="Select criticality" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {criticalityOptions.map((p) => (
                            <SelectItem
                              key={p}
                              value={p}
                              className={`font-bold py-2.5 ${p === 'low' ? 'text-blue-600 focus:bg-blue-50' : p === 'medium' ? 'text-amber-600 focus:bg-amber-50' : p === 'high' ? 'text-orange-600 focus:bg-orange-50' : 'text-rose-600 focus:bg-rose-50'}`}
                            >
                              {PRIORITY_LABELS[p] ?? p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Assignment Zone
                        <Globe className="w-3 h-3" />
                      </Label>
                      <Select value={zoneValue} onValueChange={setZoneValue}>
                        <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {(zones as { id: string; name: string }[]).map((z) => (
                            <SelectItem key={z.id} value={z.name} className="font-medium focus:bg-slate-50">
                              {z.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Specific Branch
                        <GitBranch className="w-3 h-3" />
                      </Label>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {branchesForZone.map((b) => (
                            <SelectItem key={b.id} value={b.name} className="font-medium focus:bg-slate-50">{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Assigned Professional
                        <UserCircle className="w-3 h-3" />
                      </Label>
                      <Select value={assignedToValue} onValueChange={setAssignedToValue}>
                        <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold bg-slate-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="unassigned" className="font-bold text-blue-500 italic focus:bg-blue-50">Auto-assign Engine</SelectItem>
                          {usersForAssignment.map((u: User) => (
                            <SelectItem key={u.id} value={u.name} className="font-medium focus:bg-slate-50">{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-slate-50/30 space-y-4">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-4">
                      Evidence & Attachments
                      <Paperclip className="w-3 h-3" />
                    </Label>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files?.length) {
                          setAttachments(prev => [
                            ...prev,
                            ...Array.from(files).map(file => ({ file, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` })),
                          ]);
                          toast.success('File(s) added');
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group bg-slate-50/50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-600 block group-hover:text-blue-600 transition-colors">Upload Evidence</span>
                            <span className="text-[10px] text-slate-400 font-medium">Click or drag & drop</span>
                          </div>
                        </div>
                      </motion.div>

                      {isEditing && existingAttachments.length > 0 && (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Existing attachments</span>
                          {existingAttachments.map((att) => (
                            <motion.div
                              key={att.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[11px] font-bold text-slate-700 truncate">{att.fileName}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {att.fileSize != null ? formatFileSize(att.fileSize) : '—'}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isSubmitting}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!effectiveTicketId) return;
                                    try {
                                      await deleteAttachment({ ticketId: effectiveTicketId, attachmentId: att.id }).unwrap();
                                    toast.success('Attachment removed');
                                  } catch {
                                    toast.error('Failed to remove attachment');
                                  }
                                }}
                                className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      <AnimatePresence>
                        {attachments.length > 0 && (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {existingAttachments.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New uploads</span>
                            )}
                            {attachments.map(({ file, id }) => (
                              <motion.div
                                key={id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-blue-200 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{formatFileSize(file.size)}</span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachments(prev => prev.filter(a => a.id !== id));
                                    toast.info('Attachment removed');
                                  }}
                                  className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <div className="flex flex-col gap-4 pt-4 pb-10">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className={`h-14 rounded-2xl font-bold text-base shadow-xl transition-all active:scale-[0.98] ${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 hover:shadow-blue-300/50'}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Synchronizing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isEditing ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                      {isEditing ? 'Confirm Changes' : 'Initialize Request'}
                    </span>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onBack} 
                  className="h-12 text-slate-500 font-bold rounded-2xl hover:bg-white hover:text-red-500 transition-all border border-transparent hover:border-slate-200"
                >
                  Discard Progress
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

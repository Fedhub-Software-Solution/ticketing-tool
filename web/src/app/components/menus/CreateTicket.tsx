import { useState, useMemo, useEffect } from 'react';
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
import { useGetTicketQuery } from '@/app/store/apis/ticketsApi';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
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

const locations = ['Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune'];

const zoneBranches: Record<string, { name: string, code: string }[]> = {
  'Chennai': [
    { name: 'Adyar Branch', code: 'CHN-001' },
    { name: 'T Nagar Branch', code: 'CHN-002' },
    { name: 'Velachery Branch', code: 'CHN-003' },
  ],
  'Bangalore': [
    { name: 'Indiranagar Branch', code: 'BLR-001' },
    { name: 'Koramangala Branch', code: 'BLR-002' },
    { name: 'Whitefield Branch', code: 'BLR-003' },
  ],
  'Mumbai': [
    { name: 'Andheri Branch', code: 'MUM-001' },
    { name: 'Bandra Branch', code: 'MUM-002' },
    { name: 'Colaba Branch', code: 'MUM-003' },
  ],
  'Hyderabad': [
    { name: 'Gachibowli Branch', code: 'HYD-001' },
    { name: 'Banjara Hills Branch', code: 'HYD-002' },
    { name: 'Jubilee Hills Branch', code: 'HYD-003' },
  ],
  'Delhi': [
    { name: 'Connaught Place Branch', code: 'DEL-001' },
    { name: 'Hauz Khas Branch', code: 'DEL-002' },
    { name: 'Saket Branch', code: 'DEL-003' },
  ],
  'Pune': [
    { name: 'Kothrud Branch', code: 'PUN-001' },
    { name: 'Hinjewadi Branch', code: 'PUN-002' },
    { name: 'Viman Nagar Branch', code: 'PUN-003' },
  ],
};

export function CreateTicket({ currentUser, onBack, onSuccess, ticketId, ticket: ticketProp }: CreateTicketProps) {
  const { tickets, addTicket, updateTicket } = useTickets();
  const { data: ticketFromApi } = useGetTicketQuery(ticketId!, { skip: !ticketId });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: currentUser.role === 'customer' });
  const ticket = ticketProp ?? ticketFromApi;
  const isEditing = !!ticket;

  const [selectedLocation, setSelectedLocation] = useState<string>(ticket?.location || currentUser.location || 'Chennai');
  const [selectedBranch, setSelectedBranch] = useState<string>(ticket?.branch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ticket ? (categories.find((c: { name: string; id: string }) => c.name === ticket.category)?.id || categories[0]?.id || '') : (categories[0]?.id || '')
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(ticket?.subCategory || '');
  const [selectedRequestor, setSelectedRequestor] = useState<string>(ticket?.createdBy || currentUser.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(ticket?.childIds || []);
  const [attachments, setAttachments] = useState<{ name: string, size: string, type: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  const [statusValue, setStatusValue] = useState(ticket?.status || 'open');
  const [titleValue, setTitleValue] = useState(ticket?.title || '');
  const [descriptionValue, setDescriptionValue] = useState(ticket?.description || '');
  const [priorityValue, setPriorityValue] = useState(ticket?.priority || 'medium');
  const [assignedToValue, setAssignedToValue] = useState(ticket?.assignedTo || 'unassigned');
  const [zoneValue, setZoneValue] = useState(ticket?.zone || currentUser.zone || 'South');

  useEffect(() => {
    if (selectedLocation && zoneBranches[selectedLocation]) {
      const branchesInLoc = zoneBranches[selectedLocation].map(b => b.name);
      if (!branchesInLoc.includes(selectedBranch)) {
        setSelectedBranch(zoneBranches[selectedLocation][0].name);
      }
    }
  }, [selectedLocation]);

  const currentBranchCode = useMemo(() => {
    if (!selectedLocation || !selectedBranch) return '';
    return zoneBranches[selectedLocation]?.find(b => b.name === selectedBranch)?.code || '';
  }, [selectedLocation, selectedBranch]);

  const filteredUsersForAssignment = useMemo(() => {
    return users.filter((user: User) =>
      (user.role === 'agent' || user.role === 'manager' || user.role === 'admin') &&
      (user.location === selectedLocation || !user.location)
    );
  }, [users, selectedLocation]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const ticketData: Partial<Ticket> = {
        title: titleValue,
        description: descriptionValue,
        status: statusValue as any,
        priority: priorityValue as any,
        category: categories.find((c: { id: string; name: string }) => c.id === selectedCategory)?.name || 'General',
        subCategory: selectedSubCategory,
        zone: zoneValue,
        location: selectedLocation,
        branch: selectedBranch,
        branchCode: currentBranchCode,
        assignedTo: assignedToValue === 'unassigned' ? 'Unassigned' : assignedToValue,
        createdBy: selectedRequestor,
        updatedAt: new Date().toISOString(),
        childIds: selectedChildIds.length > 0 ? selectedChildIds : undefined,
      };

      await new Promise(resolve => setTimeout(resolve, 800));

      if (isEditing && ticket) {
        await updateTicket(ticket.id, ticketData);
        toast.success('Ticket updated successfully!');
      } else {
        const categoryName = categories.find((c: { id: string; name: string }) => c.id === selectedCategory)?.name || 'General';
        const assigneeId = assignedToValue === 'unassigned' ? undefined : users.find((u: User) => u.name === assignedToValue)?.id;
        await addTicket({
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
          assignedToId: assigneeId,
        } as Ticket & { categoryId?: string; assignedToId?: string });
        toast.success('Ticket created successfully!');
      }
      onSuccess();
    } catch (error) {
      toast.error('Operation failed.');
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
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            {categories.filter((c: { parentId?: string }) => !c.parentId).map((c: { id: string; name: string }) => (
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
                            {categories.filter((c: { parentId?: string }) => c.parentId === selectedCategory).map((c: { id: string; name: string }) => (
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
                    {comments.length > 0 && (
                      <Badge variant="outline" className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border-none backdrop-blur-sm">
                        {comments.length} Internal Note{comments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="space-y-6 mb-8">
                      {comments.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <MessageSquare className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="text-slate-400 text-sm font-medium">No internal communications yet</p>
                          <p className="text-slate-300 text-xs mt-1">Comments are only visible to support staff</p>
                        </div>
                      ) : (
                        <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                          {comments.map((c, index) => (
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
                                          onClick={() => {
                                            setComments(comments.filter(com => com.id !== c.id));
                                            toast.success('Comment deleted');
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
                                        onClick={() => {
                                          setComments(comments.map(com => 
                                            com.id === c.id ? { ...com, text: editingCommentText } : com
                                          ));
                                          setEditingCommentId(null);
                                          toast.success('Comment updated');
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
                          onClick={() => {
                            if (commentText.trim()) {
                              setComments([...comments, { id: Date.now().toString(), author: currentUser.name, text: commentText, timestamp: 'Just now', isCurrentUser: true }]);
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="low" className="font-bold text-blue-600 py-2.5 focus:bg-blue-50">Low Priority</SelectItem>
                          <SelectItem value="medium" className="font-bold text-amber-600 py-2.5 focus:bg-amber-50">Medium Priority</SelectItem>
                          <SelectItem value="high" className="font-bold text-orange-600 py-2.5 focus:bg-orange-50">High Priority</SelectItem>
                          <SelectItem value="urgent" className="font-bold text-rose-600 py-2.5 focus:bg-rose-50">Urgent Response</SelectItem>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="South" className="font-medium focus:bg-slate-50">South Zone</SelectItem>
                          <SelectItem value="North" className="font-medium focus:bg-slate-50">North Zone</SelectItem>
                          <SelectItem value="East" className="font-medium focus:bg-slate-50">East Zone</SelectItem>
                          <SelectItem value="West" className="font-medium focus:bg-slate-50">West Zone</SelectItem>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {selectedLocation && zoneBranches[selectedLocation]?.map(b => (
                            <SelectItem key={b.code} value={b.name} className="font-medium focus:bg-slate-50">{b.name}</SelectItem>
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
                          {filteredUsersForAssignment.map(u => (
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
                    
                    <div className="space-y-4">
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group bg-slate-50/50"
                        onClick={() => {
                          const mockFiles = [
                            { name: 'technical_report.docx', size: '1.2 MB', type: 'application/msword' },
                            { name: 'error_screenshot.jpg', size: '840 KB', type: 'image/jpeg' },
                            { name: 'config_dump.json', size: '12 KB', type: 'application/json' }
                          ];
                          const newFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                          setAttachments([...attachments, { ...newFile, name: `${Date.now().toString().slice(-4)}_${newFile.name}` }]);
                          toast.success('File attached');
                        }}
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
                      
                      <AnimatePresence>
                        {attachments.length > 0 && (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {attachments.map((file, idx) => (
                              <motion.div 
                                key={idx} 
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
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{file.size}</span>
                                  </div>
                                </div>
                                <Button 
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachments(attachments.filter((_, i) => i !== idx));
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

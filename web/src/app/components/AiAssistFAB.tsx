import { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Send, Paperclip, X } from 'lucide-react';
import { Button } from './common/ui/button';
import { Input } from './common/ui/input';
import { Textarea } from './common/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './common/ui/dialog';
import { useGetCategoriesQuery } from '@/app/store/apis/categoriesApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import { useGetSLAsQuery } from '@/app/store/apis/slasApi';
import { useGetUsersQuery } from '@/app/store/apis/usersApi';
import { useCreateTicketMutation, useUploadAttachmentMutation, useLazyGetTicketsQuery } from '@/app/store/apis/ticketsApi';
import { useParseTicketPromptMutation, useParseReportPromptMutation } from '@/app/store/apis/aiApi';
import type { User } from '@/app/types';
import type { ParsedTicketSuggestion, ParsedReportSuggestion } from '@/app/store/apis/aiApi';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type StepId =
  | 'choice'
  | 'reportDescribe'
  | 'forSelfOrRequester'
  | 'requesterUser'
  | 'describe'
  | 'editDescription'
  | 'category'
  | 'subCategory'
  | 'criticality'
  | 'zone'
  | 'branch'
  | 'assignee'
  | 'documentUpload'
  | 'review';

const STEP_ORDER: StepId[] = [
  'choice',
  'reportDescribe',
  'forSelfOrRequester',
  'requesterUser',
  'describe',
  'editDescription',
  'category',
  'subCategory',
  'criticality',
  'zone',
  'branch',
  'assignee',
  'documentUpload',
  'review',
];

const BOT_GREETING = 'Create New Ticket or Report?';

interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
  options?: { label: string; value: string }[];
}

interface AiAssistFABProps {
  currentUser: User;
  onTicketCreated?: () => void;
  hidden?: boolean;
}

export function AiAssistFAB({ currentUser, onTicketCreated, hidden }: AiAssistFABProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [createForSelf, setCreateForSelf] = useState<boolean | null>(null);
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('none');
  const [selectedSlaId, setSelectedSlaId] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>('unassigned');
  const [wantDocumentUpload, setWantDocumentUpload] = useState(false);
  const [documentUploadDone, setDocumentUploadDone] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: zones = [] } = useGetZonesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: slas = [] } = useGetSLAsQuery();
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: currentUser.role === 'customer' });
  const [createTicket, { isLoading: isSubmitting }] = useCreateTicketMutation();
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [parseTicketPrompt, { isLoading: isParsing }] = useParseTicketPromptMutation();
  const [parseReportPrompt, { isLoading: isParsingReport }] = useParseReportPromptMutation();
  const [fetchTickets] = useLazyGetTicketsQuery();

  const parentCategories = useMemo(
    () => (categories as { id: string; name: string; parentId?: string }[]).filter((c) => !c.parentId),
    [categories]
  );
  const subCategoriesForSelected = useMemo(() => {
    return (categories as { id: string; name: string; parentId?: string }[]).filter((c) => c.parentId === categoryId);
  }, [categories, categoryId]);
  /** Only zones that have at least one branch (so branch selection is possible). */
  const zoneList = useMemo(() => {
    const zList = zones as { id: string; name: string }[];
    const bList = branches as { zoneId: string }[];
    return zList.filter((z) => bList.some((b) => b.zoneId === z.id));
  }, [zones, branches]);
  const branchesForZone = useMemo(() => {
    const zoneId = zoneList.find((z) => z.name === zoneName)?.id;
    return (branches as { id: string; name: string; zoneId: string; code?: string }[]).filter((b) => b.zoneId === zoneId);
  }, [branches, zoneList, zoneName]);
  /** Criticality options: all SLAs (not filtered by category), sorted by priority. */
  const criticalityOptions = useMemo(() => {
    const all = (slas as { id: string; name: string; priority: string }[]).slice();
    const order: Array<'low' | 'medium' | 'high' | 'urgent' | 'critical'> = ['critical', 'urgent', 'high', 'medium', 'low'];
    all.sort((a, b) => order.indexOf(a.priority as any) - order.indexOf(b.priority as any));
    return all;
  }, [slas]);
  const selectedSla = useMemo(
    () => (slas as { id: string; name: string; priority: string }[]).find((s) => s.id === selectedSlaId),
    [slas, selectedSlaId]
  );
  const branchCode = useMemo(
    () => branchesForZone.find((b) => b.name === branchName)?.code ?? '',
    [branchesForZone, branchName]
  );
  const selectedZoneId = useMemo(() => zoneList.find((z) => z.name === zoneName)?.id ?? null, [zoneList, zoneName]);
  const selectedBranchId = useMemo(
    () => branchesForZone.find((b) => b.name === branchName)?.id ?? null,
    [branchesForZone, branchName]
  );
  const userList = useMemo(() => (users as { id: string; name: string }[]) || [], [users]);
  /** Assignee options: Auto-assign Engine + users in the selected zone and branch. */
  const usersForAssignee = useMemo(() => {
    const list = users as User[];
    if (!selectedZoneId || !selectedBranchId) return list;
    return list.filter((u) => u.zone === selectedZoneId && u.branch === selectedBranchId);
  }, [users, selectedZoneId, selectedBranchId]);

  const currentStep = STEP_ORDER[currentStepIndex];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (criticalityOptions.length === 0) {
      setSelectedSlaId('');
      return;
    }
    const inList = criticalityOptions.some((s) => s.id === selectedSlaId);
    if (!inList) setSelectedSlaId(criticalityOptions[0].id);
  }, [criticalityOptions, selectedSlaId]);

  useEffect(() => {
    if (assignedToId === 'unassigned') return;
    const inList = usersForAssignee.some((u) => u.id === assignedToId);
    if (!inList) setAssignedToId('unassigned');
  }, [usersForAssignee, assignedToId]);

  /** When transitioning from zone→branch or category→subCategory or branch→assignee, pass overrides so options use the just-selected value (state may not have updated yet). */
  const getNextBotMessage = (
    step: StepId,
    overrides?: { selectedZone?: string; selectedBranch?: string; selectedCategoryId?: string }
  ): ChatMessage => {
    switch (step) {
      case 'choice':
        return {
          role: 'bot',
          content: 'What would you like to do?',
          options: [{ label: 'Create New Ticket', value: 'ticket' }, { label: 'Report', value: 'report' }],
        };
      case 'reportDescribe':
        return {
          role: 'bot',
          content: "Describe the report you need (e.g. \"open tickets from John from 1 Jan to 31 Jan\", \"closed tickets between March 1 and March 15\"). I'll use AI to build the report and give you an XLS download.",
        };
      case 'forSelfOrRequester':
        return {
          role: 'bot',
          content: 'Create ticket for yourself or on behalf of someone?',
          options: [{ label: 'For myself', value: 'self' }, { label: 'On behalf of requester', value: 'requester' }],
        };
      case 'requesterUser':
        return {
          role: 'bot',
          content: 'Who is the requester? (Select the person this ticket is for)',
          options: userList.map((u) => ({ label: u.name, value: u.id })),
        };
      case 'describe':
        return {
          role: 'bot',
          content: "Describe your issue or what you need help with (e.g. \"AC not working in North zone, urgent\"). I'll use AI to suggest title and description.",
        };
      case 'editDescription':
        return {
          role: 'bot',
          content: `I've got it. Subject: ${subject}.`,
        };
      case 'category':
        return {
          role: 'bot',
          content: 'Select a category.',
          options: parentCategories.map((c) => ({ label: c.name, value: c.id })),
        };
      case 'subCategory': {
        const categoryIdForSub = overrides?.selectedCategoryId ?? categoryId;
        const subCats = (categories as { id: string; name: string; parentId?: string }[]).filter(
          (c) => c.parentId === categoryIdForSub
        );
        const categoryName = parentCategories.find((c) => c.id === categoryIdForSub)?.name;
        return {
          role: 'bot',
          content: categoryName
            ? `Select a sub-category for ${categoryName} (or None).`
            : 'Select a sub-category (or None).',
          options:
            subCats.length > 0
              ? [{ label: 'None', value: 'none' }, ...subCats.map((c) => ({ label: c.name, value: c.name }))]
              : [{ label: 'None', value: 'none' }],
        };
      }
      case 'criticality':
        return {
          role: 'bot',
          content: 'Select criticality / priority.',
          options: criticalityOptions.map((s) => ({ label: s.name, value: s.id })),
        };
      case 'zone':
        return {
          role: 'bot',
          content: 'Which zone?',
          options: zoneList.map((z) => ({ label: z.name, value: z.name })),
        };
      case 'branch': {
        const zoneForBranch = overrides?.selectedZone ?? zoneName;
        const zoneId = zoneList.find((z) => z.name === zoneForBranch)?.id;
        const branchesInZone = zoneId
          ? (branches as { id: string; name: string; zoneId: string; code?: string }[]).filter((b) => b.zoneId === zoneId)
          : [];
        return {
          role: 'bot',
          content: zoneForBranch
            ? `Any specific branch in ${zoneForBranch}?`
            : 'Any specific branch?',
          options: [{ label: 'No specific branch', value: '_none' }, ...branchesInZone.map((b) => ({ label: b.name, value: b.name }))],
        };
      }
      case 'assignee': {
        const zoneForAssignee = overrides?.selectedZone ?? zoneName;
        const branchForAssignee = overrides?.selectedBranch ?? branchName;
        const zId = zoneList.find((z) => z.name === zoneForAssignee)?.id ?? null;
        const branchesInZoneForAssignee = zId
          ? (branches as { id: string; name: string; zoneId: string }[]).filter((b) => b.zoneId === zId)
          : [];
        const bId = branchForAssignee && branchForAssignee !== '_none'
          ? branchesInZoneForAssignee.find((b) => b.name === branchForAssignee)?.id ?? null
          : null;
        const assigneeList =
          zId && bId
            ? (users as User[]).filter((u) => u.zone === zId && u.branch === bId)
            : usersForAssignee;
        return {
          role: 'bot',
          content: "Who should this be assigned to?",
          options: [
            { label: 'Auto-assign Engine', value: 'unassigned' },
            ...assigneeList.map((u) => ({ label: u.name, value: u.id })),
          ],
        };
      }
      case 'documentUpload':
        return {
          role: 'bot',
          content: 'Do you want to upload a document for reference?',
          options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
        };
      case 'review':
        return {
          role: 'bot',
          content: `Here’s your ticket:\n\n**For:** ${requesterId === currentUser.id ? currentUser.name : requesterId ? (userList.find((u) => u.id === requesterId)?.name ?? '—') : 'Myself'}\n**Subject:** ${subject}\n**Description:** ${description || '—'}\n**Category:** ${parentCategories.find((c) => c.id === categoryId)?.name ?? '—'}\n**Sub-category:** ${subCategory === 'none' ? 'Not specified' : subCategory}\n**Criticality:** ${selectedSla?.name ?? '—'}\n**Zone:** ${zoneName || '—'}\n**Branch:** ${branchName || '—'}\n**Assigned to:** ${assignedToId === 'unassigned' ? 'Auto-assign' : userList.find((u) => u.id === assignedToId)?.name ?? '—'}\n**Attachments:** ${attachmentFiles.length > 0 ? attachmentFiles.map((f) => f.name).join(', ') : 'None'}\n\nReady to submit?`,
          options: [{ label: 'Submit ticket', value: '__submit__' }],
        };
      default:
        return { role: 'bot', content: '' };
    }
  };

  const applyAnswer = (step: StepId, value: string): number => {
    switch (step) {
      case 'choice':
        if (value === 'ticket') {
          if (currentUser.role !== 'admin') {
            setCreateForSelf(true);
            setRequesterId(currentUser.id);
            return STEP_ORDER.indexOf('describe');
          }
          return 2;
        }
        return 1;
      case 'forSelfOrRequester':
        if (value === 'self') {
          setCreateForSelf(true);
          setRequesterId(null);
          return STEP_ORDER.indexOf('describe');
        }
        setCreateForSelf(false);
        return STEP_ORDER.indexOf('requesterUser');
      case 'requesterUser':
        setRequesterId(value);
        return 4;
      case 'zone':
        setZoneName(value);
        setBranchName('');
        return currentStepIndex + 1;
      case 'branch':
        setBranchName(value === '_none' ? '' : value);
        return currentStepIndex + 1;
      case 'category':
        setCategoryId(value);
        setSubCategory('none');
        return currentStepIndex + 1;
      case 'subCategory':
        setSubCategory(value);
        return currentStepIndex + 1;
      case 'criticality':
        setSelectedSlaId(value);
        return currentStepIndex + 1;
      case 'assignee':
        setAssignedToId(value);
        return currentStepIndex + 1;
      case 'documentUpload':
        if (value === 'yes') {
          setWantDocumentUpload(true);
          setDocumentUploadDone(false);
          return currentStepIndex;
        }
        setWantDocumentUpload(false);
        setDocumentUploadDone(true);
        return currentStepIndex + 1;
      default:
        return currentStepIndex + 1;
    }
  };

  const applyOpenAIResult = (result: ParsedTicketSuggestion) => {
    setSubject(result.title || 'Support request');
    setDescription(result.description || '');
    const catMatch = parentCategories.find((c) => c.name.toLowerCase() === (result.category ?? '').toLowerCase());
    const newCategoryId = catMatch?.id ?? parentCategories[0]?.id ?? '';
    setCategoryId(newCategoryId);
    setSubCategory('none');
    const catName = catMatch?.name ?? parentCategories[0]?.name ?? '';
    const filtered = (slas as { id: string; priority: string; category?: string; subCategory?: string }[]).filter(
      (s) => (s.category ?? '') === catName && (s.subCategory ?? '') === ''
    );
    const slaMatch = filtered.find((s) => s.priority === (result.priority ?? 'medium'));
    setSelectedSlaId(slaMatch?.id ?? filtered[0]?.id ?? (slas as { id: string }[])[0]?.id ?? '');
  };

  const sendUserReply = (content: string) => {
    if (currentStep === 'describe' || currentStep === 'reportDescribe') return;
    if (!content.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: content.trim() }]);
    setInputValue('');
    const nextIndex = applyAnswer(currentStep, content.trim());
    setCurrentStepIndex(nextIndex);
    const nextStep = STEP_ORDER[nextIndex];
    if (nextStep === 'documentUpload' && content.trim() === 'yes') {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Add your file(s) below, then click Continue.' }]);
    } else {
      setMessages((prev) => [...prev, getNextBotMessage(nextStep)]);
    }
  };

  const handleDescribeSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt) return;
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInputValue('');
    let result: ParsedTicketSuggestion;
    try {
      result = await parseTicketPrompt({ prompt }).unwrap();
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { fallback?: ParsedTicketSuggestion } }).data : undefined;
      if (data?.fallback) {
        result = data.fallback;
        toast.info('AI unavailable. Using your text as ticket details.');
      } else {
        toast.error('Could not process your request. Try again.');
        return;
      }
    }
    applyOpenAIResult(result);
    const summary = `I've got it. Subject: ${result.title}.`;
    setMessages((prev) => [...prev, { role: 'bot', content: summary }]);
    setCurrentStepIndex(STEP_ORDER.indexOf('editDescription'));
  };

  const handleReportDescribeSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt) return;
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInputValue('');
    let parsed: ParsedReportSuggestion = {};
    try {
      parsed = await parseReportPrompt({ prompt }).unwrap();
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { fallback?: ParsedReportSuggestion } }).data : undefined;
      if (data?.fallback) parsed = data.fallback;
      else {
        toast.error('Could not parse report request. Try again.');
        setMessages((prev) => [...prev, { role: 'bot', content: "I couldn't understand the report request. Try something like: open tickets from 1 Jan to 31 Jan." }]);
        return;
      }
    }
    const assignedToId =
      parsed.assignedToName && userList.length
        ? userList.find((u) => u.name.toLowerCase().includes(parsed.assignedToName!.toLowerCase()))?.id
        : undefined;
    const params = {
      ...(parsed.status && { status: parsed.status }),
      ...(assignedToId && { assignedTo: assignedToId }),
      ...(parsed.dateFrom && { createdAfter: parsed.dateFrom + 'T00:00:00.000Z' }),
      ...(parsed.dateTo && { createdBefore: parsed.dateTo + 'T23:59:59.999Z' }),
      ...(parsed.zone && { zone: parsed.zone }),
      limit: 500,
      offset: 0,
    };
    try {
      const tickets = await fetchTickets(params).unwrap();
      const rows = (tickets as Record<string, unknown>[]).map((t) => ({
        'Ticket #': t.ticketNumber ?? t.id,
        Title: t.title,
        Description: (t.description as string) ?? '',
        Status: t.status,
        Priority: t.priority,
        Category: t.category,
        Zone: t.zone ?? '',
        Branch: t.branch ?? '',
        'Assigned To': t.assignedTo ?? '',
        'Created By': t.createdBy ?? '',
        'Created At': t.createdAt,
        'Updated At': t.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
      const fileName = `ticket-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Report downloaded as ' + fileName);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: `Report generated. ${rows.length} ticket(s) — ${fileName} has been downloaded. You can create another report or close.`,
          options: [{ label: 'Create another report', value: '__report_again__' }, { label: 'Close', value: '__close__' }],
        },
      ]);
    } catch (err) {
      toast.error('Failed to fetch tickets for report.');
      setMessages((prev) => [...prev, { role: 'bot', content: 'Failed to generate report. Please try again.' }]);
    }
  };

  const handleOptionSelect = (value: string, label?: string) => {
    if (value === '__submit__') {
      handleSubmit();
      return;
    }
    if (value === '__close__') {
      handleOpenChange(false);
      return;
    }
    if (value === '__report_again__') {
      setCurrentStepIndex(0);
      setMessages([getNextBotMessage('choice')]);
      return;
    }
    const display = label ?? (value === 'self' ? 'For myself' : value === 'requester' ? 'On behalf of requester' : value);
    setMessages((prev) => [...prev, { role: 'user', content: display }]);
    const nextIndex = applyAnswer(currentStep, value);
    setCurrentStepIndex(nextIndex);
    const nextStep = STEP_ORDER[nextIndex];
    if (nextStep === 'documentUpload' && value === 'yes') {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Add your file(s) below, then click Continue.' }]);
    } else if (currentStep === 'zone' && nextStep === 'branch') {
      setMessages((prev) => [...prev, getNextBotMessage('branch', { selectedZone: value })]);
    } else if (currentStep === 'branch' && nextStep === 'assignee') {
      setMessages((prev) => [...prev, getNextBotMessage('assignee', { selectedZone: zoneName, selectedBranch: value })]);
    } else if (currentStep === 'category' && nextStep === 'subCategory') {
      setMessages((prev) => [...prev, getNextBotMessage('subCategory', { selectedCategoryId: value })]);
    } else {
      setMessages((prev) => [...prev, getNextBotMessage(nextStep)]);
    }
  };

  const handleDocumentContinue = () => {
    setDocumentUploadDone(true);
    const reviewIndex = STEP_ORDER.indexOf('review');
    setCurrentStepIndex(reviewIndex);
    setMessages((prev) => [...prev, getNextBotMessage('review')]);
  };

  const handleEditDescriptionContinue = () => {
    const categoryIndex = STEP_ORDER.indexOf('category');
    setCurrentStepIndex(categoryIndex);
    setMessages((prev) => [...prev, getNextBotMessage('category')]);
  };

  const handleSend = () => {
    if (currentStep === 'review') return;
    if (currentStep === 'describe') {
      handleDescribeSubmit();
      return;
    }
    if (currentStep === 'reportDescribe') {
      handleReportDescribeSubmit();
      return;
    }
    sendUserReply(inputValue);
  };

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!subject.trim()) missing.push('Title');
    if (!description.trim()) missing.push('Description');
    if (!categoryId) missing.push('Category');
    if (!zoneName) missing.push('Zone');
    if (!branchName) missing.push('Branch');
    if (!assignedToId) missing.push('Assignee');
    if (missing.length > 0) {
      toast.error('Required fields missing', { description: missing.join(', ') });
      return;
    }
    try {
      const ticket = await createTicket({
        title: subject.trim(),
        description: description.trim() || undefined,
        status: 'open',
        priority: (selectedSla?.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        categoryId: categoryId || undefined,
        subCategory: subCategory === 'none' ? undefined : subCategory,
        zone: zoneName || undefined,
        location: zoneName || undefined,
        branch: branchName || undefined,
        branchCode: branchCode || undefined,
        requesterId: requesterId || undefined,
        assignedToId: assignedToId === 'unassigned' ? undefined : assignedToId,
        slaId: selectedSlaId || undefined,
      }).unwrap();
      if (attachmentFiles.length > 0 && ticket.id) {
        for (const file of attachmentFiles) {
          try {
            await uploadAttachment({ ticketId: ticket.id, file }).unwrap();
          } catch {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }
      toast.success('Ticket created successfully');
      handleOpenChange(false);
      onTicketCreated?.();
    } catch (err) {
      toast.error('Failed to create ticket. Try again.');
    }
  };

  const resetForm = () => {
    setMessages([]);
    setInputValue('');
    setCurrentStepIndex(0);
    setCreateForSelf(null);
    setRequesterId(null);
    setSubject('');
    setDescription('');
    setCategoryId('');
    setSubCategory('none');
    setSelectedSlaId('');
    setZoneName('');
    setBranchName('');
    setAssignedToId('unassigned');
    setWantDocumentUpload(false);
    setDocumentUploadDone(false);
    setAttachmentFiles([]);
  };

  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
      setMessages([
        {
          role: 'bot',
          content: BOT_GREETING,
          options: [{ label: 'Create New Ticket', value: 'ticket' }, { label: 'Report', value: 'report' }],
        },
      ]);
    }
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    setOpen(next);
  };

  const lastMsg = messages[messages.length - 1];
  const showInput =
    (currentStep === 'describe' && lastMsg?.role === 'bot' && !lastMsg?.options?.length) ||
    (currentStep === 'reportDescribe' && lastMsg?.role === 'bot' && !lastMsg?.options?.length);
  const isDescribeStep = currentStep === 'describe';
  const isReportDescribeStep = currentStep === 'reportDescribe';
  const showDescriptionEditArea = currentStep === 'editDescription';
  const showDocumentUploadArea = currentStep === 'documentUpload' && wantDocumentUpload && !documentUploadDone;

  if (hidden) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:scale-105 transition-transform"
        size="icon"
        aria-label="AI Assist - Create ticket"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh] p-0 gap-0 fixed bottom-6 right-6 top-auto left-auto translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:slide-out-to-right-4">
          <DialogHeader className="px-5 pt-5 pb-2 border-b border-slate-200">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-5 h-5 text-violet-500" />
              AI Assist
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[280px] max-h-[50vh] space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.role === 'bot' && m.options && m.options.length > 0 && i === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.options.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={opt.value === '__submit__' ? 'default' : 'outline'}
                          size="sm"
                          className={opt.value === '__submit__' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                          onClick={() => handleOptionSelect(opt.value, opt.label)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && opt.value === '__submit__' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(isParsing || isParsingReport) && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-600 rounded-2xl px-4 py-2.5 text-sm italic">Thinking…</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showDescriptionEditArea && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-200 space-y-3">
              <p className="text-sm font-medium text-slate-700">Description (you can edit)</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="AI-generated description"
                className="min-h-[80px] resize-y rounded-xl text-sm"
                rows={4}
              />
              <Button type="button" size="sm" onClick={handleEditDescriptionContinue}>
                Continue
              </Button>
            </div>
          )}

          {showDocumentUploadArea && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-200 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setAttachmentFiles((prev) => [...prev, ...files]);
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                  Choose files
                </Button>
                <Button type="button" size="sm" onClick={handleDocumentContinue} disabled={isSubmitting}>
                  Continue
                </Button>
              </div>
              {attachmentFiles.length > 0 && (
                <ul className="text-xs text-slate-600 space-y-1">
                  {attachmentFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => setAttachmentFiles((prev) => prev.filter((_, j) => j !== i))}
                        aria-label="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {currentStep !== 'review' && showInput && !showDocumentUploadArea && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-200">
              <div className="flex gap-2">
                {isDescribeStep || isReportDescribeStep ? (
                  <Textarea
                    placeholder={isReportDescribeStep ? 'e.g. open tickets from John from 1 Jan to 31 Jan' : 'e.g. AC not working in North zone, urgent'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-h-[60px] resize-none rounded-xl"
                    rows={2}
                  />
                ) : (
                  <Input
                    placeholder="Type your answer..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="rounded-xl flex-1"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  className="rounded-xl shrink-0 bg-violet-600 hover:bg-violet-700"
                  onClick={handleSend}
                  disabled={((isDescribeStep || isReportDescribeStep) && !inputValue.trim()) || isSubmitting || isParsing || isParsingReport}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

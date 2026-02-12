import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Shield, MapPin, Building2, MoreVertical, Edit2, Trash2, X, Check, Info, Users as UsersIcon, Filter, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import { Badge } from '../common/ui/badge';
import { Input } from '../common/ui/input';
import { Label } from '../common/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../common/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../common/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../common/ui/tabs';
import { useGetUsersQuery, useUpdateUserMutation } from '@/app/store/apis/usersApi';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { User } from '@/app/types';

export function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const { data: users = [] } = useGetUsersQuery();
  const [updateUserMutation] = useUpdateUserMutation();
  
  const initialRoles = [
    { 
      name: 'Administrator', 
      id: 'admin', 
      count: 2, 
      color: 'text-red-600 bg-red-50 border-red-100',
      description: 'Full system access with ability to manage all settings and users.',
      permissions: ['Full System Access', 'User Management', 'SLA Configuration', 'Financial Reports', 'Enterprise Management', 'Security Audit Logs'] 
    },
    { 
      name: 'Manager', 
      id: 'manager', 
      count: 4, 
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'High-level oversight of departments and team performance.',
      permissions: ['Department Oversight', 'Ticket Reassignment', 'Reporting', 'Team Management', 'Internal Knowledge Base Management'] 
    },
    { 
      name: 'Support Agent', 
      id: 'agent', 
      count: 10, 
      color: 'text-green-600 bg-green-50 border-green-100',
      description: 'Standard operational access for resolving customer issues.',
      permissions: ['Ticket Resolution', 'Customer Communication', 'Internal Notes', 'SLA Tracking', 'Macros & Canned Responses'] 
    },
    { 
      name: 'Customer', 
      id: 'customer', 
      count: 150, 
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      description: 'External users seeking support and tracking their own tickets.',
      permissions: ['Ticket Creation', 'Status Tracking', 'Knowledge Base Access', 'Feedback', 'Profile Management'] 
    }
  ];

  const [roles, setRoles] = useState(initialRoles);

  // Form state for add/edit user
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'agent',
    zone: '',
    branch: '',
    location: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: '#6366f1'
  });

  // Pagination and Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRolePage, setCurrentRolePage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ field: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const [roleSortConfig, setRoleSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const recordsPerPage = 10;

  useEffect(() => {
    // Reset to first page when search or filter changes
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleSort = (field: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const getSortIcon = (field: keyof User) => {
    if (!sortConfig || sortConfig.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-600" /> 
      : <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-600" />;
  };

  const handleRoleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (roleSortConfig && roleSortConfig.field === field && roleSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setRoleSortConfig({ field, direction });
  };

  const getRoleSortIcon = (field: string) => {
    if (!roleSortConfig || roleSortConfig.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />;
    return roleSortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-600" /> 
      : <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-600" />;
  };

  const sortedAndFilteredUsers = [...users]
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { field, direction } = sortConfig;
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredUsers.length / recordsPerPage);
  const paginatedUsers = sortedAndFilteredUsers.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  useEffect(() => {
    if (editingUser) {
      const nameParts = editingUser.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setFormData({
        firstName,
        lastName,
        email: editingUser.email,
        role: editingUser.role,
        zone: editingUser.zone || '',
        branch: editingUser.branch || '',
        location: editingUser.location || '',
        status: editingUser.status
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'agent',
        zone: '',
        branch: '',
        location: '',
        status: 'active'
      });
    }
  }, [editingUser, isAddUserOpen]);

  const roleColors = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    agent: 'bg-green-100 text-green-700 border-green-200',
    customer: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  useEffect(() => {
    if (editingRole) {
      setRoleFormData({
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions,
        color: editingRole.color.split(' ')[0].replace('text-[', '').replace(']', '') || '#6366f1'
      });
    } else {
      setRoleFormData({
        name: '',
        description: '',
        permissions: [],
        color: '#6366f1'
      });
    }
  }, [editingRole, isAddRoleOpen]);

  const handleEditRoleClick = (role: any) => {
    setEditingRole(role);
    setIsAddRoleOpen(true);
  };

  const handleAddRole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? {
        ...r,
        name: roleFormData.name,
        description: roleFormData.description,
        permissions: roleFormData.permissions
      } : r));
      toast.success('Role updated successfully');
    } else {
      const newRole = {
        id: roleFormData.name.toLowerCase().replace(/\s+/g, '-'),
        name: roleFormData.name,
        count: 0,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        description: roleFormData.description,
        permissions: roleFormData.permissions
      };
      setRoles([...roles, newRole]);
      toast.success('Role created successfully');
    }
    
    setIsAddRoleOpen(false);
    setEditingRole(null);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsAddUserOpen(true);
  };

  const handleAddUserClick = () => {
    setEditingUser(null);
    setIsAddUserOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    if (editingUser) {
      try {
        await updateUserMutation({
          id: editingUser.id,
          body: { name, role: formData.role as any, zone: formData.zone, branch: formData.branch, location: formData.location, status: formData.status },
        }).unwrap();
        toast.success('User updated successfully', { description: `Changes to ${name} have been saved.` });
      } catch {
        toast.error('Failed to update user');
      }
    } else {
      toast.info('Add user via registration or backend admin.');
    }
    setIsAddUserOpen(false);
    setEditingUser(null);
  };

  const filteredAndSortedRoles = roles
    .filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) || 
                           role.id.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                           role.description.toLowerCase().includes(roleSearchQuery.toLowerCase());
      
      const matchesType = roleTypeFilter === 'all' || 
                         (roleTypeFilter === 'system' && ['admin', 'manager', 'agent', 'customer'].includes(role.id)) ||
                         (roleTypeFilter === 'custom' && !['admin', 'manager', 'agent', 'customer'].includes(role.id));
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (!roleSortConfig) return 0;
      const { field, direction } = roleSortConfig;
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const roleTotalPages = Math.ceil(filteredAndSortedRoles.length / recordsPerPage);
  const paginatedRoles = filteredAndSortedRoles.slice(
    (currentRolePage - 1) * recordsPerPage,
    currentRolePage * recordsPerPage
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Tab Navigation - Header moved to App level */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100/80 p-1 h-11 rounded-xl border border-slate-200 shadow-inner max-w-fit">
              <TabsTrigger 
                value="users" 
                className="h-9 px-6 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/50 gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                System Users
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="h-9 px-6 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/50 gap-2"
              >
                <Shield className="w-4 h-4" />
                Access Roles
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="users" className="h-full mt-0 flex flex-col gap-6 outline-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name, email or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-10 focus-visible:ring-blue-500/20"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-white border-slate-200 h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="bg-blue-600 hover:bg-blue-700 shadow-md h-10 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleAddUserClick}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col bg-white">
              {/* Static Header */}
              <div className="bg-slate-50 border-b border-slate-200 shrink-0 z-20">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-0">
                      <TableHead className="w-[30%] cursor-pointer group select-none py-3" onClick={() => handleSort('name')}>
                        <div className="flex items-center ml-4">
                          User {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[12%] cursor-pointer group select-none py-3" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[12%] cursor-pointer group select-none py-3" onClick={() => handleSort('role')}>
                        <div className="flex items-center">
                          Role {getSortIcon('role')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[20%] cursor-pointer group select-none py-3" onClick={() => handleSort('branch')}>
                        <div className="flex items-center">
                          Zone / Branch {getSortIcon('branch')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[16%] cursor-pointer group select-none py-3" onClick={() => handleSort('location')}>
                        <div className="flex items-center">
                          Location {getSortIcon('location')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[10%] text-right py-3 pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <Table className="table-fixed">
                  <TableBody>
                    {paginatedUsers.map((user, index) => {
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                        >
                          <TableCell className="w-[30%] py-3">
                            <div className="flex items-center gap-3 ml-4">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shrink-0 shadow-sm border border-white">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate">{user.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[12%] py-3">
                            <Badge className={user.status === 'active' 
                              ? "bg-green-100 text-green-700 border-green-200 shadow-none px-2 py-0" 
                              : "bg-slate-100 text-slate-600 border-slate-200 shadow-none px-2 py-0"
                            }>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[12%] py-3">
                            <Badge className={`${roleColors[user.role as keyof typeof roleColors]} shadow-none border font-medium px-2 py-0 capitalize`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[20%] py-3">
                            {user.branch ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                                  <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{user.branch}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 ml-5 font-semibold uppercase tracking-wider">
                                  {user.zone} Zone
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm italic">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="w-[16%] py-3">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{user.location || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[10%] text-right py-3 pr-8">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditClick(user)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => toast.error('Action restricted', { description: 'Cannot delete demo users.' })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{Math.min(sortedAndFilteredUsers.length, (currentPage - 1) * recordsPerPage + 1)}</span> to{' '}
                  <span className="font-medium text-slate-900">{Math.min(sortedAndFilteredUsers.length, currentPage * recordsPerPage)}</span> of{' '}
                  <span className="font-medium text-slate-900">{sortedAndFilteredUsers.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = currentPage;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="h-full mt-0 flex flex-col gap-6 outline-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by role name, ID or description..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-10 focus-visible:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={roleTypeFilter} onValueChange={setRoleTypeFilter}>
                    <SelectTrigger className="w-[160px] bg-white border-slate-200 h-10">
                      <SelectValue placeholder="Role Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Role Types</SelectItem>
                      <SelectItem value="system">System Roles</SelectItem>
                      <SelectItem value="custom">Custom Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-10 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setIsAddRoleOpen(true)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Add New Role
              </Button>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col bg-white">
              {/* Static Header for Roles */}
              <div className="bg-slate-50 border-b border-slate-200 shrink-0 z-20">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-0">
                      <TableHead className="w-[20%] cursor-pointer group select-none py-3" onClick={() => handleRoleSort('name')}>
                        <div className="flex items-center ml-4">
                          Role Name {getRoleSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[10%] cursor-pointer group select-none py-3" onClick={() => handleRoleSort('count')}>
                        <div className="flex items-center">
                          Users {getRoleSortIcon('count')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[25%] py-3">Description</TableHead>
                      <TableHead className="w-[35%] py-3">Key Permissions</TableHead>
                      <TableHead className="w-[10%] text-right py-3 pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Scrollable Body for Roles */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <Table className="table-fixed">
                  <TableBody>
                    {paginatedRoles.map((role, index) => (
                      <motion.tr
                        key={role.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <TableCell className="w-[20%] py-4">
                          <div className="flex items-center gap-3 ml-4">
                            <div className={`p-2 rounded-lg border ${role.color.replace('text-', 'border-').replace(' bg-', ' bg- opacity-50')} shadow-sm shrink-0`}>
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">{role.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{role.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[10%] py-4">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0">
                            {role.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[25%] py-4">
                          <p className="text-sm text-slate-500 leading-relaxed truncate pr-4">
                            {role.description}
                          </p>
                        </TableCell>
                        <TableCell className="w-[35%] py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.slice(0, 3).map((perm) => (
                              <span 
                                key={perm} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap"
                              >
                                {perm}
                              </span>
                            ))}
                            {role.permissions.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">+{role.permissions.length - 3} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[10%] text-right py-4 pr-8">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditRoleClick(role)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => toast.error('System Role', { description: 'Default system roles cannot be deleted.' })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer for Roles */}
              <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{Math.min(filteredAndSortedRoles.length, (currentRolePage - 1) * recordsPerPage + 1)}</span> to{' '}
                  <span className="font-medium text-slate-900">{Math.min(filteredAndSortedRoles.length, currentRolePage * recordsPerPage)}</span> of{' '}
                  <span className="font-medium text-slate-900">{filteredAndSortedRoles.length}</span> roles
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setCurrentRolePage(prev => Math.max(1, prev - 1))}
                    disabled={currentRolePage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, roleTotalPages) }, (_, i) => {
                      let pageNum = currentRolePage;
                      if (roleTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentRolePage <= 3) {
                        pageNum = i + 1;
                      } else if (currentRolePage >= roleTotalPages - 2) {
                        pageNum = roleTotalPages - 4 + i;
                      } else {
                        pageNum = currentRolePage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentRolePage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${currentRolePage === pageNum ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          onClick={() => setCurrentRolePage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setCurrentRolePage(prev => Math.min(roleTotalPages, prev + 1))}
                    disabled={currentRolePage === roleTotalPages || roleTotalPages === 0}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
          <form onSubmit={handleAddUser}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Update the user's profile and system access." 
                  : "Invite a new team member to your workspace."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    required 
                    className="bg-white" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    required 
                    className="bg-white"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  required 
                  className="bg-white"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({...formData, role: val as any})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Support Agent</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val as 'active' | 'inactive'})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Select 
                    value={formData.zone}
                    onValueChange={(val) => setFormData({...formData, zone: val})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North">North Zone</SelectItem>
                      <SelectItem value="South">South Zone</SelectItem>
                      <SelectItem value="East">East Zone</SelectItem>
                      <SelectItem value="West">West Zone</SelectItem>
                      <SelectItem value="Central">Central Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input 
                    id="branch" 
                    placeholder="e.g. Chennai Main" 
                    className="bg-white"
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="e.g. London, UK" 
                  className="bg-white"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                {editingUser ? 'Save Changes' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Role Modal */}
      <Dialog open={isAddRoleOpen} onOpenChange={(open) => {
        setIsAddRoleOpen(open);
        if (!open) setEditingRole(null);
      }}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
          <form onSubmit={handleAddRole}>
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Update the permissions for this role.' : 'Define a new set of permissions for specific team functions.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input 
                  id="roleName" 
                  placeholder="e.g. Senior Support Lead" 
                  required 
                  className="bg-white" 
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description</Label>
                <Input 
                  id="roleDesc" 
                  placeholder="Briefly describe what this role does..." 
                  className="bg-white"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {[
                    'View Tickets', 'Edit Tickets', 'Delete Tickets', 
                    'Assign Tickets', 'Manage SLA', 'View Reports',
                    'Manage Users', 'System Settings', 'Customer Data'
                  ].map((perm) => (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                      <input 
                        type="checkbox" 
                        id={perm} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={roleFormData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleFormData({...roleFormData, permissions: [...roleFormData.permissions, perm]});
                          } else {
                            setRoleFormData({...roleFormData, permissions: roleFormData.permissions.filter(p => p !== perm)});
                          }
                        }}
                      />
                      <label htmlFor={perm} className="text-sm font-medium text-slate-700 cursor-pointer">{perm}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

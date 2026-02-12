import { useState } from 'react';
import { Shield, Users as UsersIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../common/ui/tabs';
import { SystemUsersTab } from './SystemUsersTab';
import { AccessRolesTab } from './AccessRolesTab';

export function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="h-full flex flex-col bg-slate-50">
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
            <SystemUsersTab isActive={activeTab === 'users'} />
          </TabsContent>
          <TabsContent value="roles" className="h-full mt-0 flex flex-col gap-6 outline-none">
            <AccessRolesTab isActive={activeTab === 'roles'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

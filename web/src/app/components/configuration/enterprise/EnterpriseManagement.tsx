import { useState } from 'react';
import { Building2, Globe, GitBranch } from 'lucide-react';
import { EnterpriseTab } from './EnterpriseTab';
import { ZoneTab } from './ZoneTab';
import { BranchTab } from './BranchTab';

type EnterpriseTabId = 'enterprise' | 'zone' | 'branch';

const TABS: { id: EnterpriseTabId; label: string; icon: typeof Building2 }[] = [
  { id: 'enterprise', label: 'Enterprise', icon: Building2 },
  { id: 'zone', label: 'Zone', icon: Globe },
  { id: 'branch', label: 'Branch', icon: GitBranch },
];

export function EnterpriseManagement() {
  const [activeTab, setActiveTab] = useState<EnterpriseTabId>('enterprise');

  return (
    <div className="h-full overflow-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'enterprise' && <EnterpriseTab />}
        {activeTab === 'zone' && <ZoneTab />}
        {activeTab === 'branch' && <BranchTab />}
      </div>
    </div>
  );
}

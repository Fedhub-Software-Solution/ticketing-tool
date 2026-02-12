import { useState, useEffect } from 'react';
import { Save, Mail, Phone, Globe } from 'lucide-react';
import { Card } from '../../common/ui/card';
import { Button } from '../../common/ui/button';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useGetEnterpriseQuery, useUpdateEnterpriseMutation } from '@/app/store/apis/enterpriseApi';
import type { EnterpriseConfig } from '@/app/store/apis/enterpriseApi';
import { EMPTY_ENTERPRISE } from '../../common/constants';

export function EnterpriseTab() {
  const { data: enterpriseFromApi, isLoading: enterpriseLoading } = useGetEnterpriseQuery(undefined);
  const [updateEnterprise, { isLoading: enterpriseSaving }] = useUpdateEnterpriseMutation();
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseConfig>({ ...EMPTY_ENTERPRISE });

  useEffect(() => {
    if (enterpriseFromApi) {
      setEnterpriseData({ ...EMPTY_ENTERPRISE, ...enterpriseFromApi });
    }
  }, [enterpriseFromApi]);

  const handleSaveEnterprise = async () => {
    try {
      await updateEnterprise(enterpriseData).unwrap();
      toast.success('Enterprise settings saved');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || 'Failed to save enterprise settings');
    }
  };

  if (enterpriseLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-40 mb-8" />
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded" />
              ))}
            </div>
          </Card>
          <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-40 mb-8" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded" />
              ))}
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-8 px-1">Company Information</h3>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-bold text-slate-900 mb-2 block">Company Name</Label>
              <Input
                value={enterpriseData.companyName ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, companyName: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-bold text-slate-900 mb-2 block">Legal Name</Label>
              <Input
                value={enterpriseData.legalName ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, legalName: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-bold text-slate-900 mb-2 block">Registration Number</Label>
              <Input
                value={enterpriseData.regNumber ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, regNumber: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11 font-mono text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-bold text-slate-900 mb-2 block">Tax ID / VAT Number</Label>
              <Input
                value={enterpriseData.taxId ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, taxId: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11 font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-white border border-slate-200/60 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-8 px-1">Contact Information</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-slate-900" />
                <Label className="text-sm font-bold text-slate-900">Email Address</Label>
              </div>
              <Input
                value={enterpriseData.email ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, email: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-slate-900" />
                <Label className="text-sm font-bold text-slate-900">Phone Number</Label>
              </div>
              <Input
                value={enterpriseData.phone ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, phone: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-slate-900" />
                <Label className="text-sm font-bold text-slate-900">Website</Label>
              </div>
              <Input
                value={enterpriseData.website ?? ''}
                onChange={(e) => setEnterpriseData({ ...enterpriseData, website: e.target.value })}
                className="bg-slate-50/80 border-slate-100 h-11"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveEnterprise}
          disabled={enterpriseSaving}
          className="bg-[#0f766e] hover:bg-[#0d6d65] text-white shadow-sm flex items-center gap-2 h-10 px-8 rounded-lg font-medium transition-all active:scale-95 shrink-0 disabled:opacity-70"
        >
          <Save className="w-4 h-4" /> {enterpriseSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </motion.div>
  );
}

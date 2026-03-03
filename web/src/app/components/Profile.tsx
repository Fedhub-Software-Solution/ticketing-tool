import { useEffect, useState } from 'react';
import { User, Shield, Building, Edit2, Bell, Key } from 'lucide-react';
import { Button } from './common/ui/button';
import { Card } from './common/ui/card';
import { Input } from './common/ui/input';
import { Label } from './common/ui/label';
import { Badge } from './common/ui/badge';
import { User as UserType } from '../types';
import { useGetMeQuery } from '@/app/store/apis/authApi';
import { useUpdateMyProfileMutation } from '@/app/store/apis/usersApi';
import { useChangePasswordMutation } from '@/app/store/apis/authApi';
import { useGetZonesQuery } from '@/app/store/apis/zonesApi';
import { useGetBranchesQuery } from '@/app/store/apis/branchesApi';
import { toast } from 'sonner';

interface ProfileProps {
  currentUser: UserType | null;
}

export function Profile({ currentUser }: ProfileProps) {
  const { data: profile, isLoading } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const { data: zones = [] } = useGetZonesQuery();
  const { data: branches = [] } = useGetBranchesQuery();

  const user = profile ?? currentUser;
  const [name, setName] = useState('');
  const [zoneId, setZoneId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slaWarnings, setSlaWarnings] = useState(true);
  const [desktopPush, setDesktopPush] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setZoneId(profile.zone ?? '');
    setBranchId(profile.branch ?? '');
    setLocation(profile.location ?? '');
    setEmailAlerts(profile.emailAlerts ?? true);
    setSlaWarnings(profile.slaWarnings ?? true);
    setDesktopPush(profile.desktopPush ?? false);
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile({
        name: name.trim() || undefined,
        zone: zoneId || undefined,
        branch: branchId || undefined,
        location: location.trim() || undefined,
        emailAlerts,
        slaWarnings,
        desktopPush,
      }).unwrap();
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.data?.error ?? 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e?.data?.error ?? 'Failed to change password');
    }
  };

  if (!user) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh]">
        {isLoading ? (
          <p className="text-slate-500">Loading profile…</p>
        ) : (
          <p className="text-slate-500">Please log in to view your profile.</p>
        )}
      </div>
    );
  }

  const zoneName = profile?.zoneName ?? zones.find((z) => z.id === user.zone)?.name ?? user.zone ?? 'Global';
  const branchName = profile?.branchName ?? branches.find((b) => b.id === user.branch)?.name ?? user.branch ?? '—';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white overflow-hidden">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-xl border-4 border-white shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 uppercase tracking-widest text-[10px] font-black px-2.5 py-1">
                {user.role}
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-sm font-medium text-slate-500">{zoneName} Operations</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 gap-2 h-11 px-6 transition-all active:scale-95"
        >
          <Edit2 className="w-4 h-4" />
          <span className="font-bold">{isSaving ? 'Saving…' : 'Save Profile'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-slate-200/60 shadow-sm rounded-3xl space-y-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />

            <div className="relative">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 h-11 rounded-xl focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</Label>
                  <Input value={user.email} readOnly className="bg-slate-100 border-slate-200 h-11 rounded-xl text-slate-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Zone / Region</Label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="">— Select zone —</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Branch Location</Label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="">— Select branch —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Location (optional)</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Building A, Floor 2"
                    className="bg-slate-50/50 border-slate-200 h-11 rounded-xl focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="relative pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Security
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-500" />
                    Change password
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-10 rounded-lg"
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 rounded-lg"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    variant="outline"
                    size="sm"
                  >
                    {isChangingPassword ? 'Updating…' : 'Update password'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-6 border-slate-200/60 shadow-sm rounded-3xl bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -mr-16" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              Notifications
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Email Alerts', desc: 'New assignments & mentions', value: emailAlerts, set: setEmailAlerts },
                { label: 'SLA Warnings', desc: 'Breach notifications', value: slaWarnings, set: setSlaWarnings },
                { label: 'Desktop Push', desc: 'Real-time updates', value: desktopPush, set: setDesktopPush },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-[10px] text-white/50">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.value}
                    onClick={() => item.set(!item.value)}
                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${item.value ? 'bg-blue-500' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${item.value ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-slate-200/60 shadow-sm rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Organization
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zone / Region</p>
                <p className="font-bold text-slate-900">{zoneName}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Branch</p>
                <p className="font-bold text-slate-900">{branchName}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

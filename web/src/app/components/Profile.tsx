import { User, Mail, Shield, MapPin, Building, Globe, Edit2, Camera, Key, Bell, ShieldCheck } from 'lucide-react';
import { Button } from './common/ui/button';
import { Card } from './common/ui/card';
import { Input } from './common/ui/input';
import { Label } from './common/ui/label';
import { Badge } from './common/ui/badge';
import { motion } from 'motion/react';
import { User as UserType } from '../types';

interface ProfileProps {
  currentUser: UserType;
}

export function Profile({ currentUser }: ProfileProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white overflow-hidden">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-xl border-4 border-white shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentUser.name}</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 uppercase tracking-widest text-[10px] font-black px-2.5 py-1">
                {currentUser.role}
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                {currentUser.zone || 'Global'} Operations
              </span>
            </div>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 gap-2 h-11 px-6 transition-all active:scale-95">
          <Edit2 className="w-4 h-4" />
          <span className="font-bold">Edit Profile</span>
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
                  <Input defaultValue={currentUser.name} className="bg-slate-50/50 border-slate-200 h-11 rounded-xl focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</Label>
                  <Input defaultValue={currentUser.email} readOnly className="bg-slate-100 border-slate-200 h-11 rounded-xl text-slate-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Zone / Region</Label>
                  <Input defaultValue={currentUser.zone} className="bg-slate-50/50 border-slate-200 h-11 rounded-xl focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Branch Location</Label>
                  <Input defaultValue={currentUser.branch} className="bg-slate-50/50 border-slate-200 h-11 rounded-xl focus:ring-blue-500/20" />
                </div>
              </div>
            </div>

            <div className="relative pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Key className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Secure your account with an extra layer of protection.</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 font-bold px-3">ENABLED</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Session Management</p>
                      <p className="text-xs text-slate-500">View and manage all your active sessions on different devices.</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">VIEW ACTIVE</Button>
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
                { label: 'Email Alerts', desc: 'New assignments & mentions', active: true },
                { label: 'SLA Warnings', desc: 'Breach notifications', active: true },
                { label: 'Desktop Push', desc: 'Real-time updates', active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-[10px] text-white/50">{item.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${item.active ? 'bg-blue-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${item.active ? 'right-1' : 'left-1'}`} />
                  </div>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Department</p>
                <p className="font-bold text-slate-900">IT Infrastructure & Support</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Branch</p>
                <p className="font-bold text-slate-900">{currentUser.branch || 'Corporate Headquarters'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employment Type</p>
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  Full-Time 
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card } from './common/ui/card';
import { Button } from './common/ui/button';
import { Input } from './common/ui/input';
import { Label } from './common/ui/label';
import { Badge } from './common/ui/badge';
import { Shield, Users, Headphones, User as UserIcon, Lock, Mail, ChevronRight, Building2, Globe, Zap } from 'lucide-react';
import { User } from '@/app/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useLoginMutation, useRegisterMutation } from '@/app/store/apis/authApi';

interface LoginProps {
  onLogin: (user: User) => void;
  onOpenCustomerPortal?: () => void;
}

const roleInfo = {
  admin: {
    title: 'Helpdesk Admin',
    description: 'Executive oversight and strategic governance',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  manager: {
    title: 'Helpdesk Manager',
    description: 'Operational management and escalation handling',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  agent: {
    title: 'Helpdesk Agent',
    description: 'Active resolution of support requests',
    icon: Headphones,
    color: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  customer: {
    title: 'Customer',
    description: 'Enterprise client with support portal access',
    icon: UserIcon,
    color: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
};

const adminSubRoles = {
  director: { title: 'Helpdesk Admin', color: 'bg-red-600' },
  admin: { title: 'Helpdesk Admin', color: 'bg-red-600' },
};

export function Login({ onLogin, onOpenCustomerPortal }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      onLogin(res.user);
      toast.success('Login successful!', {
        description: `Welcome back, ${res.user.name}!`,
      });
    } catch {
      toast.error('Invalid credentials', {
        description: 'Please check your email and password.',
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register({ name, email, password, role: 'customer' }).unwrap();
      onLogin(res.user);
      toast.success('Registration successful!', {
        description: 'Your account has been created.',
      });
      setIsRegistering(false);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Registration failed.');
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@company.com');
    setPassword('admin123');
    toast.info('Fill credentials and click Sign in', { description: 'Or use admin@company.com / admin123' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white space-y-6 lg:pr-12"
        >
          <div className="space-y-4">
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Ticketing Management System</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Modern Support
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Ticketing System
              </span>
            </h1>
            <p className="text-lg text-slate-300">
              Streamline your customer support with powerful ticket management,
              automated workflows, and insightful analytics.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <p className="text-slate-400 text-sm">Are you a customer looking for support?</p>
            <Button 
              className="w-fit bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20"
              onClick={onOpenCustomerPortal}
            >
              <Globe className="w-4 h-4 mr-2" />
              Go to Customer Registration Portal
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            {[
              { icon: '🎯', title: 'Smart Routing', desc: 'Auto-assign tickets' },
              { icon: '⚡', title: 'Fast Response', desc: 'SLA tracking' },
              { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
              { icon: '🔔', title: 'Notifications', desc: 'Stay updated' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login/Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 shadow-2xl border-slate-200">
            <AnimatePresence mode="wait">
              {!isRegistering ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                    <p className="text-slate-600">Sign in to access your account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Sign In
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setIsRegistering(true)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Register Now
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
                    <p className="text-slate-600">Join our modern support platform</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative mt-1.5">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reg-email">Email Address</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Create Account
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => setIsRegistering(false)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isRegistering && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-2">💡 Demo</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Use admin@company.com / admin123 or customer@company.com / customer123 (after running backend seed).
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={handleDemoLogin} className="text-xs">
                    Pre-fill admin credentials
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

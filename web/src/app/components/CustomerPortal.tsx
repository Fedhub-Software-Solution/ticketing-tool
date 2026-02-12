import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './common/ui/card';
import { Button } from './common/ui/button';
import { Input } from './common/ui/input';
import { Label } from './common/ui/label';
import { Shield, User as UserIcon, Mail, Lock, CheckCircle2, ArrowRight, ArrowLeft, Globe, Zap, MessageSquare, Phone, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

import { Badge } from './common/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './common/ui/input-otp';
import { useLoginMutation } from '@/app/store/apis/authApi';

interface CustomerPortalProps {
  onBack: () => void;
  onLogin: (email: string, pass: string) => void;
  autoShowQR?: boolean;
}

export function CustomerPortal({ onBack, onLogin, autoShowQR = false }: CustomerPortalProps) {
  const [login] = useLoginMutation();
  const [mode, setMode] = useState<'landing' | 'register' | 'login' | 'otp'>('landing');
  const [showQR, setShowQR] = useState(autoShowQR);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: ''
  });

  const [showDemoInbox, setShowDemoInbox] = useState(false);
  const [lastEmailContent, setLastEmailContent] = useState<{to: string, code: string} | null>(null);
  const [registrationUrl, setRegistrationUrl] = useState('');

  useEffect(() => {
    // In a real app, this would be the actual production URL
    setRegistrationUrl(window.location.href);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setLastEmailContent({ to: 'aravindraj.n@fedhubsoftware.com', code: otp });
    
    toast.success('Email Simulation Triggered', {
      description: `A simulated verification code has been generated. Check the "Demo Inbox" popup.`
    });
    
    // Show the demo inbox after a short delay to simulate "receiving"
    setTimeout(() => {
      setShowDemoInbox(true);
    }, 1000);
    
    setMode('otp');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpValue === generatedOtp) {
      toast.success('Registration successful!', {
        description: 'Your account has been verified and created. You can now log in.'
      });
      setMode('login');
    } else {
      toast.error('Invalid OTP', {
        description: 'The verification code you entered is incorrect. Please try again.'
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email: formData.email, password: formData.password }).unwrap();
      onLogin(res.user.email, formData.password);
      toast.success('Welcome back!');
    } catch {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Support Portal</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Agent Login
        </Button>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-5xl w-full">
          <AnimatePresence mode="wait">
            {mode === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block">
                      Customer Hub
                    </Badge>
                    <h1 className="text-5xl font-extrabold text-slate-900 leading-[1.1]">
                      Your Dedicated <span className="text-blue-600">Support Portal</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Experience priority service. Submit tickets, track progress in real-time, and access our premium knowledge base.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {[
                      { icon: Zap, title: "Quick Resolution", desc: "Tickets routed to specialists instantly." },
                      { icon: Globe, title: "24/7 Access", desc: "Track your issues anytime, anywhere." },
                      { icon: MessageSquare, title: "Direct Chat", desc: "Communicate with agents seamlessly." },
                      { icon: CheckCircle2, title: "Verified Updates", desc: "Get official confirmations on every step." }
                    ].map((feature, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{feature.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button onClick={() => setMode('register')} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 shadow-lg shadow-blue-200 w-full sm:w-auto">
                      Join the Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button onClick={() => setShowQR(true)} variant="outline" size="lg" className="px-8 bg-white w-full sm:w-auto">
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan to Register
                    </Button>
                  </div>

                  <div className="pt-4">
                    <button onClick={() => setMode('login')} className="text-sm font-semibold text-blue-600 hover:underline">
                      Already have an account? Sign In
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-4 bg-blue-600/5 rounded-[2rem] blur-2xl" />
                  <Card className="relative p-8 border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full transition-transform group-hover:scale-110" />
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">Portal Preview</h3>
                          <p className="text-sm text-slate-500">Live support metrics</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-green-700">Ticket #1204 - Resolved</span>
                            <span className="text-[10px] text-green-600">2h ago</span>
                          </div>
                          <p className="text-sm text-green-800 font-medium truncate">Cloud Access Restoration complete.</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-amber-700">Ticket #1208 - In Progress</span>
                            <span className="text-[10px] text-amber-600">Just now</span>
                          </div>
                          <p className="text-sm text-amber-800 font-medium truncate">Agent Sarah is reviewing your logs...</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-blue-700">Community Post</span>
                            <span className="text-[10px] text-blue-600">New Reply</span>
                          </div>
                          <p className="text-sm text-blue-800 font-medium truncate">Check out the new SDK documentation.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {(mode === 'register' || mode === 'login' || mode === 'otp') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto w-full"
              >
                <Card className="p-8 border-slate-200 shadow-2xl bg-white">
                  <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      {mode === 'register' ? <UserIcon className="w-6 h-6 text-blue-600" /> : 
                       mode === 'otp' ? <Shield className="w-6 h-6 text-blue-600" /> :
                       <Lock className="w-6 h-6 text-blue-600" />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {mode === 'register' ? 'Join the Portal' : 
                       mode === 'otp' ? 'Verify Your Email' :
                       'Welcome Back'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                      {mode === 'register' ? 'Register to start managing your support tickets.' : 
                       mode === 'otp' ? 'Enter the code sent to aravindraj.n@fedhubsoftware.com (Check the Demo Inbox)' :
                       'Sign in to your customer account.'}
                    </p>
                  </div>

                  {mode === 'otp' ? (
                    <form onSubmit={handleVerifyOTP} className="space-y-8">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <InputOTP
                          maxLength={6}
                          value={otpValue}
                          onChange={(value) => setOtpValue(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                            <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-slate-500">
                          Didn't receive the code?{' '}
                          <button 
                            type="button" 
                            onClick={handleRegister}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Resend
                          </button>
                        </p>
                      </div>

                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={otpValue.length !== 6}>
                        Verify & Complete Registration
                      </Button>
                      
                      <button 
                        type="button" 
                        onClick={() => setMode('register')}
                        className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Registration
                      </button>
                    </form>
                  ) : (
                    <>
                      <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
                      {mode === 'register' && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              id="name" 
                              placeholder="John Doe" 
                              className="pl-9" 
                              required 
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="company">Company Name</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              id="company" 
                              placeholder="Acme Inc." 
                              className="pl-9" 
                              value={formData.company}
                              onChange={e => setFormData({...formData, company: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              id="phone" 
                              placeholder="+1 (555) 000-0000" 
                              className="pl-9" 
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@company.com" 
                          className="pl-9" 
                          required 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {mode === 'login' && (
                          <button type="button" className="text-xs text-blue-600 hover:underline">Forgot Password?</button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-9" 
                          required 
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11">
                      {mode === 'register' ? 'Create Account' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                      {mode === 'register' ? 'Already have an account?' : 'New to our portal?'}
                      <button 
                        onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                        className="ml-1 text-blue-600 font-bold hover:underline"
                      >
                        {mode === 'register' ? 'Sign In' : 'Register Now'}
                      </button>
                    </p>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Scan to Register</h3>
                <p className="text-slate-500 text-sm mt-1">Open your phone camera to scan and register on your mobile device</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6 flex justify-center">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <QRCodeSVG 
                    value={registrationUrl} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Secure Access Link</div>
                <div className="bg-slate-100 p-2 rounded-lg text-xs font-mono text-slate-600 truncate">
                  {registrationUrl}
                </div>
              </div>

              <Button onClick={() => setShowQR(false)} className="w-full mt-8 bg-slate-900 hover:bg-slate-800">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Email Inbox (For Demo Purposes) */}
      <AnimatePresence>
        {showDemoInbox && lastEmailContent && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[110] max-w-sm w-full"
          >
            <Card className="p-4 border-blue-200 bg-blue-50 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Simulated Inbox</span>
                    <button onClick={() => setShowDemoInbox(false)} className="text-blue-400 hover:text-blue-600">
                      <ArrowRight className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">New Email: Verification Code</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    To: <span className="font-semibold">{lastEmailContent.to}</span>
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 text-center">
                    <p className="text-xs text-slate-500 mb-1">Your 6-digit verification code is:</p>
                    <p className="text-2xl font-black tracking-[0.5em] text-blue-600 ml-2">
                      {lastEmailContent.code}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-white border-t border-slate-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">© 2026 Ticketing Management System Enterprise Support.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600">Terms of Service</a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600">Knowledge Base</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

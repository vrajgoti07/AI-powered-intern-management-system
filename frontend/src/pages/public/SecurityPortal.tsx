import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Smartphone, RefreshCw, KeyRound, 
  Trash2, ShieldAlert, Cpu, Laptop, Terminal, Sparkles
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';

export const SecurityPortal: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<'otp' | '2fa' | 'sessions'>('otp');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '']);
  const handleOtpChange = (val: string, index: number) => {
    if (/[^0-9]/.test(val)) return;
    setOtp(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });

    // Auto-focus next cell
    if (val && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(o => !o)) {
      toast.error("Please enter the complete 4-digit code.");
      return;
    }
    toast.success("Security Passcode authorized! Verification completed.");
    setOtp(['', '', '', '']);
  };

  // Sessions State
  const [sessions, setSessions] = useState([
    { id: 1, browser: "Chrome 124 (Windows)", ip: "192.168.1.15", date: "Current Session", active: true },
    { id: 2, browser: "Safari 17.4 (iPhone)", ip: "10.0.0.12", date: "Yesterday, 3:10 PM", active: false }
  ]);

  const terminateSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Active session terminated successfully.");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Authentication & Security Gate" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button 
              onClick={() => setActiveTab('otp')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === 'otp' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              OTP Code Authorization
            </button>
            <button 
              onClick={() => setActiveTab('2fa')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === '2fa' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Two-Factor Setup (2FA)
            </button>
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Active Client Sessions
            </button>
          </div>

          <div className="text-left">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: OTP digits */}
              {activeTab === 'otp' && (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-md mx-auto"
                >
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-base">OTP Code Verification</h3>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                        Insert the 4-digit code dispatched to your registered workspace mobile contact.
                      </p>
                    </div>

                    <form onSubmit={verifyOtp} className="space-y-6">
                      <div className="flex justify-center gap-3">
                        {otp.map((o, idx) => (
                          <input 
                            key={idx}
                            id={`otp-${idx}`}
                            type="text" 
                            maxLength={1}
                            value={o}
                            onChange={(e) => handleOtpChange(e.target.value, idx)}
                            className="w-12 h-12 text-center text-lg font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" 
                          />
                        ))}
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Authorize Access Code
                      </button>
                    </form>

                    <button 
                      type="button" 
                      onClick={() => toast.success("OTP Code re-sent successfully!")}
                      className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Two-Factor QR Setup */}
              {activeTab === '2fa' && (
                <motion.div 
                  key="2fa"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-xl mx-auto"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* QR Mock image */}
                    <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 flex items-center justify-center min-h-[180px]">
                      <div className="text-center space-y-2">
                        {/* Mock QR grid */}
                        <div className="w-24 h-24 bg-slate-900 border-4 border-white mx-auto flex items-center justify-center relative shadow-md">
                          <div className="absolute top-1 left-1 w-3 h-3 bg-white" />
                          <div className="absolute top-1 right-1 w-3 h-3 bg-white" />
                          <div className="absolute bottom-1 left-1 w-3 h-3 bg-white" />
                          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Scan with Google Authenticator</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-sm">Two-Factor Authentication Setup</h3>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                          Secure your active account using 2FA token generation. Scan the QR code, then input the verified code below.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="6-digit verification code"
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white" 
                        />
                        <button 
                          onClick={() => toast.success("Two-Factor Authentication activated successfully!")}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                        >
                          Enable 2FA Verification
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: Active Client Sessions */}
              {activeTab === 'sessions' && (
                <motion.div 
                  key="sessions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm max-w-xl mx-auto space-y-4"
                >
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight pb-3 border-b">Active Logged Clients</h3>
                  
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center text-xs font-semibold">
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Laptop className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">{s.browser}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">IP Address: {s.ip} • Logged: {s.date}</p>
                          </div>
                        </div>

                        {!s.active && (
                          <button 
                            onClick={() => terminateSession(s.id)}
                            className="p-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl transition-colors cursor-pointer"
                            title="Terminate access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {s.active && (
                          <span className="text-[9px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Current Device</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
};


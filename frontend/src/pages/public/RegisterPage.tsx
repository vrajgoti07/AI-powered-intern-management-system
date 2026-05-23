import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, ShieldAlert, Sparkles, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dept: 'Engineering',
    agree: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  const handlePasswordChange = (val: string) => {
    setFormData(prev => ({ ...prev, password: val }));

    // Simple password strength calculation
    let strength = 0;
    if (val.length >= 6) strength += 25;
    if (/[A-Z]/.test(val)) strength += 25;
    if (/[0-9]/.test(val)) strength += 25;
    if (/[^A-Za-z0-9]/.test(val)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all credentials.");
      return;
    }
    if (!formData.agree) {
      toast.error("Please accept the security compliance terms.");
      return;
    }

    toast.success("Account created successfully! Redirecting to Verification Gateway...");
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent)] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 text-left"
      >
        {/* Brand logo header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Create Candidate Account
            </h2>
            <p className="text-xs text-slate-500 font-bold">Start onboarding with InternFlow AI</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 mt-6 text-xs text-white">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-400">Corporate Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="aarav@internflow.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-400">Assigned Department</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <select
                value={formData.dept}
                onChange={(e) => setFormData(prev => ({ ...prev, dept: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-300 font-semibold"
              >
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>HR</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-400">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Password strength bar */}
            {formData.password && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Security Index</span>
                  <span className={passwordStrength > 75 ? 'text-emerald-500' : 'text-amber-500'}>
                    {passwordStrength > 75 ? 'Strong' : 'Medium'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength > 75 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} style={{ width: `${passwordStrength}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="agree"
              checked={formData.agree}
              onChange={(e) => setFormData(prev => ({ ...prev, agree: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="agree" className="text-[10px] text-slate-400 font-bold select-none cursor-pointer">
              I agree to comply with organizational confidentiality security protocols.
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-900/20 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Initialize Candidate Account
          </button>
        </form>

        <p className="text-center text-slate-500 text-[10px] font-bold mt-6">
          Registered before? <Link to="/login" className="text-indigo-400 hover:underline">Sign In Portal</Link>
        </p>

      </motion.div>
    </div>
  );
};

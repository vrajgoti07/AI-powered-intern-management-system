import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, Shield, Sparkles, User, UserCheck, ArrowRight, BarChart3, Users, Clock, Star, Zap, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '../../components/common/Logo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, sendLoginOtp, verifyLoginOtp } = useAuth();

  const [role, setRole] = useState<'hr' | 'mentor' | 'intern'>('hr');
  const [email, setEmail] = useState('hr.internflow@gmail.com');
  const [password, setPassword] = useState('hr@123456789');

  // OTP Stage States
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expiryTime, setExpiryTime] = useState(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown

  useEffect(() => {
    let timer: any;
    if (isOtpStage && expiryTime > 0) {
      timer = setInterval(() => {
        setExpiryTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStage, expiryTime]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleChange = (selectedRole: 'hr' | 'mentor' | 'intern') => {
    setRole(selectedRole);
    if (selectedRole === 'hr') {
      setEmail('hr.internflow@gmail.com');
      setPassword('hr@123456789');
    } else {
      // Clear fields so user can log in with their actual email
      setEmail('');
      setPassword('');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password."); return; }

    const loadingToast = toast.loading("Verifying credentials against backend...");
    const res = await sendLoginOtp(email, password);
    toast.dismiss(loadingToast);

    if (res.success) {
      if (res.directLogin) {
        const storedUser = localStorage.getItem('internflow_user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          const userRole = userObj.role; // maps to 'hr', 'mentor', or 'intern'
          toast.success(`Welcome back, ${userObj.name}! (Trusted Device Recognized)`);
          navigate(userRole === 'hr' ? '/hr/dashboard' : userRole === 'mentor' ? '/mentor/dashboard' : '/intern/dashboard');
        }
      } else {
        toast.success("Credentials validated! A login verification code has been dispatched.");
        setIsOtpStage(true);
        setExpiryTime(300);
        setResendCooldown(30);
      }
    }
  };

  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit passcode.');
      return;
    }

    if (expiryTime <= 0) {
      toast.error('The verification code has expired. Please request a new one.');
      return;
    }

    const loadingToast = toast.loading("Authorizing security credentials...");
    const success = await verifyLoginOtp(email, password, otpCode);
    toast.dismiss(loadingToast);

    if (success) {
      const storedUser = localStorage.getItem('internflow_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        const userRole = userObj.role; // maps to 'hr', 'mentor', or 'intern'
        toast.success(`Access Authorized! Welcome back, ${userObj.name}!`);
        navigate(userRole === 'hr' ? '/hr/dashboard' : userRole === 'mentor' ? '/mentor/dashboard' : '/intern/dashboard');
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const loadingToast = toast.loading("Resending login passcode...");
    const res = await sendLoginOtp(email, password);
    toast.dismiss(loadingToast);

    if (res.success) {
      if (res.directLogin) {
        const storedUser = localStorage.getItem('internflow_user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          const userRole = userObj.role;
          toast.success(`Welcome back, ${userObj.name}! (Trusted Device Recognized)`);
          navigate(userRole === 'hr' ? '/hr/dashboard' : userRole === 'mentor' ? '/mentor/dashboard' : '/intern/dashboard');
        }
      } else {
        toast.success("A fresh verification passcode has been dispatched!");
        setOtpCode('');
        setExpiryTime(300);
        setResendCooldown(30);
      }
    }
  };

  // Format expiry seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-slate-950">

      {/* ─── Left: Login Form (Equal 50% split) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative flex-shrink-0 z-10">

        {/* Logo */}
        <div className="px-10 pt-9 pb-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-10 h-10" iconClassName="w-5.5 h-5.5" />
            <span className="font-extrabold text-slate-800 text-xl tracking-tight">InternFlow</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-10 items-center">
          <div className="w-full max-w-md space-y-8">

            {!isOtpStage ? (
              <>
                <div className="space-y-2.5">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Welcome Back</h2>
                  <p className="text-sm font-semibold text-slate-400">Select your role and sign in to continue</p>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-100/80">
                  {[
                    { id: 'hr', label: 'HR Admin', icon: Shield },
                    { id: 'mentor', label: 'Mentor', icon: UserCheck },
                    { id: 'intern', label: 'Intern', icon: User },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id as any)}
                        className={`flex flex-col items-center gap-2 py-3.5 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer
                          ${isSelected
                            ? "bg-white text-[#2563eb] shadow-md shadow-blue-100/40 border border-blue-100 scale-[1.02]"
                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>

                {/* Form */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full text-sm font-semibold px-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm font-semibold px-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                      <input id="remember-me" type="checkbox" defaultChecked className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer accent-blue-600" />
                      <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-slate-400 cursor-pointer">Remember me</label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer">Forgot password?</button>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer group animate-fade-in"
                  >
                    Verify Credentials
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-2.5">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Identity Authorization</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    A secure 6-digit verification code has been dispatched to <strong className="text-slate-600 font-extrabold">{email}</strong>. Please enter the passcode to access the workspace.
                  </p>
                </div>

                {/* OTP verification form */}
                <form onSubmit={handleOtpVerifySubmit} className="space-y-6 text-left animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Secure Passcode</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000 000"
                      className="w-full text-center text-3xl font-black tracking-[0.4em] px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-[#2563eb] placeholder:text-slate-200"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span className={`flex items-center gap-1 ${expiryTime <= 60 ? 'text-rose-500' : 'text-slate-400'}`}>
                      <Clock className="w-4 h-4" /> Expires in: <strong className="font-extrabold">{formatTime(expiryTime)}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp}
                      className={`font-extrabold ${resendCooldown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:underline cursor-pointer'}`}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <button
                      type="submit"
                      className="w-full px-6 py-4 text-sm font-black uppercase tracking-wider text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Verify Passcode & Enter
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsOtpStage(false)}
                      className="w-full py-3 text-xs font-extrabold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-center"
                    >
                      Back to credentials
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ─── Right: Animated Visual Panel (Equal 50% split) ─── */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col items-center justify-center border-l border-slate-900">

        {/* Continuous Dynamic Morphing Mesh Background */}
        <div className="absolute inset-0 z-0 opacity-70">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[160px]" style={{ top: '-10%', left: '20%', animation: 'morphGlow 12s ease-in-out infinite alternate' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" style={{ bottom: '-10%', right: '10%', animation: 'morphGlow2 15s ease-in-out infinite alternate' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Dynamic Interactive Scene */}
        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-center space-y-10">

          {/* Headline Section */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              {/* Rotating ring frames */}
              <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/20" style={{ animation: 'spinClockwise 25s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border border-indigo-500/10" style={{ animation: 'spinCounterClockwise 18s linear infinite' }} />
              <div className="absolute inset-4 bg-blue-600/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-blue-500/25 shadow-2xl shadow-blue-950/50">
                <GraduationCap className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI-Powered Intern<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Management System</span>
            </h3>
            <p className="text-sm text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
              Streamline onboarding, track daily milestones, and automate program operations cleanly.
            </p>
          </div>

          {/* Interactive Stacked Floating Grid Cards */}
          <div className="w-full space-y-4 relative">

            {/* Card 1 */}
            <div
              className="bg-white/5 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all duration-500 shadow-2xl shadow-slate-950/80 cursor-default transform hover:-translate-y-0.5"
              style={{ animation: 'floatAnim1 6s ease-in-out infinite' }}
            >
              <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-extrabold text-white">Interactive Timelines</p>
                <p className="text-xs text-slate-400 font-medium">Track performance, milestones & feedback loops instantly</p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="bg-white/5 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all duration-500 shadow-2xl shadow-slate-950/80 cursor-default transform hover:-translate-y-0.5"
              style={{ animation: 'floatAnim2 7s ease-in-out infinite' }}
            >
              <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-extrabold text-white">Cohort Automation</p>
                <p className="text-xs text-slate-400 font-medium">Assign departments, tasks, and mentors dynamically</p>
              </div>
            </div>

          </div>

          {/* Staggered Floating Stats Bar */}
          <div className="w-full grid grid-cols-3 gap-4 pt-4">
            {[
              { val: "500+", lbl: "Active Interns" },
              { val: "98%", lbl: "Success Rate" },
              { val: "60%", lbl: "Time Saved" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/5 hover:border-blue-500/20 rounded-2xl p-4 text-center hover:bg-white/10 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] transition-all duration-500"
                style={{ animation: `floatAnim3 ${5 + i}s ease-in-out infinite` }}
              >
                <p className="text-xl font-black text-blue-400">{stat.val}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.lbl}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom subtle copyright */}
        <div className="absolute bottom-5 left-0 right-0 text-center">
          <p className="text-[10px] text-slate-600 font-semibold">© 2026 InternFlow · AI-Powered Cohort Automation</p>
        </div>
      </div>

      {/* Embedded High-Fidelity Custom Animation Styles */}
      <style>{`
        @keyframes morphGlow {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          100% { transform: translate(40px, -50px) scale(1.1) rotate(90deg); border-radius: 40% 60% 50% 50% / 50% 60% 40% 60%; }
        }
        @keyframes morphGlow2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50% 50% 60% 40% / 40% 60% 50% 50%; }
          100% { transform: translate(-30px, 40px) scale(1.05) rotate(-90deg); border-radius: 60% 40% 50% 50% / 50% 40% 60% 50%; }
        }
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinCounterClockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes floatAnim1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.5deg); }
        }
        @keyframes floatAnim2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(-0.5deg); }
        }
        @keyframes floatAnim3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

    </div>
  );
};

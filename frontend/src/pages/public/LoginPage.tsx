import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, Shield, Sparkles, User, UserCheck, ArrowRight, BarChart3, Users, Clock, Star, Zap, TrendingUp, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '../../components/common/Logo';

/**
 * Role-based redirect map.
 * Backend detects the actual role from DB — frontend just redirects accordingly.
 */
const ROLE_REDIRECT_MAP: Record<string, string> = {
  super_admin: '/admin/super-admin',
  admin: '/admin/super-admin',
  hr: '/hr/dashboard',
  department_head: '/mentor/dashboard',
  mentor: '/mentor/dashboard',
  intern: '/intern/dashboard',
};

/**
 * Resolve the correct dashboard path from the user's role string.
 */
const getDashboardPath = (role: string): string => {
  return ROLE_REDIRECT_MAP[role.toLowerCase()] || '/hr/dashboard';
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, sendLoginOtp, verifyLoginOtp, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user.originalRole || user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Cosmetic role tab — purely visual, does NOT affect authentication logic
  const [activeTab, setActiveTab] = useState<'hr' | 'mentor' | 'intern'>('hr');

  // Credential fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Stage States
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expiryTime, setExpiryTime] = useState(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown

  // OTP expiry countdown
  useEffect(() => {
    let timer: any;
    if (isOtpStage && expiryTime > 0) {
      timer = setInterval(() => {
        setExpiryTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStage, expiryTime]);

  // Resend cooldown countdown
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /**
   * Navigate user to the correct dashboard after successful authentication.
   */
  const redirectAfterLogin = () => {
    const storedUser = localStorage.getItem('internflow_user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      const userRole = userObj.originalRole || userObj.role;
      toast.success(`Welcome back, ${userObj.name}!`);
      navigate(getDashboardPath(userRole), { replace: true });
    }
  };

  /**
   * Handle credential submission.
   * Sends email + password to backend. Backend auto-detects role from DB.
   * If trusted device is recognized → direct login bypass.
   * Otherwise → OTP verification stage.
   */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password."); return; }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Verifying credentials...");

    try {
      const res = await sendLoginOtp(email, password);
      toast.dismiss(loadingToast);

      if (res.success) {
        if (res.directLogin) {
          // Trusted device recognized — skip OTP, go straight to dashboard
          redirectAfterLogin();
        } else {
          // OTP dispatched — show verification stage
          toast.success("A login verification code has been sent to your email.");
          setIsOtpStage(true);
          setExpiryTime(300);
          setResendCooldown(30);
        }
      }
    } catch {
      toast.dismiss(loadingToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle OTP verification submission.
   */
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

    setIsSubmitting(true);
    const loadingToast = toast.loading("Verifying passcode...");

    try {
      const success = await verifyLoginOtp(email, password, otpCode);
      toast.dismiss(loadingToast);

      if (success) {
        redirectAfterLogin();
      }
    } catch {
      toast.dismiss(loadingToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle OTP resend.
   */
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const loadingToast = toast.loading("Resending verification code...");
    const res = await sendLoginOtp(email, password);
    toast.dismiss(loadingToast);

    if (res.success) {
      if (res.directLogin) {
        redirectAfterLogin();
      } else {
        toast.success("A fresh verification code has been sent!");
        setOtpCode('');
        setExpiryTime(300);
        setResendCooldown(30);
      }
    }
  };

  /**
   * Format seconds into MM:SS display string.
   */
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
            <Logo size="sm" showText={false} />
            <span className="font-extrabold text-slate-800 text-xl tracking-tight">InternFlow</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-10 items-center">
          <div className="w-full max-w-md space-y-8">

            {!isOtpStage ? (
              <>
                <div className="space-y-2.5">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Welcome Back</h2>
                  <p className="text-sm font-semibold text-slate-400">Sign in with your email and password to continue</p>
                </div>



                {/* Login Form — only email + password, backend detects role */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full text-sm font-semibold px-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm font-semibold px-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 pr-12 text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                      <input id="remember-me" type="checkbox" defaultChecked className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer accent-blue-600 text-base" />
                      <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-slate-400 cursor-pointer">Remember me</label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer">Forgot password?</button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer group animate-fade-in disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {isSubmitting ? 'Verifying...' : 'Sign In'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-2.5">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Identity Verification</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    A secure 6-digit verification code has been sent to <strong className="text-slate-600 font-extrabold">{email}</strong>. Enter the code to access your workspace.
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
                      className="w-full text-center text-4xl font-black tracking-[0.4em] pl-[0.4em] py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-[#2563eb] placeholder:text-slate-200 text-base"
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
                      disabled={isSubmitting}
                      className="w-full px-6 py-4 text-sm font-black uppercase tracking-wider text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Passcode & Enter'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsOtpStage(false)}
                      className="w-full py-3 text-xs font-extrabold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-center min-h-[44px]"
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
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[140px]" style={{ bottom: '-10%', right: '10%', animation: 'morphGlow2 15s ease-in-out infinite alternate' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Dynamic Interactive Scene */}
        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-center space-y-10">

          {/* Headline Section */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              {/* Rotating ring frames */}
              <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/20" style={{ animation: 'spinClockwise 25s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border border-blue-400/10" style={{ animation: 'spinCounterClockwise 18s linear infinite' }} />
              <div className="absolute inset-4 bg-blue-600/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-blue-500/25 shadow-2xl shadow-blue-950/50">
                <GraduationCap className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI-Powered Intern<br />
              <span className="text-blue-400">Management System</span>
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
              className="bg-white/5 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all duration-500 shadow-2xl shadow-slate-950/80 cursor-default transform hover:-translate-y-0.5"
              style={{ animation: 'floatAnim2 7s ease-in-out infinite' }}
            >
              <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Mail, ShieldCheck, Sparkles, AlertCircle, KeyRound, Lock,
  Eye, EyeOff, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '../../components/common/Logo';
import api from '../../services/api';

/* ─── Password Strength Helpers ─────────────────────────────────────── */
interface StrengthResult {
  score: number;       // 0-4
  label: string;
  color: string;
  barColor: string;
}

const calcStrength = (pw: string): StrengthResult => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const map: StrengthResult[] = [
    { score: 0, label: 'Too Weak', color: 'text-red-500', barColor: 'bg-red-500' },
    { score: 1, label: 'Weak', color: 'text-orange-500', barColor: 'bg-orange-500' },
    { score: 2, label: 'Fair', color: 'text-yellow-500', barColor: 'bg-yellow-500' },
    { score: 3, label: 'Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500' },
    { score: 4, label: 'Very Strong', color: 'text-blue-500', barColor: 'bg-blue-600' },
  ];
  return map[score];
};

interface Requirement { label: string; met: boolean }
const getReqs = (pw: string): Requirement[] => [
  { label: 'At least 8 characters', met: pw.length >= 8 },
  { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(pw) },
  { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(pw) },
  { label: 'Number (0-9)', met: /[0-9]/.test(pw) },
  { label: 'Special character (!@#$…)', met: /[^A-Za-z0-9]/.test(pw) },
];

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 3 States
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const strength = calcStrength(password);
  const reqs = getReqs(password);
  const allMet = reqs.every(r => r.met);
  const matches = password === confirm && confirm.length > 0;

  // Handle Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle Redirect on Step 4
  useEffect(() => {
    if (step !== 4) return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          navigate('/login');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, navigate]);

  // OTP Box inputs change
  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newInputs = [...otpInputs];
    newInputs[index] = value;
    setOtpInputs(newInputs);

    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpInputs[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newInputs = [...otpInputs];
    for (let i = 0; i < 6; i++) {
      newInputs[i] = pastedData[i] || '';
    }
    setOtpInputs(newInputs);

    const focusIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`otp-input-${focusIndex}`);
    nextInput?.focus();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Processing request...");
    try {
      await api.post('/auth/forgot-password-send-otp', { email });
      toast.dismiss(loadingToast);
      toast.success("Verification code sent!");
      setStep(2);
      setResendCooldown(30);
      // Auto-focus the first OTP box
      setTimeout(() => {
        document.getElementById('otp-input-0')?.focus();
      }, 100);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Failed to send verification code.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const loadingToast = toast.loading("Sending new code...");
    try {
      await api.post('/auth/forgot-password-send-otp', { email });
      toast.dismiss(loadingToast);
      toast.success("New verification code sent!");
      setResendCooldown(30);
      setOtpInputs(['', '', '', '', '', '']);
      setTimeout(() => {
        document.getElementById('otp-input-0')?.focus();
      }, 100);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Failed to resend code.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpInputs.join('');
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Verifying code...");
    try {
      const response = await api.post('/auth/forgot-password-verify-otp', { email, otpCode });
      toast.dismiss(loadingToast);
      toast.success("Verification successful!");
      setResetToken(response.data.data.resetToken);
      setStep(3);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Invalid or expired code.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error("Session expired. Please try sending OTP again.");
      setStep(1);
      return;
    }
    if (!allMet) {
      toast.error("Please satisfy all password requirements.");
      return;
    }
    if (!matches) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Saving new password...");
    try {
      await api.post('/auth/reset-password', { token: resetToken, password });
      toast.dismiss(loadingToast);
      toast.success("Password updated successfully!");
      setStep(4);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Failed to reset password.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-slate-950">

      {/* ─── Left: Portal (Equal 50% split) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative flex-shrink-0 z-10">
        
        {/* Logo */}
        <div className="px-10 pt-9 pb-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" showText={false} />
            <span className="font-extrabold text-slate-800 text-xl tracking-tight">InternFlow</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-10 items-center">
          <div className="w-full max-w-md space-y-8">

            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-3.5">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md shadow-blue-100/30">
                    <KeyRound className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Reset Password</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    Enter your email to verify your account and establish a new credential.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-6 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. hr@internflow.com"
                        className="w-full text-sm font-semibold pl-12 pr-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 text-base"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-3.5">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md shadow-blue-100/30">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Verify Code</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    We sent a 6-digit passcode to <strong className="text-slate-700 font-extrabold">{email}</strong>. Enter it below to unlock password reset.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">6-Digit Verification Code</label>
                    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                      {otpInputs.map((val, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          className="w-12 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all text-slate-800"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpInputs.some(v => !v)}
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Verify and Continue</span>
                    )}
                  </button>

                  <div className="text-center pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Change Email Address
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-3.5">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md shadow-blue-100/30">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Choose New Password</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    Set a strong password for your verified account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        className="w-full text-sm font-semibold pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength Bar */}
                    {password.length > 0 && (
                      <div className="mt-3 space-y-1.5 animate-fade-in">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < strength.score ? strength.barColor : 'bg-slate-100'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-[11px] font-bold ${strength.color}`}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showCf ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className={`w-full text-sm font-semibold pl-11 pr-11 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800
                          ${confirm.length > 0
                            ? matches
                              ? 'border-emerald-400 focus:ring-emerald-400'
                              : 'border-red-400 focus:ring-red-400'
                            : 'border-slate-200 focus:ring-blue-500 focus:border-blue-400'} text-base`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCf(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirm.length > 0 && (
                      <p className={`mt-1.5 text-[11px] font-bold ${matches ? 'text-emerald-500' : 'text-red-500'}`}>
                        {matches ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  {/* Requirements Checklist */}
                  {password.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 animate-fade-in">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password Requirements</p>
                      {reqs.map(r => (
                        <div key={r.label} className="flex items-center gap-2">
                          {r.met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-[11px] font-semibold ${r.met ? 'text-slate-700' : 'text-slate-400'}`}>
                            {r.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !allMet || !matches}
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-100 border border-emerald-200"
                    style={{ animation: 'pingOnce 0.6s ease-out' }}
                  />
                  <ShieldCheck className="w-9 h-9 text-emerald-500 relative z-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Password Changed!</h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    Your password has been changed successfully. You can now log in using your new credentials.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-700">
                  Redirecting to login in <strong className="text-emerald-800">{countdown}s</strong>…
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  Go to Login Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Back to Login option (Only show in steps 1, 2, 3) */}
            {step < 4 && (
              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 text-xs font-extrabold text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Log In
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ─── Right: Animated Visual Panel (Equal 50% split) ─── */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col items-center justify-center">

        {/* Shifting Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[160px]" style={{ top: '-10%', left: '20%', animation: 'morphGlow 12s ease-in-out infinite alternate' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[140px]" style={{ bottom: '-10%', right: '10%', animation: 'morphGlow2 15s ease-in-out infinite alternate' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Visual Scene */}
        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-center space-y-10">

          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-dashed border-blue-400/30" style={{ animation: 'spinClockwise 25s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border border-blue-400/20" style={{ animation: 'spinCounterClockwise 18s linear infinite' }} />
              <div className="absolute inset-4 bg-blue-500/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-blue-400/20 shadow-2xl">
                <Lock className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Level<br />
              <span className="text-blue-400">Identity Protection</span>
            </h3>
            <p className="text-sm text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
              We leverage strict encryption frameworks and multi-factor checks to safeguard corporate directories.
            </p>
          </div>

          {/* Holographic Security Card Mockup */}
          <div className="w-full" style={{ animation: 'floatAnim 6s ease-in-out infinite' }}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl shadow-slate-950/80">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Security Protocol</span>
                </div>
                <span className="text-[9px] font-mono text-blue-400">SSL_256_BIT</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded-full w-full" />
                <div className="h-2 bg-white/10 rounded-full w-5/6" />
                <div className="h-2 bg-white/5 rounded-full w-2/3" />
              </div>
              <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Zero-Trust Directory Integration Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom subtle copyright */}
        <div className="absolute bottom-5 left-0 right-0 text-center">
          <p className="text-[10px] text-slate-700 font-semibold">© 2026 InternFlow · Corporate Security Portal</p>
        </div>
      </div>

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
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pingOnce {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

    </div>
  );
};

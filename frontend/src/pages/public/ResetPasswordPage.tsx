import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowRight,
  CheckCircle2, XCircle, KeyRound, Sparkles, ArrowLeft,
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
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const map: StrengthResult[] = [
    { score: 0, label: 'Too Weak',  color: 'text-red-500',    barColor: 'bg-red-500' },
    { score: 1, label: 'Weak',      color: 'text-orange-500', barColor: 'bg-orange-500' },
    { score: 2, label: 'Fair',      color: 'text-yellow-500', barColor: 'bg-yellow-500' },
    { score: 3, label: 'Strong',    color: 'text-emerald-500',barColor: 'bg-emerald-500' },
    { score: 4, label: 'Very Strong',color: 'text-indigo-400',barColor: 'bg-indigo-500' },
  ];
  return map[score];
};

interface Requirement { label: string; met: boolean }
const getReqs = (pw: string): Requirement[] => [
  { label: 'At least 8 characters',       met: pw.length >= 8 },
  { label: 'Uppercase letter (A-Z)',       met: /[A-Z]/.test(pw) },
  { label: 'Lowercase letter (a-z)',       met: /[a-z]/.test(pw) },
  { label: 'Number (0-9)',                 met: /[0-9]/.test(pw) },
  { label: 'Special character (!@#$…)',    met: /[^A-Za-z0-9]/.test(pw) },
];

/* ─── Main Component ──────────────────────────────────────────────────── */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') ?? '';

  const [password, setPassword]         = useState('');
  const [confirm,  setConfirm]          = useState('');
  const [showPw,   setShowPw]           = useState(false);
  const [showCf,   setShowCf]           = useState(false);
  const [loading,  setLoading]          = useState(false);
  const [success,  setSuccess]          = useState(false);
  const [countdown, setCountdown]       = useState(5);

  const strength = calcStrength(password);
  const reqs     = getReqs(password);
  const allMet   = reqs.every(r => r.met);
  const matches  = password === confirm && confirm.length > 0;

  /* auto-redirect after success */
  useEffect(() => {
    if (!success) return;
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); navigate('/login'); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [success, navigate]);

  /* missing token warning */
  useEffect(() => {
    if (!token) {
      toast.error('No setup token found. Please use the link from your email.');
    }
  }, [token]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token)    { toast.error('Invalid or missing token.'); return; }
    if (!allMet)   { toast.error('Your password does not meet the requirements.'); return; }
    if (!matches)  { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    const loadingToast = toast.loading('Setting your password…');
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.dismiss(loadingToast);
      toast.success('Password set successfully! Redirecting to login…');
      setSuccess(true);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const msg = err?.response?.data?.message ?? 'Failed to set password. The link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, password, allMet, matches]);

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-slate-950">

      {/* ─── Left: Form Panel ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative flex-shrink-0 z-10">

        {/* Logo */}
        <div className="px-10 pt-9 pb-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-10 h-10" iconClassName="w-5.5 h-5.5" />
            <span className="font-extrabold text-slate-800 text-xl tracking-tight">InternFlow</span>
          </div>
        </div>

        {/* Form / Success */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-10 items-center">
          <div className="w-full max-w-md space-y-8">

            {!success ? (
              <>
                {/* Header */}
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100/30">
                    <KeyRound className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Set Your Password
                  </h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    Create a strong, unique password to secure your InternFlow account.
                  </p>
                </div>

                {/* No token warning */}
                {!token && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700">
                      Missing activation token. Please use the exact link from your welcome email.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 text-left">

                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="rp-password"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        className="w-full text-sm font-semibold pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
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
                      <div className="mt-3 space-y-1.5">
                        <div className="flex gap-1">
                          {[0,1,2,3].map(i => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                i < strength.score ? strength.barColor : 'bg-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[11px] font-bold ${strength.color}`}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="rp-confirm"
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
                            : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-400'
                          }`}
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
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Password Requirements
                      </p>
                      {reqs.map(r => (
                        <div key={r.label} className="flex items-center gap-2">
                          {r.met
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            : <XCircle      className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          }
                          <span className={`text-[11px] font-semibold ${r.met ? 'text-slate-700' : 'text-slate-400'}`}>
                            {r.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !token || !allMet || !matches}
                    className="w-full px-6 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Set Account Password
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-4 text-xs font-extrabold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Log In
                  </button>
                </div>
              </>
            ) : (
              /* ─── Success Card ───────────────────────────────────────── */
              <div className="space-y-6 text-center animate-fade-in">
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-100 border border-emerald-200"
                    style={{ animation: 'pingOnce 0.6s ease-out' }}
                  />
                  <ShieldCheck className="w-9 h-9 text-emerald-500 relative z-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    Password Set!
                  </h2>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    Your account password has been saved securely.
                    <br />You can now log in with your new credentials.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-700">
                  Redirecting to login in <strong className="text-emerald-800">{countdown}s</strong>…
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  Go to Login Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ─── Right: Animated Visual Panel ───────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col items-center justify-center">

        {/* Shifting Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[160px]"
               style={{ top: '-10%', left: '20%', animation: 'morphGlow 12s ease-in-out infinite alternate' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[140px]"
               style={{ bottom: '-10%', right: '10%', animation: 'morphGlow2 15s ease-in-out infinite alternate' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Visual Scene */}
        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-center space-y-10">

          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400/30"
                   style={{ animation: 'spinClockwise 25s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border border-purple-500/20"
                   style={{ animation: 'spinCounterClockwise 18s linear infinite' }} />
              <div className="absolute inset-4 bg-indigo-500/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-indigo-400/20 shadow-2xl shadow-indigo-950/50">
                <Lock className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Secure Account<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Password Setup
              </span>
            </h3>
            <p className="text-sm text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
              Your account is protected with industry-standard AES-256 encryption and zero-knowledge hashing.
            </p>
          </div>

          {/* Security Feature Cards */}
          <div className="w-full space-y-4">
            {[
              { icon: ShieldCheck, color: 'indigo', title: 'End-to-End Encrypted', desc: 'Password never transmitted in plain text' },
              { icon: KeyRound,    color: 'purple', title: 'Token-Based Activation', desc: 'One-time 24-hour secure setup link' },
              { icon: Sparkles,    color: 'emerald', title: 'bcrypt Hashing',        desc: 'Military-grade salted password storage' },
            ].map((item, idx) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                indigo: 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400',
                purple: 'bg-purple-500/15 border-purple-500/20 text-purple-400',
                emerald: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
              };
              return (
                <div
                  key={item.title}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-400/30 hover:bg-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all duration-500 shadow-xl shadow-slate-950/80 cursor-default"
                  style={{ animation: `floatAnim${idx+1} ${6+idx}s ease-in-out infinite` }}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorMap[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="absolute bottom-5 left-0 right-0 text-center">
          <p className="text-[10px] text-slate-700 font-semibold">© 2026 InternFlow · Secure Identity Portal</p>
        </div>
      </div>

      <style>{`
        @keyframes morphGlow {
          0%   { transform: translate(0,0) scale(1) rotate(0deg); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          100% { transform: translate(40px,-50px) scale(1.1) rotate(90deg); border-radius: 40% 60% 50% 50% / 50% 60% 40% 60%; }
        }
        @keyframes morphGlow2 {
          0%   { transform: translate(0,0) scale(1) rotate(0deg); border-radius: 50% 50% 60% 40% / 40% 60% 50% 50%; }
          100% { transform: translate(-30px,40px) scale(1.05) rotate(-90deg); border-radius: 60% 40% 50% 50% / 50% 40% 60% 50%; }
        }
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinCounterClockwise {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes floatAnim1 {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-8px); }
        }
        @keyframes floatAnim2 {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes floatAnim3 {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-10px); }
        }
        @keyframes pingOnce {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

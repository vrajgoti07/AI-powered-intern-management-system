import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Sparkles, AlertCircle, KeyRound, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '../../components/common/Logo';
import api from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Processing your security request...");
    try {
      await api.post('/auth/forgot-password', { email });
      toast.dismiss(loadingToast);
      setSubmitted(true);
      toast.success("Security token sent to your email!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Failed to process recovery request. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-slate-950">

      {/* ─── Left: Reset Password Portal (Equal 50% split) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative flex-shrink-0 z-10">

        {/* Logo */}
        <div className="px-10 pt-9 pb-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-10 h-10" iconClassName="w-5.5 h-5.5" />
            <span className="font-extrabold text-slate-800 text-xl tracking-tight">InternFlow</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-10 items-center">
          <div className="w-full max-w-md space-y-8">

            <div className="space-y-3.5">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md shadow-blue-100/30">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Reset Password</h2>
              <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                Enter your credentials below and we'll transmit instructions to recover access.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. hr@internflow.com"
                      className="w-full text-sm font-semibold pl-12 pr-4.5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
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
                      Send Password Instructions
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Success State */
              <div className="space-y-6 text-left animate-fade-in">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5.5 h-5.5 text-emerald-500 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 mb-0.5">Recovery Link Sent</h4>
                    <p className="text-[11px] text-emerald-700/80 font-semibold leading-relaxed">
                      We have dispatched a secure authentication token to <strong className="text-emerald-800">{email}</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Check your spam folder if the transmission does not arrive within two minutes. The secure verification link is valid for 1 hour.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 text-xs font-extrabold text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Log In
              </button>
            </div>

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
      `}</style>

    </div>
  );
};

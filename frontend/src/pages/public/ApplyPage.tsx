import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, User, BookOpen, 
  Heart, FileText, Shield, Brain, Rocket, Sparkles, HelpCircle, Lock
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Email validation utilities ───────────────────────────────────────────

const BLOCKED_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net',
  'test.com', 'test.org', 'test.net',
  'fake.com', 'fake.org', 'mailinator.com',
  'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.at', 'trashmail.io',
  'yopmail.com', 'yopmail.fr', 'dispostable.com',
  'spamgourmet.com', 'throwam.com', 'throwaway.email',
  'filzmail.com', 'sharklasers.com', 'grr.la',
  'spam4.me', 'tempr.email', 'discard.email',
  'discardmail.com', 'spamspot.com', 'tempmail.com',
  'tempmail.net', 'tempmail.org', 'temp-mail.org',
  'getnada.com', 'mailnull.com', 'tempinbox.com',
  'tempemail.net', 'mailnesia.com', 'maildrop.cc',
  'fakeinbox.com', 'mailsac.com', '10minutemail.com',
  '10minutemail.net', '10minutemail.org', '20minutemail.com',
  '30minutemail.com', 'inboxbear.com', 'spamevader.com',
]);

const FAKE_LOCAL_PARTS = new Set([
  'test', 'fake', 'dummy', 'sample', 'demo',
  'placeholder', 'noreply', 'no-reply', 'donotreply',
  'do-not-reply', 'admin', 'user', 'hello', 'info',
]);

const getEditDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const COMMON_SERVICE_TYPOS = new Set([
  'gamil', 'gmaill', 'gmal', 'gail', 'gmial', 'gmeil', 'gmai', 'gml',
  'yaho', 'yhoo', 'yahooo', 'hotail', 'hotamil', 'hotmaill', 'hotmal',
  'outlok', 'outllok', 'outlookk'
]);

const isFakeDomainName = (domain: string): boolean => {
  const parts = domain.split('.');
  const name = parts[0]?.toLowerCase() || '';

  // 1. Check exact blocklist / substrings
  const blockedSubstrings = [
    'example', 'mailinator', 'yopmail', 'trashmail', 'tempmail', 
    'dispostable', 'guerrillamail', 'placeholder', 'disposable'
  ];
  if (blockedSubstrings.some(sub => name.includes(sub))) {
    return true;
  }

  // 2. Levenshtein distance checks for typos
  if (getEditDistance(name, 'example') <= 2) return true;
  if (getEditDistance(name, 'mailinator') <= 2) return true;
  if (getEditDistance(name, 'yopmail') <= 2) return true;
  
  // For short words, limit distance to <= 1 to avoid blocking legit words
  if (getEditDistance(name, 'test') <= 1) return true;
  if (getEditDistance(name, 'fake') <= 1) return true;
  if (getEditDistance(name, 'dummy') <= 1) return true;
  if (getEditDistance(name, 'temp') <= 1) return true;

  // 3. Pattern checks (e.g. test123.com, fake-site.com)
  const regexPatterns = [
    /^(test|fake|dummy|temp)\d*$/,
    /^(test|fake|dummy|temp)-/,
    /-(test|fake|dummy|temp)$/
  ];
  if (regexPatterns.some(regex => regex.test(name))) {
    return true;
  }

  // 4. Common email provider typos
  if (COMMON_SERVICE_TYPOS.has(name)) {
    return true;
  }

  return false;
};

type EmailValidationResult = {
  valid: boolean;
  error: string | null;
};

const validateEmailRealTime = (emailValue: string): EmailValidationResult => {
  const val = emailValue.trim();

  if (!val) return { valid: false, error: null }; // empty = no error shown yet

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(val)) {
    return { valid: false, error: 'Enter a valid email address (e.g. yourname@gmail.com).' };
  }

  const parts = val.split('@');
  const localPart = parts[0].toLowerCase();
  const domain = parts[1]?.toLowerCase() || '';

  // Block disposable / fake domains / typos
  if (BLOCKED_DOMAINS.has(domain) || isFakeDomainName(domain)) {
    return {
      valid: false,
      error: `Emails from "${domain}" are not accepted. Please use your personal or college email address.`,
    };
  }

  // Block fake local parts (exact match only — e.g. test@gmail.com is blocked, testuser@gmail.com is fine)
  if (FAKE_LOCAL_PARTS.has(localPart)) {
    return {
      valid: false,
      error: `"${localPart}" is not a valid personal email username. Please use your actual email address.`,
    };
  }

  // Block if domain has no proper TLD
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || domainParts.length < 2) {
    return { valid: false, error: 'Email domain appears invalid. Please check and try again.' };
  }

  // Block suspiciously short domains (e.g. x.co is fine but a.b is not)
  if (domain.length < 4) {
    return { valid: false, error: 'Email domain appears invalid. Please use a real email address.' };
  }

  return { valid: true, error: null };
};

// Check duplicate against backend (debounced — called onBlur)
const checkEmailDuplicate = async (emailValue: string): Promise<string | null> => {
  try {
    const res = await api.get(`/interns/check-email?email=${encodeURIComponent(emailValue.trim())}`);
    return null;
  } catch (err: any) {
    if (err.response?.status === 409) {
      const data = err.response?.data;
      return data?.message || 'This email address has already been used to apply.';
    }
    return null; // If check fails, don't block — backend will catch it on submit
  }
};


const stepMeta = [
  { num: 1, title: "Personal Information", subtitle: "Basic details & contact info", icon: User },
  { num: 2, title: "Academic Credentials", subtitle: "Education & technical skills", icon: BookOpen },
  { num: 3, title: "Internship Preferences", subtitle: "Department & availability", icon: Heart },
  { num: 4, title: "Review & Submit", subtitle: "Verify your application", icon: FileText },
];

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState('');
  const [dept, setDept] = useState('Engineering');
  const [duration, setDuration] = useState('3 Months');
  const [startDate, setStartDate] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Email validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailValid, setEmailValid] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const animateStep = (newStep: number) => {
    setAnimating(true);
    setTimeout(() => { setStep(newStep); setAnimating(false); }, 200);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const result = validateEmailRealTime(val);
    setEmailError(result.error);
    setEmailValid(result.valid);
  };

  const handleEmailBlur = async () => {
    if (!emailValid || !email.trim()) return;
    setEmailChecking(true);
    const duplicateError = await checkEmailDuplicate(email);
    setEmailChecking(false);
    if (duplicateError) {
      setEmailError(duplicateError);
      setEmailValid(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) { toast.error('Full name is required.'); return; }
      if (!email.trim()) { toast.error('Email address is required.'); return; }
      const result = validateEmailRealTime(email);
      if (!result.valid) {
        setEmailError(result.error);
        setEmailValid(false);
        toast.error(result.error || 'Please enter a valid email address before continuing.');
        return;
      }
      if (emailChecking) { toast.error('Please wait — verifying your email address…'); return; }
      if (!phone.trim()) { toast.error('Phone number is required.'); return; }
    }
    if (step === 2 && (!college || !cgpa)) { toast.error("Please fill in all required fields."); return; }
    if (step === 3 && (!startDate || !whyJoin)) { toast.error("Please fill in all required fields."); return; }
    animateStep(step + 1);
  };

  const prevStep = () => animateStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("You must agree to the terms."); return; }
    
    // Re-verify email validation on submit
    const result = validateEmailRealTime(email);
    if (!result.valid) {
      setEmailError(result.error);
      setEmailValid(false);
      toast.error(result.error || 'Please fix the email address before submitting.');
      return;
    }

    // Double check duplicate on submit
    setEmailChecking(true);
    const duplicateError = await checkEmailDuplicate(email);
    setEmailChecking(false);
    if (duplicateError) {
      setEmailError(duplicateError);
      setEmailValid(false);
      toast.error(duplicateError);
      return;
    }

    const loadingToast = toast.loading("Submitting your application...");

    try {
      const payload = {
        name,
        email,
        phone: phone || undefined,
        dob: dob ? new Date(dob).toISOString() : undefined,
        college,
        degree: degree || undefined,
        branch: branch || undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        dept,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        duration: duration || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        whyJoin: whyJoin || undefined,
      };

      const applyResponse = await api.post('/interns/apply', payload);

      // Trigger HR notification for the new application
      try {
        await api.post('/notifications/intern-applied', {
          internName: name,
          internEmail: email,
          position: dept,
          college: college,
          startDate: startDate,
        });
      } catch (notifError) {
        console.warn('Notification dispatch failed:', notifError);
      }

      toast.dismiss(loadingToast);
      toast.success("Application Submitted Successfully!");
      animateStep(5);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Submission error:', error);
      
      const responseData = error.response?.data;
      if (responseData) {
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          responseData.errors.forEach((err: any) => {
            const fieldName = err.field ? err.field.replace('body.', '') : '';
            const capitalizedField = fieldName ? fieldName.charAt(0).toUpperCase() + fieldName.slice(1) : '';
            const msg = err.message || 'Invalid input';
            const displayMsg = (capitalizedField && !msg.toLowerCase().includes(fieldName.toLowerCase()))
              ? `${capitalizedField}: ${msg}`
              : msg;
            toast.error(displayMsg, { duration: 5000 });
          });
        } else if (responseData.message) {
          toast.error(responseData.message);
        } else if (responseData.error) {
          toast.error(responseData.error);
        } else {
          toast.error(JSON.stringify(responseData));
        }
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Cannot connect to the server. Please check if the backend is running.");
      } else {
        toast.error(error.message || "An unexpected error occurred.");
      }
    }
  };

  const inputClass = "w-full text-base font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800";
  const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">

      {/* ─── Left Sidebar (Widened & Compact, fully fits with no scroll required) ─── */}
      <div className="hidden lg:flex w-[420px] xl:w-[460px] bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 py-8 px-9 flex-col relative overflow-hidden flex-shrink-0 border-r border-slate-200/20 max-h-screen overflow-y-auto no-scrollbar">
        
        {/* Background decorative glows */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative z-10 space-y-7">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
            <Logo size="sm" showText={false} />
            <span className="font-extrabold text-white text-lg tracking-tight">InternFlow</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight leading-tight">Apply for Internship</h2>
            <p className="text-[11px] text-blue-200/50 font-semibold leading-relaxed">Complete the 4 simple stages to launch your engineering career.</p>
          </div>

          {/* Stepper tracker list - Futuristic Isometric Timeline Blocks */}
          <div className="space-y-3">
            {stepMeta.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div 
                  key={s.num} 
                  className={`group relative flex items-center justify-between p-4.5 rounded-2xl transition-all duration-500 border overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-white/15 to-white/10 border-white/25 shadow-xl shadow-slate-950/40 translate-x-1.5' 
                      : isDone
                        ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:translate-x-1'
                        : 'bg-white/[0.01] border-white/5 opacity-75 hover:opacity-100 hover:translate-x-1'
                  }`}
                >
                  {/* Left glowing neon border indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                    isActive 
                      ? 'bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_12px_rgba(96,165,250,0.8)]' 
                      : isDone
                        ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'bg-transparent'
                  }`} />

                  {/* Huge watermark number in background */}
                  <div className={`absolute -right-3 -bottom-5 text-7xl font-black select-none pointer-events-none transition-all duration-700 ${
                    isActive ? 'text-white/[0.06] scale-110 rotate-3' : 'text-white/[0.02]'
                  }`}>
                    0{s.num}
                  </div>

                  <div className="flex items-center gap-4 relative z-10 pl-1.5">
                    {/* Icon block */}
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center transition-all duration-500 border ${
                      isDone 
                        ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                        : isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-white/5 border-white/5 text-white/40'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-white' : isDone ? 'text-white/90' : 'text-white/60'}`}>{s.title}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 transition-colors duration-300 ${isActive ? 'text-blue-200/60' : isDone ? 'text-emerald-300/40' : 'text-blue-200/30'}`}>{s.subtitle}</p>
                    </div>
                  </div>

                  {/* Active / Done status badge */}
                  {isActive && (
                    <div className="relative z-10 flex items-center gap-1 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-blue-100 animate-pulse uppercase tracking-wider flex-shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Active
                    </div>
                  )}
                  {isDone && (
                    <div className="relative z-10 flex items-center gap-1 bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-emerald-300 uppercase tracking-wider flex-shrink-0">
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer info - brought tightly below the steps list with elegant visual separation */}
        <div className="relative z-10 space-y-4 mt-6 pt-5 border-t border-white/5">
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Enterprise Security</span>
            </div>
            <p className="text-[10px] text-blue-200/40 font-semibold leading-relaxed">
              Your details are protected using zero-trust framework standards.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="w-full text-[11px] font-bold text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5 cursor-pointer transition-colors py-1.5 min-h-[44px]">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
          </button>
        </div>
      </div>

      {/* ─── Right Column Content ─── */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-slate-50">
        
        {/* Continuous Dynamic Background Glow behind the form */}
        <div className="absolute inset-0 z-0">
          <div className="absolute w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[140px]" style={{ top: '15%', right: '10%' }} />
          <div className="absolute w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px]" style={{ bottom: '15%', left: '10%' }} />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200/60 px-5 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" showText={false} />
            <span className="font-extrabold text-slate-800 text-base">InternFlow</span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Step {step}/4</span>
        </header>

        {/* Top Breadcrumb Navigation bar */}
        <div className="hidden lg:flex items-center justify-between px-12 py-5 border-b border-slate-200/50 bg-white/40 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Apply Portal</span>
            <span>/</span>
            <span className="text-[#2563eb] font-extrabold">{stepMeta[Math.min(step - 1, 3)].title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600">Secure SSL Connection Active</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto z-10 pt-6 sm:pt-6">
          
          {step < 5 ? (
            <div className={`w-full max-w-2xl transition-all duration-300 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
              
              {/* Form Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/40 overflow-hidden">
                
                {/* Card Header */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-100">
                      {React.createElement(stepMeta[step - 1].icon, { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{stepMeta[step - 1].title}</h3>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">{stepMeta[step - 1].subtitle}</p>
                    </div>
                  </div>
                  {/* Step indicators */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-6">

                  {step === 1 && (
                    <div className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>Full Name *</label>
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className={`${inputClass} text-base`} />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Email Address *
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => handleEmailChange(e.target.value)}
                              onBlur={handleEmailBlur}
                              placeholder="e.g. yourname@gmail.com"
                              className={`${inputClass} text-base pr-10 ${
                                email.trim() === ''
                                  ? ''
                                  : emailError
                                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-300 focus:border-rose-400'
                                  : emailValid
                                  ? 'border-emerald-400 bg-emerald-50/30 focus:ring-emerald-300 focus:border-emerald-400'
                                  : ''
                              }`}
                            />
                            {/* Status icon inside the input */}
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              {emailChecking && (
                                <svg className="animate-spin w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              )}
                              {!emailChecking && email.trim() !== '' && emailValid && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              {!emailChecking && email.trim() !== '' && emailError && (
                                <svg className="w-4 h-4 text-rose-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Error message */}
                          {emailError && email.trim() !== '' && (
                            <div className="mt-2 flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                              <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">{emailError}</p>
                            </div>
                          )}

                          {/* Success hint */}
                          {emailValid && !emailError && email.trim() !== '' && (
                            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Email address looks good.
                            </p>
                          )}


                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>Phone Number *</label>
                          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className={`${inputClass} text-base`} />
                        </div>
                        <div>
                          <label className={labelClass}>Date of Birth</label>
                          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`${inputClass} text-base`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <div>
                        <label className={labelClass}>University / College *</label>
                        <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. IIT Delhi" className={`${inputClass} text-base`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>Degree</label>
                          <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. B.Tech" className={`${inputClass} text-base`} />
                        </div>
                        <div>
                          <label className={labelClass}>Branch / Field</label>
                          <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. Computer Science" className={`${inputClass} text-base`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>CGPA *</label>
                          <input type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 9.1" className={`${inputClass} text-base`} />
                        </div>
                        <div>
                          <label className={labelClass}>Skills (comma separated)</label>
                          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Node, Python" className={`${inputClass} text-base`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>Preferred Department</label>
                          <select value={dept} onChange={(e) => setDept(e.target.value)} className={`${inputClass} text-base`}>
                            <option value="Engineering">Engineering</option>
                            <option value="Design">Design</option>
                            <option value="Marketing">Marketing</option>
                            <option value="HR">HR</option>
                            <option value="Finance">Finance</option>
                            <option value="AIML">AIML</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Duration</label>
                          <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputClass} text-base`}>
                            <option value="3 Months">3 Months</option>
                            <option value="4 Months">4 Months</option>
                            <option value="6 Months">6 Months</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Earliest Start Date *</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inputClass} text-base`} />
                      </div>
                      <div>
                        <label className={labelClass}>Why do you want to join us? *</label>
                        <textarea value={whyJoin} onChange={(e) => setWhyJoin(e.target.value)} placeholder="Share your professional goals, motivations, and what excites you about this internship opportunity..." className={`${`${inputClass} text-base`} h-32 resize-none`} />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-inner bg-slate-50/50 p-2">
                        {[
                          { label: "Name", value: name },
                          { label: "Email", value: email },
                          { label: "Phone", value: phone },
                          { label: "College", value: college },
                          { label: "Degree", value: `${degree} — ${branch}` },
                          { label: "CGPA", value: cgpa },
                          { label: "Department", value: dept },
                          { label: "Duration", value: duration },
                          { label: "Start Date", value: startDate },
                        ].map((item, i) => (
                          <div key={item.label} className={`flex items-start sm:items-center justify-between px-3 sm:px-4 py-3 text-xs gap-2 ${i % 2 === 0 ? 'bg-white rounded-xl' : 'bg-transparent'}`}>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">{item.label}</span>
                            <span className="font-bold text-slate-800 truncate max-w-[60%] sm:max-w-[55%] text-right">{item.value || "—"}</span>
                          </div>
                        ))}
                      </div>

                      {whyJoin && (
                        <div className="p-4 bg-blue-50/40 border border-blue-100/50 rounded-2xl">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Motivation Statement</span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed italic">"{whyJoin}"</p>
                        </div>
                      )}
                      
                      <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer select-none">
                        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded mt-0.5 flex-shrink-0 accent-blue-600 cursor-pointer text-base" />
                        <span className="text-xs font-semibold text-slate-500 leading-relaxed">
                          I certify that all details submitted in this application are completely accurate. I agree to receive official program communications.
                        </span>
                      </label>
                    </div>
                  )}

                </div>

                {/* Card Footer */}
                <div className="bg-slate-50/50 border-t border-slate-100 px-5 sm:px-8 py-4 sm:py-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {step > 1 ? (
                    <button type="button" onClick={prevStep} className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-white border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <div />}
                  {step < 4 ? (
                    <button type="button" onClick={nextStep} className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]">
                      <CheckCircle2 className="w-4 h-4" /> Submit Application
                    </button>
                  )}
                </div>

              </div>

            </div>
          ) : (
            /* Success State */
            <div className="w-full max-w-md" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/40 p-8 text-center space-y-6">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-35" />
                  <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Application Transmitted!</h2>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                    Your candidate status has been updated to <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-100">Pending Evaluation</span>.
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Our team reviews submissions continuously. Look out for password setup tokens on <strong className="text-slate-600">{email}</strong>.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button onClick={() => navigate('/')} className="w-full px-5 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]">
                    Return to Homepage
                  </button>
                  <button onClick={() => navigate('/login')} className="w-full px-5 py-3 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[44px]">
                    Go to Login Portal
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

    </div>
  );
};

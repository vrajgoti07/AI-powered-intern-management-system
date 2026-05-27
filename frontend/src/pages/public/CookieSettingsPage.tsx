import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, ShieldCheck, Info, ChevronDown, CheckCircle2, 
  Settings2, PieChart, LayoutTemplate, Megaphone, Globe
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

type CookieCategory = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
  defaultOn?: boolean;
  cookies: Array<{ name: string; provider: string; purpose: string; expiry: string }>;
};

const CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Strictly Necessary',
    description: 'These cookies are essential for the InternFlow platform to function properly. They enable core features like security, network management, and account authentication. You cannot disable these.',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    required: true,
    cookies: [
      { name: 'session_id', provider: 'InternFlow', purpose: 'Maintains user authentication state', expiry: 'Session' },
      { name: 'csrf_token', provider: 'InternFlow', purpose: 'Prevents Cross-Site Request Forgery attacks', expiry: 'Session' },
      { name: 'cookie_consent', provider: 'InternFlow', purpose: 'Stores your cookie preference choices', expiry: '1 Year' }
    ]
  },
  {
    id: 'performance',
    name: 'Performance & Analytics',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.',
    icon: <PieChart className="w-5 h-5 text-blue-400" />,
    defaultOn: true,
    cookies: [
      { name: '_ga', provider: 'Google Analytics', purpose: 'Calculates visitor, session and campaign data', expiry: '2 Years' },
      { name: '_mixpanel', provider: 'Mixpanel', purpose: 'Tracks product usage and user flows', expiry: '1 Year' },
      { name: '_hjSession', provider: 'Hotjar', purpose: 'Analyzes user interactions (heatmaps)', expiry: '30 Days' }
    ]
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'These cookies enable the platform to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    icon: <LayoutTemplate className="w-5 h-5 text-purple-400" />,
    defaultOn: true,
    cookies: [
      { name: 'intercom-session', provider: 'Intercom', purpose: 'Enables live chat support widget', expiry: '7 Days' },
      { name: 'ui_preferences', provider: 'InternFlow', purpose: 'Remembers dashboard layout choices', expiry: '1 Year' }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing & Advertising',
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.',
    icon: <Megaphone className="w-5 h-5 text-pink-400" />,
    defaultOn: false,
    cookies: [
      { name: 'li_sugr', provider: 'LinkedIn Insight', purpose: 'Used for routing and tracking conversions', expiry: '90 Days' },
      { name: '_fbp', provider: 'Meta Pixel', purpose: 'Delivers targeted advertising', expiry: '3 Months' }
    ]
  }
];

const ToggleSwitch: React.FC<{ checked: boolean; onChange?: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] ${
        checked ? 'bg-blue-600' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

const CookieCategoryCard: React.FC<{
  category: CookieCategory;
  enabled: boolean;
  onToggle: () => void;
}> = ({ category, enabled, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#121822] border border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-white/20">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-inner">
                {category.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Geist'] text-white">{category.name}</h3>
                {category.required && (
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Always Active</span>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-3xl font-['Geist']">
              {category.description}
            </p>
          </div>
          <div className="pt-2">
            <ToggleSwitch checked={enabled} onChange={onToggle} disabled={category.required} />
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors font-['Geist']"
        >
          {isExpanded ? 'Hide specific cookies' : 'View specific cookies'}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-[#0a0d12]/50 border-t border-white/5"
          >
            <div className="p-6 md:p-8 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Geist'] w-1/4">Name</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Geist'] w-1/4">Provider</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Geist'] w-2/4">Purpose</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Geist'] whitespace-nowrap">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {category.cookies.map((cookie, i) => (
                    <tr key={i} className="font-['DM_Mono'] text-sm text-slate-300">
                      <td className="py-4 text-blue-300 pr-4">{cookie.name}</td>
                      <td className="py-4 pr-4">{cookie.provider}</td>
                      <td className="py-4 text-slate-400 pr-4">{cookie.purpose}</td>
                      <td className="py-4 whitespace-nowrap">{cookie.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CookieSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    necessary: true,
    performance: true,
    functional: true,
    marketing: false
  });
  
  const [showToast, setShowToast] = useState(false);

  const toggleCategory = (id: string) => {
    if (id === 'necessary') return;
    setPreferences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const acceptAll = () => {
    setPreferences({ necessary: true, performance: true, functional: true, marketing: true });
    savePreferences();
  };

  const rejectAll = () => {
    setPreferences({ necessary: true, performance: false, functional: false, marketing: false });
    savePreferences();
  };

  const savePreferences = () => {
    // In a real app, this would save to localStorage or a backend
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white selection:bg-blue-600 selection:text-white font-['Geist'] pb-24 relative overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-[#1a2133] border border-blue-500/30 shadow-2xl shadow-blue-500/20 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Preferences Saved</div>
              <div className="text-xs text-slate-400">Your cookie settings have been updated.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Nav */}
      <nav className="fixed top-0 w-full z-40 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black font-['Geist'] tracking-tight flex items-center gap-2">
            <Logo size="sm" showText={false} />
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-6 max-w-4xl mx-auto text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-bold text-xs uppercase tracking-widest mb-8">
          <Settings2 className="w-4 h-4" /> Consent Management
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Your Privacy, <br/> Your Choice.</h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          We use cookies to improve your experience, analyze site traffic, and serve targeted advertisements. You can customize your preferences below. Your choices will be saved for 1 year.
        </p>
      </section>

      {/* Main Content Area */}
      <section className="px-6 max-w-4xl mx-auto relative z-10">
        
        {/* About Cookies Info Box */}
        <div className="bg-[#121822] border border-white/10 rounded-2xl p-8 mb-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">About our use of cookies</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Cookies are small text files that can be used by websites to make a user's experience more efficient. The law states that we can store cookies on your device if they are strictly necessary for the operation of this site. For all other types of cookies we need your permission.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Learn more about who we are, how you can contact us and how we process personal data in our <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">Privacy Policy</Link>.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-lg w-fit bg-black/20">
              <Globe className="w-3.5 h-3.5" /> Compliant with GDPR & ePrivacy Directive
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="sticky top-24 z-30 bg-[#0a0d12]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="text-sm font-medium text-slate-300">
            Set your global preferences or customize below.
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <button 
              onClick={rejectAll}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-colors"
            >
              Reject All Non-Essential
            </button>
            <button 
              onClick={acceptAll}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-bold transition-colors shadow-lg"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-6">
          {CATEGORIES.map(category => (
            <CookieCategoryCard 
              key={category.id}
              category={category}
              enabled={preferences[category.id] ?? false}
              onToggle={() => toggleCategory(category.id)}
            />
          ))}
        </div>

        {/* Save Bar */}
        <div className="mt-12 flex justify-end">
          <button 
            onClick={savePreferences}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-bold transition-colors shadow-lg shadow-blue-500/20"
          >
            Save Preferences
          </button>
        </div>

      </section>
    </div>
  );
};

export { CookieSettingsPage };

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, Shield, Lock, Server, FileCheck, AlertTriangle, 
  Database, Users, Activity, ExternalLink, ChevronDown, 
  Mail, Bug, FileLock2, Globe2, ShieldCheck, HardDrive
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

const PILLARS = [
  {
    icon: <Lock className="w-6 h-6 text-blue-400" />,
    title: 'Data Encryption',
    desc: 'All customer data is encrypted at rest using AES-256 and in transit via TLS 1.3 to ensure absolute confidentiality.'
  },
  {
    icon: <Users className="w-6 h-6 text-emerald-400" />,
    title: 'Access Controls',
    desc: 'Strict least-privilege access using Role-Based Access Control (RBAC), mandatory MFA, and SAML-based SSO.'
  },
  {
    icon: <Server className="w-6 h-6 text-purple-400" />,
    title: 'Infrastructure',
    desc: 'Hosted on AWS across multiple isolated regions with continuous monitoring and a financially backed 99.9% uptime SLA.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-pink-400" />,
    title: 'Penetration Testing',
    desc: 'We conduct rigorous annual third-party network and application penetration testing, with available summaries.'
  },
  {
    icon: <Activity className="w-6 h-6 text-amber-400" />,
    title: 'Incident Response',
    desc: 'Dedicated 24/7 security operations center with an iron-clad 24-hour critical incident response SLA.'
  },
  {
    icon: <Database className="w-6 h-6 text-cyan-400" />,
    title: 'Data Isolation',
    desc: 'Logical tenant separation ensures your intern data is strictly siloed and never leaks across organizations.'
  }
];

const FAQS = [
  { q: "Do you support SAML/SSO integrations?", a: "Yes, Enterprise plans include out-of-the-box support for SAML 2.0 and OIDC integrations with identity providers like Okta, Azure AD, and Google Workspace." },
  { q: "Where is my data hosted?", a: "By default, all data is hosted in AWS US-East and US-West regions. EU data residency is available upon request for Enterprise customers." },
  { q: "How often do you backup data?", a: "We perform automated, encrypted point-in-time database backups every 6 hours, retaining them in redundant storage across availability zones for 30 days." },
  { q: "Can I request your latest SOC 2 report?", a: "Absolutely. Current customers and prospects under an active NDA can request our latest SOC 2 Type II and ISO 27001 reports through their account executive." },
  { q: "What is your uptime SLA?", a: "We guarantee 99.9% uptime for our core API and web applications, financially backed by service credits in our Enterprise MSA." }
];

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left focus:outline-none">
        <h4 className="text-lg font-bold font-['Space_Grotesk'] pr-8">{q}</h4>
        <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <p className="pt-4 text-slate-400 text-sm font-['Space_Grotesk'] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white selection:bg-blue-600 selection:text-white font-['Space_Grotesk'] overflow-hidden relative">
      
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-40 bg-transparent border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Logo size="sm" showText={false} />
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto relative z-10 text-center">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
          className="mx-auto w-24 h-24 mb-8 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center relative"
        >
          <div className="absolute inset-0 rounded-full border-t border-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
          <Shield className="w-12 h-12 text-blue-500" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Enterprise-grade security. <br className="hidden md:block"/>Built in from day one.</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Trust is our most important feature. We safeguard your cohort data with bank-level encryption, rigorous compliance, and zero-trust architecture.
        </p>
      </section>

      {/* Compliance Badges */}
      <section className="py-12 border-y border-white/10 bg-[#0a0d12]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-10">Verified & Audited By Independent Experts</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { title: 'SOC 2 Type II', desc: 'Audited Annually' },
              { title: 'GDPR', desc: 'Fully Compliant' },
              { title: 'CCPA', desc: 'Fully Compliant' },
              { title: 'ISO 27001', desc: 'Certified Framework' }
            ].map((badge, i) => (
              <div key={i} className="p-6 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center">
                <FileCheck className="w-10 h-10 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-1">{badge.title}</h3>
                <p className="text-sm text-slate-500 font-['IBM_Plex_Mono']">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">The Six Pillars of InternFlow Security</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((pillar, i) => (
            <div key={i} className="bg-[#121822] border border-white/10 p-8 rounded-2xl hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#0d1117] border border-white/5 flex items-center justify-center mb-6">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vertical Data Flow / Protection Diagram */}
      <section className="py-24 bg-[#0a0d12] border-y border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How We Protect Your Data</h2>
          <div className="relative border-l-2 border-white/10 ml-6 space-y-12 pb-8">
            
            <div className="relative pl-10">
              <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-4 border-[#0a0d12] -left-[13px] top-1" />
              <div className="bg-[#121822] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-3 text-blue-400 font-bold font-['IBM_Plex_Mono']">
                  <Globe2 className="w-5 h-5" /> In Transit
                </div>
                <h4 className="text-xl font-bold mb-2">TLS 1.3 Encryption</h4>
                <p className="text-slate-400 text-sm">All traffic between your browser and our servers is secured with industry-standard TLS 1.3, mitigating man-in-the-middle attacks and snooping.</p>
              </div>
            </div>

            <div className="relative pl-10">
              <div className="absolute w-6 h-6 bg-purple-500 rounded-full border-4 border-[#0a0d12] -left-[13px] top-1" />
              <div className="bg-[#121822] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-3 text-purple-400 font-bold font-['IBM_Plex_Mono']">
                  <Server className="w-5 h-5" /> At The Edge
                </div>
                <h4 className="text-xl font-bold mb-2">WAF & DDoS Protection</h4>
                <p className="text-slate-400 text-sm">Our Cloudflare-backed Web Application Firewall inspects all incoming traffic, automatically dropping malicious payloads and absorbing volumetric DDoS attacks.</p>
              </div>
            </div>

            <div className="relative pl-10">
              <div className="absolute w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0a0d12] -left-[13px] top-1" />
              <div className="bg-[#121822] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-3 text-emerald-400 font-bold font-['IBM_Plex_Mono']">
                  <HardDrive className="w-5 h-5" /> At Rest
                </div>
                <h4 className="text-xl font-bold mb-2">AES-256 Storage</h4>
                <p className="text-slate-400 text-sm">Every byte of database information, uploaded document, and cached session is encrypted on disk using AES-256 with AWS Key Management Service (KMS) master keys.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Grid: Audit, Bounty, Status, Contact */}
      <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        
        {/* Audit */}
        <div className="bg-gradient-to-br from-blue-900/40 to-[#121822] border border-blue-500/20 p-8 rounded-2xl flex flex-col items-start justify-between">
          <div>
            <FileLock2 className="w-10 h-10 text-blue-400 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Audit & Compliance</h3>
            <p className="text-slate-400 text-sm mb-6">
              Review our security posture. We provide SOC 2 reports, penetration test summaries, and compliance matrices under NDA.
            </p>
          </div>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg text-sm transition-colors w-full sm:w-auto">
            Request Security Pack
          </button>
        </div>

        {/* Bug Bounty */}
        <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col items-start justify-between">
          <div>
            <Bug className="w-10 h-10 text-amber-400 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Vulnerability Disclosure</h3>
            <p className="text-slate-400 text-sm mb-6">
              We value the white-hat community. If you've found a vulnerability, please report it through our responsible disclosure program.
            </p>
          </div>
          <a href="mailto:security@internflow.io" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-sm font-['IBM_Plex_Mono']">
            disclosure@internflow.io <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Uptime */}
        <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <h3 className="text-2xl font-bold">Systems Operational</h3>
            </div>
            <div className="font-['IBM_Plex_Mono'] text-sm text-slate-400 space-y-2 mb-6 border-l-2 border-white/10 pl-4">
              <div className="flex justify-between w-64"><span className="text-white">API</span><span className="text-emerald-400">99.99%</span></div>
              <div className="flex justify-between w-64"><span className="text-white">Web App</span><span className="text-emerald-400">99.98%</span></div>
              <div className="flex justify-between w-64"><span className="text-white">Webhooks</span><span className="text-emerald-400">100.0%</span></div>
            </div>
          </div>
          <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm">
            View Status Page <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Contact */}
        <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col justify-center text-center items-center">
          <Mail className="w-12 h-12 text-slate-500 mb-6" />
          <h3 className="text-xl font-bold mb-2">Have security questions?</h3>
          <p className="text-slate-400 text-sm mb-6">Our security engineering team is happy to chat.</p>
          <a href="mailto:security@internflow.io" className="text-lg font-bold text-white hover:text-blue-400 transition-colors underline underline-offset-8">
            security@internflow.io
          </a>
        </div>

      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#0a0d12] border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Security FAQ</h2>
          <div className="bg-[#121822] border border-white/10 rounded-2xl p-6 md:p-8">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-white/10 bg-[#0d1117] py-12 px-6 text-center text-slate-500 text-sm font-['Space_Grotesk']">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} InternFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/security" className="text-white border-b border-white/20 pb-0.5">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { SecurityPage };

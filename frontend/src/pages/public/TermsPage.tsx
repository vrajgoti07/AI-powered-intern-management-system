import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, FileText, Download, ChevronDown, AlertTriangle, 
  Calendar, CheckCircle2, ScrollText, History
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'account', title: '3. Account Registration & Security' },
  { id: 'acceptable', title: '4. Acceptable Use Policy' },
  { id: 'billing', title: '5. Subscription Plans & Billing' },
  { id: 'ip', title: '6. Intellectual Property' },
  { id: 'content', title: '7. User Content & Data' },
  { id: 'privacy', title: '8. Privacy' },
  { id: 'disclaimers', title: '9. Disclaimers & Warranties' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'indemnification', title: '11. Indemnification' },
  { id: 'termination', title: '12. Termination' },
  { id: 'law', title: '13. Governing Law & Disputes' },
  { id: 'changes', title: '14. Changes to Terms' },
  { id: 'contact', title: '15. Contact Information' },
];

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-l-2 border-white/10 ml-2 pl-4 py-2 mt-4 font-['DM_Sans']">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {title}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 font-['Lora'] text-base text-slate-300">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white selection:bg-blue-600 selection:text-white print:bg-white print:text-black">
      
      {/* Minimal Nav - Hidden in print */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10 font-['DM_Sans'] print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black font-['DM_Sans'] tracking-tight flex items-center gap-2">
            <Logo size="sm" showText={false} />
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-16 border-b border-white/10 print:border-black/20 pb-12">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 font-['DM_Sans'] print:hidden">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsVersionOpen(!isVersionOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#121822] border border-white/10 hover:border-white/20 rounded-lg text-sm font-bold transition-all"
                >
                  <History className="w-4 h-4 text-slate-400" /> Version 2.1 (Current) <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                <AnimatePresence>
                  {isVersionOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-[#121822] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20"
                    >
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 font-bold text-blue-400">v2.1 (Jan 2025)</button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-400">v2.0 (Aug 2024)</button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-400">v1.0 (Nov 2022)</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 w-fit">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold font-['DM_Sans'] mb-8 tracking-tight flex items-center gap-4">
            <ScrollText className="w-12 h-12 text-blue-500" /> Terms of Service
          </h1>
          
          <div className="flex flex-wrap gap-6 font-['DM_Sans'] text-slate-400 text-sm">
            <div className="flex items-center gap-2 print:text-black">
              <Calendar className="w-4 h-4" /> <strong>Effective Date:</strong> January 25, 2025
            </div>
            <div className="flex items-center gap-2 print:text-black">
              <FileText className="w-4 h-4" /> <strong>Last Revised:</strong> January 15, 2025
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar TOC - Hidden in print */}
          <aside className="lg:w-1/4 hidden lg:block print:hidden relative">
            <div className="sticky top-32">
              <h3 className="text-sm font-bold font-['DM_Sans'] text-slate-400 uppercase tracking-widest mb-6">Table of Contents</h3>
              <nav className="space-y-3 font-['DM_Sans'] text-sm">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block text-left w-full transition-colors ${
                      activeSection === section.id 
                        ? 'text-blue-400 font-bold border-l-2 border-blue-500 pl-3' 
                        : 'text-slate-400 hover:text-white border-l-2 border-transparent pl-3'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Legal Content */}
          <main className="lg:w-3/4 font-['Lora'] text-lg text-slate-300 print:text-black leading-relaxed space-y-20">
            
            {/* 1. Acceptance */}
            <section id="acceptance" ref={(el) => { sectionRefs.current[0] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">1. Acceptance of Terms</h2>
              <div className="space-y-4">
                <p>By accessing or using the InternFlow SaaS platform, websites, and associated services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>
                <p>If you are using the Service on behalf of an organization (e.g., your employer), you represent and warrant that you have the authority to bind that organization to these Terms.</p>
              </div>
            </section>

            {/* 2. Description */}
            <section id="description" ref={(el) => { sectionRefs.current[1] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">2. Description of Service</h2>
              <div className="space-y-4">
                <p>InternFlow is an AI-powered intern cohort management and workflow automation platform. The Service includes software, algorithms, databases, interfaces, and related documentation provided by InternFlow Inc.</p>
                <CollapsibleSection title="View beta features terms">
                  <p>Occasionally, we may offer beta features. These are provided "as-is" without any warranties and may be modified or removed at our sole discretion. Use of beta features is entirely at your own risk.</p>
                </CollapsibleSection>
              </div>
            </section>

            {/* 3. Account */}
            <section id="account" ref={(el) => { sectionRefs.current[2] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">3. Account Registration & Security</h2>
              <div className="space-y-4">
                <p>To use certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>
                <p>You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
              </div>
            </section>

            {/* 4. Acceptable Use */}
            <section id="acceptable" ref={(el) => { sectionRefs.current[3] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">4. Acceptable Use Policy</h2>
              <div className="space-y-4">
                <p>You agree not to engage in any of the following prohibited activities:</p>
                <ul className="list-disc pl-6 space-y-2 marker:text-slate-500">
                  <li>Using the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
                  <li>Violating, or encouraging others to violate, any right of a third party, including intellectual property rights.</li>
                  <li>Attempting to interfere with the security or proper functioning of the Service.</li>
                  <li>Selling, reselling, or leasing the Service unless explicitly authorized in writing.</li>
                </ul>
              </div>
            </section>

            {/* 5. Billing */}
            <section id="billing" ref={(el) => { sectionRefs.current[4] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">5. Subscription Plans & Billing</h2>
              <div className="space-y-4">
                <p>Access to certain features of the Service requires a paid subscription. You will be billed in advance on a recurring, periodic basis (e.g., monthly or annually).</p>
                <CollapsibleSection title="Refund Policy Details">
                  <p>All fees are non-refundable unless otherwise required by law or explicitly stated in your Enterprise Master Services Agreement. If you cancel your subscription, you will retain access to the Service until the end of your current billing cycle.</p>
                </CollapsibleSection>
              </div>
            </section>

            {/* 6. Intellectual Property */}
            <section id="ip" ref={(el) => { sectionRefs.current[5] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">6. Intellectual Property</h2>
              <div className="space-y-4">
                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of InternFlow Inc. and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>
              </div>
            </section>

            {/* 7. User Content */}
            <section id="content" ref={(el) => { sectionRefs.current[6] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">7. User Content & Data</h2>
              <div className="space-y-4">
                <p>You retain all rights to any data, information, or material you submit to the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and process the User Content solely for the purpose of providing and improving the Service.</p>
              </div>
            </section>

            {/* 8. Privacy */}
            <section id="privacy" ref={(el) => { sectionRefs.current[7] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">8. Privacy</h2>
              <div className="space-y-4">
                <p>Our collection and use of personal information in connection with the Service is described in our <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.</p>
              </div>
            </section>

            {/* 9. Disclaimers */}
            <section id="disclaimers" ref={(el) => { sectionRefs.current[8] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">9. Disclaimers & Warranties</h2>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 my-6 font-['DM_Sans'] print:bg-amber-50 print:border-amber-300">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-500 print:text-amber-800 text-base mb-1">Important Clause: "As-Is" Provision</h4>
                    <p className="text-sm text-amber-200/80 print:text-amber-900 leading-normal font-['Lora'] italic">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 10. Liability */}
            <section id="liability" ref={(el) => { sectionRefs.current[9] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">10. Limitation of Liability</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 my-6 font-['DM_Sans'] print:bg-amber-50 print:border-amber-300">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-500 print:text-amber-800 text-base mb-1">Important Clause: Liability Cap</h4>
                    <p className="text-sm text-amber-200/80 print:text-amber-900 leading-normal font-['Lora'] italic">IN NO EVENT SHALL INTERNFLOW, NOR ITS DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 11. Indemnification */}
            <section id="indemnification" ref={(el) => { sectionRefs.current[10] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">11. Indemnification</h2>
              <div className="space-y-4">
                <p>You agree to defend, indemnify, and hold harmless InternFlow Inc. and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses resulting from or arising out of a) your use and access of the Service, or b) a breach of these Terms.</p>
              </div>
            </section>

            {/* 12. Termination */}
            <section id="termination" ref={(el) => { sectionRefs.current[11] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">12. Termination</h2>
              <div className="space-y-4">
                <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
              </div>
            </section>

            {/* 13. Law */}
            <section id="law" ref={(el) => { sectionRefs.current[12] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">13. Governing Law & Disputes</h2>
              <div className="space-y-4">
                <p>These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
                <CollapsibleSection title="Arbitration Agreement">
                  <p>Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach thereof, shall be settled by arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.</p>
                </CollapsibleSection>
              </div>
            </section>

            {/* 14. Changes */}
            <section id="changes" ref={(el) => { sectionRefs.current[13] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">14. Changes to Terms</h2>
              <div className="space-y-4">
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
              </div>
            </section>

            {/* 15. Contact */}
            <section id="contact" ref={(el) => { sectionRefs.current[14] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">15. Contact Information</h2>
              <div className="space-y-4">
                <p>If you have any questions about these Terms, please contact our Legal team:</p>
                <div className="bg-[#121822] border border-white/10 print:bg-white print:border-black/20 p-6 rounded-xl font-['DM_Sans'] mt-6">
                  <div className="font-bold text-white print:text-black mb-1">InternFlow Legal Department</div>
                  <a href="mailto:legal@internflow.com" className="text-blue-400 hover:text-blue-300 print:text-blue-600 font-bold">legal@internflow.com</a>
                  <div className="mt-4 pt-4 border-t border-white/10 print:border-black/10 text-sm text-slate-500 print:text-slate-500">
                    100 Market St, Suite 400<br/>
                    San Francisco, CA 94105
                  </div>
                </div>
              </div>
            </section>
            
          </main>
        </div>
      </div>

      {/* Footer Placeholder - Hidden in print */}
      <footer className="border-t border-white/10 bg-[#0a0d12] py-8 px-6 text-center text-slate-500 text-sm font-['DM_Sans'] mt-20 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} InternFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-white border-b border-white/20 pb-0.5">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { TermsPage };

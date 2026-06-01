import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, FileText, Globe, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

const SECTIONS = [
  { id: 'intro', title: '1. Introduction & Overview' },
  { id: 'collect', title: '2. Information We Collect' },
  { id: 'use', title: '3. How We Use Your Information' },
  { id: 'sharing', title: '4. Data Sharing & Third Parties' },
  { id: 'retention', title: '5. Data Retention' },
  { id: 'rights', title: '6. Your Privacy Rights' },
  { id: 'cookies', title: '7. Cookies & Tracking' },
  { id: 'security', title: '8. Data Security' },
  { id: 'transfers', title: '9. International Transfers' },
  { id: 'children', title: '10. Children\'s Privacy' },
  { id: 'changes', title: '11. Changes to This Policy' },
  { id: 'contact', title: '12. Contact Us' },
];

const PrivacyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
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
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 sm:pt-32 pb-12 sm:pb-24 px-5 sm:px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-16 border-b border-white/10 print:border-black/20 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300 mb-6 font-['DM_Sans'] print:text-black print:border-black/20">
            <FileText className="w-4 h-4" /> Last updated: January 15, 2025
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-['DM_Sans'] mb-5 sm:mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="flex flex-wrap gap-4 font-['DM_Sans']">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-bold print:border-blue-800 print:text-blue-800">
              <ShieldCheck className="w-5 h-5" /> GDPR Ready
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-bold print:border-blue-800 print:text-blue-800">
              <Globe className="w-5 h-5" /> CCPA Compliant
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-bold print:border-blue-800 print:text-blue-800">
              <Server className="w-5 h-5" /> SOC 2 Type II
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-16 items-start">
          
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
            
            {/* 1. Intro */}
            <section id="intro" ref={(el) => { sectionRefs.current[0] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">1. Introduction & Overview</h2>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-6 mb-8 font-['DM_Sans'] print:bg-blue-50 print:border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white print:text-black text-base mb-1">TL;DR</h4>
                    <p className="text-sm text-blue-100 print:text-blue-900 leading-normal">InternFlow is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights regarding your personal information.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p>Welcome to InternFlow ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, process, and disclose your information, including personal information, in conjunction with your access to and use of the InternFlow SaaS platform and associated services.</p>
                <p>This policy applies to all visitors, users, and others who access our service. By using InternFlow, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
              </div>
            </section>

            {/* 2. Info Collect */}
            <section id="collect" ref={(el) => { sectionRefs.current[1] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">2. Information We Collect</h2>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-6 mb-8 font-['DM_Sans'] print:bg-blue-50 print:border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white print:text-black text-base mb-1">TL;DR</h4>
                    <p className="text-sm text-blue-100 print:text-blue-900 leading-normal">We collect data you provide directly (like account info), data collected automatically (like usage metrics), and data from third-party integrations (like your HR system).</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
                <ul className="list-disc pl-6 space-y-2 marker:text-slate-500">
                  <li><strong className="text-white print:text-black">Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information, including but not limited to your email address, first name and last name, phone number, and professional details.</li>
                  <li><strong className="text-white print:text-black">Usage Data:</strong> We may also collect information on how the Service is accessed and used. This includes your computer's Internet Protocol address, browser type, browser version, the pages you visit, the time and date of your visit, and diagnostic data.</li>
                  <li><strong className="text-white print:text-black">Integration Data:</strong> Information synchronized from your company's Applicant Tracking System (ATS) or HRIS platform, as explicitly authorized by your organization.</li>
                </ul>
              </div>
            </section>

            {/* 3. How We Use */}
            <section id="use" ref={(el) => { sectionRefs.current[2] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">3. How We Use Your Information</h2>
              <div className="space-y-4">
                <p>InternFlow uses the collected data for various purposes:</p>
                <ul className="list-disc pl-6 space-y-2 marker:text-slate-500">
                  <li>To provide and maintain our Service</li>
                  <li>To notify you about changes to our Service</li>
                  <li>To allow you to participate in interactive features of our Service</li>
                  <li>To provide customer support</li>
                  <li>To gather analysis or valuable information so that we can improve our Service</li>
                  <li>To monitor the usage of our Service and detect technical issues</li>
                </ul>
              </div>
            </section>

            {/* 4. Data Sharing */}
            <section id="sharing" ref={(el) => { sectionRefs.current[3] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">4. Data Sharing & Third Parties</h2>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-6 mb-8 font-['DM_Sans'] print:bg-blue-50 print:border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white print:text-black text-base mb-1">TL;DR</h4>
                    <p className="text-sm text-blue-100 print:text-blue-900 leading-normal">We do not sell your personal data. We only share it with trusted service providers necessary to run InternFlow (e.g., AWS hosting, payment processors).</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, or to assist us in analyzing how our Service is used.</p>
                <p>These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
              </div>
            </section>

            {/* 5. Retention */}
            <section id="retention" ref={(el) => { sectionRefs.current[4] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">5. Data Retention</h2>
              <div className="space-y-4">
                <p>We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.</p>
              </div>
            </section>

            {/* 6. Rights */}
            <section id="rights" ref={(el) => { sectionRefs.current[5] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">6. Your Privacy Rights</h2>
              
              <div className="grid md:grid-cols-2 gap-6 my-8 font-['DM_Sans']">
                <div className="border border-white/10 print:border-black/20 p-6 rounded-xl bg-[#121822] print:bg-white">
                  <div className="flex items-center gap-2 font-bold text-white print:text-black mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" /> GDPR Rights (EEA/UK)
                  </div>
                  <ul className="text-sm text-slate-400 print:text-slate-700 space-y-2 list-none">
                    <li>• Right to Access</li>
                    <li>• Right to Rectification</li>
                    <li>• Right to Erasure (Right to be Forgotten)</li>
                    <li>• Right to Restrict Processing</li>
                    <li>• Right to Data Portability</li>
                  </ul>
                </div>
                <div className="border border-white/10 print:border-black/20 p-6 rounded-xl bg-[#121822] print:bg-white">
                  <div className="flex items-center gap-2 font-bold text-white print:text-black mb-3">
                    <Globe className="w-5 h-5 text-blue-500" /> CCPA Rights (California)
                  </div>
                  <ul className="text-sm text-slate-400 print:text-slate-700 space-y-2 list-none">
                    <li>• Right to Know what data is collected</li>
                    <li>• Right to Delete personal information</li>
                    <li>• Right to Opt-Out of data sales (We do not sell data)</li>
                    <li>• Right to Non-Discrimination</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <p>If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us at privacy@internflow.com. We will respond to all requests within 30 days.</p>
              </div>
            </section>

            {/* 7. Cookies */}
            <section id="cookies" ref={(el) => { sectionRefs.current[6] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">7. Cookies & Tracking</h2>
              <div className="space-y-4">
                <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amounts of data which may include an anonymous unique identifier.</p>
                <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
              </div>
            </section>

            {/* 8. Security */}
            <section id="security" ref={(el) => { sectionRefs.current[7] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">8. Data Security</h2>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-6 mb-8 font-['DM_Sans'] print:bg-blue-50 print:border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white print:text-black text-base mb-1">SOC 2 Type II Certified</h4>
                    <p className="text-sm text-blue-100 print:text-blue-900 leading-normal">The security of your data is critical to us. We employ enterprise-grade encryption and are fully audited annually.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p>While we strive to use commercially acceptable means to protect your Personal Data, we remind you that no method of transmission over the Internet, or method of electronic storage is 100% secure. We cannot guarantee its absolute security.</p>
              </div>
            </section>

            {/* 9. Transfers */}
            <section id="transfers" ref={(el) => { sectionRefs.current[8] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">9. International Transfers</h2>
              <div className="space-y-4">
                <p>Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.</p>
              </div>
            </section>

            {/* 10. Children */}
            <section id="children" ref={(el) => { sectionRefs.current[9] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">10. Children's Privacy</h2>
              <div className="space-y-4">
                <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.</p>
              </div>
            </section>

            {/* 11. Changes */}
            <section id="changes" ref={(el) => { sectionRefs.current[10] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">11. Changes to This Policy</h2>
              <div className="space-y-4">
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top.</p>
                <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
              </div>
            </section>

            {/* 12. Contact Us */}
            <section id="contact" ref={(el) => { sectionRefs.current[11] = el; }}>
              <h2 className="text-3xl font-bold text-white print:text-black mb-6 font-['DM_Sans'] tracking-tight">12. Contact Us</h2>
              <div className="space-y-4">
                <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact our Data Protection Officer:</p>
                <div className="bg-[#121822] border border-white/10 print:bg-white print:border-black/20 p-6 rounded-xl font-['DM_Sans'] mt-6">
                  <div className="font-bold text-white print:text-black mb-1">InternFlow Privacy Team</div>
                  <div className="text-slate-400 print:text-slate-600 mb-4">Attn: Data Protection Officer</div>
                  <a href="mailto:privacy@internflow.com" className="text-blue-400 hover:text-blue-300 print:text-blue-600 font-bold">privacy@internflow.com</a>
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
            <Link to="/privacy" className="text-white border-b border-white/20 pb-0.5">Privacy</Link>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { PrivacyPage };

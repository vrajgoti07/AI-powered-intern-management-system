import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Mail, Phone, MapPin, MessagesSquare, Headset, 
  Newspaper, Clock, ChevronDown, 
  CheckCircle2, Loader2, Globe, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  { q: "What is your typical onboarding time?", a: "For teams under 50 interns, onboarding usually takes 48 hours. Enterprise deployments with custom integrations typically take 2-3 weeks depending on your IT review processes." },
  { q: "Do you offer custom pricing for non-profits?", a: "Yes, we offer a 40% discount for registered 501(c)(3) organizations and educational institutions. Select 'Pricing' in the contact form to learn more." },
  { q: "Can I integrate InternFlow with my existing HRIS?", a: "Absolutely. We have native integrations for Workday, BambooHR, and Gusto, plus a robust API for custom ERP connections." },
  { q: "Is my data secure?", a: "InternFlow is SOC 2 Type II certified. All data is encrypted at rest and in transit, and we offer SSO options (SAML/OIDC) on all enterprise plans." },
  { q: "Do you provide dedicated account managers?", a: "Yes, all teams with 50+ intern seats are assigned a dedicated Customer Success Manager for quarterly business reviews and strategic support." }
];

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', size: '', subject: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', company: '', size: '', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-['DM_Sans'] selection:bg-blue-600 selection:text-white">
      
      {/* Minimal Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black font-['Instrument_Serif'] tracking-tight flex items-center gap-2 italic">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center not-italic">
              <Zap className="w-5 h-5 text-white" />
            </div>
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            <Link to="/contact" className="text-white border-b border-blue-500 pb-1">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
            <Link to="/apply" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-['Instrument_Serif'] italic mb-6">Let's talk.</h1>
        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Whether you're looking for a platform demo, need technical support, or want to explore a partnership—our team is here for you.
        </p>
      </section>

      {/* Contact Options Grid */}
      <section className="py-12 px-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
            <div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <MessagesSquare className="w-6 h-6 text-blue-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sales</h3>
              <p className="text-slate-400 text-sm mb-8">Want a personalized demo of the platform for your team?</p>
            </div>
            <a href="#form" className="text-blue-400 font-bold text-sm inline-flex items-center gap-2 hover:text-blue-300 transition-colors">
              Book a Call <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
            <div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <Headset className="w-6 h-6 text-blue-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Support</h3>
              <p className="text-slate-400 text-sm mb-8">Need help with your current deployment or account?</p>
            </div>
            <a href="#" className="text-blue-400 font-bold text-sm inline-flex items-center gap-2 hover:text-blue-300 transition-colors">
              Open a Ticket <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-[#121822] border border-white/10 p-8 rounded-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
            <div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <Newspaper className="w-6 h-6 text-blue-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Press</h3>
              <p className="text-slate-400 text-sm mb-8">Media inquiry, interview request, or brand assets?</p>
            </div>
            <Link to="/press" className="text-blue-400 font-bold text-sm inline-flex items-center gap-2 hover:text-blue-300 transition-colors">
              Email Press <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Form & Info Split Layout */}
      <section id="form" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-16">
          
          {/* Left Col: Contact Form */}
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-['Instrument_Serif'] italic mb-8">Send us a message</h2>
            
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Message sent successfully!</h3>
                <p className="text-slate-300 text-sm">We've received your request and our team will get back to you within 2 business hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      required type="text" name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Work Email</label>
                    <input 
                      required type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company</label>
                    <input 
                      required type="text" name="company" value={formData.company} onChange={handleInputChange}
                      className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Size</label>
                    <select 
                      required name="size" value={formData.size} onChange={handleInputChange}
                      className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="200+">200+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                  <select 
                    required name="subject" value={formData.subject} onChange={handleInputChange}
                    className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="" disabled>How can we help?</option>
                    <option value="Demo Request">Demo Request</option>
                    <option value="Pricing">Pricing Inquiry</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Message</label>
                  <textarea 
                    required name="message" value={formData.message} onChange={handleInputChange} rows={5}
                    className="w-full bg-[#121822] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                    placeholder="Tell us what you're looking for..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Col: Info & Map */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#121822] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              {/* Abstract decorative element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />
              
              <h3 className="text-xl font-bold mb-6">Get in touch</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">Response Time</div>
                    <div className="text-sm text-slate-400 leading-relaxed">We typically reply within 2 business hours. Our core support hours are Mon-Fri, 9am - 6pm EST.</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">Direct Email</div>
                    <div className="text-sm text-slate-400">hello@internflow.com</div>
                    <div className="text-sm text-slate-400">support@internflow.com</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">Phone</div>
                    <div className="text-sm text-slate-400">+1 (800) 555-0199</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 flex items-center gap-4">
                <a href="#" className="px-4 py-2 rounded-full bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white font-bold text-xs">
                  LinkedIn
                </a>
                <a href="#" className="px-4 py-2 rounded-full bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white font-bold text-xs">
                  Twitter
                </a>
                <a href="#" className="px-4 py-2 rounded-full bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white font-bold text-xs">
                  GitHub
                </a>
              </div>
            </div>

            {/* Stylized Map Placeholder */}
            <div className="bg-[#1a2133] border border-white/10 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center group">
              {/* Abstract map pattern using gradients */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121822] via-transparent to-transparent opacity-80" />
              
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm">San Francisco HQ</div>
                <div className="text-xs text-slate-400">100 Market St, Suite 400</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 px-6 max-w-3xl mx-auto border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-['Instrument_Serif'] italic mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-400 font-medium">Quick answers to common questions about our platform.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-[#121822] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-sm md:text-base pr-8">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 text-sm text-slate-400 leading-relaxed border-t border-white/5 mt-2 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="border-t border-white/10 bg-[#0a0d12] py-8 px-6 text-center text-slate-500 text-sm font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} InternFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { ContactPage };

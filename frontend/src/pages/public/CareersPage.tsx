import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowDown, MapPin, Briefcase, Globe, Heart, 
  Coffee, Monitor, Rocket, Zap, Users, GraduationCap, 
  Baby, DollarSign, Activity, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Job Data
const JOBS = [
  { id: 1, title: 'Senior Full Stack Engineer', dept: 'Engineering', location: 'Remote', type: 'Full-time' },
  { id: 2, title: 'Product Designer', dept: 'Design', location: 'Remote', type: 'Full-time' },
  { id: 3, title: 'Account Executive', dept: 'Sales', location: 'NYC', type: 'Full-time' },
  { id: 4, title: 'Customer Success Manager', dept: 'Customer Success', location: 'Remote', type: 'Full-time' },
  { id: 5, title: 'Data Analyst', dept: 'Engineering', location: 'SF', type: 'Full-time' }
];

const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Sales', 'Customer Success'];
const LOCATIONS = ['All', 'Remote', 'NYC', 'SF'];

const CareersPage: React.FC = () => {
  const [activeDept, setActiveDept] = useState('All');
  const [activeLoc, setActiveLoc] = useState('All');

  const filteredJobs = JOBS.filter(job => {
    const matchDept = activeDept === 'All' || job.dept === activeDept;
    const matchLoc = activeLoc === 'All' || job.location === activeLoc;
    return matchDept && matchLoc;
  });

  const scrollToRoles = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-['JetBrains_Mono'] selection:bg-[#2563eb] selection:text-white">
      
      {/* Minimal Nav for completeness (usually shared) */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/10 font-sans">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black font-['Cabinet_Grotesk'] tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Product</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/careers" className="text-white border-b border-blue-500 pb-1">Careers</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
            <Link to="/apply" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20">
              Join Us
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> We are hiring
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-['Cabinet_Grotesk'] leading-[1.05] tracking-tight mb-8">
              Build the platform that <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">builds careers.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light leading-relaxed mb-10 font-sans">
              We're a team of makers, educators, and rebels completely reimagining how the next generation starts their professional journey. Want to leave a dent in the universe? Start here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 font-sans font-bold">
              <a href="#open-roles" onClick={scrollToRoles} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:-translate-y-1">
                View Open Roles <ArrowDown className="w-4 h-4" />
              </a>
              <a href="#culture" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
                Our Culture
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why InternFlow (Perks) */}
      <section className="py-20 px-6 border-y border-white/5 bg-[#0a0d12]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Globe, title: 'Remote-First', desc: 'Work from anywhere in the world. We care about output, not office hours.' },
              { icon: Rocket, title: 'True Equity', desc: 'You are an owner. Everyone gets a meaningful slice of the pie.' },
              { icon: GraduationCap, title: 'Learning Budget', desc: '$2,000/yr for books, courses, and conferences to sharpen your axe.' },
              { icon: Coffee, title: 'Unlimited PTO', desc: 'Mandatory minimum of 3 weeks off. Disconnect to reconnect.' }
            ].map((perk, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-[#121822] border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                  <perk.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg font-['Cabinet_Grotesk'] mb-2">{perk.title}</h3>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section id="culture" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black font-['Cabinet_Grotesk'] tracking-tight mb-6">Operate at the <span className="text-blue-500">speed of thought.</span></h2>
              <div className="space-y-6 text-slate-400 font-sans text-lg mb-8 leading-relaxed">
                <p>
                  We don't do red tape. We don't do bureaucracy. We believe in hiring incredibly smart people, giving them massive autonomy, and getting out of their way.
                </p>
                <p>
                  If you want a cushy 9-to-5 where you can hide in the background, this isn't for you. But if you want to ship features that impact thousands of careers on day one—welcome home.
                </p>
              </div>
              
              <div className="bg-[#121822] border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <p className="text-white italic mb-4">"The best part about InternFlow is the absolute lack of ego. The best idea wins, whether it comes from the CEO or an engineering intern."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">MC</div>
                  <div className="font-sans">
                    <div className="font-bold text-sm">Michael Chang</div>
                    <div className="text-xs text-slate-400">VP of Engineering</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4 h-[600px]">
              <div className="space-y-4">
                <div className="h-2/5 rounded-3xl overflow-hidden bg-slate-800">
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" alt="Team" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="h-3/5 rounded-3xl overflow-hidden bg-slate-800">
                  <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80" alt="Office" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="h-3/5 rounded-3xl overflow-hidden bg-slate-800">
                  <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80" alt="Retreat" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="h-2/5 rounded-3xl overflow-hidden bg-slate-800 flex items-center justify-center p-6 bg-blue-600 text-center">
                  <span className="font-['Cabinet_Grotesk'] font-black text-3xl leading-tight">Work Hard.<br/>Be Kind.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Benefits */}
      <section className="py-24 px-6 bg-[#0a0d12] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black font-['Cabinet_Grotesk'] mb-4">We take care of our own</h2>
            <p className="text-slate-400 font-sans">Comprehensive benefits designed for your well-being.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Activity, label: "Top-tier Health, Dental, Vision" },
              { icon: DollarSign, label: "401k Match (up to 5%)" },
              { icon: Monitor, label: "$1,500 Home Office Setup" },
              { icon: Baby, label: "16 Weeks Paid Parental Leave" },
              { icon: Globe, label: "Annual Team Retreats" },
              { icon: Coffee, label: "Weekly Free Lunches" },
              { icon: Heart, label: "Mental Health Stipend" },
              { icon: Zap, label: "Monthly Wellness Budget" }
            ].map((ben, i) => (
              <div key={i} className="bg-[#121822] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-4 hover:bg-white/5 transition-colors">
                <ben.icon className="w-8 h-8 text-blue-400" />
                <span className="font-sans font-medium text-sm">{ben.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles Section */}
      <section id="open-roles" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black font-['Cabinet_Grotesk'] tracking-tight mb-12">Open Positions</h2>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6 mb-12 font-sans">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => (
                  <button 
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeDept === dept ? 'bg-blue-600 text-white' : 'bg-[#121822] text-slate-400 hover:text-white hover:bg-[#1a2133] border border-white/5'}`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Location</label>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map(loc => (
                  <button 
                    key={loc}
                    onClick={() => setActiveLoc(loc)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeLoc === loc ? 'bg-blue-600 text-white' : 'bg-[#121822] text-slate-400 hover:text-white hover:bg-[#1a2133] border border-white/5'}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      to={`/apply?role=${job.id}`}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-[#121822] border border-white/5 rounded-2xl hover:border-blue-500/50 hover:bg-[#1a2133] transition-all"
                    >
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold font-['Cabinet_Grotesk'] mb-3 group-hover:text-blue-400 transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 font-sans text-sm text-slate-400">
                          <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.dept}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {job.type}</span>
                        </div>
                      </div>
                      <div className="mt-6 md:mt-0">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 text-blue-400 font-bold font-sans rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          Apply <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-20 text-center bg-[#121822] rounded-3xl border border-white/5 border-dashed"
                >
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold font-['Cabinet_Grotesk'] mb-2">No matching roles</h3>
                  <p className="text-slate-400 font-sans">We don't have any open positions matching these filters right now.</p>
                  <button 
                    onClick={() => { setActiveDept('All'); setActiveLoc('All'); }}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold font-sans text-sm transition-colors"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-[#0a0d12] to-blue-900/20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-black font-['Cabinet_Grotesk']">Don't see a perfect fit?</h2>
          <p className="text-slate-400 font-sans">We are always looking for exceptional talent. If you believe you belong here, convince us.</p>
          <div className="pt-4">
            <a href="mailto:careers@internflow.com" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold font-sans rounded-xl hover:bg-slate-200 transition-colors shadow-xl">
              Send us your resume <ArrowRight className="w-5 h-5" />
            </a>
          </div>
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

export { CareersPage };

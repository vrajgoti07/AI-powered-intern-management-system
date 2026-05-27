import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Download, Mail, ExternalLink, Filter, Building2, BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';

// Dummy Coverage Data
const COVERAGE_DATA = [
  { id: 1, pub: 'TechCrunch', headline: 'InternFlow raises $15M Series A to revolutionize early-career talent management', date: 'Oct 12, 2024', year: '2024', topic: 'Funding', logo: 'TC' },
  { id: 2, pub: 'Forbes', headline: 'Why AI is the missing link in corporate mentorship programs', date: 'Sep 28, 2024', year: '2024', topic: 'Culture', logo: 'F' },
  { id: 3, pub: 'VentureBeat', headline: 'InternFlow launches automated radar skills assessment for engineering interns', date: 'Aug 15, 2024', year: '2024', topic: 'Product', logo: 'VB' },
  { id: 4, pub: 'Fast Company', headline: 'The 10 most innovative workplace companies of 2024', date: 'Jul 02, 2024', year: '2024', topic: 'Awards', logo: 'FC' },
  { id: 5, pub: 'Wall Street Journal', headline: 'Startups target the broken university recruiting pipeline', date: 'Mar 18, 2024', year: '2024', topic: 'Culture', logo: 'WSJ' },
  { id: 6, pub: 'Sifted', headline: 'European expansion on the horizon for US-based InternFlow', date: 'Feb 05, 2024', year: '2024', topic: 'Product', logo: 'S' },
  { id: 7, pub: 'TechCrunch', headline: 'InternFlow emerges from stealth with a $3M Seed round', date: 'Nov 20, 2023', year: '2023', topic: 'Funding', logo: 'TC' },
  { id: 8, pub: 'HR Dive', headline: 'How automated workflows are saving HR teams 20+ hours a week', date: 'Sep 10, 2023', year: '2023', topic: 'Product', logo: 'HR' },
  { id: 9, pub: 'Business Insider', headline: 'Top 50 enterprise startups to bet your career on in 2024', date: 'Dec 15, 2023', year: '2023', topic: 'Awards', logo: 'BI' },
  { id: 10, pub: 'Wired', headline: 'The algorithm that knows where you should intern next', date: 'Aug 01, 2023', year: '2023', topic: 'Culture', logo: 'W' },
];

const YEARS = ['All', '2024', '2023'];
const TOPICS = ['All', 'Funding', 'Product', 'Awards', 'Culture'];

const PressPage: React.FC = () => {
  const [activeYear, setActiveYear] = useState('All');
  const [activeTopic, setActiveTopic] = useState('All');

  const filteredCoverage = COVERAGE_DATA.filter(item => {
    const matchYear = activeYear === 'All' || item.year === activeYear;
    const matchTopic = activeTopic === 'All' || item.topic === activeTopic;
    return matchYear && matchTopic;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-['Space_Grotesk'] selection:bg-blue-600 selection:text-white pb-24">
      
      {/* Minimal Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10 font-sans">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
            <Logo size="sm" showText={false} />
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            <Link to="/press" className="text-white border-b border-blue-500 pb-1">Press</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
            <Link to="/apply" className="px-5 py-2.5 bg-white text-[#0d1117] hover:bg-slate-200 text-sm font-bold rounded-full transition-all">
              Join Us
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 max-w-7xl mx-auto border-b border-white/10 relative">
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
        <div className="mb-6 flex items-center gap-3 text-blue-400 font-bold uppercase tracking-widest text-sm">
          <BookOpen className="w-4 h-4" /> Media & Press Room
        </div>
        <h1 className="text-6xl md:text-8xl font-medium font-['Cormorant_Garamond'] tracking-tight leading-none mb-8">
          InternFlow <br/> <span className="italic text-slate-300">in the News.</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-light leading-relaxed">
          The latest coverage, announcements, and resources for journalists reporting on the future of work and early-career talent.
        </p>
      </section>

      {/* Press Highlights */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-medium font-['Cormorant_Garamond'] mb-12 flex items-center gap-4">
          Featured Coverage <span className="flex-1 h-px bg-white/10 ml-4"></span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { pub: 'TechCrunch', title: 'InternFlow raises $15M Series A to revolutionize early-career talent management', date: 'Oct 12, 2024', img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=1000' },
            { pub: 'Forbes', title: 'Why AI is the missing link in corporate mentorship programs', date: 'Sep 28, 2024', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000' },
            { pub: 'VentureBeat', title: 'InternFlow launches automated radar skills assessment for engineering interns', date: 'Aug 15, 2024', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000' }
          ].map((item, i) => (
            <a href="#" key={i} className="group block border border-white/10 bg-[#121822] rounded-xl overflow-hidden hover:border-blue-500/50 transition-all hover:-translate-y-1">
              <div className="aspect-[16/9] overflow-hidden bg-slate-800 relative">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100 group-hover:scale-105" />
                <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 text-xs font-bold uppercase tracking-widest rounded shadow-lg">
                  {item.pub}
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="text-sm text-blue-400 font-bold mb-3">{item.date}</div>
                <h3 className="text-2xl font-medium font-['Cormorant_Garamond'] leading-tight mb-6 group-hover:text-blue-300 transition-colors">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                  Read Article <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* All Coverage List */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <h2 className="text-3xl font-medium font-['Cormorant_Garamond']">All Press Mentions</h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="w-4 h-4" /> Filter by:
            </div>
            
            <div className="flex gap-2 bg-[#121822] p-1 rounded-lg border border-white/5">
              {YEARS.map(year => (
                <button 
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeYear === year ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="flex gap-2 bg-[#121822] p-1 rounded-lg border border-white/5">
              {TOPICS.map(topic => (
                <button 
                  key={topic}
                  onClick={() => setActiveTopic(topic)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTopic === topic ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#121822]">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-widest bg-black/20 hidden md:grid">
            <div className="col-span-3">Publication</div>
            <div className="col-span-6">Headline</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1 text-right">Link</div>
          </div>
          
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredCoverage.length > 0 ? (
                filteredCoverage.map((item) => (
                  <motion.a 
                    href="#"
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6 items-center hover:bg-white/5 transition-colors group"
                  >
                    <div className="col-span-1 md:col-span-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs border border-white/10 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                        {item.logo}
                      </div>
                      <span className="font-bold text-sm md:text-base">{item.pub}</span>
                    </div>
                    <div className="col-span-1 md:col-span-6">
                      <h4 className="text-lg font-medium font-['Cormorant_Garamond'] group-hover:text-blue-300 transition-colors leading-snug">{item.headline}</h4>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-sm text-slate-400">
                      {item.date}
                    </div>
                    <div className="col-span-1 text-left md:text-right">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center inline-flex group-hover:bg-blue-600 transition-colors">
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>
                  </motion.a>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  No press coverage matches your selected filters.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Brand Assets & Contact Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Brand Assets */}
          <div className="lg:col-span-2 space-y-12">
            <h2 className="text-3xl font-medium font-['Cormorant_Garamond']">Brand Assets</h2>
            
            <div className="bg-[#121822] border border-white/10 rounded-2xl p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Logos</h3>
                  <p className="text-sm text-slate-400">Official InternFlow lockups and logomarks.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                  <Download className="w-4 h-4" /> Download All
                </button>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-6">
                    <div className="text-2xl font-black font-['Space_Grotesk'] tracking-tight text-black flex items-center gap-2">
                      <Logo size="sm" showText={false} />
                      InternFlow
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
                    <span>Light Lockup</span>
                    <div className="flex gap-2">
                      <a href="#" className="hover:text-white">SVG</a>
                      <a href="#" className="hover:text-white">PNG</a>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-32 bg-[#0a0d12] rounded-xl border border-white/10 flex items-center justify-center p-6">
                    <div className="text-2xl font-black font-['Space_Grotesk'] tracking-tight text-white flex items-center gap-2">
                      <Logo size="sm" showText={false} />
                      InternFlow
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
                    <span>Dark Lockup</span>
                    <div className="flex gap-2">
                      <a href="#" className="hover:text-white">SVG</a>
                      <a href="#" className="hover:text-white">PNG</a>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-32 bg-[#121822] rounded-xl border border-white/10 flex items-center justify-center p-6">
                    <Logo size="lg" showText={false} />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
                    <span>Logomark</span>
                    <div className="flex gap-2">
                      <a href="#" className="hover:text-white">SVG</a>
                      <a href="#" className="hover:text-white">PNG</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {/* Color Palette */}
              <div className="bg-[#121822] border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Colors</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563eb] shadow-inner border border-white/10" />
                    <div>
                      <div className="font-bold text-sm">Primary Blue</div>
                      <div className="text-xs text-slate-400">HEX #2563eb</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#0d1117] shadow-inner border border-white/10" />
                    <div>
                      <div className="font-bold text-sm">Navy Background</div>
                      <div className="text-xs text-slate-400">HEX #0d1117</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#ffffff] shadow-inner border border-white/10" />
                    <div>
                      <div className="font-bold text-sm">Clean White</div>
                      <div className="text-xs text-slate-400">HEX #ffffff</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="bg-[#121822] border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Typography</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Primary — Space Grotesk</div>
                    <div className="text-3xl font-black font-['Space_Grotesk'] leading-none">Aa Bb Cc</div>
                    <div className="text-sm text-slate-400 mt-2">Used for headings, UI, and branding.</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Editorial — Cormorant Garamond</div>
                    <div className="text-3xl font-medium font-['Cormorant_Garamond'] leading-none italic">Aa Bb Cc</div>
                    <div className="text-sm text-slate-400 mt-2">Used for editorial highlights and quotes.</div>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors shadow-lg">
              <Download className="w-5 h-5" /> Download Full Brand Kit (ZIP, 12MB)
            </button>
          </div>

          {/* Boilerplate & Contact */}
          <div className="space-y-8">
            <div className="bg-blue-600 text-white rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-2xl font-bold mb-2">Press Contact</h3>
              <p className="text-blue-100 text-sm mb-8">For press inquiries, interviews, or additional assets.</p>
              
              <div className="space-y-1 mb-8">
                <div className="font-bold text-lg">Sarah Jenkins</div>
                <div className="text-blue-200 text-sm">Director of Communications</div>
              </div>
              
              <a href="mailto:press@internflow.com" className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 font-bold rounded-lg w-full justify-center hover:bg-blue-50 transition-colors">
                <Mail className="w-4 h-4" /> press@internflow.com
              </a>
            </div>

            <div className="bg-[#121822] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold">About InternFlow</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed space-y-4 font-sans">
                <span className="block mb-4">
                  InternFlow is an AI-powered SaaS platform that helps enterprise companies build, manage, and scale world-class internship programs. 
                </span>
                <span className="block mb-4">
                  Founded in 2022 by former university recruiting leaders, InternFlow replaces spreadsheets with intelligent workflows—automating candidate matching, onboarding, mentor assignments, and performance tracking.
                </span>
                <span className="block">
                  Headquartered in San Francisco, CA, InternFlow is backed by leading venture capital firms and serves over 500 organizations globally, having facilitated more than 12,000 successful internships.
                </span>
              </p>
              <button className="mt-6 flex items-center gap-2 text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors">
                Copy Boilerplate <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="border-t border-white/10 bg-[#0a0d12] py-8 px-6 text-center text-slate-500 text-sm font-sans mt-20">
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

export { PressPage };

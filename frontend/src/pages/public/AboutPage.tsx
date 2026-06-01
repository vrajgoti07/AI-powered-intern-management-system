import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronRight, Users, Briefcase, Zap, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';

const AboutPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-['Outfit'] overflow-hidden selection:bg-[#2563eb] selection:text-white">
      {/* Navbar Placeholder - Assuming shared navbar, but creating minimal inline one for standalone visual perfection */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold font-['Playfair_Display'] tracking-tight flex items-center gap-2">
            <Logo size="sm" showText={false} />
            InternFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Product</Link>
            <Link to="/about" className="text-white">About Us</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
            <Link to="/apply" className="px-5 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-32 px-5 sm:px-6 flex items-center justify-center min-h-[70vh] sm:min-h-[90vh]">
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.4) 0%, transparent 50%)',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium tracking-wide mb-8 inline-block">
              OUR MISSION
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-['Playfair_Display'] leading-[1.1] mb-6 sm:mb-8 tracking-tight">
              Making great internships <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-400">
                accessible to everyone.
              </span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              We're building the operating system for the next generation of talent, empowering teams to deliver world-class internship experiences at scale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-12 sm:py-24 px-5 sm:px-6 relative border-t border-white/5 bg-gradient-to-b from-[#0d1117] to-[#121822]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay z-10 transition-opacity group-hover:opacity-0" />
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000" 
                  alt="Team collaboration" 
                  className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-[#1a2133] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-xs backdrop-blur-xl">
                <p className="font-['Playfair_Display'] text-xl italic text-slate-300">
                  "We built the tool we desperately wished we had."
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-['Playfair_Display'] font-bold mb-4 sm:mb-6">Born from frustration. <br/>Built for scale.</h2>
              <div className="space-y-6 text-lg text-slate-400 font-light leading-relaxed">
                <p>
                  Founded in 2022, InternFlow started when our founders—former university recruiting leaders at top tech firms—realized that managing 500+ interns across 20 departments using spreadsheets was fundamentally broken.
                </p>
                <p>
                  Mentors were overwhelmed, interns felt disconnected, and HR spent 80% of their time chasing down feedback forms instead of actually improving the program experience.
                </p>
                <p>
                  We knew there had to be a better way. So we built InternFlow: an AI-augmented platform that automates the busywork, surfaces meaningful insights, and puts the focus back on human connection and mentorship.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* By the Numbers */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#0a0d12]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { number: "500+", label: "Companies" },
              { number: "12k+", label: "Interns Managed" },
              { number: "98%", label: "Satisfaction Rate" },
              { number: "4.9", label: "Average App Rating", star: true }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-5xl md:text-6xl font-bold text-white mb-2 font-['Playfair_Display'] flex items-center justify-center gap-1">
                  {stat.number}
                  {stat.star && <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-widest font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold mb-6">Our Core Values</h2>
            <p className="text-xl text-slate-400 font-light">The principles that guide everything we build and how we operate.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Transparency First",
                desc: "No black boxes. Interns deserve clear expectations, and managers deserve clear visibility into program health."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Intern-Centric",
                desc: "We design for the intern's success first. When interns thrive, managers succeed, and companies grow."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Augmented, Not Replaced",
                desc: "We use AI to eliminate administrative busywork, freeing up human mentors to do what they do best: mentor."
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                title: "Continuous Improvement",
                desc: "Internships aren't static. Our platform continuously learns and adapts to provide better recommendations every cycle."
              }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#121822] border border-white/5 p-10 rounded-3xl hover:border-blue-500/30 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 font-['Playfair_Display']">{value.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light text-lg">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 bg-[#0a0d12] border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-['Playfair_Display'] font-bold mb-16 text-center">Our Journey</h2>
          <div className="space-y-12">
            {[
              { year: "2022", title: "The Beginning", desc: "Founded by a team of frustrated HR professionals. MVP launched in a weekend." },
              { year: "2023", title: "Seed Round & First 100", desc: "Raised $3M Seed led by prominent VCs. Onboarded our first 100 enterprise customers." },
              { year: "2024", title: "AI Integration", desc: "Launched our proprietary AI matching and automated feedback loop systems." },
              { year: "2025", title: "Global Expansion", desc: "Expanded across EMEA and APAC. Surpassed 10,000 interns managed on platform." },
              { year: "Present", title: "The Next Chapter", desc: "Continuing to redefine the future of early-career talent management." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 md:gap-12 group"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 text-right font-bold text-blue-500 mt-1">{item.year}</div>
                  <div className="w-px h-full bg-white/10 group-last:hidden my-4 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="pb-12 group-last:pb-0">
                  <h3 className="text-2xl font-semibold mb-3 font-['Playfair_Display']">{item.title}</h3>
                  <p className="text-slate-400 font-light leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold mb-6">Meet the Team</h2>
            <p className="text-xl text-slate-400 font-light">The people building the future of work.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "Co-Founder & CEO", img: "https://i.pravatar.cc/300?img=1" },
              { name: "David Chen", role: "Co-Founder & CTO", img: "https://i.pravatar.cc/300?img=11" },
              { name: "Elena Rodriguez", role: "Head of Product", img: "https://i.pravatar.cc/300?img=5" },
              { name: "Michael Chang", role: "VP of Engineering", img: "https://i.pravatar.cc/300?img=8" },
              { name: "Jessica Taylor", role: "Head of Customer Success", img: "https://i.pravatar.cc/300?img=9" },
              { name: "Marcus Johnson", role: "Lead AI Researcher", img: "https://i.pravatar.cc/300?img=12" }
            ].map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative rounded-3xl overflow-hidden bg-[#121822] border border-white/5 aspect-[3/4]"
              >
                <img src={member.img} alt={member.name} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-semibold mb-1 font-['Playfair_Display']">{member.name}</h3>
                  <p className="text-blue-400 text-sm font-medium mb-4">{member.role}</p>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <a href="#" className="text-slate-300 hover:text-white font-medium text-sm">LinkedIn</a>
                    <a href="#" className="text-slate-300 hover:text-white font-medium text-sm">Twitter</a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investors / Backed By */}
      <section className="py-20 px-6 bg-[#0a0d12] border-y border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-10">Backed by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale">
            {/* Fictional VCs using typography for logos */}
            <div className="text-2xl font-black tracking-tighter">NEXUS<span className="font-light">CAPITAL</span></div>
            <div className="text-2xl font-bold font-['Playfair_Display'] italic">Horizon Ventures</div>
            <div className="text-2xl font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-6 border-4 border-current rounded-full" />
              Oculus P.
            </div>
            <div className="text-2xl font-serif">Altus & Co.</div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold mb-4">Join our mission</h2>
              <p className="text-xl text-slate-400 font-light max-w-2xl">Help us build the software that will define the early careers of millions of professionals.</p>
            </div>
            <Link to="/careers" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium font-semibold whitespace-nowrap transition-colors">
              View all openings <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="space-y-4">
            {[
              { title: "Senior Full Stack Engineer", dept: "Engineering", loc: "Remote (US)" },
              { title: "Product Marketing Manager", dept: "Marketing", loc: "San Francisco / Remote" },
              { title: "Enterprise Account Executive", dept: "Sales", loc: "New York" }
            ].map((job, i) => (
              <Link 
                key={i} 
                to="/careers" 
                className="group block bg-[#121822] border border-white/5 hover:border-blue-500/50 rounded-2xl p-6 md:p-8 transition-all hover:bg-[#1a2133]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 font-light">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.dept}</span>
                      <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {job.loc}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative border-t border-white/5 bg-gradient-to-t from-blue-900/20 to-[#0d1117]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-black font-['Playfair_Display'] mb-8">
              Join us in shaping <br className="hidden md:block"/>
              <span className="italic font-light">the future of work.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
              <Link to="/apply" className="w-full sm:w-auto px-8 py-4 bg-white text-[#0d1117] hover:bg-slate-200 text-lg font-semibold rounded-full transition-all hover:scale-105 text-center">
                Get a Demo
              </Link>
              <Link to="/careers" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:border-white text-white text-lg font-semibold rounded-full transition-all hover:bg-white/5 text-center">
                View Open Roles
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer Placeholder */}
      <footer className="border-t border-white/10 bg-[#0a0d12] py-12 px-6 text-center text-slate-500 text-sm font-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} InternFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { AboutPage };

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, Brain, Shield, BarChart3,
  Clock, Zap, CheckCircle2, Star, Globe, Heart
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight">InternFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4.5 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/apply')}
            className="px-4.5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Decorative Light Orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full blur-[120px] opacity-45 -z-10" style={{ animation: 'blobFloat 12s ease-in-out infinite alternate' }} />
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200 rounded-full blur-[120px] opacity-45 -z-10" style={{ animation: 'blobFloat2 15s ease-in-out infinite alternate' }} />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold mb-6 tracking-wide uppercase" style={{ animation: 'heroFadeIn 0.8s ease-out 0.1s both' }}>
          <Brain className="w-3.5 h-3.5 animate-bounce" /> Smart Internship Automation
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6" style={{ animation: 'heroFadeIn 0.8s ease-out 0.3s both' }}>
          Manage Your Interns <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">Smarter with AI</span>
        </h1>

        <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed mb-10" style={{ animation: 'heroFadeIn 0.8s ease-out 0.5s both' }}>
          From onboarding application pipelines to AI-driven radar skill charts and certificate issuance — automate, track, and optimize your internship program in one dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4" style={{ animation: 'heroFadeIn 0.8s ease-out 0.7s both' }}>
          <button
            onClick={() => navigate('/apply')}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            Apply for Internship <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            Explore Dashboards
          </button>
        </div>
      </section>
      {/* Interactive Dashboard Preview Mockup Box */}      <section className="px-6 pb-24 max-w-5xl mx-auto w-full" style={{ animation: 'heroFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both' }}>
        <div className="relative bg-white rounded-3xl p-4 md:p-6 border border-slate-200/80 shadow-[0_30px_60px_rgba(15,23,42,0.06)] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_rgba(37,99,235,0.1)] group"
             style={{ 
               perspective: '1000px',
               animation: 'float3D 9s ease-in-out infinite alternate',
             }}>
          {/* Decorative Subtle Background Glows inside Mockup */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] pointer-events-none -z-10 opacity-70" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-50 rounded-full blur-[100px] pointer-events-none -z-10 opacity-70" />

          {/* Browser Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            </div>
            
            {/* Search Input Bar Mock */}
            <div className="w-full sm:w-auto flex-1 max-w-md mx-4">
              <div className="relative">
                <input 
                  type="text" 
                  disabled
                  placeholder="Search interns, tasks, departments, announcements..." 
                  className="w-full text-[10px] bg-slate-50 text-slate-500 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none placeholder-slate-400 font-semibold"
                />
              </div>
            </div>

            {/* Profile Dropdown Mock */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-505 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <div className="w-5.5 h-5.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md flex items-center justify-center text-[9px] font-extrabold shadow-sm">
                  HA
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[9px] font-extrabold text-slate-700 leading-none">HR Admin</p>
                  <p className="text-[7px] text-blue-600 font-extrabold mt-0.5">Manager</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-5 text-left">
            {/* Left Navigation Sidebar Mock */}
            <div className="col-span-1 border-r border-slate-100 pr-4 space-y-4 hidden md:block">
              <div className="flex items-center gap-2 px-2.5 pb-2 border-b border-slate-100">
                <div className="w-5.5 h-5.5 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                  <span className="text-[10px] font-extrabold text-white">IF</span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">InternFlow</span>
              </div>
              <div className="space-y-1">
                {[
                  { label: "Dashboard", active: true, dot: "bg-blue-600" },
                  { label: "Interns", active: false, dot: "bg-slate-400" },
                  { label: "Mentors", active: false, dot: "bg-slate-400" },
                  { label: "Departments", active: false, dot: "bg-slate-400" },
                  { label: "Announcements", active: false, dot: "bg-slate-400" },
                  { label: "Reports & Analytics", active: false, dot: "bg-slate-400" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`h-8.5 rounded-xl flex items-center gap-2.5 px-3 transition-all duration-300 cursor-pointer
                      ${item.active 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-white" : item.dot}`} />
                    <span className="text-[9px] font-extrabold tracking-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Bot status widget */}
              <div className="pt-8">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[8px] font-extrabold text-slate-600">AI Co-pilot</span>
                  </div>
                  <p className="text-[7px] font-bold text-slate-400 leading-normal">System active</p>
                </div>
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="col-span-5 md:col-span-4 space-y-4">
              {/* Top Cards Row */}
              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { 
                    title: "Active Interns", 
                    val: "142", 
                    trend: "+12 this week", 
                    color: "bg-white border-slate-200 shadow-sm",
                    extra: (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {['bg-rose-500', 'bg-blue-500', 'bg-indigo-500', 'bg-emerald-500'].map((color, i) => (
                          <div key={i} className={`inline-block h-4.5 w-4.5 rounded-full border border-white ${color} flex items-center justify-center text-[6px] font-bold text-white shadow-sm`}>
                            {['SC', 'AR', 'LC', 'KP'][i]}
                          </div>
                        ))}
                      </div>
                    )
                  },
                  { 
                    title: "Avg Task Velocity", 
                    val: "94.8%", 
                    trend: "Optimal rating", 
                    color: "bg-white border-slate-200 shadow-sm",
                    extra: (
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-1 border border-slate-200/50 overflow-hidden">
                        <div className="bg-emerald-500 h-1 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: '94.8%' }} />
                      </div>
                    )
                  },
                  { 
                    title: "AI Skill Fit accuracy", 
                    val: "89%", 
                    trend: "+4.2% score", 
                    color: "bg-white border-slate-200 shadow-sm",
                    extra: (
                      <span className="text-[7px] text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Excellent Match
                      </span>
                    )
                  }
                ].map((card, idx) => (
                  <div key={idx} className={`${card.color} rounded-2xl p-3 border flex flex-col justify-between space-y-2`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">{card.title}</span>
                        <p className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight mt-0.5">{card.val}</p>
                      </div>
                      <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">{card.trend}</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      {card.extra}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Rows */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Active Interns Table Grid (Left) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider">Active Cohort Directory</span>
                    <span className="text-[8px] text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-extrabold">View all 142 →</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 pb-2">
                          <th className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider pb-2">Intern</th>
                          <th className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider pb-2">Department</th>
                          <th className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider pb-2">Performance</th>
                          <th className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { name: "Sophia Chen", dept: "Engineering", score: "94%", color: "bg-blue-50 text-blue-600 border-blue-100", progress: "w-[94%] bg-blue-600" },
                          { name: "Alex Rivera", dept: "Product Design", score: "88%", color: "bg-purple-50 text-purple-600 border-purple-100", progress: "w-[88%] bg-purple-600" },
                          { name: "Liam Carter", dept: "Data Science", score: "91%", color: "bg-cyan-50 text-cyan-600 border-cyan-100", progress: "w-[91%] bg-cyan-600" }
                        ].map((intern, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 flex items-center gap-2">
                              <div className="w-5.5 h-5.5 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-extrabold text-slate-600 border border-slate-200">
                                {intern.name.split(' ').map(n=>n[0]).join('')}
                              </div>
                              <span className="text-[9px] font-extrabold text-slate-700">{intern.name}</span>
                            </td>
                            <td className="py-2.5">
                              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${intern.color}`}>{intern.dept}</span>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-extrabold text-slate-700">{intern.score}</span>
                                <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div className={`h-1 rounded-full ${intern.progress}`} />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5">
                              <span className="inline-flex items-center gap-1 text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                <span className="h-1 w-1 bg-emerald-500 rounded-full" /> ACTIVE
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI co-pilot + Bulletin Feed (Right) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* AI match card */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-4.5 h-4.5 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-center text-blue-600 text-[10px]">
                        <span>✨</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider">AI Recruiting Agent</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-500 leading-normal">
                      "98.4% resume matching confidence across 4 pending applicant intakes. Autogenerated scoring profile recommendations are successfully dispatched to HR inbox."
                    </p>
                  </div>

                  {/* Bulletins Bulletin Feed */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider">Live Broadcasts</span>
                      <span className="text-[7px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1 rounded">2 Active</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 hover:border-blue-200 hover:bg-blue-50/10 transition-all flex justify-between items-start">
                        <div className="space-y-0.5 text-left flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-extrabold text-slate-700 truncate">Q2 Intern Hackathon</span>
                            <span className="text-[6px] bg-rose-100 border border-rose-200 text-rose-600 px-1 rounded font-extrabold">HIGH</span>
                          </div>
                          <p className="text-[7px] text-slate-500 leading-normal truncate font-semibold">Teams must submit code repositories by Friday night.</p>
                        </div>
                        <button className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-all cursor-pointer flex-shrink-0" title="Delete Notice">
                          <span className="text-[8px] font-bold">✕</span>
                        </button>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 hover:border-blue-200 hover:bg-blue-50/10 transition-all flex justify-between items-start">
                        <div className="space-y-0.5 text-left flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-extrabold text-slate-700 truncate">Mid-Term Appraisal Cycle</span>
                            <span className="text-[6px] bg-blue-100 border border-blue-200 text-blue-600 px-1 rounded font-extrabold">MED</span>
                          </div>
                          <p className="text-[7px] text-slate-500 leading-normal truncate font-semibold">Mentors must finalize reviews by June 1st.</p>
                        </div>
                        <button className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-all cursor-pointer flex-shrink-0" title="Delete Notice">
                          <span className="text-[8px] font-bold">✕</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-slate-200/60 py-10" style={{ animation: 'slideUpFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Partner Companies" },
            { value: "10,000+", label: "Interns Managed" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "60%", label: "Time Saved Daily" },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4" style={{ animation: 'slideUpFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Powerful Capabilities at Your Fingertips</h2>
          <p className="text-sm font-semibold text-slate-400">Everything you need to successfully launch, run and score multi-department internship operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI-Powered NLP Bot", desc: "Interactive chatbot responding instantly to attendance, task due-dates and certification guidelines." },
            { icon: BarChart3, title: "Radar Competence Analytics", desc: "Detailed performance mapping across coding, collaboration, communication and planning parameters." },
            { icon: Zap, title: "Multi-Step Onboarding", desc: "Interactive applications form logic that channels applicants directly into review channels for approval." },
            { icon: Clock, title: "Interactive Kanban Boards", desc: "Visual task columns enabling drag-and-drop workflow tracking for both supervisors and interns." },
            { icon: CheckCircle2, title: "Daily Punch Attendance", desc: "Calendar view clock ins and logs tracking to automatically formulate attendance metrics." },
            { icon: Shield, title: "Role-Based Navigation", desc: "Secured view portals with individual configurations tailored for HR administrators, Mentors, and Interns." },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i} 
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-100/30 hover:border-blue-200/50 hover:scale-[1.03] transition-all duration-300 flex flex-col items-start text-left"
                style={{ 
                  animation: 'scaleUpIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                  animationDelay: `${0.1 + i * 0.1}s`
                }}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="workflow" className="bg-white border-y border-slate-200/60 py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Structured Internship Journey</h2>
            <p className="text-sm font-semibold text-slate-400">Our structured automation platform supports candidates from day one through graduation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-100 hidden md:block -z-10" />
            {[
              { step: "01", title: "Apply & Onboard", desc: "Submit your academic credentials and preferences. Receive department mapping upon manual approval." },
              { step: "02", title: "Collaborate & Deliver", desc: "Work on visual Kanban cards. Check in daily on the clock and sync with assigned corporate mentors." },
              { step: "03", title: "Assess & Certify", desc: "Analyze dynamic radar skill scores and receive a blockchain verified digital internship certificate." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-xl shadow-blue-100 ring-8 ring-blue-50">
                  {step.step}
                </div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{step.title}</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 max-w-5xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">What Our Partners & Interns Say</h2>
          <p className="text-sm font-semibold text-slate-400">Trusted by modern businesses and outstanding university graduates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "InternFlow cut down our program management overhead by 60%. Assigning mentors and reviewing scores has never been this fluid.", author: "Priya Nair", role: "HR Manager, TechCorp", rating: 5 },
            { quote: "Evaluating interns' skills became extremely visual. The Radar Analytics chart makes performance feedback highly scientific.", author: "Rahul Mehta", role: "Design Director", rating: 5 },
            { quote: "The daily punch-in logs and the interactive AI Chatbot kept me aligned with my tasks throughout my 3-month engineering internship.", author: "Ankit Patil", role: "Software Intern", rating: 5 },
          ].map((test, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 hover:scale-[1.01] transition-all duration-300 text-left flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-0.5">
                  {[...Array(test.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">"{test.quote}"</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{test.author}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 py-16 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent)]" />
        <div className="max-w-xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to Transform Your Internship Program?</h2>
          <p className="text-blue-100 text-sm font-semibold leading-relaxed">
            Get started today. Deploy secure dashboards, AI features, and scientific evaluations for your next cohort of interns.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/apply')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl transition-all shadow-xl cursor-pointer"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 hover:bg-blue-800 border border-blue-500 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Explore Sandbox
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-12 text-slate-400">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">InternFlow</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed max-w-xs text-slate-500">
              Complete state-of-the-art cohort management tools powered by AI insights.
            </p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Integrations", "Roadmap"] },
            { title: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Settings", "Security"] }
          ].map((col, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                {col.links.map((link) => (
                  <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <p>© 2026 InternFlow Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Globe className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition-colors"><Heart className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>

      {/* Embedded High-Fidelity Custom Animation Styles */}
      <style>{`
        @keyframes heroFadeIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.08); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 20px) scale(1.05); }
        }
        @keyframes float3D {
          0%, 100% { transform: translateY(0px) rotateX(1.5deg) rotateY(-1.5deg); }
          50% { transform: translateY(-12px) rotateX(-1.5deg) rotateY(1.5deg); }
        }
        @keyframes slideUpFadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUpIn {
          0% { opacity: 0; transform: scale(0.96) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

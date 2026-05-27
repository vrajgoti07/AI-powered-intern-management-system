import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight, Brain, Shield, BarChart3,
  Clock, Zap, CheckCircle2, Star, Globe, Heart,
  Building2, Users, ThumbsUp, Timer, Quote,
  MessageSquare, Video, GitBranch, FileText, Layers, Briefcase,
  Lock, TrendingUp, UserCheck,
  ClipboardCheck, Award, Send
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

/* ─── Tiny reusable sub-components ─── */

const SectionBadge: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
    {text}
  </span>
);

const InitialAvatar: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <div
    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
    style={{ background: color }}
  >
    {name.charAt(0)}
  </div>
);

/* ─── Main Component ─── */

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans overflow-x-hidden selection:bg-blue-600 selection:text-white">

      {/* ═══════════ Navigation ═══════════ */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-3.5 flex items-center justify-between z-50 transition-all duration-300">
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} />
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">InternFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <a href="#features" className="hover:text-blue-600 transition-colors duration-200">Features</a>
          <a href="#workflow" className="hover:text-blue-600 transition-colors duration-200">How It Works</a>
          <a href="#testimonials" className="hover:text-blue-600 transition-colors duration-200">Testimonials</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100/50 rounded-lg transition-all cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/apply')}
            className="px-4.5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative px-6 pt-16 pb-8 md:pt-20 md:pb-12 max-w-6xl mx-auto w-full">
        {/* Decorative Light Orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/25 rounded-full blur-[120px] -z-10 animate-[blobFloat_12s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200/25 rounded-full blur-[120px] -z-10 animate-[blobFloat2_15s_ease-in-out_infinite_alternate]" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="text-left flex flex-col items-start animate-[heroFadeIn_0.8s_ease-out_0.2s_both]">
            <SectionBadge text="AI-Powered Platform" />
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
              The smarter way to manage your{' '}
              <span className="text-blue-600">internship program</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
              Onboard applicants, assign mentors, track daily progress, and issue verified certificates — all from one intelligent dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <button
                onClick={() => navigate('/apply')}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/15 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                Apply for internship <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200/80 shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                Explore dashboard
              </button>
            </div>

            {/* Trusted By Strip */}
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>Trusted by teams at</span>
              <div className="flex items-center gap-2">
                {['TechCorp', 'InnovateLabs', 'CloudNine', 'PixelForge'].map((company) => (
                  <span key={company} className="px-2.5 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 tracking-wide">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Dashboard Preview Mock */}
          <div className="relative animate-[heroFadeIn_0.8s_ease-out_0.5s_both]">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 ml-2">InternFlow Dashboard</span>
              </div>

              {/* Dashboard body */}
              <div className="p-4 space-y-3">
                {/* Top stat cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Active Interns', value: '148', icon: Users, accent: 'text-blue-600 bg-blue-50' },
                    { label: 'Tasks Done', value: '1,024', icon: CheckCircle2, accent: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Avg. Score', value: '87%', icon: TrendingUp, accent: 'text-indigo-600 bg-indigo-50' },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${card.accent}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-lg font-extrabold text-slate-800 tracking-tight">{card.value}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{card.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Mini chart placeholder */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500">Weekly Performance</span>
                    <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">+12%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {[40, 55, 35, 70, 60, 80, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-blue-500/80"
                        style={{ height: `${h}%`, opacity: 0.5 + (i * 0.07) }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent activity rows */}
                <div className="space-y-1.5">
                  {[
                    { name: 'Priya Nair', action: 'completed React module', time: '2m ago' },
                    { name: 'Rahul Mehta', action: 'submitted weekly report', time: '5m ago' },
                    { name: 'Ankit Patil', action: 'checked in for today', time: '12m ago' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                        {row.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-slate-700 truncate">
                          <span className="font-bold">{row.name}</span> {row.action}
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium shrink-0">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating accent badge */}
            <div className="absolute -bottom-3 -left-3 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-1.5 animate-[floatBadge_3s_ease-in-out_infinite]">
              <Zap className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Stats Bar ═══════════ */}
      <section className="bg-white border-y border-slate-200/50 py-10 mt-8 animate-[slideUpFadeIn_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Partner Companies', icon: Building2 },
            { value: '10,000+', label: 'Interns Placed', icon: Users },
            { value: '98%', label: 'Satisfaction Rate', icon: ThumbsUp },
            { value: '60%', label: 'Admin Time Saved', icon: Timer },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="space-y-2 group">
                <div className="w-10 h-10 mx-auto bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-1 group-hover:bg-blue-100 transition-colors duration-200">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ Features ═══════════ */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto space-y-14">
        <div className="text-center max-w-2xl mx-auto space-y-4 animate-[slideUpFadeIn_1s_cubic-bezier(0.16,1,0.3,1)_both]">
          <SectionBadge text="Core Features" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Everything your team needs, nothing it doesn't</h2>
          <p className="text-sm md:text-base font-medium text-slate-400">Launch and scale multi-department internship programs without the operational overhead.</p>
        </div>

        {/* Clean 3×2 Uniform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Brain, title: 'AI Recruiting Assistant', desc: 'Automatically scores applicant resumes against role requirements and routes top matches directly to your HR inbox.', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/15', bg: 'bg-blue-50/40' },
            { icon: BarChart3, title: 'Radar Skill Analytics', desc: 'Visualize intern competency across coding, collaboration, and communication with dynamic radar charts updated in real time.', gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/15', bg: 'bg-indigo-50/40' },
            { icon: Zap, title: 'Smart Onboarding Flow', desc: 'Multi-step application forms that collect credentials, preferences, and consent — then channel candidates straight into review queues.', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/15', bg: 'bg-amber-50/40' },
            { icon: Clock, title: 'Kanban Task Boards', desc: 'Drag-and-drop task columns give supervisors and interns a shared view of work in progress, blockers, and deliverables.', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/15', bg: 'bg-emerald-50/40' },
            { icon: CheckCircle2, title: 'Daily Attendance Tracking', desc: 'Calendar-based clock-in logs automatically compile attendance metrics so you always have accurate records at appraisal time.', gradient: 'from-sky-500 to-blue-500', shadow: 'shadow-sky-500/15', bg: 'bg-sky-50/40' },
            { icon: Shield, title: 'Role-Based Access Control', desc: 'Separate portals for HR admins, mentors, and interns — each with the exact permissions their role requires.', gradient: 'from-blue-600 to-slate-600', shadow: 'shadow-blue-500/15', bg: 'bg-blue-50/40' },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left group relative overflow-hidden"
                style={{ animation: 'scaleUpIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${0.1 + i * 0.07}s` }}
              >
                {/* Subtle hover glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 ${feat.bg} rounded-full blur-2xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`w-11 h-11 bg-gradient-to-br ${feat.gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-md ${feat.shadow} relative z-10`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2 relative z-10">{feat.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium relative z-10">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ Social Proof Band ═══════════ */}
      <section className="bg-white border-y border-slate-200/50 py-12 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trusted by HR teams at 500+ organizations worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { name: 'TechCorp', icon: Building2 },
              { name: 'InnovateLabs', icon: Layers },
              { name: 'CloudNine', icon: Globe },
              { name: 'PixelForge', icon: Briefcase },
              { name: 'DataSphere', icon: BarChart3 },
              { name: 'CodeCraft', icon: GitBranch },
            ].map((company) => {
              const Icon = company.icon;
              return (
                <button
                  key={company.name}
                  onClick={() => window.open(`https://www.google.com/search?q=${company.name}+company`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all duration-200 cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-wide">{company.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Enterprise-grade security · SOC 2 compliant · 99.9% uptime</span>
          </div>
        </div>
      </section>

      {/* ═══════════ How it Works ═══════════ */}
      <section id="workflow" className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <SectionBadge text="Simple Workflow" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">From application to certification in three steps</h2>
            <p className="text-sm md:text-base font-medium text-slate-400">Our structured pipeline supports every candidate from day one through program graduation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Gradient connecting line */}
            <div className="absolute top-[40px] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-indigo-300 hidden md:block -z-10 rounded-full" />

            {[
              { step: '01', title: 'Apply & Onboard', desc: 'Submit academic credentials and role preferences. Receive an instant department match upon HR approval.', icon: Send },
              { step: '02', title: 'Collaborate & Deliver', desc: 'Work through Kanban tasks, check in daily, and sync regularly with your assigned corporate mentor.', icon: UserCheck },
              { step: '03', title: 'Assess & Certify', desc: 'Review radar skill scores with your mentor, then receive a blockchain-verified digital internship certificate.', icon: Award },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center space-y-4 group"
                  style={{ animation: 'scaleUpIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${0.2 + i * 0.15}s` }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/15 ring-8 ring-blue-50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-500/20">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center text-[10px] font-extrabold text-blue-600 shadow-sm">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{step.title}</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ Testimonials ═══════════ */}
      <section id="testimonials" className="bg-white border-y border-slate-200/50 px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <SectionBadge text="Testimonials" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Trusted by HR teams and interns alike</h2>
            <p className="text-sm md:text-base font-medium text-slate-400">From fast-growing startups to established enterprises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'InternFlow cut our program management overhead by 60%. Assigning mentors, tracking tasks, and issuing certificates now takes minutes instead of days.', author: 'Priya Nair', role: 'HR Manager, TechCorp', color: '#2563eb', rating: 5 },
              { quote: 'The radar analytics made performance feedback concrete and objective. Our design interns could see exactly where to improve — no more vague end-of-term reviews.', author: 'Rahul Mehta', role: 'Design Director, InnovateLabs', color: '#6366f1', rating: 5 },
              { quote: 'The attendance tracker and AI chatbot kept me on top of every deadline during my three-month engineering placement. Genuinely useful, not just a nice-to-have.', author: 'Ankit Patil', role: 'Software Engineering Intern', color: '#0ea5e9', rating: 5 },
            ].map((test, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg hover:border-blue-200/40 hover:-translate-y-0.5 transition-all duration-300 text-left flex flex-col justify-between relative"
                style={{ animation: 'scaleUpIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${0.1 + i * 0.1}s` }}
              >
                {/* Quote decoration */}
                <Quote className="w-8 h-8 text-blue-100 mb-3" />

                <div className="space-y-4 flex-1">
                  <div className="flex gap-0.5 items-center">
                    {[...Array(test.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">"{test.quote}"</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-3">
                  <InitialAvatar name={test.author} color={test.color} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{test.author}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Integrations ═══════════ */}
      <section id="integrations" className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <SectionBadge text="Integrations" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Integrates with your existing stack</h2>
            <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">Connect InternFlow with the tools your team already uses. No migration headaches.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'Slack', icon: MessageSquare, url: 'https://slack.com' },
              { name: 'Google Workspace', icon: Globe, url: 'https://workspace.google.com' },
              { name: 'Zoom', icon: Video, url: 'https://zoom.us' },
              { name: 'GitHub', icon: GitBranch, url: 'https://github.com' },
              { name: 'Jira', icon: ClipboardCheck, url: 'https://www.atlassian.com/software/jira' },
              { name: 'Notion', icon: FileText, url: 'https://notion.so' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.name}
                  onClick={() => window.open(tool.url, '_blank')}
                  className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <Icon className="w-4.5 h-4.5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA Banner ═══════════ */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-16 px-6 text-center text-white relative overflow-hidden">
        {/* Subtle geometric accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-20 w-20 h-20 border border-white/10 rounded-2xl rotate-12" />
        <div className="absolute bottom-8 left-16 w-14 h-14 border border-white/10 rounded-xl -rotate-12" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Ready to transform your<br />internship program?
          </h2>
          <p className="text-blue-100 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Deploy AI-powered dashboards, scientific skill evaluations, and verified certificates for your next cohort — today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/apply')}
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              Start free trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-700/50 hover:bg-blue-700 border border-blue-400/30 font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Explore sandbox
            </button>
          </div>
          <p className="text-[11px] text-blue-200 font-medium flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> No credit card required · Setup in under 5 minutes
          </p>
        </div>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-16 text-slate-400">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12 text-left">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <span className="font-extrabold text-white text-base tracking-tight">InternFlow</span>
            </div>
            <p className="text-xs font-medium leading-relaxed max-w-xs text-slate-500">
              Complete cohort management tools powered by AI — built for the teams shaping the next generation of talent.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <GitBranch className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>
          {[
            {
              title: 'Product',
              links: [
                { label: 'Features', href: '#features' },
                { label: 'Integrations', href: '#integrations' },
                { label: 'Roadmap', href: '/roadmap' }
              ]
            },
            {
              title: 'Company',
              links: [
                { label: 'About Us', href: '/about' },
                { label: 'Careers', href: '/careers' },
                { label: 'Press', href: '/press' },
                { label: 'Contact', href: '/contact' }
              ]
            },
            {
              title: 'Legal',
              links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Cookie Settings', href: '/cookies' },
                { label: 'Security', href: '/security' }
              ]
            }
          ].map((col, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-500">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        if (link.href === '#') {
                          e.preventDefault();
                          toast.success(`${link.label} page coming soon!`);
                        } else if (link.href.startsWith('/')) {
                          e.preventDefault();
                          window.scrollTo(0, 0);
                          navigate(link.href);
                        }
                      }}
                      className="hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© 2026 InternFlow Inc. All rights reserved.</p>
          <p className="flex items-center gap-1.5">Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> in India</p>
        </div>
      </footer>

      {/* ═══════════ Animations ═══════════ */}
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
        @keyframes slideUpFadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUpIn {
          0% { opacity: 0; transform: scale(0.96) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

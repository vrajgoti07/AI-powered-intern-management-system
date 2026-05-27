import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronUp, Send, CheckCircle2, Clock, Circle, HelpCircle } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

type StatusType = 'shipped' | 'in-progress' | 'planned' | 'under-review';

interface Feature {
  id: string;
  title: string;
  desc: string;
  tag: string;
  upvotes: number;
  status: StatusType;
}

const initialFeatures: Feature[] = [
  // Shipped
  { id: '1', title: 'AI Resume Screener', desc: 'Automatically parse and score incoming intern resumes against job requirements.', tag: 'AI & ML', upvotes: 342, status: 'shipped' },
  { id: '2', title: 'Bulk Email Tool', desc: 'Send personalized cohort announcements or rejection emails in bulk.', tag: 'Communication', upvotes: 215, status: 'shipped' },
  { id: '3', title: 'CSV Import', desc: 'Import existing intern data from legacy systems via CSV upload.', tag: 'Data', upvotes: 189, status: 'shipped' },
  { id: '4', title: 'Slack Integration', desc: 'Receive real-time notifications for intern submissions and messages in Slack.', tag: 'Integrations', upvotes: 412, status: 'shipped' },
  
  // In Progress
  { id: '5', title: 'Mobile App', desc: 'Native iOS and Android apps for interns to log hours and check tasks on the go.', tag: 'Platform', upvotes: 856, status: 'in-progress' },
  { id: '6', title: 'API v2', desc: 'Expanded GraphQL API for deeper integrations with enterprise HRIS systems.', tag: 'Developer', upvotes: 145, status: 'in-progress' },
  { id: '7', title: 'Analytics Dashboard v2', desc: 'Customizable widgets and deeper cohort performance insights.', tag: 'Analytics', upvotes: 532, status: 'in-progress' },
  { id: '8', title: 'Mentor Portal', desc: 'Dedicated workspace for mentors to track their assigned interns.', tag: 'User Roles', upvotes: 621, status: 'in-progress' },

  // Planned
  { id: '9', title: 'Video Interview Integration', desc: 'Connect Zoom and Google Meet for seamless interview scheduling.', tag: 'Integrations', upvotes: 743, status: 'planned' },
  { id: '10', title: 'AI Performance Summaries', desc: 'Weekly AI-generated summaries of intern progress for managers.', tag: 'AI & ML', upvotes: 890, status: 'planned' },
  { id: '11', title: 'Multi-company Support', desc: 'Manage internships across subsidiary companies from a single parent account.', tag: 'Enterprise', upvotes: 210, status: 'planned' },
  { id: '12', title: 'Custom Workflows', desc: 'Drag-and-drop builder for custom onboarding and offboarding workflows.', tag: 'Platform', upvotes: 654, status: 'planned' },

  // Under Review
  { id: '13', title: 'Marketplace', desc: 'A public directory of available interns seeking placement.', tag: 'New Product', upvotes: 1205, status: 'under-review' },
  { id: '14', title: 'White-label Option', desc: 'Remove InternFlow branding and use your own company logo and colors.', tag: 'Enterprise', upvotes: 489, status: 'under-review' }
];

export const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'timeline'>('kanban');
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);

  const handleUpvote = (id: string) => {
    setFeatures(features.map(f => f.id === id ? { ...f, upvotes: f.upvotes + 1 } : f));
  };

  const statusConfig = {
    'shipped': { label: 'Shipped', color: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
    'in-progress': { label: 'In Progress', color: 'bg-blue-600', bg: 'bg-blue-600/10', border: 'border-blue-600/20', icon: Clock },
    'planned': { label: 'Planned', color: 'bg-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Circle },
    'under-review': { label: 'Under Review', color: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: HelpCircle }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 font-sans selection:bg-blue-500/30">
      <header className="bg-[#0d1117]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span className="font-bold text-white tracking-tight">InternFlow</span>
          </div>
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto px-6 py-20 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6 animate-[slideUpFadeIn_0.5s_ease-out_both]">
          <h1 className="text-5xl md:text-7xl font-fraunces font-medium text-white tracking-tight">
            What we're building <span className="text-[#2563eb] italic">next</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We believe in transparent product development. Explore our roadmap, upvote your favorite features, and suggest new ideas.
          </p>
        </section>

        {/* Legend & Toggle */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 animate-[slideUpFadeIn_0.6s_ease-out_both]">
          <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-full border border-slate-800">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2 px-3 py-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${config.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                <span className="text-xs font-dm-mono uppercase tracking-wider text-slate-400">{config.label}</span>
              </div>
            ))}
          </div>

          <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
            <button
              onClick={() => setView('kanban')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${view === 'kanban' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${view === 'timeline' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Timeline
            </button>
          </div>
        </section>

        {/* Kanban Board */}
        {view === 'kanban' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-[slideUpFadeIn_0.7s_ease-out_both] items-start">
            {(Object.keys(statusConfig) as StatusType[]).map(status => (
              <div key={status} className="space-y-4">
                <div className={`px-4 py-3 rounded-xl border ${statusConfig[status].bg} ${statusConfig[status].border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {React.createElement(statusConfig[status].icon, { className: `w-4 h-4 ${statusConfig[status].color.replace('bg-', 'text-')}` })}
                    <h3 className={`font-dm-mono text-sm uppercase tracking-wider font-semibold ${statusConfig[status].color.replace('bg-', 'text-')}`}>
                      {statusConfig[status].label}
                    </h3>
                  </div>
                  <span className="text-xs font-dm-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md">
                    {features.filter(f => f.status === status).length}
                  </span>
                </div>

                <div className="space-y-4">
                  {features.filter(f => f.status === status).map(feature => (
                    <div 
                      key={feature.id} 
                      className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-600 hover:-translate-y-1 hover:shadow-xl hover:bg-slate-800/40 transition-all duration-300 group cursor-grab active:cursor-grabbing flex flex-col h-full"
                    >
                      <div className="mb-4 flex-grow">
                        <span className="inline-block px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-dm-mono uppercase tracking-widest rounded-md mb-3 border border-slate-700">
                          {feature.tag}
                        </span>
                        <h4 className="font-fraunces text-lg font-medium text-white mb-2 leading-tight group-hover:text-[#2563eb] transition-colors">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-slate-800/50 flex justify-end mt-auto">
                        <button 
                          onClick={() => handleUpvote(feature.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-[#2563eb]/10 border border-slate-700 hover:border-[#2563eb]/50 text-slate-400 hover:text-[#2563eb] transition-all text-xs font-dm-mono"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          {feature.upvotes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Timeline View Placeholder */}
        {view === 'timeline' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center animate-[slideUpFadeIn_0.3s_ease-out_both]">
            <h3 className="text-2xl font-fraunces text-white mb-4">Quarterly Timeline</h3>
            <p className="text-slate-400">Timeline visualization is currently under construction. Please use the board view.</p>
          </section>
        )}

        {/* Suggest & Newsletter */}
        <section className="grid md:grid-cols-2 gap-8 animate-[slideUpFadeIn_0.8s_ease-out_both] max-w-5xl mx-auto">
          <div className="bg-[#2563eb]/10 border border-[#2563eb]/20 p-8 md:p-10 rounded-3xl">
            <h3 className="text-2xl font-fraunces text-white mb-3">Suggest a Feature</h3>
            <p className="text-slate-400 mb-6 text-sm">Don't see what you need? Let us know what we should build next.</p>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <input 
                type="text" 
                placeholder="Feature title..." 
                className="w-full bg-[#0d1117] border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#2563eb] transition-colors"
              />
              <textarea 
                placeholder="Describe how it works..." 
                rows={3}
                className="w-full bg-[#0d1117] border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
              />
              <button className="flex items-center justify-center gap-2 w-full bg-[#2563eb] hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <Send className="w-4 h-4" /> Submit Request
              </button>
            </form>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 md:p-10 rounded-3xl flex flex-col justify-center">
            <h3 className="text-2xl font-fraunces text-white mb-3">Stay in the loop</h3>
            <p className="text-slate-400 mb-6 text-sm">Get notified when features ship. No spam, just product updates.</p>
            <form className="flex gap-3" onSubmit={e => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="flex-grow bg-[#0d1117] border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-slate-500 transition-colors"
              />
              <button className="bg-white text-[#0d1117] hover:bg-slate-200 font-bold px-6 py-3 rounded-xl transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes slideUpFadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

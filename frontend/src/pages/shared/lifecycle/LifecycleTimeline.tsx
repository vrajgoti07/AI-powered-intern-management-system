import React, { useState } from 'react';
import { 
  Milestone, Send, 
  ClipboardList, Info
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';

export const LifecycleTimeline: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stage, setStage] = useState(2); // Mid-term progress
  const [exitSurveySubmitted, setExitSurveySubmitted] = useState(false);

  // Form states for exit interview
  const [rating, setRating] = useState('5');
  const [remarks, setRemarks] = useState('');

  const submitExitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Please add exit survey remarks.");
      return;
    }
    setExitSurveySubmitted(true);
    toast.success("Exit Interview survey submitted successfully!");
  };

  // Progression milestones
  const milestones = [
    { num: 1, label: "Onboarding & IT Setup", desc: "Government verification and keys credentials setup.", date: "2026-03-01" },
    { num: 2, label: "Training & Core Tasks", desc: "First 4 weeks of project engineering tasks.", date: "2026-04-01" },
    { num: 3, label: "Midterm Progress Audit", desc: "Score matching overlays with mentor feedback.", date: "2026-04-15" },
    { num: 4, label: "Final Task Evaluations", desc: "Normalized performance index score scorecard.", date: "2026-05-25" },
    { num: 5, label: "Exit Interview Survey", desc: "Completion reviews and digital signature.", date: "2026-06-01" }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Internship Lifecycle Timeline" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Timeline Progress */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b">
                <Milestone className="w-5 h-5 text-indigo-600" /> Internship Milestones Tracker
              </h3>

              <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3">
                {milestones.map((m) => {
                  const isDone = stage >= m.num;
                  const isCurrent = stage === m.num;

                  return (
                    <div key={m.num} className="relative">
                      {/* Node Indicator */}
                      <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all duration-300 ${
                        isDone ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}>
                        {isDone ? '✓' : m.num}
                      </span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className={`text-xs font-extrabold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>{m.label}</h4>
                          <span className="text-[9px] text-slate-400 font-bold">{m.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stage progression is managed by the HR/Mentor workflow */}
            </div>

            {/* Exit Interview Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm min-h-[380px] flex flex-col justify-between">
                
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b">
                    <ClipboardList className="w-5 h-5 text-indigo-600" /> Exit Interview Survey
                  </h3>

                  {stage < 5 ? (
                    <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-150 rounded-2xl mt-4 flex flex-col items-center justify-center min-h-[220px]">
                      <Info className="w-8 h-8 text-slate-300 mb-2" /> Exit Survey locks until final evaluation stage (Stage 5) is active.
                    </div>
                  ) : exitSurveySubmitted ? (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 mt-4 text-xs font-semibold leading-relaxed">
                      Thank you! Your exit interview comments have been uploaded and added to the official report registers.
                    </div>
                  ) : (
                    <form onSubmit={submitExitSurvey} className="space-y-4 mt-4 text-xs">
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Overall Internship Rating (1 - 5)</label>
                        <select 
                          value={rating} 
                          onChange={(e) => setRating(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border rounded-xl"
                        >
                          <option value="5">5 - Excellent experience</option>
                          <option value="4">4 - Good experience</option>
                          <option value="3">3 - Satisfactory</option>
                          <option value="2">2 - Needs improvements</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Reflection Notes & Suggestions</label>
                        <textarea 
                          rows={3} 
                          placeholder="Detail your takeaways..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                        ></textarea>
                      </div>

                      <button 
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Submit Exit Interview <Send className="w-4 h-4" />
                      </button>

                    </form>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

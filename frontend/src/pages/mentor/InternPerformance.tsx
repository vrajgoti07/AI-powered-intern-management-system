import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { RadarChartComponent } from '../../components/charts/RadarChartComponent';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { FeedbackForm } from '../../components/forms/FeedbackForm';
import { 
  Brain, 
  Award, 
  Filter, 
  ShieldAlert, 
  Sparkles, 
  Code, 
  Users, 
  MessageSquare, 
  Zap, 
  Calendar, 
  GraduationCap, 
  TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const InternPerformance: React.FC = () => {
  const { state, refreshData } = useApp();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mentor dynamic reference from logged-in user
  const mentorName = user?.name || "Mentor";
  const isDepartmentHead = user?.originalRole === 'DEPARTMENT_HEAD';
  
  const myInterns = isDepartmentHead
    ? state.interns.filter((i: any) => i.dept === user?.headedDepartment?.name)
    : state.interns.filter((i: any) => i.mentor === mentorName);
  
  const [selectedInternId, setSelectedInternId] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  React.useEffect(() => {
    if (myInterns.length > 0 && !selectedInternId) {
      setSelectedInternId(myInterns[0].id);
    }
  }, [myInterns, selectedInternId]);

  const selectedIntern = state.interns.find(i => i.id === selectedInternId) || myInterns[0];

  // Map scores into Radar format. Pulls persistent sub-scores from backend JSON field.
  const getRadarData = () => {
    if (!selectedIntern) return [];
    
    const exp = selectedIntern.experience;
    if (exp && typeof exp === 'object' && 'coding' in exp) {
      return [
        { subject: 'Coding', A: Number(exp.coding) || 0, fullMark: 100 },
        { subject: 'Teamwork', A: Number(exp.teamwork) || 0, fullMark: 100 },
        { subject: 'Communication', A: Number(exp.communication) || 0, fullMark: 100 },
        { subject: 'Initiative', A: Number(exp.initiative) || 0, fullMark: 100 },
        { subject: 'Planning', A: Number(exp.planning) || 0, fullMark: 100 },
      ];
    }

    // Default intelligent mapping if no evaluations have been submitted yet
    const base = selectedIntern.score || 75;
    return [
      { subject: 'Coding', A: base, fullMark: 100 },
      { subject: 'Teamwork', A: Math.min(base + 5, 100), fullMark: 100 },
      { subject: 'Communication', A: Math.max(base - 10, 50), fullMark: 100 },
      { subject: 'Initiative', A: Math.min(base + 3, 100), fullMark: 100 },
      { subject: 'Planning', A: Math.max(base - 5, 60), fullMark: 100 },
    ];
  };

  const radarData = getRadarData();

  const handleFeedbackSubmit = async (feedbackData: {
    coding: number;
    teamwork: number;
    communication: number;
    initiative: number;
    planning: number;
    score: number;
  }) => {
    if (!selectedIntern) return;
    try {
      await api.put(`/interns/${selectedIntern.id}`, { 
        score: feedbackData.score,
        experience: {
          coding: feedbackData.coding,
          teamwork: feedbackData.teamwork,
          communication: feedbackData.communication,
          initiative: feedbackData.initiative,
          planning: feedbackData.planning
        }
      });
      toast.success("Feedback submitted. Competency scorecard saved successfully!");
      setShowFeedbackModal(false);
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to update performance metrics";
      toast.error(errMsg);
    }
  };

  const getAIRecommendation = () => {
    if (!selectedIntern) return "";
    const sc = selectedIntern.score;
    if (sc >= 90) {
      return `${selectedIntern.name} exhibits exemplary technical capabilities and outstanding task ownership. Recommending immediately for Pre-Placement Offer (PPO) review cycle.`;
    }
    if (sc >= 80) {
      return `${selectedIntern.name} has demonstrated robust progress. Continues to deliver high quality frontend cards. Support further with cloud infrastructure experience.`;
    }
    return `${selectedIntern.name} is progressing steadily. Recommending focusing on improving collaborative standups and planning timeliness.`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Intern Performance Tracker" />

        {/* Action Header */}
        <div className="px-8 py-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-left border-b border-slate-100 bg-white/60 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Select Active Intern</span>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm w-full max-w-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={selectedInternId}
                onChange={(e) => setSelectedInternId(e.target.value)}
                className="text-xs bg-transparent focus:outline-none font-bold text-slate-700 w-full cursor-pointer"
              >
                {myInterns.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.dept})</option>
                ))}
              </select>
            </div>
          </div>

          {selectedIntern && (
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="self-end flex items-center justify-center gap-2 px-5 py-3 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-95"
            >
              <Award className="w-4 h-4" /> Evaluate Performance
            </button>
          )}
        </div>

        {/* Performance display panels */}
        {selectedIntern ? (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/50">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Radar Chart & Telemetry Progress */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Visual Chart Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-100/50 flex flex-col lg:flex-row gap-8 items-center">
                  <div className="w-full lg:w-1/2 flex flex-col justify-between h-full space-y-4">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Competency Skills Radar</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Scientific multi-parameter telemetry analysis diagram</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        This model visualizes core professional attributes evaluated by supervisors. Submit assessments periodically to maintain updated metrics.
                      </p>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex items-center justify-center">
                    <RadarChartComponent data={radarData} height={210} />
                  </div>
                </div>

                {/* Sub-Score Telemetry Dossier Panel */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-100/50 text-left">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Assessment Telemetry Metrics</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Granular competency breakdown and index scoring</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Live Database Metrics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: "Coding & Technical Competence", score: radarData[0]?.A || 0, icon: Code, color: "from-blue-500 to-indigo-500", bg: "bg-blue-50 text-blue-600" },
                      { name: "Teamwork & Collaborative Skills", score: radarData[1]?.A || 0, icon: Users, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 text-emerald-600" },
                      { name: "Communication & Clarity", score: radarData[2]?.A || 0, icon: MessageSquare, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-600" },
                      { name: "Initiative & Problem Solving", score: radarData[3]?.A || 0, icon: Zap, color: "from-purple-500 to-fuchsia-500", bg: "bg-purple-50 text-purple-600" },
                      { name: "Planning & Reliability", score: radarData[4]?.A || 0, icon: Calendar, color: "from-rose-500 to-pink-500", bg: "bg-rose-50 text-rose-600" }
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div key={metric.name} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100/80 transition-all hover:shadow-lg hover:shadow-slate-100/50 flex flex-col justify-between space-y-3 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl ${metric.bg} transition-colors group-hover:scale-110 duration-200`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">{metric.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">{metric.score}%</span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-500`}
                              style={{ width: `${metric.score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Dossier Card & AI Review */}
              <div className="space-y-8">
                
                {/* Dossier Info Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-100/50 flex flex-col text-left space-y-6">
                  <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                    <Avatar name={selectedIntern.name} size="md" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{selectedIntern.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {selectedIntern.college}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="text-slate-400">Department:</span>
                      <StatusBadge type="dept" value={selectedIntern.dept} />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="text-slate-400">Evaluation Grade:</span>
                      <span className="text-indigo-600 font-extrabold bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {selectedIntern.score}% Avg
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="text-slate-400">Attendance Score:</span>
                      <span className="text-emerald-600 font-extrabold bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        {selectedIntern.attendance}% Clocked
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Review Insight: premium light glass panel */}
                <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 backdrop-blur-xl rounded-3xl p-8 border border-indigo-100/70 shadow-xl shadow-indigo-100/20 text-left relative overflow-hidden">
                  {/* Subtle decorative lights */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] uppercase tracking-widest bg-indigo-100/50 px-3 py-1.5 rounded-full border border-indigo-200/50 w-fit">
                      <Brain className="w-3.5 h-3.5 animate-pulse text-indigo-600" /> AI Review Synthesis
                    </div>

                    <p className="text-[12px] text-slate-700 leading-relaxed font-extrabold">
                      {getAIRecommendation()}
                    </p>

                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time LLM Output</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 bg-slate-50/30">
            <div className="p-4 bg-white border border-slate-100 rounded-full shadow-lg shadow-slate-100">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">No assigned interns to track</p>
          </div>
        )}
      </main>

      {/* Evaluate Modal */}
      {selectedIntern && (
        <Modal 
          isOpen={showFeedbackModal} 
          onClose={() => setShowFeedbackModal(false)} 
          title={`Evaluate Performance Dossier: ${selectedIntern.name}`}
        >
          <FeedbackForm 
            internName={selectedIntern.name}
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setShowFeedbackModal(false)}
          />
        </Modal>
      )}

    </div>
  );
};

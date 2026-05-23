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
import { Brain, Award, Filter, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const InternPerformance: React.FC = () => {
  const { state, refreshData } = useApp();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mentor dynamic reference from logged-in user
  const mentorName = user?.name || "Mentor";
  const myInterns = state.interns.filter(i => i.mentor === mentorName);
  
  const [selectedInternId, setSelectedInternId] = useState<string>(myInterns[0]?.id || '');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const selectedIntern = state.interns.find(i => i.id === selectedInternId) || myInterns[0];

  // Map scores into Radar format. If first time or default, generate robust defaults based on overall score.
  const getRadarData = () => {
    if (!selectedIntern) return [];
    const base = selectedIntern.score || 80;
    return [
      { subject: 'Coding', A: base, fullMark: 100 },
      { subject: 'Teamwork', A: Math.min(base + 5, 100), fullMark: 100 },
      { subject: 'Communication', A: Math.max(base - 10, 50), fullMark: 100 },
      { subject: 'Initiative', A: Math.min(base + 3, 100), fullMark: 100 },
      { subject: 'Planning', A: Math.max(base - 5, 60), fullMark: 100 },
    ];
  };

  const handleFeedbackSubmit = async (feedbackData: { score: number }) => {
    if (!selectedIntern) return;
    try {
      await api.put(`/interns/${selectedIntern.id}`, { score: feedbackData.score });
      toast.success("Feedback submitted. Performance metrics updated successfully!");
      setShowFeedbackModal(false);
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to update performance score";
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
        <div className="p-6 pb-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm w-full max-w-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="text-xs bg-transparent focus:outline-none font-bold text-slate-600 w-full cursor-pointer"
            >
              {myInterns.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.dept})</option>
              ))}
            </select>
          </div>

          {selectedIntern && (
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Award className="w-4 h-4" /> Evaluate Performance
            </button>
          )}
        </div>

        {/* Performance display panels */}
        {selectedIntern ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Radar Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Competency Skills Radar</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Scientific parameter assessment diagram</p>
                </div>
                <div className="py-4">
                  <RadarChartComponent data={getRadarData()} height={210} />
                </div>
              </div>

              {/* Dossier info */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between text-left space-y-5">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 flex-shrink-0">
                  <Avatar name={selectedIntern.name} size="md" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{selectedIntern.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{selectedIntern.college}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Department:</span>
                    <StatusBadge type="dept" value={selectedIntern.dept} />
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Evaluation Grade:</span>
                    <span className="text-indigo-600 font-extrabold bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                      {selectedIntern.score}% Avg
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Attendance Score:</span>
                    <span className="text-emerald-600 font-extrabold bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100">
                      {selectedIntern.attendance}% Clock
                    </span>
                  </div>
                </div>

                {/* AI Review Insight */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-indigo-800 font-extrabold text-[11px] uppercase tracking-wide">
                    <Brain className="w-4 h-4 animate-pulse text-indigo-600" /> AI Review Synthesis
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-relaxed font-semibold">
                    {getAIRecommendation()}
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold">No assigned interns to track</p>
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

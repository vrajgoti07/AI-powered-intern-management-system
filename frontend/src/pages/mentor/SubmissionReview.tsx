import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, CheckCircle2, AlertCircle, Eye, 
  ExternalLink, MessageSquare, Star, ArrowRight, User
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useTasks } from '../../hooks/queries';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';

const getFileUrl = (url: string | null) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

export const SubmissionReview: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [grade, setGrade] = useState('85');
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  // Fetch all tasks assigned by this mentor
  const { data: tasks = [], isLoading } = useTasks();

  // Filter tasks that have deliverables (in REVIEW or COMPLETED status)
  const deliverables = tasks.filter((t: any) => t.status === 'REVIEW' || t.status === 'COMPLETED');

  const [selectedSub, setSelectedSub] = useState<any>(null);

  // Sync selected task when tasks load or change
  useEffect(() => {
    if (deliverables.length > 0) {
      const exists = selectedSub && deliverables.some((t: any) => t.id === selectedSub.id);
      if (!exists) {
        setSelectedSub(deliverables[0]);
      } else {
        const updated = deliverables.find((t: any) => t.id === selectedSub.id);
        setSelectedSub(updated);
      }
    } else {
      setSelectedSub(null);
    }
  }, [tasks]);

  // Sync performance score when selected task changes (pre-fill with intern's current score if already graded)
  useEffect(() => {
    if (selectedSub) {
      const currentScore = selectedSub.intern?.score;
      setGrade(currentScore !== undefined && currentScore !== null ? String(currentScore) : '85');
    }
  }, [selectedSub]);

  const handleSubmitEvaluation = async () => {
    if (!selectedSub) return;
    
    const internId = selectedSub.internId || selectedSub.intern?.id;
    if (!internId) {
      toast.error("Could not find intern ID associated with this task.");
      return;
    }

    const scoreNum = Number(grade);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Please enter a valid performance score between 0 and 100.");
      return;
    }

    const isAlreadyCompleted = selectedSub.status === 'COMPLETED';
    const loadingToast = toast.loading(
      isAlreadyCompleted 
        ? "Updating evaluation grade..." 
        : "Submitting evaluation and updating intern scorecard..."
    );

    try {
      // 1. Update task status to COMPLETED (if not already completed)
      if (!isAlreadyCompleted) {
        await api.put(`/tasks/${selectedSub.id}`, { status: 'COMPLETED' });
      }

      // 2. Update intern's overall performance score
      await api.put(`/interns/${internId}`, { score: scoreNum });

      // 3. Add direct mentor feedback remarks as a task comment if provided
      if (feedback.trim()) {
        await api.post(`/tasks/${selectedSub.id}/comments`, { comment: feedback });
      }

      toast.dismiss(loadingToast);
      toast.success(
        isAlreadyCompleted
          ? `Evaluation grade updated! ${selectedSub.intern?.user?.name || 'Intern'} score updated to ${scoreNum}%.`
          : `Task evaluated! ${selectedSub.intern?.user?.name || 'Intern'} graded with ${scoreNum}% score.`
      );
      
      // Reset feedback
      setFeedback('');

      // Invalidate react-query cache to instantly sync changes with backend
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to complete evaluation.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Task Evaluation Workspace" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Left Block: Submissions Inbox */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Deliverables Inbox ({deliverables.length})
                  </h3>
                </div>

                <div className="space-y-3 mt-4">
                  {isLoading ? (
                    <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-100 rounded-2xl animate-pulse">
                      Loading deliverables...
                    </div>
                  ) : deliverables.length > 0 ? (
                    deliverables.map((s: any) => {
                      const displayPriority = s.priority 
                        ? s.priority.charAt(0) + s.priority.slice(1).toLowerCase() 
                        : 'Medium';
                      const isCompleted = s.status === 'COMPLETED';
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => setSelectedSub(s)}
                          className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 ${
                            selectedSub?.id === s.id 
                              ? 'bg-indigo-50/50 border-indigo-200' 
                              : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                          }`}
                        >
                          <h4 className="font-extrabold text-slate-800 text-xs">{s.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Submitted by: {s.intern?.user?.name || 'Unknown Intern'}</p>
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-1.5">
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-md ${
                              s.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'
                            }`}>{displayPriority} Priority</span>
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-md ${
                              isCompleted 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>{isCompleted ? 'Graded' : 'Awaiting Evaluation'}</span>
                            <span className="text-[9px] text-slate-400 font-bold ml-auto">
                              {s.submittedAt ? dayjs(s.submittedAt).format('MMM D') : (s.updatedAt ? dayjs(s.updatedAt).format('MMM D') : 'N/A')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                      No deliverables submitted yet!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Block: Grading Area */}
            <div className="lg:col-span-2 text-left">
              {selectedSub ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                  
                  {/* Evaluation header */}
                  <div className="flex justify-between items-start flex-wrap gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="font-extrabold text-slate-800 text-base">{selectedSub.title}</h2>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">Deliverable submitted by: <strong>{selectedSub.intern?.user?.name || 'Unknown Intern'}</strong></p>
                    </div>
                    {selectedSub.status === 'COMPLETED' ? (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                        Graded & Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600">
                        Awaiting Evaluation
                      </span>
                    )}
                  </div>

                  {/* Submission Details */}
                  <div className="space-y-4 text-xs text-slate-600 font-semibold leading-relaxed">
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Candidate Submission Notes</p>
                      <p className="text-slate-700 italic">"{selectedSub.submissionNotes || 'No submission notes provided.'}"</p>
                    </div>

                    {selectedSub.submissionUrl ? (
                      <a 
                        href={getFileUrl(selectedSub.submissionUrl)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-3 p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors w-fit cursor-pointer"
                      >
                        <ExternalLink className="w-4.5 h-4.5 text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] text-left">Download Deliverable</p>
                          <p className="text-[9px] text-slate-400 font-semibold text-left truncate max-w-[200px]">
                            {selectedSub.submissionUrl.split(/[/\\]/).pop()}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 text-slate-400 w-fit">
                        <AlertCircle className="w-4.5 h-4.5" />
                        <div>
                          <p className="font-bold text-[11px]">No deliverable file uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evaluation Actions */}
                  <div className="border-t border-slate-100 pt-5 space-y-4 text-left">
                    <h3 className="font-extrabold text-slate-800 text-xs">Evaluation Scorecard & Remarks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Performance Score (0 - 100%)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white" 
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-600">Direct Mentor Feedback Remarks</label>
                        <input 
                          type="text" 
                          placeholder="Provide supportive feedback details..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white" 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={handleSubmitEvaluation}
                        className="flex items-center gap-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        {selectedSub.status === 'COMPLETED' ? 'Update Evaluation Grade' : 'Submit Evaluation Grade'}{' '}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center min-h-[300px]">
                  Select an active submission inbox item to begin candidate scorecard reviews.
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

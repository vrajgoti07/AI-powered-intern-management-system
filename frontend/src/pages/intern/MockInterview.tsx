import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  Award, Briefcase, ChevronRight, Brain, Clock, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle, AlertTriangle, Play, MessageSquare, Sparkles, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface InterviewQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL';
  internAnswer?: string | null;
  score?: number | null;
  aiFeedback?: string | null;
}

interface MockInterview {
  id: string;
  jobRole: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  overallScore?: number | null;
  readinessLevel?: 'READY' | 'NEARLY_READY' | 'NEEDS_PRACTICE' | null;
  aiSummary?: string | null;
  completedAt?: string | null;
  createdAt: string;
  questions: InterviewQuestion[];
}

const JOB_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Data Analyst',
  'Product Manager',
  'UI/UX Designer'
];

export const MockInterview: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Setup, 2 = Interview, 3 = Results
  const [selectedRole, setSelectedRole] = useState(JOB_ROLES[0]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MockInterview[]>([]);
  const [activeInterview, setActiveInterview] = useState<MockInterview | null>(null);

  // Active interview state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<{ score: number; aiFeedback: string } | null>(null);

  // Accordion state for history / results
  const [expandedInterview, setExpandedInterview] = useState<string | null>(null);
  const [expandedQIndex, setExpandedQIndex] = useState<number | null>(null);

  // Bottom scroll ref for keyboard focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/mock-interviews/my');
      if (res.data.success && Array.isArray(res.data.data)) {
        setHistory(res.data.data);
        // If there is an active session in progress, auto-resume it!
        const active = res.data.data.find((i: MockInterview) => i.status === 'IN_PROGRESS');
        if (active) {
          setActiveInterview(active);
          // Find first unanswered question
          const unansweredIdx = active.questions.findIndex((q: InterviewQuestion) => !q.internAnswer);
          setCurrentQIndex(unansweredIdx >= 0 ? unansweredIdx : 0);
          setStep(2);
        }
      }
    } catch (err) {
      console.error('Failed to fetch interview history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await api.post('/mock-interviews/start', { jobRole: selectedRole });
      if (res.data.success && res.data.data) {
        setActiveInterview(res.data.data);
        setCurrentQIndex(0);
        setAnswerInput('');
        setQuestionFeedback(null);
        setStep(2);
        toast.success(`Mock interview for ${selectedRole} started!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeInterview) return;
    const currentQ = activeInterview.questions[currentQIndex];
    if (!answerInput.trim() || answerInput.trim().length < 5) {
      toast.error('Please provide a complete answer (at least 5 characters).');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/mock-interviews/${activeInterview.id}/answer`, {
        questionNumber: currentQ.questionNumber,
        answer: answerInput.trim()
      });

      if (res.data.success && res.data.data) {
        const result = res.data.data;
        // Show evaluation tips
        setQuestionFeedback({
          score: result.score,
          aiFeedback: result.aiFeedback
        });
        
        // Update activeInterview object in state locally
        const updatedQuestions = [...activeInterview.questions];
        updatedQuestions[currentQIndex] = {
          ...currentQ,
          internAnswer: answerInput.trim(),
          score: result.score,
          aiFeedback: result.aiFeedback
        };
        setActiveInterview({
          ...activeInterview,
          questions: updatedQuestions
        });

        toast.success(`Question ${currentQ.questionNumber} evaluated!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to evaluate answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = async () => {
    if (!activeInterview) return;

    if (currentQIndex < 4) {
      setCurrentQIndex(currentQIndex + 1);
      setAnswerInput('');
      setQuestionFeedback(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      // Complete interview
      setLoading(true);
      try {
        const res = await api.post(`/mock-interviews/${activeInterview.id}/complete`);
        if (res.data.success && res.data.data) {
          setActiveInterview(res.data.data);
          setStep(3);
          toast.success('Interview session completed! XP awarded!');
          fetchHistory();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to finalize interview.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Keyboard scroll assistance on mobile devices
  const handleTextareaFocus = () => {
    if (window.innerWidth < 768) {
      setTimeout(() => {
        submitButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }
  };

  const getReadinessColor = (level?: string | null) => {
    switch (level) {
      case 'READY':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'NEARLY_READY':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'NEEDS_PRACTICE':
      default:
        return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    }
  };

  const currentQ = activeInterview?.questions[currentQIndex];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Mock Interview" />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* STEP 1: SETUP PORTAL */}
          {step === 1 && (
            <div className="max-w-4xl mx-auto space-y-8 text-left">
              {/* Introduction Card */}
              <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Brain className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">AI Mock Interview Portal</h2>
                  <p className="text-xs font-semibold text-slate-500 max-w-2xl leading-relaxed">
                    Test your expertise and readiness. Choose your target domain role, complete a 5-question structured exam, and receive instant AI performance insights, scoring feedback, and an official preparedness evaluation rank.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="md:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    Interview Config
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer transition-all"
                    >
                      {JOB_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                      <span className="text-[10px] font-black text-indigo-900 uppercase">Gamify Reward</span>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-700 leading-normal">
                      Earn **+100 XP** upon completing the mock interview. Scores above 80% establish you as "Job Ready"!
                    </p>
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Start AI Interview
                      </>
                    )}
                  </button>
                </div>

                {/* Session History */}
                <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Session History
                  </h3>

                  {history.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider">No mock interviews completed yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {history.map((item) => {
                        const isExpanded = expandedInterview === item.id;
                        const readiness = getReadinessColor(item.readinessLevel);

                        return (
                          <div key={item.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all bg-slate-50/20">
                            <div
                              onClick={() => setExpandedInterview(isExpanded ? null : item.id)}
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-indigo-500 uppercase">{item.jobRole}</span>
                                <p className="text-[10px] font-bold text-slate-400">
                                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {item.status === 'COMPLETED' ? (
                                  <>
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg ${readiness.bg} ${readiness.text} border ${readiness.border}`}>
                                      {item.readinessLevel?.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-black text-slate-800">{item.overallScore}%</span>
                                  </>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg">
                                    IN PROGRESS
                                  </span>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                              </div>
                            </div>

                            {isExpanded && item.status === 'COMPLETED' && (
                              <div className="p-4 border-t border-slate-100 bg-white space-y-4">
                                <div className="p-3.5 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 rounded-2xl border border-indigo-50 text-xs font-semibold text-slate-600 italic leading-relaxed">
                                  "{item.aiSummary}"
                                </div>
                                <div className="space-y-2">
                                  {item.questions.map((q) => (
                                    <div key={q.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/20 text-xs">
                                      <p className="font-extrabold text-slate-800">Q{q.questionNumber}: {q.questionText}</p>
                                      <p className="font-bold text-slate-500 mt-1 italic">Your Answer: "{q.internAnswer}"</p>
                                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] font-semibold text-indigo-800/80">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
                                        <span>AI Feedback ({q.score}/20): {q.aiFeedback}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERVIEW CONVERSATION WIZARD */}
          {step === 2 && activeInterview && currentQ && (
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              {/* Progress and indicators */}
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 tracking-wider">
                  Question {currentQ.questionNumber} of 5
                </span>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-full">
                  {currentQ.questionType}
                </span>
              </div>

              {/* Progress Line bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQIndex + (questionFeedback ? 1 : 0.2)) * 20}%` }}
                />
              </div>

              {/* Question Screen */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 space-y-6"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      Interviewer Prompt
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-slate-800 leading-relaxed">
                      {currentQ.questionText}
                    </p>
                  </div>

                  {/* Input block */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">Your Response</label>
                    <textarea
                      ref={textareaRef}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      onFocus={handleTextareaFocus}
                      placeholder="Type your response here... Give detailed reasoning, examples, and technical terms where appropriate."
                      disabled={!!questionFeedback || submittingAnswer}
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                    />
                  </div>

                  {/* Dynamic feedback display overlay */}
                  {questionFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 flex flex-col md:flex-row gap-4 items-start text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 flex items-center justify-center flex-shrink-0 font-black text-indigo-700 text-xs shadow-sm">
                        {questionFeedback.score}/20
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-indigo-900 font-black text-[10px] uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Score analysis
                        </div>
                        <p className="text-xs font-semibold text-indigo-800 leading-relaxed">
                          {questionFeedback.aiFeedback}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Sticky footer control bar */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {!questionFeedback ? (
                      <button
                        ref={submitButtonRef}
                        onClick={handleSubmitAnswer}
                        disabled={submittingAnswer || !answerInput.trim()}
                        className="min-h-[44px] px-6 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        {submittingAnswer ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Evaluating answer...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5" /> Submit Response
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        disabled={loading}
                        className="min-h-[44px] px-6 py-2.5 text-xs font-black text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md shadow-green-100 cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {currentQIndex < 4 ? 'Next Question' : 'Finish & View Results'}{' '}
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* STEP 3: RESULTS SUMMARY REPORT */}
          {step === 3 && activeInterview && (
            <div className="max-w-4xl mx-auto space-y-8 text-left">
              {/* Action row */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Award className="w-6 h-6 text-indigo-600" />
                  Interview Report Card
                </h2>
                <button
                  onClick={() => {
                    setStep(1);
                    setActiveInterview(null);
                  }}
                  className="px-4 py-2 text-xs font-extrabold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Exit Dashboard
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score & readiness card */}
                <div className="md:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between text-center gap-6">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Preparedness score</span>
                  
                  {/* SVG circular progress ring */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="60" className="stroke-slate-100 fill-none stroke-[6]" />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="fill-none stroke-[6] transition-all duration-1000"
                        style={{
                          strokeDasharray: 2 * Math.PI * 60,
                          strokeDashoffset: 2 * Math.PI * 60 * (1 - (activeInterview.overallScore || 0) / 100),
                          stroke: (activeInterview.overallScore || 0) >= 80 ? '#10b981' : (activeInterview.overallScore || 0) >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-800">{activeInterview.overallScore}%</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">Overall index</span>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Readiness Tier</span>
                    <span className={`inline-flex px-3.5 py-1 text-xs font-black uppercase rounded-full border ${getReadinessColor(activeInterview.readinessLevel).bg} ${getReadinessColor(activeInterview.readinessLevel).text} ${getReadinessColor(activeInterview.readinessLevel).border} w-fit`}>
                      {activeInterview.readinessLevel?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* AI synthesized insight */}
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-100/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-black text-[10px] uppercase bg-indigo-100/50 border border-indigo-200/50 px-3 py-1 rounded-full w-fit">
                      <Brain className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> AI Interview Synthesis
                    </div>
                    <p className="text-sm sm:text-base font-extrabold text-slate-700 leading-relaxed">
                      "{activeInterview.aiSummary}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pre-placement evaluation completed</span>
                  </div>
                </div>
              </div>

              {/* Accordions questions details */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-3">Question-by-Question Review</h3>
                <div className="space-y-3">
                  {activeInterview.questions.map((q, idx) => {
                    const isExpanded = expandedQIndex === idx;
                    return (
                      <div key={q.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                        <div
                          onClick={() => setExpandedQIndex(isExpanded ? null : idx)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-xs">
                              {q.questionNumber}
                            </span>
                            <span className="text-xs font-black text-slate-700 truncate max-w-[200px] sm:max-w-[450px]">
                              {q.questionText}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-800">{q.score}/20</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 bg-white space-y-3 text-xs leading-normal">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Interviewer Question</span>
                              <p className="font-extrabold text-slate-800">{q.questionText}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Your response</span>
                              <p className="font-bold text-slate-500 italic">"{q.internAnswer}"</p>
                            </div>
                            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl">
                              <span className="text-[9px] font-black uppercase text-indigo-900 block mb-1">AI Evaluator Feedback</span>
                              <p className="font-semibold text-indigo-800">{q.aiFeedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

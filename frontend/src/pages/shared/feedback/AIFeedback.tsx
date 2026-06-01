import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, BrainCircuit, Heart, 
  AlertTriangle, ShieldCheck, Tag, ThumbsUp, Send, Check
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';
import api from '../../../services/api';

import { useSubmitFeedback } from '../../../hooks/queries';

export const AIFeedback: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<'mentor' | 'intern' | 'insights'>('insights');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  // New state variables for complete submission and history flow
  const [sentimentResult, setSentimentResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/ai/feedback/history');
      if (res.data.success) {
        const rawData = res.data.data?.data || res.data.data || [];
        setHistory(Array.isArray(rawData) ? rawData : []);
      }
    } catch (err) {
      console.error("Failed to fetch feedback history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mentor' || activeTab === 'intern') {
      fetchHistory();
    }
  }, [activeTab]);
  
  const submitFeedbackMutation = useSubmitFeedback();
  
  // Custom mock analytics state
  const [sentiment, setSentiment] = useState({
    positive: 85,
    neutral: 10,
    negative: 5,
    keywords: ["Redux Hooks", "Database indexing", "Task submission speed", "Documentation styling"],
    summary: "Candidate displays exceptional agility in UI creation but requires moderate guidance in normalizing Relational Schema pathways.",
    actions: [
      { text: "Allocate React Hooks task items", completed: true },
      { text: "Recommend normalizations learning modules", completed: false },
      { text: "Schedule 1-on-1 DB indexes verification meet", completed: false }
    ]
  });

  const handleToggleAction = (index: number) => {
    setSentiment(prev => {
      const updated = [...prev.actions];
      updated[index] = { ...updated[index], completed: !updated[index].completed };
      return { ...prev, actions: updated };
    });
    toast.success("Action recommendation updated!");
  };

  const handleAnalyzeFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Please insert feedback remarks.");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    setSentimentResult(null);
    try {
      const response = await api.post('/ai/feedback', {
        rating,
        text,
        comment: text
      });
      const data = response.data.data || response.data;
      
      const resolvedSentiment = data.sentiment || data.label || 'NEUTRAL';
      setSentimentResult(resolvedSentiment);
      toast.success("Feedback submitted and sentiment analyzed!");

      // Clear input fields
      setText('');
      setRating(5);

      // Refresh history
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "Failed to analyze feedback";
      setSubmitError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Feedback & Sentiments" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button 
              onClick={() => setActiveTab('insights')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === 'insights' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              AI Insights Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('mentor')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === 'mentor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Mentor Feedback Submission
            </button>
            <button 
              onClick={() => setActiveTab('intern')}
              className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 ${
                activeTab === 'intern' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Intern Self Evaluation
            </button>
          </div>

          <div className="text-left">
            <AnimatePresence mode="wait">
              
              {/* INSIGHTS DASHBOARD */}
              {activeTab === 'insights' && (
                <motion.div 
                  key="insights" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Left Column: Sentiment Score */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                      <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Sentiment Analysis
                    </h3>

                    {/* Progress Rings/Bars */}
                    <div className="space-y-4 pt-2">
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-emerald-600 flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-emerald-100" /> Positive Tone</span>
                          <span>{sentiment.positive}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${sentiment.positive}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Neutral Tone</span>
                          <span>{sentiment.neutral}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${sentiment.neutral}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Constructive Tone</span>
                          <span>{sentiment.negative}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${sentiment.negative}%` }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Middle Column: Summary & Keywords */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                      <Sparkles className="w-5 h-5 text-indigo-600" /> Executive AI Insight
                    </h3>

                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs text-indigo-950 font-semibold leading-relaxed">
                      {sentiment.summary}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Extracted Keyword Anchors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sentiment.keywords.map((k, i) => (
                          <span key={i} className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recommendations */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" /> Action Recommendations
                    </h3>

                    <div className="space-y-3">
                      {sentiment.actions.map((act, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleToggleAction(i)}
                          className={`p-3 border rounded-2xl cursor-pointer flex gap-3 items-center justify-between text-xs transition-colors ${
                            act.completed 
                              ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800' 
                              : 'bg-slate-50/50 border-slate-150 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-semibold leading-snug">{act.text}</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            act.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                          }`}>
                            {act.completed && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MENTOR / INTERN FEEDBACK FORMS */}
              {(activeTab === 'mentor' || activeTab === 'intern') && (
                <motion.div 
                  key="form" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative min-h-[350px]"
                >
                  <div className="max-w-xl space-y-5">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
                        {activeTab === 'mentor' ? 'Provide Mentor Evaluation' : 'Intern Self Reflection Log'}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        {activeTab === 'mentor' 
                          ? 'Input descriptive feedback on task speeds, agility, or general communication matrices.'
                          : 'Summarize your achievements, core struggles, and suggestions to elevate your workflow.'}
                      </p>
                    </div>

                    <form onSubmit={handleAnalyzeFeedback} className="space-y-4">
                      {activeTab === 'mentor' && (
                        <div className="space-y-1 pb-2">
                          <label className="text-xs font-bold text-slate-600">Rating (1-5 Stars)</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Feedback Details</label>
                        <textarea 
                          rows={4} 
                          placeholder="Type details..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                        ></textarea>
                      </div>

                      <button 
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <span className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent inline-block mr-1"></span>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Submit & Analyze Sentiment <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {submitError && (
                        <p className="text-rose-500 font-bold text-xs mt-2">{submitError}</p>
                      )}

                      {sentimentResult && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            sentimentResult.toLowerCase() === 'positive' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : sentimentResult.toLowerCase() === 'negative' 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            AI Sentiment: {sentimentResult}
                          </span>
                        </div>
                      )}
                    </form>

                    {/* History Section */}
                    <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Feedback History (Last 5)</h4>
                      {historyLoading ? (
                        <div className="text-xs text-slate-400 font-bold animate-pulse">Loading feedback history...</div>
                      ) : history.length > 0 ? (
                        <div className="space-y-2">
                          {history.slice(0, 5).map((h: any, idx: number) => (
                            <div key={h.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-extrabold">{new Date(h.createdAt || h.date).toLocaleDateString()}</p>
                                <p className="text-slate-600 font-semibold" title={h.text || h.comment}>
                                  {(h.text || h.comment || '').substring(0, 60)}{(h.text || h.comment || '').length > 60 ? '...' : ''}
                                </p>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                (h.sentiment || '').toLowerCase() === 'positive'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : (h.sentiment || '').toLowerCase() === 'negative'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {h.sentiment || 'NEUTRAL'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No feedback history found.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
};


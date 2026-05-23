import React, { useState } from 'react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentor' | 'intern' | 'insights'>('insights');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  
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
    try {
      const response = await api.post('/ai/sentiment-analysis', { feedbackText: text });
      const data = response.data.data;

      // Extract details flexibly to handle both AI Service and Fallback responses
      const positive = data.positivePercentage || (data.sentiment === 'POSITIVE' ? 85 : data.sentiment === 'NEUTRAL' ? 30 : 10);
      const negative = data.negativePercentage || (data.sentiment === 'NEGATIVE' ? 85 : data.sentiment === 'NEUTRAL' ? 20 : 5);
      const neutral = 100 - positive - negative;

      const keywords = data.keywords || data.strongSkills || [];
      const suggestions = data.improvementSuggestions || data.extractedSuggestions || [];
      const actions = suggestions.map((s: string) => ({ text: s, completed: false }));
      
      let summary = "Feedback analyzed successfully.";
      if (data.sentiment) summary = `Sentiment Analysis Result: ${data.sentiment}. Confidence: ${data.confidenceScore}`;
      if (data.weakAreas?.length) summary += ` Weak areas identified: ${data.weakAreas.join(', ')}.`;

      setSentiment({
        positive,
        neutral: neutral < 0 ? 0 : neutral,
        negative,
        keywords: keywords.length ? keywords : ["Feedback", "Evaluation"],
        summary,
        actions: actions.length > 0 ? actions : [{ text: "Review feedback details with intern", completed: false }]
      });

      // If it's mentor feedback, also submit it to the backend HR dashboard
      if (activeTab === 'mentor') {
        try {
          await submitFeedbackMutation.mutateAsync({
            rating,
            comment: text,
            category: "General Evaluation"
          });
        } catch (e) {
          console.error("Failed to save feedback to HR dashboard", e);
        }
      }

      toast.success("AI Sentiment analysis updated!");
      setActiveTab('insights');
      setText('');
      setRating(5);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to analyze feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
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
                  {loading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center rounded-3xl">
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-600">Analyzing feedback vectors using AI...</span>
                      </div>
                    </div>
                  )}

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
                        className="flex items-center justify-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Submit & Analyze Sentiment <Send className="w-4 h-4" />
                      </button>
                    </form>
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

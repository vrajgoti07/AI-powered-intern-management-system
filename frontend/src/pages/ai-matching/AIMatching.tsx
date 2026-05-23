import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, Cell
} from 'recharts';
import { 
  BrainCircuit, Award, Star, Compass, ShieldAlert,
  ArrowRight, CheckCircle2, Play, Sparkles, Check, Info
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const AIMatching: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name || "Intern Candidate";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Skill matrix data comparing current intern against Ideal Engineering Roles
  const radarData = [
    { subject: 'Frontend', Aarav: 90, Ideal: 85, fullMark: 100 },
    { subject: 'Backend', Aarav: 75, Ideal: 80, fullMark: 100 },
    { subject: 'Database', Aarav: 65, Ideal: 75, fullMark: 100 },
    { subject: 'UI/UX Design', Aarav: 80, Ideal: 60, fullMark: 100 },
    { subject: 'System Architecture', Aarav: 50, Ideal: 70, fullMark: 100 },
    { subject: 'Agile & Git', Aarav: 85, Ideal: 80, fullMark: 100 },
  ];

  // Department compatibility metrics
  const deptData = [
    { name: 'Engineering', Match: 92, fill: '#6366f1' },
    { name: 'Design', Match: 81, fill: '#a855f7' },
    { name: 'Product', Match: 75, fill: '#ec4899' },
    { name: 'Marketing', Match: 45, fill: '#f59e0b' },
  ];

  // Coding evaluation questions
  const questions = [
    {
      q: "Which hook is most suitable to compute and memoize complex values synchronously in React?",
      opts: ["useEffect", "useMemo", "useCallback", "useReducer"],
      ans: "useMemo"
    },
    {
      q: "What is the primary architectural purpose of a database index?",
      opts: ["Data Encryption", "Improve Query Speed", "Normalize Tables", "Enforce Type Checks"],
      ans: "Improve Query Speed"
    },
    {
      q: "Which HTTP status code is used for 'Unauthorized' requests?",
      opts: ["400 Bad Request", "404 Not Found", "401 Unauthorized", "403 Forbidden"],
      ans: "401 Unauthorized"
    }
  ];

  const handleAnswerSelect = (option: string) => {
    if (option === questions[currentQuestion].ans) {
      setScore(prev => prev + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizFinished(true);
      toast.success("Skill assessment completed! Model weights updated.");
    }
  };

  const resetQuiz = () => {
    setScore(0);
    setCurrentQuestion(0);
    setQuizFinished(false);
    setAssessmentStarted(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Matching & Skill Analytics" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white text-left relative overflow-hidden shadow-xl border border-indigo-900/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] animate-pulse" />
            <div className="relative z-10 space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5" /> Core Intelligence Engine Active
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">AI Capability Matrix</h2>
                <p className="text-xs text-slate-300 font-semibold max-w-xl leading-relaxed">
                  Our neural mapping models analyze test results, task histories, and code feedback vectors to measure matching percentages against engineering departments.
                </p>
              </div>
              
              {!assessmentStarted && !quizFinished && (
                <button 
                  onClick={() => setAssessmentStarted(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-103"
                >
                  <Play className="w-4 h-4 fill-white" /> Take Skill Assessment Test
                </button>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Block: Radar Match Vector */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" /> Skill Overlays (Ideal vs You)
                </h3>
                
                <div className="w-full h-[240px] mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name={userName} dataKey="Aarav" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      <Radar name="Ideal Benchmark" dataKey="Ideal" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 700 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Middle Block: Dept Compatibility Bar Chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                  <Compass className="w-5 h-5 text-indigo-600" /> Department Match Indices (%)
                </h3>
                
                <div className="w-full h-[240px] mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fontWeight: 700 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                      <Bar dataKey="Match" radius={[0, 8, 8, 0]} barSize={16}>
                        {deptData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Block: Skill Assessment & Recommendations */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left min-h-[300px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {/* 1. Skill quiz is running */}
                {assessmentStarted && !quizFinished && (
                  <motion.div 
                    key="quiz"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-600">Question {currentQuestion + 1} of {questions.length}</span>
                        <span className="text-[9px] font-bold text-slate-400">Score: {score}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs tracking-tight mt-3 leading-relaxed">
                        {questions[currentQuestion].q}
                      </h4>
                    </div>

                    <div className="space-y-2 mt-4">
                      {questions[currentQuestion].opts.map((opt, i) => (
                        <button 
                          key={i}
                          onClick={() => handleAnswerSelect(opt)}
                          className="w-full text-left text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 rounded-xl transition-all duration-300 cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. Quiz Finished */}
                {quizFinished && (
                  <motion.div 
                    key="finished"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 space-y-4"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 text-sm">Assessment Completed!</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        You scored <strong>{score} out of {questions.length}</strong>. The neural alignment model successfully calculated match compatibility thresholds.
                      </p>
                    </div>
                    <button 
                      onClick={resetQuiz}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] rounded-xl cursor-pointer"
                    >
                      Restart Assessment
                    </button>
                  </motion.div>
                )}

                {/* 3. Static Recommendations Panel */}
                {!assessmentStarted && !quizFinished && (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 h-full flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100">
                        <Award className="w-5 h-5 text-indigo-600" /> AI Insights Panel
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex gap-3 items-start">
                          <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-bold text-slate-800">Best Match: Full Stack Dev</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">High proficiency in React, TypeScript and modular styling logic.</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex gap-3 items-start">
                          <Info className="w-4.5 h-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-bold text-slate-800">Learning Path Suggestion</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Focus on normalization rules and indexes to boost Backend score matrices.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

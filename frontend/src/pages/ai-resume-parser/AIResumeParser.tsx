import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, Trash2, 
  ChevronRight, ArrowRight, User, Mail, Phone, Calendar, Briefcase, Cpu, Award, 
  MapPin, Loader2, RefreshCw, Plus, X, Globe, Star, FileJson, CheckSquare, ShieldCheck,
  History, Eye
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface EducationItem {
  degree: string;
  institution?: string;
  year?: string;
}

interface ExperienceItem {
  company: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ProjectItem {
  name: string;
  description?: string;
  technologies?: string[];
}

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skillScore: number;
  experienceYears: number;
}

interface ParsedResumeHistoryItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: any;
  experience: any;
  projects: any;
  skillScore: number;
  experienceYears: number;
  createdAt: string;
}

// Preset Target Benchmarks for auto-filling skills
const BENCHMARKS = [
  { 
    role: "Full Stack Developer", 
    skills: ["react", "node.js", "typescript", "sql", "html", "css", "git", "rest api"] 
  },
  { 
    role: "Backend Engineer", 
    skills: ["python", "node.js", "postgresql", "redis", "aws", "docker", "kubernetes", "git"] 
  },
  { 
    role: "UI/UX Designer", 
    skills: ["figma", "ui/ux", "sketch", "photoshop", "tailwind", "css", "html"] 
  },
  { 
    role: "Data Scientist / ML", 
    skills: ["python", "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "pandas", "numpy"] 
  },
  { 
    role: "Product Manager", 
    skills: ["agile", "scrum", "kanban", "jira", "trello", "confluence", "analytics"] 
  }
];

export const AIResumeParser: React.FC = () => {
  const { user } = useAuth();
  const isIntern = user?.role?.toLowerCase() === 'intern';
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target Skills Tags State
  const [targetSkills, setTargetSkills] = useState<string[]>(["react", "node.js", "typescript"]);
  const [skillInput, setSkillInput] = useState("");
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("");

  // Processing States
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeData | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Parsing History States
  const [historyList, setHistoryList] = useState<ParsedResumeHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get('/ai/parse-history');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch parsing history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleViewHistoryDetails = (item: ParsedResumeHistoryItem) => {
    let parsedEducation: EducationItem[] = [];
    let parsedExperience: ExperienceItem[] = [];
    let parsedProjects: ProjectItem[] = [];

    try {
      parsedEducation = Array.isArray(item.education)
        ? item.education
        : typeof item.education === 'string'
          ? JSON.parse(item.education)
          : [];
    } catch (e) {
      console.error('Failed to parse education history:', e);
    }

    try {
      parsedExperience = Array.isArray(item.experience)
        ? item.experience
        : typeof item.experience === 'string'
          ? JSON.parse(item.experience)
          : [];
    } catch (e) {
      console.error('Failed to parse experience history:', e);
    }

    try {
      parsedProjects = Array.isArray(item.projects)
        ? item.projects
        : typeof item.projects === 'string'
          ? JSON.parse(item.projects)
          : [];
    } catch (e) {
      console.error('Failed to parse projects history:', e);
    }

    setParsedResult({
      name: item.name,
      email: item.email,
      phone: item.phone,
      skills: item.skills,
      education: parsedEducation,
      experience: parsedExperience,
      projects: parsedProjects,
      skillScore: item.skillScore,
      experienceYears: item.experienceYears,
    });
    toast.success(`Loaded parsed results for ${item.name}`);
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
      } else {
        toast.error("Only PDF files are supported for AI resume parsing.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
      } else {
        toast.error("Only PDF files are supported for AI resume parsing.");
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Tag Management Functions
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = skillInput.trim().toLowerCase();
      if (cleaned && !targetSkills.includes(cleaned)) {
        setTargetSkills([...targetSkills, cleaned]);
        setSkillInput("");
        setSelectedBenchmark("");
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTargetSkills(targetSkills.filter(s => s !== skillToRemove));
    setSelectedBenchmark("");
  };

  const handleSelectBenchmark = (benchmarkRole: string) => {
    const found = BENCHMARKS.find(b => b.role === benchmarkRole);
    if (found) {
      setTargetSkills(found.skills);
      setSelectedBenchmark(benchmarkRole);
    }
  };

  // Submit and Parse Resume API
  const handleParseResume = async () => {
    if (!file) {
      toast.error("Please upload a PDF resume file first.");
      return;
    }

    setIsParsing(true);
    const parseToast = toast.loading("AI Engine parsing profile vectors & skills...");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requiredSkills', JSON.stringify(targetSkills));

      const response = await api.post('/ai/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success && response.data?.data) {
        setParsedResult(response.data.data);
        toast.success("Resume parsed and evaluated successfully!", { id: parseToast });
        fetchHistory(); // Refresh history list after a successful parse
      } else {
        throw new Error("Invalid API response structure.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to parse resume document.", { id: parseToast });
    } finally {
      setIsParsing(false);
    }
  };

  // Sync parsed skills with active Intern settings
  const handleSyncSkills = async () => {
    if (!parsedResult) return;
    setIsSyncing(true);
    const syncToast = toast.loading("Synchronizing parsed skills with your profile...");

    try {
      // Fetch current profile details first to preserve other properties
      const currentRes = await api.get('/settings/profile');
      let currentPayload: any = {};
      if (currentRes.data?.success && currentRes.data?.data) {
        const { user: uDetails, intern } = currentRes.data.data;
        currentPayload = {
          name: uDetails.name || '',
          phone: intern?.phone || '',
          dob: intern?.dob ? intern.dob.split('T')[0] : '',
          college: intern?.college || '',
          degree: intern?.degree || '',
          branch: intern?.branch || '',
          cgpa: intern?.cgpa || '',
          address: intern?.address || '',
          workAddress: intern?.workAddress || '',
        };
      }

      // Merge parsed skills with current profile
      const parsedSkillsSet = new Set([
        ...parsedResult.skills, 
        ...(currentPayload.skills ? currentPayload.skills.split(',').map((s: string) => s.trim()) : [])
      ]);
      const mergedSkillsString = Array.from(parsedSkillsSet).join(', ');

      const res = await api.put('/settings/profile', {
        ...currentPayload,
        skills: mergedSkillsString
      });

      if (res.data?.success) {
        toast.success("Profile skills successfully updated and synchronized!", { id: syncToast });
      } else {
        throw new Error("Profile synchronization failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to synchronize skills with your profile.", { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  // Download raw parsed JSON data
  const handleDownloadJSON = () => {
    if (!parsedResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parsedResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `parsed_resume_${parsedResult.name.replace(/\s+/g, '_') || 'candidate'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("JSON structured data exported successfully.");
  };

  const handleResetParser = () => {
    setParsedResult(null);
    setFile(null);
    setSelectedBenchmark("");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Resume Screener & Parser" />

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          
          {/* Top Banner Row */}
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 rounded-3xl p-6 text-slate-800 text-left relative overflow-hidden shadow-sm border border-slate-200/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent)] animate-pulse" />
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Advanced NLP Parsing Active
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800">AI Resume Parser & Skill Screener</h2>
              <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed">
                Upload raw PDF CV documents to extract personal contact records, technology skills, educational histories, work timelines, and milestone projects in structured data. Score candidates dynamically against ideal target benchmarks.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* 1. INITIAL UPLOAD / SCREENING CONFIG */}
            {!isParsing && !parsedResult && (
              <motion.div
                key="upload-setup"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
              >
                {/* Left side: Upload File drop-zone */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-600" /> Upload PDF Document
                    </h3>
                    
                    {/* Drag and Drop Container */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px]
                        ${isDragActive 
                          ? 'border-indigo-500 bg-indigo-50/30' 
                          : file 
                            ? 'border-emerald-250 bg-emerald-50/10' 
                            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40'}`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden text-base"
                      />
                      
                      {!file ? (
                        <>
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Drag and drop your PDF resume here, or <span className="text-indigo-600 hover:underline">browse</span></p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Supports PDF format documents up to 10MB</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <FileText className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-850 truncate max-w-[280px]">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            className="mt-4 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors border-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Document
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {file && (
                    <button
                      onClick={handleParseResume}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all cursor-pointer border-0"
                    >
                      <Brain className="w-4 h-4 fill-white" /> Analyze & Score Resume
                    </button>
                  )}
                </div>

                {/* Right side: Target Skills configuration */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Presets and tags config card */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" /> Screening Presets & Targets
                    </h3>

                    {/* Pre-fill Benchmarks */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Ideal Role Profile</label>
                      <div className="flex flex-wrap gap-1.5">
                        {BENCHMARKS.map((b) => (
                          <button
                            key={b.role}
                            onClick={() => handleSelectBenchmark(b.role)}
                            className={`px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all cursor-pointer
                              ${selectedBenchmark === b.role 
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100/50'}`}
                          >
                            {b.role}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive tag input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Configure Required Technical Skills</label>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                        {targetSkills.map((tag) => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center gap-1 bg-white text-indigo-600 border border-indigo-100/50 text-[10px] font-black px-2 py-1 rounded-lg"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveSkill(tag)}
                              className="text-slate-400 hover:text-rose-500 p-0 hover:bg-transparent border-0 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                          placeholder={targetSkills.length === 0 ? "Type skill & hit Enter" : "Add target skill..."}
                          className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-700 min-w-[120px] flex-1 px-1 py-0.5 text-base"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold block leading-relaxed">
                        Specify technical skills you expect candidates to have. The NLP engine calculates match ratios against these keywords.
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. LOADING STATE (SKELETON PARSING) */}
            {isParsing && (
              <motion.div
                key="parsing-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center py-20 space-y-6 max-w-2xl mx-auto flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                    <Brain className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin w-20 h-20" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Scanning File Coordinates</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-sm leading-relaxed mx-auto">
                    The NLP neural network is extracting personal contact details, parsing educational blocks, parsing chronological experience vectors, and matching technologies. This takes a few seconds...
                  </p>
                </div>

                {/* Symmetrical Skeleton Loading Grid */}
                <div className="w-full space-y-3 pt-6 border-t border-slate-100 max-w-md">
                  <div className="h-4 bg-slate-100 rounded-full animate-pulse w-full" />
                  <div className="h-4 bg-slate-100 rounded-full animate-pulse w-5/6 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded-full animate-pulse w-2/3 mx-auto" />
                </div>
              </motion.div>
            )}

            {/* 3. PARSING RESULTS VIEW */}
            {!isParsing && parsedResult && (
              <motion.div
                key="parsing-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
              >
                
                {/* Result KPI Row: Gauge + Basic contact details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Gauge Card (Matches percentage) */}
                  <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider w-full pb-2 border-b border-slate-50 flex items-center justify-center gap-1.5">
                      <Award className="w-4.5 h-4.5 text-indigo-500" /> Profile Quality Analysis
                    </h3>

                    {/* Custom circular progress gauge */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track circle */}
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        {/* Fill circle */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          stroke={parsedResult.skillScore >= 80 ? "#10b981" : parsedResult.skillScore >= 50 ? "#6366f1" : "#f59e0b"} 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * parsedResult.skillScore) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">{parsedResult.skillScore}%</span>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">Match Index</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-50 rounded-2xl p-3 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase">Professional Practice:</span>
                      <span className="text-xs font-black text-slate-800">{parsedResult.experienceYears} Years</span>
                    </div>
                  </div>

                  {/* Profile Contact Card */}
                  <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md">Candidate Record Discovered</span>
                          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">{parsedResult.name || "Unknown Candidate"}</h3>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Details lists */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="text-xs min-w-0">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Parsed Email Address</p>
                            <p className="font-extrabold text-slate-700 truncate mt-0.5">{parsedResult.email || "No email parsed"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="text-xs min-w-0">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Parsed Telephone No</p>
                            <p className="font-extrabold text-slate-700 truncate mt-0.5">{parsedResult.phone || "No telephone parsed"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        This contact card presents entities extracted dynamically using spaCy NER classifiers. Verify exact email addresses and coordinates before scheduling outreach milestones.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Extracted Skills Cloud Block */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Cpu className="w-4.5 h-4.5 text-indigo-600" /> Discovered Technical Skills Cloud
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {/* Render target skills that matched (Green) */}
                    {parsedResult.skills
                      .filter(s => targetSkills.includes(s.toLowerCase()))
                      .map(skill => (
                        <span 
                          key={skill} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {skill}
                        </span>
                    ))}

                    {/* Render additional skills parsed (Blue) */}
                    {parsedResult.skills
                      .filter(s => !targetSkills.includes(s.toLowerCase()))
                      .map(skill => (
                        <span 
                          key={skill} 
                          className="px-3 py-1.5 bg-indigo-50/50 text-indigo-600 border border-indigo-100/50 rounded-xl text-[10px] font-black uppercase tracking-wider"
                        >
                          {skill}
                        </span>
                    ))}

                    {/* Show target skills that are missing in the resume (Red/Amber) */}
                    {targetSkills
                      .filter(s => !parsedResult.skills.map(ps => ps.toLowerCase()).includes(s.toLowerCase()))
                      .map(missingSkill => (
                        <span 
                          key={missingSkill} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> {missingSkill} (Missing)
                        </span>
                    ))}

                    {parsedResult.skills.length === 0 && (
                      <span className="text-xs text-slate-400 font-bold">No standard technical keywords identified.</span>
                    )}
                  </div>
                </div>

                {/* Grid: Education + Experience timelines */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Professional Practice (Experience) Timeline */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Briefcase className="w-4.5 h-4.5 text-indigo-600" /> Extracted Work Experience
                    </h3>

                    <div className="space-y-5 relative pl-4 border-l border-slate-100 mt-2 text-left">
                      {parsedResult.experience.map((exp, i) => (
                        <div key={i} className="relative space-y-1">
                          {/* Dot connector */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white ring-4 ring-indigo-50" />
                          
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <h4 className="text-xs font-black text-slate-800 tracking-tight leading-snug">{exp.company || "Enterprise Entity"}</h4>
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Chronological Item</span>
                          </div>
                          
                          {exp.role && (
                            <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">{exp.role}</p>
                          )}
                          {exp.description && (
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}

                      {parsedResult.experience.length === 0 && (
                        <div className="py-6 text-center text-slate-400 font-bold text-xs">No corporate employment experience parsed.</div>
                      )}
                    </div>
                  </div>

                  {/* Academic Credentials (Education) Timeline */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-indigo-600" /> Extracted Education Timeline
                    </h3>

                    <div className="space-y-5 relative pl-4 border-l border-slate-100 mt-2 text-left">
                      {parsedResult.education.map((edu, i) => (
                        <div key={i} className="relative space-y-1">
                          {/* Dot connector */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-4 ring-emerald-50" />
                          
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <h4 className="text-xs font-black text-slate-800 tracking-tight leading-snug">{edu.degree || "Academic Certification"}</h4>
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{edu.year || "Academic"}</span>
                          </div>
                          
                          {edu.institution && (
                            <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide">{edu.institution}</p>
                          )}
                        </div>
                      ))}

                      {parsedResult.education.length === 0 && (
                        <div className="py-6 text-center text-slate-400 font-bold text-xs">No academic credentials blocks parsed.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Project milestones list */}
                {parsedResult.projects && parsedResult.projects.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Cpu className="w-4.5 h-4.5 text-indigo-600" /> Discovered Project Milestones
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parsedResult.projects.map((proj, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                          <h4 className="text-xs font-black text-slate-800 tracking-tight">{proj.name}</h4>
                          {proj.description && (
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{proj.description}</p>
                          )}
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {proj.technologies.map(t => (
                                <span key={t} className="px-2 py-0.5 bg-white text-indigo-600 border border-indigo-100/50 rounded-lg text-[9px] font-extrabold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symmetrical Action Footers */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
                  <button
                    onClick={handleResetParser}
                    className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-extrabold transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    Analyze Another Resume
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDownloadJSON}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto border-0"
                    >
                      <FileJson className="w-4 h-4" /> Export JSON Audit
                    </button>
                    
                    {isIntern && (
                      <button
                        onClick={handleSyncSkills}
                        disabled={isSyncing}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 transform hover:-translate-y-0.5 active:scale-98 transition-all cursor-pointer w-full sm:w-auto min-w-[170px] border-0"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Apply Skills to Profile
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

          {/* Persistent Resume Parsing History */}
          {!isParsing && !parsedResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between text-left mt-6"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <History className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Recent Resume Parsing History</h2>
                    <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Persistent database of successfully parsed credentials</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-md font-bold uppercase">
                  {historyList.length} Records
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-bold">Loading persistent history...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-400 font-bold italic">No parsed resume history found. Upload a resume above to populate the persistent log.</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="px-5 py-3 font-bold">Candidate</th>
                        <th className="px-4 py-3 font-bold">Email</th>
                        <th className="px-4 py-3 font-bold">Phone</th>
                        <th className="px-4 py-3 font-bold">Quality Match</th>
                        <th className="px-4 py-3 font-bold">Extracted Date</th>
                        <th className="px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3 font-extrabold text-slate-800">
                            {item.name || "Unknown Candidate"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">
                            {item.email || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">
                            {item.phone || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <div className="w-14 bg-slate-100 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    item.skillScore >= 80 ? 'bg-emerald-500' : item.skillScore >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                  }`} 
                                  style={{ width: `${item.skillScore}%` }}
                                ></div>
                              </div>
                              {item.skillScore}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-semibold">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewHistoryDetails(item)}
                              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600 cursor-pointer border-0 bg-transparent flex items-center justify-center gap-1 font-bold text-[10px]"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
};

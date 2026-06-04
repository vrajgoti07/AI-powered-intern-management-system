import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, ExternalLink, GitBranch,
  MapPin, PlusCircle, Code, Sparkles, CheckCircle2,
  Link2, Terminal, Cpu, Layers, Lock, Plus, X, Trash2
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useInternByUser, useTasks } from '../../hooks/queries';
import api from '../../services/api';

export const PortfolioDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const { user } = useAuth();
  const { data: myInternData } = useInternByUser(user?.id || '');
  const { data: tasks = [] } = useTasks();

  // Dynamic Portfolio References
  const myName = user?.name || "Intern Developer";
  const initials = myName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const roleStr = myInternData?.department?.name ? `${myInternData.department.name} Intern` : "Engineering Intern";

  // Github / Linkedin Link states
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [tempGithub, setTempGithub] = useState('');
  const [tempLinkedin, setTempLinkedin] = useState('');

  // Location and Map state
  const [locationVal, setLocationVal] = useState('Bengaluru Hub / Remote Dev');
  const [tempLocation, setTempLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Interactive Projects showcase state
  const [projects, setProjects] = useState<any[]>([]);

  // Load custom projects on start
  useEffect(() => {
    if (!user) return;
    const savedProjects = localStorage.getItem(`projects_${user.id}`);
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        const mapped = parsed.map((p: any) => {
          let chosenIcon = Cpu;
          if (p.iconName === 'Terminal') chosenIcon = Terminal;
          else if (p.iconName === 'Layers') chosenIcon = Layers;
          return {
            ...p,
            icon: chosenIcon
          };
        });
        setProjects(mapped);
      } catch (err) {
        console.error("Failed to parse saved projects", err);
      }
    }
  }, [user]);

  // Add Project Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTech, setNewTech] = useState('React & TS');
  const [newLink, setNewLink] = useState('https://github.com');

  // Load custom links and location on start, auto-syncing from localStorage to DB if missing
  useEffect(() => {
    const savedGit = localStorage.getItem(`git_${user?.id}`);
    const savedLink = localStorage.getItem(`link_${user?.id}`);
    const savedLoc = localStorage.getItem(`loc_${user?.id}`);
    
    let shouldSync = false;
    let gitToSet = '';
    let linkToSet = '';

    if (myInternData?.githubUrl) {
      gitToSet = myInternData.githubUrl;
    } else if (savedGit) {
      gitToSet = savedGit;
      shouldSync = true;
    }
    
    if (myInternData?.linkedinUrl) {
      linkToSet = myInternData.linkedinUrl;
    } else if (savedLink) {
      linkToSet = savedLink;
      shouldSync = true;
    }

    if (gitToSet) setGithubUrl(gitToSet);
    if (linkToSet) setLinkedinUrl(linkToSet);

    if (myInternData?.workAddress) {
      setLocationVal(myInternData.workAddress);
    } else if (myInternData?.address) {
      setLocationVal(myInternData.address);
    } else if (savedLoc) {
      setLocationVal(savedLoc);
    }

    if (shouldSync && myInternData?.id) {
      api.put(`/interns/${myInternData.id}`, {
        githubUrl: gitToSet || null,
        linkedinUrl: linkToSet || null
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['interns', 'user', user?.id] });
      })
      .catch((err) => {
        console.error("Auto-sync of profile links failed:", err);
      });
    }
  }, [user, myInternData]);

  // Statistics
  const myTasks = tasks.filter((t: any) => t.internId === myInternData?.id || t.intern?.user?.name === myName);
  const completedTasksCount = myTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const attendanceRate = myInternData?.attendance !== undefined ? `${myInternData.attendance}%` : '100%';
  const evalScore = myInternData?.score !== undefined ? `${myInternData.score}%` : 'N/A';

  // Gamified achievements list
  const badges = [
    {
      name: "First Standup",
      desc: "Unlocked by successfully punching clock check-in verification.",
      icon: Award,
      unlocked: (myInternData?.attendance || 0) > 0
    },
    {
      name: "Grades Champion",
      desc: "Maintained standard performance evaluations above 85%.",
      icon: Sparkles,
      unlocked: (myInternData?.score || 0) >= 85
    },
    {
      name: "Git Master",
      desc: "Submitted and completed 3+ cohorted milestone tasks successfully.",
      icon: GitBranch,
      unlocked: completedTasksCount >= 3
    }
  ];

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    setGithubUrl(tempGithub);
    setLinkedinUrl(tempLinkedin);
    localStorage.setItem(`git_${user?.id}`, tempGithub);
    localStorage.setItem(`link_${user?.id}`, tempLinkedin);
    
    if (myInternData?.id) {
      api.put(`/interns/${myInternData.id}`, {
        githubUrl: tempGithub || null,
        linkedinUrl: tempLinkedin || null
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['interns', 'user', user?.id] });
        toast.success("Professional profiles synced and linked successfully!");
      })
      .catch((err) => {
        console.error("Database sync failed", err);
        toast.error("Failed to sync profiles with the server.");
      });
    } else {
      toast.success("Professional profiles linked successfully!");
    }
    setShowLinksModal(false);
  };

  const handleSaveLocation = (shouldClose = true) => {
    if (tempLocation.trim()) {
      setLocationVal(tempLocation);
      localStorage.setItem(`loc_${user?.id}`, tempLocation);
      if (myInternData?.id) {
        api.put(`/interns/${myInternData.id}`, { workAddress: tempLocation })
          .then(() => {
            toast.success("Location updated & synced successfully!");
          })
          .catch((err) => {
            console.error("Database sync failed", err);
            toast.error("Failed to sync location with server.");
          });
      } else {
        toast.success("Location updated successfully!");
      }
      if (shouldClose) {
        setShowLocationModal(false);
      }
    } else {
      toast.error("Please enter a valid location");
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in the project title and description.");
      return;
    }

    const iconsList = [Cpu, Terminal, Layers];
    const iconNames = ['Cpu', 'Terminal', 'Layers'];
    const index = projects.length % iconsList.length;
    const chosenIcon = iconsList[index];
    const chosenIconName = iconNames[index];

    const newProj = {
      title: newTitle,
      desc: newDesc,
      tech: newTech,
      link: newLink,
      icon: chosenIcon,
      iconName: chosenIconName
    };

    const updated = [...projects, newProj];
    setProjects(updated);

    // Save to localStorage
    const serializable = updated.map(p => ({
      title: p.title,
      desc: p.desc,
      tech: p.tech,
      link: p.link,
      iconName: p.iconName || 'Cpu'
    }));
    localStorage.setItem(`projects_${user?.id}`, JSON.stringify(serializable));

    toast.success("New project showcase registered successfully!");
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewTech('React & TS');
    setNewLink('https://github.com');
  };

  const handleDeleteProject = (idxToDelete: number) => {
    const updated = projects.filter((_, idx) => idx !== idxToDelete);
    setProjects(updated);

    const serializable = updated.map(p => ({
      title: p.title,
      desc: p.desc,
      tech: p.tech,
      link: p.link,
      iconName: p.iconName || 'Cpu'
    }));
    localStorage.setItem(`projects_${user?.id}`, JSON.stringify(serializable));
    toast.success("Project removed from showcase!");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Developer Portfolio & Gallery" />

        {/* Scrollable Container with signature premium radial dots background */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left relative"
          style={{
            backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            backgroundColor: '#f8fafc'
          }}
        >
          {/* Decorative blurry glow bubbles */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[8s]" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-100/20 rounded-full blur-[140px] pointer-events-none -z-10" />

          {/* Premium Portfolio Header Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            {/* Blurry glow outline on banner */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-50/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10">
              {/* Glowing Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center font-extrabold text-2xl text-white shadow-[0_8px_30px_rgba(99,102,241,0.25)] ring-4 ring-white">
                {initials}
              </div>
              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-800">{myName}</h2>
                  <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-150 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active Contributor
                  </span>
                </div>
                <p className="text-xs text-indigo-600 font-extrabold flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-500" /> {roleStr}
                </p>
                <button
                  onClick={() => {
                    setTempLocation(locationVal);
                    setShowLocationModal(true);
                  }}
                  className="text-[10px] text-slate-500 hover:text-indigo-650 transition-colors font-bold flex items-center gap-1.5 cursor-pointer focus:outline-none bg-slate-50 hover:bg-slate-100/80 border border-slate-150/40 rounded-xl px-2.5 py-1.5 shadow-sm"
                  title="Click to customize and view interactive map"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {locationVal}
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/40 ml-1">Edit / Map</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics & Dynamic Profiles */}
            <div className="flex flex-col sm:flex-row gap-6 relative z-10 w-full lg:w-auto items-start sm:items-center justify-between border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
              <div className="flex gap-6 text-left">
                <div>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Attendance</p>
                  <p className="text-sm font-black text-indigo-650">{attendanceRate}</p>
                </div>
                <div className="w-px h-8 bg-slate-200/60" />
                <div>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Eval Score</p>
                  <p className="text-sm font-black text-purple-600">{evalScore}</p>
                </div>
                <div className="w-px h-8 bg-slate-200/60" />
                <div>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Milestones</p>
                  <p className="text-sm font-black text-pink-600">{completedTasksCount} / {myTasks.length}</p>
                </div>
              </div>

              {/* Profiles Connections */}
              <div className="flex gap-2 flex-wrap">
                {githubUrl ? (
                  <a
                    href={githubUrl.startsWith('http') ? githubUrl : `https://github.com/${githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <Code className="w-4 h-4 text-indigo-500" /> GitHub
                  </a>
                ) : null}

                {linkedinUrl ? (
                  <a
                    href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://linkedin.com/in/${linkedinUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <Link2 className="w-4 h-4 text-purple-500" /> LinkedIn
                  </a>
                ) : null}

                <button
                  onClick={() => {
                    setTempGithub(githubUrl);
                    setTempLinkedin(linkedinUrl);
                    setShowLinksModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Link2 className="w-4 h-4" /> Link Profiles
                </button>
              </div>
            </div>
          </div>

          {/* Intern Co-horted Skills Banner */}
          {myInternData?.skills && myInternData.skills.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-2">
              <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 border border-indigo-100/40 rounded-md">
                Verified Expertise
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {myInternData.skills.map((s: string) => (
                  <span key={s} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Portfolio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

            {/* Left Column: Projects Gallery */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <Code className="w-5 h-5 text-indigo-600 animate-pulse" /> Projects Showcase Gallery
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Showcase your repositories, deployments and deliverables</p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 text-indigo-700 font-black text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 mb-3">
                    <Code className="w-5 h-5 text-indigo-650" />
                  </div>
                  <h4 className="font-extrabold text-slate-880 text-xs tracking-tight">No projects in your showcase</h4>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xs mt-1.5 leading-relaxed">
                    Your portfolio is currently empty. Share your best deliverables, features or systems with your mentors and HR.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <AnimatePresence>
                    {projects.map((r, idx) => {
                      const ProjectIcon = r.icon || Code;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="p-5 bg-slate-50/60 hover:bg-white border border-slate-200/50 hover:border-slate-300 rounded-3xl flex flex-col justify-between min-h-[160px] transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.025)] group relative"
                        >
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                  <ProjectIcon className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                                </div>
                                <h4 className="font-extrabold text-slate-850 text-xs tracking-tight truncate max-w-[150px]">{r.title}</h4>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <a
                                  href={r.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer shadow-sm border border-slate-100 bg-white transition-colors"
                                  title="View Project Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteProject(idx)}
                                  className="p-1.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer shadow-sm border border-slate-100 bg-white transition-colors"
                                  title="Remove Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                              {r.desc}
                            </p>
                          </div>

                          <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50/80 border border-indigo-100/30 text-indigo-600 px-2.5 py-1 rounded-md w-fit mt-4">
                            {r.tech}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Column: Achievements & Badges */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-2">
                  <Award className="w-5 h-5 text-indigo-600" /> Milestone Achievements
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Earn merit certifications through system checkpoints</p>
              </div>

              <div className="space-y-4">
                {badges.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={i}
                      className={`p-4 border rounded-3xl flex gap-4 items-center transition-all duration-300 relative ${b.unlocked
                          ? 'bg-emerald-50/30 border-emerald-100/60 shadow-sm shadow-emerald-50/10'
                          : 'bg-slate-50/50 border-slate-200/50 opacity-60'
                        }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${b.unlocked
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-200'
                          : 'bg-slate-200 text-slate-400'
                        }`}>
                        {b.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-400" />}
                      </div>

                      <div className="text-xs text-left min-w-0 flex-1">
                        <div className="flex gap-1.5 items-center">
                          <p className="font-extrabold text-slate-800 truncate">{b.name}</p>
                          {b.unlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">Locked</span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed mt-0.5">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Project Showcase"
      >
        <form onSubmit={handleAddProject} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Project Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Server Performance Analyzer"
              required
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Provide a clear 1-2 sentence description detailing what you built..."
              rows={3}
              required
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Technology Tag</label>
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="e.g. Next.js & TS"
                required
                className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Project URL</label>
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="e.g. https://github.com/..."
                className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              Save Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Profiles Modal */}
      <Modal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        title="Link Professional Profiles"
      >
        <form onSubmit={handleSaveLinks} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" /> GitHub Username
            </label>
            <input
              type="text"
              value={tempGithub}
              onChange={(e) => setTempGithub(e.target.value)}
              placeholder="e.g. vrajgoti"
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-purple-500" /> LinkedIn Username
            </label>
            <input
              type="text"
              value={tempLinkedin}
              onChange={(e) => setTempLinkedin(e.target.value)}
              placeholder="e.g. vraj-goti-7517b6205"
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex justify-end pt-3 gap-2">
            <button
              type="button"
              onClick={() => setShowLinksModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              Save Profiles
            </button>
          </div>
        </form>
      </Modal>

      {/* Location Map Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Work Location & Navigation Map"
      >
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-500" /> Configure Work Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra, India"
                className="flex-1 text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => handleSaveLocation(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 hover:border-slate-300/60 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Search Map
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
              Enter any city name, workspace hub, or address. Click "Search Map" to visualize on interactive map view.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Interactive Workplace Map
            </label>
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-150 shadow-inner bg-slate-50 relative">
              <iframe
                title="Workspace Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(locationVal)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 gap-2">
            <button
              type="button"
              onClick={() => handleSaveLocation(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              Close & Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


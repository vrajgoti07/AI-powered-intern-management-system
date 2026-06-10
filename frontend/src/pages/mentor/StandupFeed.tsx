import React, { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { useTeamStandups } from '../../hooks/queries';
import { CalendarDays, Search, Smile, AlertTriangle, Clock, RefreshCw, Filter, User } from 'lucide-react';

export const StandupFeed: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  
  // Date Selector state (default: today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('ALL');

  // Fetch standups for selected date
  const { data: standups = [], isLoading, refetch } = useTeamStandups(selectedDate);

  const handleRefresh = () => {
    refetch();
  };

  const getMoodConfig = (mood: string) => {
    switch (mood) {
      case 'GREAT':
        return { emoji: '😊', label: 'Great', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'GOOD':
        return { emoji: '🙂', label: 'Good', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'OKAY':
        return { emoji: '😐', label: 'Okay', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'STRUGGLING':
        return { emoji: '😟', label: 'Struggling', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { emoji: '😐', label: 'Okay', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Filter standups by search term and mood
  const filteredStandups = standups.filter((item: any) => {
    const internName = item.intern?.user?.name || '';
    const departmentName = item.intern?.department?.name || '';
    const matchesSearch = 
      internName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMood = moodFilter === 'ALL' || item.mood === moodFilter;

    return matchesSearch && matchesMood;
  });

  // Calculate mood counts
  const moodCounts = standups.reduce((acc: any, curr: any) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, { GREAT: 0, GOOD: 0, OKAY: 0, STRUGGLING: 0 });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Intern Daily Standups Feed" />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Action Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daily Standup Tracker</h2>
              <p className="text-xs font-semibold text-slate-500">Track intern tasks, blockers, and mood indexes in real-time.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Input */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
              </button>
            </div>
          </div>

          {/* Quick Analytics & Mood Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {/* Total count */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Total Submissions</span>
              <p className="text-2xl font-black text-slate-800 tracking-tight mt-1">{standups.length}</p>
            </div>

            {/* Mood Cards */}
            <button
              onClick={() => setMoodFilter(moodFilter === 'GREAT' ? 'ALL' : 'GREAT')}
              className={`border rounded-2xl p-4 shadow-sm text-left cursor-pointer transition-all ${
                moodFilter === 'GREAT' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' : 'bg-white border-slate-100'
              }`}
            >
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                😊 Great
              </span>
              <p className="text-2xl font-black text-emerald-600 tracking-tight mt-1">{moodCounts.GREAT}</p>
            </button>

            <button
              onClick={() => setMoodFilter(moodFilter === 'GOOD' ? 'ALL' : 'GOOD')}
              className={`border rounded-2xl p-4 shadow-sm text-left cursor-pointer transition-all ${
                moodFilter === 'GOOD' ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-white border-slate-100'
              }`}
            >
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                🙂 Good
              </span>
              <p className="text-2xl font-black text-cyan-600 tracking-tight mt-1">{moodCounts.GOOD}</p>
            </button>

            <button
              onClick={() => setMoodFilter(moodFilter === 'OKAY' ? 'ALL' : 'OKAY')}
              className={`border rounded-2xl p-4 shadow-sm text-left cursor-pointer transition-all ${
                moodFilter === 'OKAY' ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-white border-slate-100'
              }`}
            >
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                😐 Okay
              </span>
              <p className="text-2xl font-black text-amber-600 tracking-tight mt-1">{moodCounts.OKAY}</p>
            </button>

            <button
              onClick={() => setMoodFilter(moodFilter === 'STRUGGLING' ? 'ALL' : 'STRUGGLING')}
              className={`border rounded-2xl p-4 shadow-sm text-left cursor-pointer transition-all ${
                moodFilter === 'STRUGGLING' ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20' : 'bg-white border-slate-100'
              }`}
            >
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                😟 Struggling
              </span>
              <p className="text-2xl font-black text-rose-600 tracking-tight mt-1">{moodCounts.STRUGGLING}</p>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by intern name or department..."
                className="w-full text-xs font-medium pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
              />
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || moodFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchTerm(''); setMoodFilter('ALL'); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap cursor-pointer px-4"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Feed Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredStandups.length > 0 ? (
            <div className="space-y-4">
              {filteredStandups.map((item: any) => {
                const moodCfg = getMoodConfig(item.mood);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-left hover:border-slate-200 transition-all flex flex-col md:flex-row gap-5"
                  >
                    {/* Left: User details */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 flex-shrink-0 md:border-r md:border-slate-100 md:pr-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full border border-slate-200 bg-indigo-50 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                        {item.intern?.user?.avatarUrl ? (
                          <img src={item.intern.user.avatarUrl} alt={item.intern.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      
                      <div className="text-left md:space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight tracking-tight">
                          {item.intern?.user?.name}
                        </h4>
                        <p className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">
                          {item.intern?.department?.name || 'Engineering'}
                        </p>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-extrabold mt-1.5 ${moodCfg.color}`}>
                          <span>{moodCfg.emoji}</span>
                          <span>{moodCfg.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Standup descriptions */}
                    <div className="flex-1 space-y-4">
                      {/* Submission details */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {item.isLate && (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-md font-bold">
                            Late Submission
                          </span>
                        )}
                      </div>

                      {/* standup answers grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Yesterday */}
                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Yesterday's Progress</span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100 min-h-[60px] whitespace-pre-line">
                            {item.yesterday}
                          </p>
                        </div>

                        {/* Today */}
                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Today's Deliverables</span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100 min-h-[60px] whitespace-pre-line">
                            {item.today}
                          </p>
                        </div>
                      </div>

                      {/* Blockers block */}
                      {item.blockers && (
                        <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-2xl flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <span className="block text-[9px] font-black tracking-wider uppercase text-rose-600 leading-none">Active Blocker Alert</span>
                            <p className="text-xs text-rose-700 font-semibold leading-relaxed mt-1 whitespace-pre-line">
                              {item.blockers}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
              No daily standup reports submitted for this date matching search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

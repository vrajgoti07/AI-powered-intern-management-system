import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { useGamificationStats, useGamificationLeaderboard, useAllBadges } from '../../hooks/queries';
import { 
  Trophy, Flame, Sparkles, Award, Medal, ShieldAlert,
  Calendar, CheckSquare, MessageSquare, Star, Milestone, 
  Lock, CheckCircle, ChevronRight, Zap, RefreshCw, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Fetch gamification queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGamificationStats();
  const { data: leaderboard = [], isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useGamificationLeaderboard();
  const { data: allBadges = [], isLoading: badgesLoading, refetch: refetchBadges } = useAllBadges();

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchLeaderboard(), refetchBadges()]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TASKS': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'ATTENDANCE': return <Calendar className="w-4 h-4 text-cyan-500" />;
      case 'COMMUNITY': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'MILESTONES': return <Milestone className="w-4 h-4 text-amber-500" />;
      default: return <Award className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'TASK': return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ATTENDANCE': return <Calendar className="w-3.5 h-3.5 text-cyan-500" />;
      case 'FEEDBACK': return <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />;
      case 'STANDUP': return <Zap className="w-3.5 h-3.5 text-indigo-500" />;
      case 'ONBOARDING': return <Milestone className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  // Filter badges based on category tab
  const filteredBadges = allBadges.filter((badge: any) => {
    if (selectedCategory === 'ALL') return true;
    return badge.category === selectedCategory;
  });

  const earnedBadgeIds = new Set(stats?.badges?.map((b: any) => b.id) || []);
  const earnedCount = earnedBadgeIds.size;

  // Sorting Leaderboard to separate Podium from general list
  const podium = leaderboard.slice(0, 3);
  // Reorder for visual podium: 2nd, 1st, 3rd
  const orderedPodium = [];
  if (podium[1]) orderedPodium.push(podium[1]); // 2nd
  if (podium[0]) orderedPodium.push(podium[0]); // 1st
  if (podium[2]) orderedPodium.push(podium[2]); // 3rd
  
  const runnerUps = leaderboard.slice(3, 10);

  const categories = [
    { id: 'ALL', label: 'All Badges' },
    { id: 'TASKS', label: 'Tasks' },
    { id: 'ATTENDANCE', label: 'Attendance' },
    { id: 'COMMUNITY', label: 'Community' },
    { id: 'MILESTONES', label: 'Milestones' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Achievements & Leaderboard" />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gamified Milestones</h2>
              <p className="text-xs font-semibold text-slate-500">Collect experience points, build check-in streaks, unlock badges, and climb the leaderboard.</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer hover:shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Stats
            </button>
          </div>

          {/* Core Stats Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Level Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
              <div className="absolute right-3 top-3 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/50">
                <Trophy className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Current Level</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : stats?.level || 1}
                </span>
                <span className="text-xs font-extrabold text-indigo-500">Lv</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                {(stats?.totalXP || 0) % 500} / 500 XP to next level
              </p>
            </div>

            {/* Total XP Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
              <div className="absolute right-3 top-3 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/50">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Total Experience</span>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : (stats?.totalXP || 0).toLocaleString()}
                </span>
                <span className="text-xs font-black text-slate-400 ml-1">XP</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                +{stats?.currentWeekXP || 0} XP earned this week
              </p>
            </div>

            {/* Streak Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
              <div className="absolute right-3 top-3 w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100/50">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Active Streak</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : stats?.currentStreak || 0}
                </span>
                <span className="text-xs font-extrabold text-amber-500">Days</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                Longest streak: {stats?.longestStreak || 0} days
              </p>
            </div>

            {/* Badges Collected Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
              <div className="absolute right-3 top-3 w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100/50">
                <Medal className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Badges Earned</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : earnedCount}
                </span>
                <span className="text-xs font-extrabold text-purple-500">/ {allBadges.length || 12}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                {allBadges.length - earnedCount} locked achievements remaining
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Badges Grid & Transactions (Colspan 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Badges Container */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Achievements Board</h3>
                  </div>

                  {/* Tabs Category Filter */}
                  <div className="flex overflow-x-auto gap-1.5 py-1 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 text-[10px] font-black tracking-wide uppercase rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badges Grid */}
                {badgesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredBadges.length > 0 ? (
                  <motion.div 
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredBadges.map((badge: any) => {
                        const isUnlocked = earnedBadgeIds.has(badge.id);
                        const earnedInfo = stats?.badges?.find((b: any) => b.id === badge.id);

                        return (
                          <motion.div
                            key={badge.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={`relative overflow-hidden p-4 rounded-2xl border transition-all flex flex-col justify-between items-center text-center select-none ${
                              isUnlocked
                                ? 'bg-white border-indigo-200/60 shadow-[0_4px_16px_rgba(99,102,241,0.06)] ring-1 ring-indigo-50/50'
                                : 'bg-slate-50/60 border-slate-200/40 opacity-70 grayscale'
                            }`}
                          >
                            {/* Decorative background glow for unlocked badges */}
                            {isUnlocked && (
                              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                            )}

                            {/* Badge Icon / Emoji Wrapper */}
                            <div className="relative">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border transition-transform ${
                                isUnlocked 
                                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100/40 shadow-indigo-100/50' 
                                  : 'bg-slate-200/50 border-slate-200 text-slate-400'
                              }`}>
                                {badge.iconEmoji || '🏆'}
                              </div>
                              
                              {/* Locked Indicator lock icon overlay */}
                              {!isUnlocked && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-slate-700 text-white rounded-full p-1 border border-white shadow">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                              
                              {/* Checkmark indicator for unlocked */}
                              {isUnlocked && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white shadow">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Text Details */}
                            <div className="mt-3 space-y-1 w-full relative z-10">
                              <div className="flex items-center justify-center gap-1">
                                <h4 className="font-extrabold text-slate-800 text-xs tracking-tight truncate">
                                  {badge.name}
                                </h4>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold leading-snug line-clamp-2 min-h-[30px] px-1">
                                {badge.description}
                              </p>
                            </div>

                            {/* Category and Date tags */}
                            <div className="mt-3.5 w-full flex items-center justify-between border-t border-slate-100/80 pt-2.5 text-[9px] font-black uppercase tracking-wider text-slate-400 relative z-10">
                              <span className="flex items-center gap-1">
                                {getCategoryIcon(badge.category)}
                                {badge.category}
                              </span>
                              <span>
                                {isUnlocked && earnedInfo?.earnedAt
                                  ? new Date(earnedInfo.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : 'Locked'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                    No badges found in this category.
                  </div>
                )}
              </div>

              {/* Recent XP Activity Log */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Recent Experience Logs</h3>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {!statsLoading && stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((tx: any) => {
                      const isPositive = tx.points >= 0;
                      return (
                        <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200/40 hover:bg-slate-100/40 rounded-xl flex items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${
                              isPositive ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                            }`}>
                              {getSourceIcon(tx.sourceType)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-700 truncate leading-snug">{tx.reason}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {tx.sourceType} · {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className={`font-black text-xs px-2.5 py-1 rounded-lg flex-shrink-0 ${
                            isPositive 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' 
                              : 'bg-red-500/10 text-red-600 border border-red-500/10'
                          }`}>
                            {isPositive ? '+' : ''}{tx.points} XP
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      No XP transaction history found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Leaderboard Standings (Podium + Top 10 List) */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Organization Standings</h3>
                    </div>
                  </div>

                  {/* Leaderboard Podium (Top 3) */}
                  {leaderboardLoading ? (
                    <div className="h-60 bg-slate-50 rounded-2xl animate-pulse mb-6" />
                  ) : leaderboard.length > 0 ? (
                    <div className="flex items-end justify-center gap-2.5 pb-6 border-b border-slate-100 mb-6 px-1">
                      
                      {/* 2nd Place Column */}
                      {orderedPodium[0] && (
                        <div className="flex flex-col items-center flex-1 max-w-[100px]">
                          {/* Avatar */}
                          <div className="relative mb-2">
                            <div className="w-11 h-11 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                              {orderedPodium[0].avatarUrl ? (
                                <img src={orderedPodium[0].avatarUrl} alt={orderedPodium[0].name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-extrabold text-slate-500">{orderedPodium[0].name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="absolute -bottom-1.5 -right-1 w-5 h-5 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow">2</span>
                          </div>
                          
                          {/* Details */}
                          <p className="text-[10px] font-extrabold text-slate-700 truncate w-full text-center leading-tight">{orderedPodium[0].name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none truncate w-full text-center mt-0.5">{orderedPodium[0].department}</p>
                          
                          {/* Podium Block */}
                          <div className="w-full h-16 bg-gradient-to-t from-slate-200 to-slate-100 border border-slate-200 rounded-t-xl mt-3 flex flex-col items-center justify-center p-1.5">
                            <span className="text-[10px] font-black text-slate-600 font-mono">{orderedPodium[0].totalXP.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">XP</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place Column */}
                      {orderedPodium[1] && (
                        <div className="flex flex-col items-center flex-1 max-w-[110px] -translate-y-2">
                          {/* Crown & Avatar */}
                          <Crown className="w-5 h-5 text-amber-500 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)] animate-bounce mb-1" />
                          <div className="relative mb-2">
                            <div className="w-13 h-13 rounded-full border-3 border-amber-400 bg-amber-50 flex items-center justify-center overflow-hidden shadow-md">
                              {orderedPodium[1].avatarUrl ? (
                                <img src={orderedPodium[1].avatarUrl} alt={orderedPodium[1].name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-extrabold text-amber-600">{orderedPodium[1].name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="absolute -bottom-1.5 -right-1 w-5.5 h-5.5 bg-amber-400 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow">1</span>
                          </div>
                          
                          {/* Details */}
                          <p className="text-xs font-black text-slate-800 truncate w-full text-center leading-tight">{orderedPodium[1].name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none truncate w-full text-center mt-0.5">{orderedPodium[1].department}</p>
                          
                          {/* Podium Block */}
                          <div className="w-full h-22 bg-gradient-to-t from-indigo-600 to-indigo-500 border border-indigo-400/20 rounded-t-2xl mt-3 flex flex-col items-center justify-center p-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.25)]">
                            <span className="text-xs font-black text-white font-mono">{orderedPodium[1].totalXP.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest mt-0.5">XP</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place Column */}
                      {orderedPodium[2] && (
                        <div className="flex flex-col items-center flex-1 max-w-[100px]">
                          {/* Avatar */}
                          <div className="relative mb-2">
                            <div className="w-11 h-11 rounded-full border-2 border-amber-600/40 bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                              {orderedPodium[2].avatarUrl ? (
                                <img src={orderedPodium[2].avatarUrl} alt={orderedPodium[2].name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-extrabold text-amber-800">{orderedPodium[2].name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="absolute -bottom-1.5 -right-1 w-5 h-5 bg-amber-600/60 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow">3</span>
                          </div>
                          
                          {/* Details */}
                          <p className="text-[10px] font-extrabold text-slate-700 truncate w-full text-center leading-tight">{orderedPodium[2].name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none truncate w-full text-center mt-0.5">{orderedPodium[2].department}</p>
                          
                          {/* Podium Block */}
                          <div className="w-full h-12 bg-gradient-to-t from-orange-100 to-orange-50/50 border border-orange-200/40 rounded-t-xl mt-3 flex flex-col items-center justify-center p-1.5">
                            <span className="text-[10px] font-black text-orange-700/80 font-mono">{orderedPodium[2].totalXP.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">XP</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl mb-6">
                      No leaderboard data found.
                    </div>
                  )}

                  {/* Top 4-10 Leaderboard List */}
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {!leaderboardLoading && runnerUps.length > 0 ? (
                      runnerUps.map((player: any) => {
                        const isCurrentUser = player.name === user?.name || player.internId === stats?.internId;
                        return (
                          <div
                            key={player.internId}
                            className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                              isCurrentUser
                                ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                                : 'bg-white hover:bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Rank */}
                              <span className="font-extrabold text-slate-400 text-xs w-4 text-center">{player.rank}</span>
                              
                              {/* Small Avatar */}
                              <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {player.avatarUrl ? (
                                  <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-500">{player.name.charAt(0)}</span>
                                )}
                              </div>
                              
                              {/* Profile Details */}
                              <div className="min-w-0">
                                <p className={`text-xs font-extrabold truncate leading-none ${isCurrentUser ? 'text-indigo-900 font-black' : 'text-slate-700'}`}>
                                  {player.name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 leading-none mt-1 uppercase tracking-wide truncate">
                                  {player.department} · Lv {player.level}
                                </p>
                              </div>
                            </div>

                            {/* Score info */}
                            <div className="text-right flex-shrink-0 flex items-center gap-2">
                              {player.streak > 2 && (
                                <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md">
                                  <Flame className="w-2.5 h-2.5 fill-amber-500" />
                                  <span>{player.streak}</span>
                                </div>
                              )}
                              <span className={`text-xs font-black font-mono ${isCurrentUser ? 'text-indigo-600' : 'text-slate-600'}`}>
                                {player.totalXP.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

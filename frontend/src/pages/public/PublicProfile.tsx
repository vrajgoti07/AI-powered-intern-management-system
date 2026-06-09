import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Star, Award, BarChart3, Clock,
  GraduationCap, User2, Briefcase, ShieldCheck,
  ExternalLink, TrendingUp, Sparkles, ArrowLeft,
  Lock
} from 'lucide-react';
import { fetchPublicProfile } from '../../services/publicProfileApi';
import type { PublicProfileData } from '../../types';

// ─── Animation Variants ────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Helper Components ─────────────────────────────────────────────

const StarRating: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(score);
        const half = !filled && i < score;
        return (
          <Star
            key={i}
            className={`w-4 h-4 ${
              filled
                ? 'text-amber-400 fill-amber-400'
                : half
                ? 'text-amber-400 fill-amber-400/50'
                : 'text-slate-200'
            }`}
          />
        );
      })}
      <span className="ml-1.5 text-sm font-bold text-slate-600">{score.toFixed(1)}</span>
    </div>
  );
};

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const gradeStyles: Record<string, string> = {
    Excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50',
    Good: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50',
    Average: 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50',
    'Needs Improvement': 'bg-red-50 text-red-600 border-red-200 shadow-red-100/50',
    'Not Graded': 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${
        gradeStyles[grade] || gradeStyles['Not Graded']
      }`}
    >
      <Award className="w-3 h-3" />
      {grade}
    </span>
  );
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span className="relative flex items-center gap-1.5">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {isActive && (
        <span className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
      )}
      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
        {isActive ? 'Active Intern' : status === 'COMPLETED' ? 'Alumni' : status}
      </span>
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────

export const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    // Set basic meta tags
    document.title = `Profile — InternFlow`;

    const load = async () => {
      try {
        const data = await fetchPublicProfile(username);
        setProfile(data);
        // Update meta tags with profile data
        document.title = `${data.name} — InternFlow Profile`;
        updateMetaTags(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      document.title = 'InternFlow – AI-Powered Cohort Automation';
    };
  }, [username]);

  const updateMetaTags = (data: PublicProfileData) => {
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const description = `${data.name} — ${data.departmentName} intern at InternFlow. ${data.customBio || 'Verified intern profile.'}`;
    setMeta('og:title', `${data.name} — InternFlow Profile`);
    setMeta('og:description', description);
    setMeta('og:type', 'profile');
    setMeta('og:url', window.location.href);
    if (data.avatarUrl) {
      setMeta('og:image', data.avatarUrl);
    }

    // Twitter card
    const setName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setName('twitter:card', 'summary');
    setName('twitter:title', `${data.name} — InternFlow`);
    setName('twitter:description', description);
    if (data.avatarUrl) {
      setName('twitter:image', data.avatarUrl);
    }

    // Standard meta description
    setName('description', description);
  };

  // ─── Loading State ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100/80 flex items-center justify-center mx-auto animate-pulse">
            <User2 className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded-lg animate-pulse mx-auto" />
            <div className="h-3 w-56 bg-slate-100 rounded-lg animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Found / Private ─────────────────────────────────────────

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5 max-w-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto border border-slate-200/50">
            <Lock className="w-9 h-9 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Profile Not Available
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              This profile is private or doesn't exist. The intern may have disabled public visibility.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to InternFlow
          </Link>
        </motion.div>
      </div>
    );
  }

  // ─── Build stat cards ────────────────────────────────────────────

  const statCards: Array<{
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    subtitle: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }> = [];

  if (profile.tasksCompleted !== null) {
    statCards.push({
      icon: CheckCircle2,
      label: 'Tasks Completed',
      value: (
        <span>
          {profile.tasksCompleted}
          {profile.totalTasks !== null && (
            <span className="text-sm font-bold text-slate-400 ml-0.5">/{profile.totalTasks}</span>
          )}
        </span>
      ),
      subtitle: 'Total deliverables',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    });
  }

  if (profile.attendance !== null) {
    statCards.push({
      icon: Clock,
      label: 'Attendance',
      value: `${profile.attendance}%`,
      subtitle: 'Days present',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-100',
    });
  }

  if (profile.feedbackScore !== null) {
    statCards.push({
      icon: Star,
      label: 'Mentor Feedback',
      value: <StarRating score={profile.feedbackScore} />,
      subtitle: profile.feedbackCount ? `${profile.feedbackCount} reviews` : 'No reviews yet',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    });
  }

  if (profile.performanceGrade !== null) {
    statCards.push({
      icon: TrendingUp,
      label: 'AI Performance',
      value: <GradeBadge grade={profile.performanceGrade} />,
      subtitle: 'AI-evaluated grade',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
    });
  }

  // ─── Render Profile ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
      {/* ── Subtle top gradient bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Hero Section ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-50/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Avatar + Status */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative flex-shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-4 ring-white shadow-lg">
                    <span className="text-3xl font-black text-indigo-600/70">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Status dot on avatar */}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white shadow-sm ${
                  profile.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
              </div>

              <div className="text-center sm:text-left space-y-2.5 flex-1 min-w-0">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-[28px] font-black text-slate-800 tracking-tight leading-tight">
                    {profile.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      {profile.departmentName}
                    </span>
                    {profile.college && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                        {profile.college}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <StatusDot status={profile.status} />

                {/* Custom bio */}
                {profile.customBio && (
                  <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-lg">
                    {profile.customBio}
                  </p>
                )}

                {/* Mentor */}
                {profile.mentorName && (
                  <p className="text-xs text-slate-400 font-bold">
                    Mentored by <span className="text-slate-600">{profile.mentorName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verified Badge */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-5 flex justify-center sm:justify-start"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-full text-[11px] font-extrabold text-indigo-700 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Verified by InternFlow
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        {statCards.length > 0 && (
          <div className={`grid gap-3 mt-5 ${
            statCards.length === 1
              ? 'grid-cols-1'
              : statCards.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : statCards.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}>
            {statCards.map((card, index) => (
              <motion.div
                key={card.label}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                custom={index + 3}
                className={`bg-white rounded-2xl p-4 border ${card.borderColor} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`w-7 h-7 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-800 tracking-tight">
                  {card.value}
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{card.subtitle}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Skills Section ── */}
        {profile.skills && profile.skills.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={7}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm mt-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Skills & Expertise</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.04, duration: 0.3 }}
                  className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-200 hover:from-indigo-50 hover:to-indigo-100/50 transition-all cursor-default"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Joined Date ── */}
        {profile.joinedDate && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={8}
            className="flex items-center justify-center gap-2 mt-5 text-[11px] text-slate-400 font-bold"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>
              Interning since{' '}
              {new Date(profile.joinedDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </motion.div>
        )}

        {/* ── Footer ── */}
        <motion.footer
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={9}
          className="mt-10 pt-6 border-t border-slate-100 text-center space-y-3"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-400 hover:text-indigo-600 transition-colors group"
          >
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <span className="text-[9px] font-black text-white">IF</span>
            </div>
            Powered by InternFlow
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <p className="text-[10px] text-slate-300 font-semibold">
            AI-Powered Intern Management Platform
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default PublicProfile;

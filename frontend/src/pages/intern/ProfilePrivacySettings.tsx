import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Eye, EyeOff, Copy, ExternalLink, Check,
  Globe, Sparkles, CheckSquare, Star, TrendingUp,
  Clock, User2, GraduationCap, Link2, Share2
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';
import {
  getPublicSettings,
  updatePublicSettings,
  getMyPublicUrl,
} from '../../services/publicProfileApi';
import type { PublicProfileSettings } from '../../types';

// ─── Toggle Switch Component ───────────────────────────────────────

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  color?: string;
}

const ToggleSwitch: React.FC<ToggleProps> = ({
  id,
  label,
  description,
  icon: Icon,
  enabled,
  onChange,
  disabled = false,
  color = 'indigo',
}) => {
  const colorMap: Record<string, { bg: string; dot: string; iconBg: string; iconColor: string }> = {
    indigo: { bg: 'bg-indigo-600', dot: 'bg-white', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-600', dot: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500', dot: 'bg-white', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    violet: { bg: 'bg-violet-600', dot: 'bg-white', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    cyan: { bg: 'bg-cyan-600', dot: 'bg-white', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    rose: { bg: 'bg-rose-600', dot: 'bg-white', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
        disabled
          ? 'bg-slate-50/50 border-slate-100 opacity-60'
          : enabled
          ? 'bg-white border-slate-200/70 shadow-sm'
          : 'bg-slate-50/50 border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${c.iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800 truncate">{label}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{description}</p>
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          disabled ? 'cursor-not-allowed' : ''
        } ${enabled ? c.bg : 'bg-slate-200'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full ${c.dot} shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────

export const ProfilePrivacySettings: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [settings, setSettings] = useState<PublicProfileSettings | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, url] = await Promise.all([
          getPublicSettings(),
          getMyPublicUrl(),
        ]);
        setSettings(settingsData);
        setPublicUrl(url);
      } catch (err) {
        toast.error('Failed to load privacy settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggle = async (
    field: keyof Pick<
      PublicProfileSettings,
      | 'isPublic'
      | 'showSkills'
      | 'showTasks'
      | 'showFeedbackScore'
      | 'showPerformanceGrade'
      | 'showAttendance'
      | 'showMentorName'
      | 'showCollege'
    >,
    value: boolean
  ) => {
    if (!settings) return;

    // Optimistic update
    setSettings({ ...settings, [field]: value });

    try {
      setSaving(true);
      const updated = await updatePublicSettings({ [field]: value });
      setSettings(updated);
    } catch (err) {
      // Revert on error
      setSettings({ ...settings, [field]: !value });
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleBioUpdate = async (bio: string) => {
    if (!settings) return;
    try {
      setSaving(true);
      const updated = await updatePublicSettings({ customBio: bio || null });
      setSettings(updated);
      toast.success('Bio updated');
    } catch (err) {
      toast.error('Failed to update bio');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const toggleFields = [
    { field: 'showSkills' as const, label: 'Skills & Expertise', desc: 'Show your technical skills and tools', icon: Sparkles, color: 'indigo' },
    { field: 'showTasks' as const, label: 'Tasks Completed', desc: 'Show task completion count', icon: CheckSquare, color: 'emerald' },
    { field: 'showFeedbackScore' as const, label: 'Mentor Feedback Score', desc: 'Show average feedback rating', icon: Star, color: 'amber' },
    { field: 'showPerformanceGrade' as const, label: 'AI Performance Grade', desc: 'Show AI-evaluated performance', icon: TrendingUp, color: 'violet' },
    { field: 'showAttendance' as const, label: 'Attendance Rate', desc: 'Show attendance percentage', icon: Clock, color: 'cyan' },
    { field: 'showMentorName' as const, label: 'Mentor Name', desc: 'Show assigned mentor', icon: User2, color: 'indigo' },
    { field: 'showCollege' as const, label: 'College / University', desc: 'Show educational institution', icon: GraduationCap, color: 'rose' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          title="Privacy Settings"
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight">
                      Public Profile Settings
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold">
                      Control what's visible on your shareable profile page
                    </p>
                  </div>
                </div>

                {/* Public URL display */}
                {!loading && publicUrl && (
                  <div className="mt-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Link2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-600 truncate">{publicUrl}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Link
                          </>
                        )}
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] rounded-lg shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3 h-3" /> Preview
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : settings ? (
              <>
                {/* Master Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      settings.isPublic
                        ? 'bg-gradient-to-r from-emerald-50/50 to-white border-emerald-200/60 shadow-sm'
                        : 'bg-gradient-to-r from-red-50/30 to-white border-red-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          settings.isPublic ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {settings.isPublic ? (
                            <Eye className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-800">
                            {settings.isPublic ? 'Profile is Public' : 'Profile is Private'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {settings.isPublic
                              ? 'Anyone with your link can see your profile'
                              : 'Your profile is hidden from the public'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.isPublic}
                        onClick={() => handleToggle('isPublic', !settings.isPublic)}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          settings.isPublic ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                            settings.isPublic ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Field Toggles */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-2"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Visible Sections
                    </h2>
                  </div>
                  {toggleFields.map((tf) => (
                    <ToggleSwitch
                      key={tf.field}
                      id={`toggle-${tf.field}`}
                      label={tf.label}
                      description={tf.desc}
                      icon={tf.icon}
                      color={tf.color}
                      enabled={settings[tf.field]}
                      onChange={(val) => handleToggle(tf.field, val)}
                      disabled={!settings.isPublic}
                    />
                  ))}
                </motion.div>

                {/* Custom Bio */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Custom Bio
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <textarea
                      id="custom-bio"
                      maxLength={300}
                      rows={3}
                      value={settings.customBio || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, customBio: e.target.value })
                      }
                      placeholder="Write a short bio about yourself (visible on your public profile)..."
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50/50"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {(settings.customBio || '').length}/300 characters
                      </span>
                      <button
                        onClick={() => handleBioUpdate(settings.customBio || '')}
                        disabled={saving}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        {saving ? 'Saving...' : 'Save Bio'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : null}

            {/* Saving indicator */}
            {saving && (
              <div className="fixed bottom-6 right-6 bg-indigo-600 text-white text-[10px] font-extrabold px-4 py-2 rounded-xl shadow-lg animate-pulse z-50">
                Saving changes...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePrivacySettings;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import {
  User, Shield, Bell, AppWindow, Upload, Trash2, Check, Loader2, Laptop,
  Clock, Activity, Eye, ShieldCheck, Cpu, Briefcase, Mail, Phone, Calendar,
  MapPin, CheckCircle, XCircle, LogOut, ArrowRight, Settings as SettingsIcon, BookOpen, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  // Settings Sidebar active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'privacy'>('profile');

  // GDPR states
  const [gdprExports, setGdprExports] = useState<any[]>([]);
  const [erasureReason, setErasureReason] = useState('');
  const [requestingExport, setRequestingExport] = useState(false);
  const [requestingErasure, setRequestingErasure] = useState(false);

  // Security Section sub-tabs state
  const [securitySubTab, setSecuritySubTab] = useState<'verification' | 'sessions' | 'activity'>('verification');

  // Loading States
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Profile Form States
  const [profileData, setProfileData] = useState<any>({
    name: '',
    phone: '',
    dob: '',
    college: '',
    degree: '',
    branch: '',
    cgpa: '',
    skills: '',
    address: '',
    workAddress: '',
    designation: '',
    experience: '',
    bio: '',
    expertise: '',
    avatarUrl: null
  });

  // Notification Preference Checkbox States
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    attendanceAlerts: true,
    leaveAlerts: true,
    taskAlerts: true,
    announcementAlerts: true,
    weeklyDigest: true
  });

  // Active Sessions & Login Activity Logs States
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginActivity, setLoginActivity] = useState<any[]>([]);

  // Local Preferences Form States
  const [preferences, setPreferences] = useState({
    theme: 'light',
    density: 'comfortable',
    pageSize: '10'
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 2FA TOTP States
  const [totpStatus, setTotpStatus] = useState<{ enabled: boolean; verifiedAt: string | null; remainingBackupCodesCount: number } | null>(null);
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrCode, setSetupQrCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isDisabling2fa, setIsDisabling2fa] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Load profile details dynamically based on role
  const fetchProfileData = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/settings/profile');
      if (res.data.success && res.data.data) {
        const { user: userDetails, intern, mentor } = res.data.data;
        const initialForm: any = {
          name: userDetails.name || '',
          avatarUrl: userDetails.avatarUrl || null,
        };

        if (userDetails.role === 'INTERN' && intern) {
          initialForm.phone = intern.phone || '';
          initialForm.dob = intern.dob ? intern.dob.split('T')[0] : '';
          initialForm.college = intern.college || '';
          initialForm.degree = intern.degree || '';
          initialForm.branch = intern.branch || '';
          initialForm.cgpa = intern.cgpa || '';
          initialForm.skills = Array.isArray(intern.skills) ? intern.skills.join(', ') : intern.skills || '';
          initialForm.address = intern.address || '';
          initialForm.workAddress = intern.workAddress || '';
          initialForm.resumeUrl = intern.resumeUrl || null;
        } else if (userDetails.role === 'MENTOR' && mentor) {
          initialForm.phone = mentor.phone || '';
          initialForm.designation = mentor.designation || '';
          initialForm.experience = mentor.experience || '';
          initialForm.bio = mentor.bio || '';
          initialForm.expertise = Array.isArray(mentor.expertise) ? mentor.expertise.join(', ') : mentor.expertise || '';
          initialForm.skills = Array.isArray(mentor.skills) ? mentor.skills.join(', ') : mentor.skills || '';
        }

        setProfileData(initialForm);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Load active sessions list
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/security/sessions');
      if (res.data.success && res.data.data) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load login activity log
  const fetchLoginActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await api.get('/security/login-activity');
      if (res.data.success && res.data.data) {
        setLoginActivity(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load login activity history.');
    } finally {
      setActivityLoading(false);
    }
  };

  // Load notification preferences
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      if (res.data.success && res.data.data) {
        const { id, userId, ...prefs } = res.data.data;
        setNotifications(prefs);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification settings.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetch2FAStatus = async () => {
    try {
      const res = await api.get('/auth/2fa/status');
      if (res.data.success && res.data.data) {
        setTotpStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleInitiate2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Initiating 2FA setup...');
    try {
      const res = await api.post('/auth/2fa/setup', { password: setupPassword });
      toast.dismiss(loadingToast);
      if (res.data.success && res.data.data) {
        setSetupSecret(res.data.data.secret);
        setSetupQrCode(res.data.data.qrCodeDataUrl);
        setSetupStep(2);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to initiate 2FA setup.');
    }
  };

  const handleVerifyAndEnable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupToken.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }
    const loadingToast = toast.loading('Enabling 2FA...');
    try {
      const res = await api.post('/auth/2fa/enable', { token: setupToken });
      toast.dismiss(loadingToast);
      if (res.data.success && res.data.data) {
        toast.success('2FA enabled successfully!');
        setBackupCodes(res.data.data.backupCodes);
        setSetupStep(3);
        fetch2FAStatus();
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Invalid code. Verification failed.');
    }
  };

  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword || !disableToken) {
      toast.error('Password and verification token are required.');
      return;
    }
    const loadingToast = toast.loading('Disabling 2FA...');
    try {
      const res = await api.post('/auth/2fa/disable', {
        password: disablePassword,
        token: disableToken,
      });
      toast.dismiss(loadingToast);
      if (res.data.success) {
        toast.success('2FA disabled successfully.');
        setIsDisabling2fa(false);
        setDisablePassword('');
        setDisableToken('');
        fetch2FAStatus();
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Verification failed. Cannot disable 2FA.');
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchNotifications();
    fetch2FAStatus();
  }, []);

  const fetchGDPRHistory = async () => {
    try {
      const res = await api.get('/gdpr/export/history');
      if (res.data.success && res.data.data) {
        setGdprExports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load GDPR history:', err);
    }
  };

  const handleRequestExport = async () => {
    setRequestingExport(true);
    try {
      const res = await api.post('/gdpr/export');
      if (res.data.success) {
        toast.success(res.data.message || 'Export request submitted successfully.');
        fetchGDPRHistory();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request data export.');
    } finally {
      setRequestingExport(false);
    }
  };

  const handleRequestErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingErasure(true);
    try {
      const res = await api.post('/gdpr/erasure', { reason: erasureReason });
      if (res.data.success) {
        toast.success(res.data.message || 'Erasure request submitted. Check your email to confirm deletion.');
        setErasureReason('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit erasure request.');
    } finally {
      setRequestingErasure(false);
    }
  };

  // Fetch security sub-tabs on demand
  useEffect(() => {
    if (activeTab === 'security') {
      if (securitySubTab === 'sessions') {
        fetchSessions();
      } else if (securitySubTab === 'activity') {
        fetchLoginActivity();
      }
    }
  }, [activeTab, securitySubTab]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Profile Upload Triggers
  const triggerAvatarUpload = () => avatarInputRef.current?.click();
  const triggerResumeUpload = () => resumeInputRef.current?.click();

  // Handle avatar photo changes
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadToast = toast.loading('Uploading profile picture...');
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('isAvatarUpload', 'true');

        const res = await api.put('/settings/profile', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success && res.data.data) {
          const stored = localStorage.getItem('internflow_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatarUrl = res.data.data.avatarUrl;
            localStorage.setItem('internflow_user', JSON.stringify(parsed));
          }
          toast.success('Profile photo updated successfully!', { id: uploadToast });
          fetchProfileData();
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload profile photo.', { id: uploadToast });
      }
    }
  };

  // Handle profile photo deletion
  const handleRemoveAvatar = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Profile Photo',
      message: 'Are you sure you want to remove your profile photo?',
      variant: 'warning',
      confirmLabel: 'Remove Photo',
      onConfirm: async () => {
        const deleteToast = toast.loading('Removing profile photo...');
        try {
          const res = await api.put('/settings/profile', { avatarUrl: 'REMOVE' });
          if (res.data.success) {
            const stored = localStorage.getItem('internflow_user');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.avatarUrl = null;
              localStorage.setItem('internflow_user', JSON.stringify(parsed));
            }
            toast.success('Profile photo removed successfully!', { id: deleteToast });
            fetchProfileData();
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to remove profile photo.', { id: deleteToast });
        }
      },
    });
  };

  // Handle onboarding resume PDF updates
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadToast = toast.loading('Uploading resume document...');
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('isAvatarUpload', 'false');

        const res = await api.put('/settings/profile', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          toast.success('Resume document updated successfully!', { id: uploadToast });
          fetchProfileData();
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload resume.', { id: uploadToast });
      }
    }
  };

  // Submit Profile Form Updates
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // Exclude avatarUrl from the payload — avatar is managed separately via upload/remove buttons
      const { avatarUrl: _ignored, ...profilePayload } = profileData;
      const res = await api.put('/settings/profile', profilePayload);
      if (res.data.success) {
        toast.success('Profile details updated successfully!');

        // Refresh local cache for header
        const stored = localStorage.getItem('internflow_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = profileData.name;
          localStorage.setItem('internflow_user', JSON.stringify(parsed));
        }

        fetchProfileData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Notification Preferences Checkboxes
  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      const res = await api.put('/settings/notifications', notifications);
      if (res.data.success) {
        toast.success('Notification preferences updated successfully!');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notification settings.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Toggle notification preference checkboxes
  const handleCheckboxToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Forcefully Logout/Terminate a session
  const handleTerminateSession = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Terminate Session',
      message: 'Are you sure you want to terminate this active device session?',
      variant: 'warning',
      confirmLabel: 'Terminate',
      onConfirm: async () => {
        const termToast = toast.loading('Terminating active session...');
        try {
          const res = await api.delete(`/security/session/${id}`);
          if (res.data.success) {
            toast.success('Session terminated successfully!', { id: termToast });
            fetchSessions();
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to terminate session.', { id: termToast });
        }
      },
    });
  };

  // Forcefully terminate ALL sessions
  const handleLogoutAllSessions = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Logout All Sessions',
      message: 'Are you sure you want to force logout all active sessions? You will need to log in again on all other devices.',
      variant: 'danger',
      confirmLabel: 'Logout All',
      onConfirm: async () => {
        const termToast = toast.loading('Revoking all active sessions...');
        try {
          const res = await api.delete('/security/logout-all');
          if (res.data.success) {
            toast.success('All other sessions terminated. Logging you out...');
            setTimeout(() => {
              localStorage.removeItem('internflow_access_token');
              localStorage.removeItem('internflow_refresh_token');
              localStorage.removeItem('internflow_user');
              navigate('/login');
            }, 1500);
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to terminate all sessions.', { id: termToast });
        }
      },
    });
  };

  // Save visual portal preferences locally
  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('internflow_theme_pref', JSON.stringify(preferences));
    toast.success('System preferences stored successfully!');
  };

  // Determine uppercase dynamic display variables for headers
  const roleName = user?.role === 'hr' ? 'HR Administrator' : user?.role === 'mentor' ? 'Program Mentor' : 'Intern Member';
  const myName = profileData.name || user?.name || 'User Profile';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-grow flex flex-col overflow-hidden bg-slate-50/50">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Workspace Settings" />

        <div className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full text-left">

          {/* Executive Backdrop Profile Hero Banner */}
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.2),transparent_60%)]" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            </div>

            <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                {/* Maximized Squircle Avatar Frame */}
                <div className="-mt-24 sm:-mt-32 w-40 h-40 sm:w-44 sm:h-44 rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-white overflow-hidden flex items-center justify-center relative">
                  <Avatar name={myName} size="full" url={profileData.avatarUrl} />
                </div>

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  className="hidden text-base"
                  accept="image/*"
                />

                <div className="text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-extrabold text-slate-800 text-2xl tracking-tight leading-none">{myName}</h3>
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/25" title="Verified Member Portal">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-semibold tracking-wide flex items-center justify-center sm:justify-start gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#2563eb]" /> {roleName}
                  </p>

                  {/* Photo Actions Toolbar (Separated next to the profile detail block) */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <button
                      onClick={triggerAvatarUpload}
                      className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-[10px] font-black uppercase tracking-wider text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Edit Photo
                    </button>
                    {profileData.avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 active:scale-95 text-[10px] font-black uppercase tracking-wider text-rose-600 rounded-xl border border-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Split Grid Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation Column */}
            <div className="lg:col-span-1 space-y-2.5">
              <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-0 lg:space-y-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm p-2.5 lg:p-4 scrollbar-none whitespace-nowrap lg:whitespace-normal">
                <p className="hidden lg:block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-3.5 pb-2">Workspace settings</p>
                
                {[
                  { id: 'profile', label: user?.role === 'hr' ? 'HR Profile' : user?.role === 'mentor' ? 'Mentor Profile' : 'My Profile', icon: User },
                  { id: 'security', label: 'Account Security', icon: Shield },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'preferences', label: 'Preferences', icon: AppWindow },
                  { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 lg:gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 lg:flex-shrink border-b-2 lg:border-b-0 lg:border-l-4
                        ${isActive
                          ? 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
                        }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Settings Form Viewport Card */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">

                {/* 1. Profile Section */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Profile Details</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Configure your personal and corporate details displayed across the platform.</p>
                    </div>

                    {profileLoading ? (
                      <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading profile details...
                      </div>
                    ) : (
                      <form onSubmit={handleProfileSubmit} className="space-y-5 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                            <input
                              type="text" name="name" value={profileData.name} onChange={handleInputChange}
                              className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                              required
                            />
                          </div>

                          {user?.role === 'intern' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                                <input
                                  type="text" name="phone" value={profileData.phone} onChange={handleInputChange}
                                  placeholder="+91 XXXXX XXXXX"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">College / University</label>
                                <input
                                  type="text" name="college" value={profileData.college} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Academic Degree</label>
                                <input
                                  type="text" name="degree" value={profileData.degree} onChange={handleInputChange}
                                  placeholder="e.g. B.Tech Computer Science"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Branch</label>
                                <input
                                  type="text" name="branch" value={profileData.branch} onChange={handleInputChange}
                                  placeholder="e.g. Information Technology"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">CGPA rating</label>
                                <input
                                  type="text" name="cgpa" value={profileData.cgpa} onChange={handleInputChange}
                                  placeholder="e.g. 9.15"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Skills Set (Comma Separated)</label>
                                <input
                                  type="text" name="skills" value={profileData.skills} onChange={handleInputChange}
                                  placeholder="e.g. React, Node.js, Prisma, PostgreSQL"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Residential Address</label>
                                <input
                                  type="text" name="address" value={profileData.address} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Workplace Address</label>
                                <input
                                  type="text" name="workAddress" value={profileData.workAddress} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                            </>
                          )}

                          {user?.role === 'mentor' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                                <input
                                  type="text" name="phone" value={profileData.phone} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Professional Designation</label>
                                <input
                                  type="text" name="designation" value={profileData.designation} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Years of Experience</label>
                                <input
                                  type="number" name="experience" value={profileData.experience} onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Professional Bio</label>
                                <textarea
                                  name="bio" value={profileData.bio} onChange={handleInputChange} rows={3}
                                  className="w-full text-xs font-semibold p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Specialization Expertise Tags (Comma Separated)</label>
                                <input
                                  type="text" name="expertise" value={profileData.expertise} onChange={handleInputChange}
                                  placeholder="e.g. Distributed Systems, Cloud Architecture, Node.js"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                                />
                              </div>
                            </>
                          )}

                          {user?.role === 'hr' && (
                            <div className="sm:col-span-2 space-y-4">
                              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                                <h5 className="text-xs font-black text-[#2563eb] uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Shield className="w-4 h-4" /> Global Admin Registry</h5>
                                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                  You are logged in as a verified Corporate HR Administrator. Any global preferences or system controls will affect department cohorts.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resume Onboarding card for Interns */}
                        {user?.role === 'intern' && (
                          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">Onboarding Resume Vault</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                  {profileData.resumeUrl ? '✓ Verified resume document is uploaded' : 'No document uploaded'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                type="file" ref={resumeInputRef} onChange={handleResumeChange}
                                className="hidden text-base" accept=".pdf,.doc,.docx"
                              />
                              <button
                                type="button" onClick={triggerResumeUpload}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                {profileData.resumeUrl ? 'Replace PDF' : 'Upload Resume'}
                              </button>
                              {profileData.resumeUrl && (
                                <a
                                  href={profileData.resumeUrl} target="_blank" rel="noreferrer"
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                                >
                                  View File
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit" disabled={savingProfile}
                            className="px-5 py-3 bg-[#2563eb] text-white hover:bg-blue-700 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer min-w-[120px]"
                          >
                            {savingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 2. Security Section */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Account & Security Gate</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Configure secure credential logins, track logged-in device locations, and audit access trials.</p>
                    </div>

                    {/* Symmetrical Security sub-tabs */}
                    <div className="flex border-b border-slate-100 gap-4 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap w-full">
                      {[
                        { id: 'verification', label: 'Login Verification', icon: ShieldCheck },
                        { id: 'sessions', label: 'Active Sessions', icon: Laptop },
                        { id: 'activity', label: 'Login Activity', icon: Activity }
                      ].map((sub) => {
                        const Icon = sub.icon;
                        const isSubActive = securitySubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setSecuritySubTab(sub.id as any)}
                            className={`flex-shrink-0 pb-3 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 flex items-center gap-1.5 transition-all
                              ${isSubActive
                                ? 'border-[#2563eb] text-[#2563eb]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub-tab 1: Login Verification (OTP Settings) */}
                    {securitySubTab === 'verification' && (
                      <div className="space-y-6 text-left">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">SMTP Email verification OTP</p>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-1">
                              When signing in, InternFlow validates credentials and automatically requests a unique 6-digit passcode sent dynamically via SMTP server to your email <strong className="text-slate-600">{user?.email}</strong>. This provides 2FA security out of the box without local authenticator apps.
                            </p>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 mt-3.5 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" /> SECURED ENABLED
                            </span>
                          </div>
                        </div>

                        {/* Google Authenticator TOTP 2FA Section */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 mt-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-800">Google Authenticator Two-Factor Authentication (2FA)</p>
                              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-1">
                                Secure your account using standard TOTP authenticator apps (Google Authenticator, Authy, Microsoft Authenticator). When enabled, you will be prompted for a 6-digit time-based code after completing password and email verification.
                              </p>
                              
                              {totpStatus?.enabled ? (
                                <div className="mt-3.5 flex flex-col gap-2 text-left">
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" /> 2FA ACTIVE
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    Enabled on: {totpStatus.verifiedAt ? new Date(totpStatus.verifiedAt).toLocaleString() : 'N/A'} ({totpStatus.remainingBackupCodesCount} backup codes remaining)
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setIsDisabling2fa(true)}
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Disable 2FA
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3.5">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shadow-sm mr-2">
                                    NOT ACTIVE
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsSettingUp2fa(true);
                                      setSetupStep(1);
                                      setSetupPassword('');
                                      setSetupToken('');
                                    }}
                                    className="px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
                                  >
                                    Set up 2FA
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inline setup wizard container */}
                          {isSettingUp2fa && (
                            <div className="border-t border-slate-150 pt-5 mt-2 animate-fade-in text-left">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Configure Two-Factor Authenticator (Step {setupStep} of 3)</h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSettingUp2fa(false);
                                    setBackupCodes([]);
                                  }}
                                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>

                              {setupStep === 1 && (
                                <form onSubmit={handleInitiate2fa} className="space-y-4 max-w-sm">
                                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                    For security reasons, please confirm your current login password to begin 2FA setup.
                                  </p>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                    <input
                                      type="password"
                                      value={setupPassword}
                                      onChange={(e) => setSetupPassword(e.target.value)}
                                      placeholder="••••••••"
                                      className="w-full text-xs font-semibold px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-base"
                                      required
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                  >
                                    Continue
                                  </button>
                                </form>
                              )}

                              {setupStep === 2 && (
                                <form onSubmit={handleVerifyAndEnable2fa} className="space-y-5">
                                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                    1. Scan the QR code below using your authenticator application (Google Authenticator, Authy, etc.).
                                  </p>
                                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                                    <div className="bg-white p-3 border border-slate-200 rounded-2xl flex-shrink-0 shadow-sm">
                                      <img src={setupQrCode} alt="2FA QR Code" className="w-40 h-40" />
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[11px] text-slate-400 font-semibold">
                                        Can't scan the code? Use this manually:
                                      </p>
                                      <code className="block p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold select-all break-all text-slate-700">
                                        {setupSecret}
                                      </code>
                                    </div>
                                  </div>
                                  <div className="space-y-3 max-w-sm">
                                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                      2. Enter the 6-digit verification code from your authenticator app below to complete the setup.
                                    </p>
                                    <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Verification Code</label>
                                      <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={setupToken}
                                        onChange={(e) => setSetupToken(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-sm font-bold tracking-widest px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-base"
                                        required
                                      />
                                    </div>
                                    <button
                                      type="submit"
                                      className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Verify & Enable
                                    </button>
                                  </div>
                                </form>
                              )}

                              {setupStep === 3 && (
                                <div className="space-y-4">
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-black text-emerald-800">Two-Factor Authentication is active!</p>
                                      <p className="text-[11px] text-emerald-700/80 font-bold mt-1">
                                        Your account is now protected with 2FA. Below are your emergency backup codes. If you lose your phone, you can use these to log in. Each code can only be used once.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Backup Recovery Codes (Save these safely!)</p>
                                    <div className="grid grid-cols-2 gap-2 text-left font-mono font-extrabold text-sm text-slate-800">
                                      {backupCodes.map((code, idx) => (
                                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                          <span>{code}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2.5 mt-4">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(backupCodes.join('\n'));
                                          toast.success('Backup codes copied to clipboard!');
                                        }}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                      >
                                        Copy Codes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsSettingUp2fa(false);
                                          setBackupCodes([]);
                                        }}
                                        className="px-3.5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Disable 2FA Form Container */}
                          {isDisabling2fa && (
                            <form onSubmit={handleDisable2fa} className="border-t border-slate-150 pt-5 mt-2 animate-fade-in text-left space-y-4 max-w-sm">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-rose-700 uppercase tracking-wider">Disable Two-Factor Authentication</h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDisabling2fa(false);
                                    setDisablePassword('');
                                    setDisableToken('');
                                  }}
                                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                Enter your current login password and the 6-digit Authenticator code (or backup code) to disable 2FA security.
                              </p>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                <input
                                  type="password"
                                  value={disablePassword}
                                  onChange={(e) => setDisablePassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-base"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Verification Code / Backup Code</label>
                                <input
                                  type="text"
                                  value={disableToken}
                                  onChange={(e) => setDisableToken(e.target.value.trim())}
                                  placeholder="000000 or xxxx-xxxx"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-base"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-rose-500/10"
                              >
                                Confirm & Disable
                              </button>
                            </form>
                          )}
                        </div>

                        <div className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-5 flex items-start gap-4">
                          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-amber-800">Passcode OTP parameters</p>
                            <ul className="text-[11px] text-amber-700/80 font-bold list-disc pl-4 space-y-1 mt-2">
                              <li>OTP codes automatically expire in exactly 5 minutes.</li>
                              <li>Resend cooldown is locked at 30 seconds to prevent mail limits.</li>
                              <li>Codes are securely cryptographically hashed in our database.</li>
                              <li>Verification allows a maximum of 3 failed entry trials before auto-revocation.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 2: Active Sessions (List sessions) */}
                    {securitySubTab === 'sessions' && (
                      <div className="space-y-5">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Logged connections ({sessions.length})</p>
                          {sessions.length > 0 && (
                            <button
                              onClick={handleLogoutAllSessions}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border border-rose-100"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Terminate all other sessions
                            </button>
                          )}
                        </div>

                        {sessionsLoading ? (
                          <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> Loading sessions...
                          </div>
                        ) : sessions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                            No active sessions found.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sessions.map((sess) => (
                              <div key={sess.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-white border border-slate-200/50 text-[#2563eb] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                      <Laptop className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{sess.operatingSystem || 'Generic Device'}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sess.browser} · IP: {sess.ipAddress || 'Unknown'}</p>
                                    </div>
                                  </div>

                                  {/* Current Status Badge */}
                                  {sess.status === 'ACTIVE' ? (
                                    <span className="text-[8px] font-extrabold bg-[#2563eb]/10 text-[#2563eb] px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-extrabold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                      {sess.status.toLowerCase()}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                                  <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Last Active: {new Date(sess.lastActivityAt).toLocaleString()}
                                  </span>
                                  {sess.status === 'ACTIVE' && (
                                    <button
                                      onClick={() => handleTerminateSession(sess.id)}
                                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                      title="Force disconnect device"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 3: Login Activity (Table log) */}
                    {securitySubTab === 'activity' && (
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider text-left">Historical authentication trails (Last 50 attempts)</p>

                        {activityLoading ? (
                          <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> Fetching activity logs...
                          </div>
                        ) : loginActivity.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                            No logs audit history.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                            <table className="w-full text-xs font-semibold text-slate-600 text-left bg-white">
                              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <tr>
                                  <th className="px-5 py-4">Date & Time</th>
                                  <th className="px-5 py-4">Status</th>
                                  <th className="px-5 py-4">Client browser</th>
                                  <th className="px-5 py-4">Device OS</th>
                                  <th className="px-5 py-4">IP Address</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {loginActivity.map((log) => {
                                  const isSuccess = log.status === 'SUCCESS';
                                  const isLogout = log.status === 'LOGOUT';
                                  return (
                                    <tr key={log.id} className="hover:bg-slate-50/50">
                                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                      <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider
                                          ${isSuccess
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : isLogout
                                              ? 'bg-slate-100 text-slate-600'
                                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                                          }`}>
                                          {isSuccess ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : isLogout ? null : <XCircle className="w-3 h-3 text-rose-500" />}
                                          {log.status}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3.5 text-slate-800">{log.browser}</td>
                                      <td className="px-5 py-3.5 text-slate-500">{log.device}</td>
                                      <td className="px-5 py-3.5 text-slate-500">{log.ipAddress}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Notifications Section */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Notification Settings</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Configure your real-time email preferences and active cohort alerts.</p>
                    </div>

                    {notificationsLoading ? (
                      <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Fetching notification settings...
                      </div>
                    ) : (
                      <form onSubmit={handleNotificationsSubmit} className="space-y-6 text-left">
                        <div className="space-y-4">
                          {[
                            { key: 'emailNotifications', title: 'Global Email Notifications', desc: 'Receive secure reports, summary digests, and system updates directly in your email address.' },
                            { key: 'taskAlerts', title: 'Milestone & Task Alerts', desc: 'Notify instantly when new task deliverables are assigned, reviewed, or comments are posted.' },
                            { key: 'attendanceAlerts', title: 'Attendance Check-in Prompts', desc: 'Trigger reminders when daily attendance mark logs require check-ins or regularizations.' },
                            { key: 'leaveAlerts', title: 'Leaves & Absences Requests', desc: 'Track request approvals, pending states, and feedback status updates for leave request filings.' },
                            { key: 'announcementAlerts', title: 'Department Broadcast Announcements', desc: 'Notify immediately when department-wide announcements are broadcasted.' },
                            { key: 'weeklyDigest', title: 'Weekly AI Performance Digest', desc: 'Receive a personalized AI-written summary of your performance, alerts, and growth tips every Monday morning.' }
                          ].map((item) => {
                            const isChecked = notifications[item.key as keyof typeof notifications];
                            return (
                              <div
                                key={item.key}
                                onClick={() => handleCheckboxToggle(item.key as any)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5
                                  ${isChecked
                                    ? 'bg-blue-50/10 border-blue-200/50 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                  }`}
                              >
                                <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5
                                  ${isChecked
                                    ? 'bg-[#2563eb] border-[#2563eb] text-white'
                                    : 'bg-slate-50 border-slate-200 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800">{item.title}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit" disabled={savingNotifications}
                            className="px-5 py-3 bg-[#2563eb] text-white hover:bg-blue-700 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer min-w-[120px]"
                          >
                            {savingNotifications ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                              </>
                            ) : (
                              'Save Preferences'
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Web Push Notifications Card */}
                    <div className="mt-6 border-t border-slate-100 pt-6 text-left">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Device Notifications</h5>
                      
                      {!isPushSupported ? (
                        <div className="p-4 bg-amber-50/40 border border-amber-100/50 rounded-2xl text-[11px] font-bold text-amber-700">
                          Web Push Notifications are not supported by your current browser. Try Chrome, Firefox, or Safari.
                        </div>
                      ) : (
                        <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4
                          ${isPushSubscribed 
                            ? 'bg-indigo-50/10 border-indigo-200/50 shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                              ${isPushSubscribed ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                            >
                              <Bell className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">Browser Push Notifications</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">
                                Receive real-time desktop or mobile push notifications for tasks, announcements, messages, and milestones.
                              </p>
                              {pushPermission === 'denied' && (
                                <p className="text-[10px] text-rose-500 font-bold mt-1.5">
                                  ⚠️ Notification permission is blocked. Please enable permissions in your browser site settings.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {pushLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-650" />
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isPushSubscribed) {
                                    const success = await unsubscribeFromPush();
                                    if (success) toast.success('Unsubscribed from push notifications successfully!');
                                    else toast.error('Failed to unsubscribe from push notifications.');
                                  } else {
                                    const success = await subscribeToPush();
                                    if (success) toast.success('Subscribed to push notifications successfully!');
                                    else toast.error('Failed to subscribe. Make sure to allow browser notifications.');
                                  }
                                }}
                                disabled={pushPermission === 'denied'}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm
                                  ${isPushSubscribed 
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
                                  } ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isPushSubscribed ? 'Disable Push' : 'Enable Push'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Preferences Section */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Visual Portal Preferences</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Configure workspace density, page lists size limit, and theme behaviors.</p>
                    </div>

                    <form onSubmit={handlePreferencesSubmit} className="space-y-5 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Active Workspace Theme</label>
                          <select
                            value={preferences.theme} onChange={(e) => setPreferences(p => ({ ...p, theme: e.target.value }))}
                            className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                          >
                            <option value="light">Classic Professional Light</option>
                            <option value="dark">Executive Slate Dark (Coming Soon)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Display Layout Density</label>
                          <select
                            value={preferences.density} onChange={(e) => setPreferences(p => ({ ...p, density: e.target.value }))}
                            className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                          >
                            <option value="compact">High-Density Compact</option>
                            <option value="comfortable">Comfortable Rounded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Grid Pagination Size</label>
                          <select
                            value={preferences.pageSize} onChange={(e) => setPreferences(p => ({ ...p, pageSize: e.target.value }))}
                            className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-base"
                          >
                            <option value="10">10 Rows</option>
                            <option value="25">25 Rows</option>
                            <option value="50">50 Rows</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          className="px-5 py-3 bg-[#2563eb] text-white hover:bg-blue-700 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          Save Preferences
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 5. Privacy & Data GDPR Section */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6 text-left">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Privacy & Data Compliance (GDPR)</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Exercise your user rights under GDPR: export personal data archives or initiate right to erasure account deletions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Data Export */}
                      <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                        <h5 className="text-sm font-bold text-slate-800">Export Personal Data</h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Request a complete copy of all your telemetry records, profile specifications, and task deliverables packaged into a compressed ZIP file structure.
                        </p>
                        
                        <button
                          onClick={handleRequestExport}
                          disabled={requestingExport}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-[#2563eb] text-white hover:bg-blue-750 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {requestingExport ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Compiling Data...</span>
                            </>
                          ) : (
                            <span>Request Data Export</span>
                          )}
                        </button>

                        {/* Export History */}
                        <div className="pt-3 border-t border-slate-100/80">
                          <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Export Logs</h6>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {gdprExports.length > 0 ? (
                              gdprExports.map((exp: any) => {
                                const isReady = exp.status === 'READY';
                                const isExpired = exp.expiresAt && new Date(exp.expiresAt) < new Date();
                                return (
                                  <div key={exp.id} className="p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-slate-700 truncate">Request ID: {exp.id.slice(0, 8)}</p>
                                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                        Status: {exp.status} · Expires: {exp.expiresAt ? new Date(exp.expiresAt).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                    {isReady && !isExpired && (
                                      <a
                                        href={`${api.defaults.baseURL}/gdpr/export/download/${exp.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No past export requests.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right to Erasure */}
                      <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                        <h5 className="text-sm font-bold text-rose-800">Right to Erasure (Delete Account)</h5>
                        <p className="text-xs text-slate-550 leading-relaxed">
                          Request to delete your profile details permanently. Submitting will send a verification token to your email. After confirmation, HR administrators will audit and complete the deletion.
                        </p>

                        <form onSubmit={handleRequestErasure} className="space-y-3">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-1">
                              Reason for Deletion
                            </label>
                            <textarea
                              value={erasureReason}
                              onChange={(e) => setErasureReason(e.target.value)}
                              placeholder="Please describe why you wish to delete your account..."
                              rows={2}
                              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={requestingErasure}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {requestingErasure ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <span>Permanently Delete Account</span>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
      />
    </div>
  );
};


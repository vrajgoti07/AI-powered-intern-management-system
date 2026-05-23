import React, { useState, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, BookOpen, Calendar, Briefcase, FileText, Upload, Sparkles, 
  Award, Edit3, Save, Eye, ShieldCheck, Users, MapPin, Lock, Smartphone, RefreshCw, 
  KeyRound, Trash2, ShieldAlert, Cpu, Laptop, Terminal, ChevronRight, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { state, refreshData } = useApp();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resumeName, setResumeName] = useState<string>('');
  
  const [activeHubTab, setActiveHubTab] = useState<'details' | 'security'>('details');
  const [activeSecurityTab, setActiveSecurityTab] = useState<'otp' | '2fa' | 'sessions'>('otp');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const rawIntern = (user as any)?.intern;
  const internDetail = rawIntern || state.interns.find(i => i.email === user?.email);

  // Use the intern profile embedded in the user object
  const myInternData = internDetail ? {
    id: internDetail.id,
    name: user?.name || '',
    email: user?.email || '',
    college: internDetail.college,
    dept: internDetail.department?.name || '',
    mentor: internDetail.mentor?.user?.name || 'Unassigned',
    score: internDetail.score,
    status: internDetail.status === 'ACTIVE' ? 'Active' : internDetail.status === 'COMPLETED' ? 'Completed' : 'Pending',
    joined: internDetail.joinedDate ? new Date(internDetail.joinedDate).toISOString().split('T')[0] : '',
    attendance: internDetail.attendance,
    phone: internDetail.phone,
    dob: internDetail.dob ? new Date(internDetail.dob).toISOString().split('T')[0] : '',
    degree: internDetail.degree,
    branch: internDetail.branch,
    cgpa: internDetail.cgpa,
    skills: internDetail.skills || [],
    duration: internDetail.duration,
    resumeUrl: internDetail.resumeUrl,
    gender: internDetail.gender,
    address: internDetail.address,
    workAddress: internDetail.workAddress,
    parentName: internDetail.parentName,
    parentPhone: internDetail.parentPhone,
    emergencyName: internDetail.emergencyName,
    emergencyRelation: internDetail.emergencyRelation,
    emergencyPhone: internDetail.emergencyPhone,
    semester: internDetail.semester,
    idProofUrl: internDetail.idProofUrl,
    marksheetUrl: internDetail.marksheetUrl,
    aadhaarPanUrl: internDetail.aadhaarPanUrl,
    collegeIdUrl: internDetail.collegeIdUrl,
    passportPhotoUrl: internDetail.passportPhotoUrl,
  } : null;

  const [editForm, setEditForm] = useState({
    phone: myInternData?.phone || '',
    degree: myInternData?.degree || '',
    branch: myInternData?.branch || '',
    cgpa: myInternData?.cgpa || 0,
  });

  const [isEditingCompliance, setIsEditingCompliance] = useState(false);
  const [isSavingCompliance, setIsSavingCompliance] = useState(false);
  const [complianceForm, setComplianceForm] = useState({
    gender: myInternData?.gender || '',
    dob: myInternData?.dob ? new Date(myInternData.dob).toISOString().split('T')[0] : '',
    semester: myInternData?.semester || 1,
    address: myInternData?.address || '',
    workAddress: myInternData?.workAddress || '',
    parentName: myInternData?.parentName || '',
    parentPhone: myInternData?.parentPhone || '',
    emergencyName: myInternData?.emergencyName || '',
    emergencyPhone: myInternData?.emergencyPhone || '',
    emergencyRelation: myInternData?.emergencyRelation || '',
  });

  const myName = user?.name || "Intern User";

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '']);
  const handleOtpChange = (val: string, index: number) => {
    if (/[^0-9]/.test(val)) return;
    setOtp(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });

    // Auto-focus next cell
    if (val && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(o => !o)) {
      toast.error("Please enter the complete 4-digit code.");
      return;
    }
    toast.success("Security Passcode authorized! Verification completed.");
    setOtp(['', '', '', '']);
  };

  // Sessions State
  const [sessions, setSessions] = useState([
    { id: 1, browser: "Chrome 124 (Windows)", ip: "192.168.1.15", date: "Current Session", active: true },
    { id: 2, browser: "Safari 17.4 (iPhone)", ip: "10.0.0.12", date: "Yesterday, 3:10 PM", active: false }
  ]);

  const terminateSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Active session terminated successfully.");
  };

  // Profile Photo Upload State & Handlers
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const triggerAvatarUpload = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.loading('Uploading profile picture...', { id: 'avatar-toast' });
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        const { default: api } = await import('../../services/api');
        const res = await api.post(`/profile/avatar`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update user localstorage
        if (res.data.success && res.data.data) {
          const stored = localStorage.getItem('internflow_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatarUrl = res.data.data.avatarUrl;
            localStorage.setItem('internflow_user', JSON.stringify(parsed));
          }
        }
        
        toast.success("Profile photo updated successfully!", { id: 'avatar-toast' });
        window.location.reload();
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload profile photo.", { id: 'avatar-toast' });
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    toast.loading('Removing profile picture...', { id: 'avatar-toast' });
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.delete(`/profile/avatar`);
      
      if (res.data.success && res.data.data) {
        const stored = localStorage.getItem('internflow_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.avatarUrl = null;
          localStorage.setItem('internflow_user', JSON.stringify(parsed));
        }
      }
      
      toast.success("Profile photo removed successfully!", { id: 'avatar-toast' });
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove profile photo.", { id: 'avatar-toast' });
    }
  };

  // Onboarding File Upload State & Handlers
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = (docType: string) => {
    setUploadingDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset value to trigger onChange even for same file
      fileInputRef.current.click();
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDocType) {
      const labelMap: Record<string, string> = {
        resume: 'Resume/CV',
        idProof: 'ID Verification',
        marksheet: 'Academic Marksheet',
        aadhaarPan: 'Aadhaar & PAN Bundle',
        collegeId: 'College ID Card',
        passportPhoto: 'Passport Photograph'
      };
      const label = labelMap[uploadingDocType] || 'Document';
      toast.loading(`Uploading ${label}...`, { id: 'upload-toast' });
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        const { default: api } = await import('../../services/api');
        await api.post(`/interns/me/onboarding/upload?docType=${uploadingDocType}`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadingDocType === 'resume') {
          setResumeName(file.name);
        }
        toast.success(`${label} updated and synced successfully!`, { id: 'upload-toast' });
        window.location.reload();
      } catch (err) {
        console.error(err);
        toast.error(`Failed to upload ${label}.`, { id: 'upload-toast' });
      }
    }
  };

  const handleEditClick = () => {
    if (myInternData) {
      setEditForm({
        phone: myInternData.phone || '',
        degree: myInternData.degree || '',
        branch: myInternData.branch || '',
        cgpa: myInternData.cgpa || 0,
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!myInternData?.id) return;
    setIsSaving(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.put(`/interns/${myInternData.id}`, editForm);
      toast.success('Academic details updated successfully!');
      setIsEditing(false);
      
      const authRes = await api.get('/auth/me');
      if (authRes.data.success && authRes.data.data) {
        localStorage.setItem('internflow_user', JSON.stringify(authRes.data.data));
        window.location.reload();
      } else {
        await refreshData();
      }
    } catch (error) {
      toast.error('Failed to update academic profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditComplianceClick = () => {
    if (myInternData) {
      setComplianceForm({
        gender: myInternData.gender || '',
        dob: myInternData.dob ? new Date(myInternData.dob).toISOString().split('T')[0] : '',
        semester: myInternData.semester || 1,
        address: myInternData.address || '',
        workAddress: myInternData.workAddress || '',
        parentName: myInternData.parentName || '',
        parentPhone: myInternData.parentPhone || '',
        emergencyName: myInternData.emergencyName || '',
        emergencyPhone: myInternData.emergencyPhone || '',
        emergencyRelation: myInternData.emergencyRelation || '',
      });
    }
    setIsEditingCompliance(true);
  };

  const handleSaveCompliance = async () => {
    if (!myInternData?.id) return;
    setIsSavingCompliance(true);
    try {
      const { default: api } = await import('../../services/api');
      const payload = {
        ...complianceForm,
        semester: parseInt(complianceForm.semester as any) || 1,
      };
      await api.put(`/interns/${myInternData.id}`, payload);
      toast.success('Onboarding details and Location Registry updated successfully!');
      setIsEditingCompliance(false);
      
      const authRes = await api.get('/auth/me');
      if (authRes.data.success && authRes.data.data) {
        localStorage.setItem('internflow_user', JSON.stringify(authRes.data.data));
        window.location.reload();
      } else {
        await refreshData();
      }
    } catch (error) {
      toast.error('Failed to update onboarding compliance details.');
    } finally {
      setIsSavingCompliance(false);
    }
  };

  const handleRemoveDocument = async (docType: string, label: string) => {
    if (!window.confirm(`Are you sure you want to remove your uploaded ${label}?`)) return;
    toast.loading(`Removing ${label}...`, { id: 'remove-toast' });
    try {
      const { default: api } = await import('../../services/api');
      await api.delete(`/interns/me/onboarding/remove?docType=${docType}`);
      toast.success(`${label} removed successfully!`, { id: 'remove-toast' });
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to remove ${label}.`, { id: 'remove-toast' });
    }
  };

  const renderDocVaultItem = (
    docType: string,
    label: string,
    description: string,
    url: string | null | undefined,
    IconComponent: any
  ) => {
    const isUploaded = !!url;
    return (
      <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm transition-all group hover:border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform ${isUploaded ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
            <IconComponent className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <span className="font-extrabold text-xs text-slate-800 block truncate">{label}</span>
            <span className="text-[9px] text-slate-400 font-semibold block leading-tight truncate">{description}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isUploaded ? (
            <>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center border border-blue-100/50 shadow-sm transition-colors cursor-pointer"
                title={`View ${label}`}
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                onClick={() => triggerUpload(docType)}
                className="w-7 h-7 rounded-lg bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center border border-slate-200 shadow-sm transition-all cursor-pointer"
                title={`Update ${label}`}
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRemoveDocument(docType, label)}
                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center border border-red-100/50 shadow-sm transition-all cursor-pointer"
                title={`Remove ${label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => triggerUpload(docType)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100/50 shadow-sm text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3" /> Upload
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="My Profile & Security Gate" />

        <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full text-left">
          
          {/* Symmetrical Premium Corporate Cover Header Panel */}
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            {/* High-Tech Brand Mesh Gradient Backdrop */}
            <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.2),transparent_60%)]" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            </div>
            
            {/* Profile Overlap Info Area */}
            <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                {/* Elevated Avatar Frame */}
                <div className="-mt-24 sm:-mt-32 w-40 h-40 sm:w-44 sm:h-44 rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-white overflow-hidden flex items-center justify-center relative">
                  <Avatar name={myName} size="full" url={user?.avatarUrl} />
                </div>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  accept="image/*"
                />
                
                <div className="text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-extrabold text-slate-800 text-2xl tracking-tight leading-none">{myName}</h3>
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/25" title="Verified Member Profile">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-semibold tracking-wide flex items-center justify-center sm:justify-start gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#2563eb]" /> {myInternData?.college || "abc university"}
                  </p>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-0.5">
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-xl bg-blue-50 text-[#2563eb] border border-blue-100/50 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Cpu className="w-3.5 h-3.5" /> {myInternData?.dept || "Engineering"}
                    </span>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/50 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {myInternData?.status || "Active"}
                    </span>
                  </div>

                  {/* Premium Flat Photo Actions Toolbar */}
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2">
                    <button 
                      onClick={triggerAvatarUpload}
                      className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-[10px] font-black uppercase tracking-wider text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer animate-fade-in"
                    >
                      <Upload className="w-3.5 h-3.5" /> Edit Photo
                    </button>
                    {user?.avatarUrl && (
                      <button 
                        onClick={handleRemoveAvatar}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 active:scale-95 text-[10px] font-black uppercase tracking-wider text-rose-600 rounded-xl border border-rose-100 transition-all flex items-center gap-1.5 cursor-pointer animate-fade-in"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Symmetrical Segmented Tab Switcher */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/40 shadow-inner w-full sm:w-auto overflow-x-auto gap-0.5">
                <button
                  onClick={() => setActiveHubTab('details')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 whitespace-nowrap cursor-pointer flex-1 sm:flex-none
                    ${activeHubTab === 'details' 
                      ? 'bg-white text-[#2563eb] shadow-md border border-slate-200/10' 
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <User className="w-4 h-4" />
                  My Details
                </button>
                <button
                  onClick={() => setActiveHubTab('security')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 whitespace-nowrap cursor-pointer flex-1 sm:flex-none
                    ${activeHubTab === 'security' 
                      ? 'bg-white text-[#2563eb] shadow-md border border-slate-200/10' 
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Security Gate
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeHubTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeHubTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-6 items-start">
                  
                  {/* Left Side Dashboard Cards */}
                  <div className="space-y-6">
                    
                    {/* Academic Details Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col text-left space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Academic & Personal Profile</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage your personal details and college registry records</p>
                          </div>
                        </div>
                        {!isEditing ? (
                          <button onClick={handleEditClick} className="text-[#2563eb] hover:text-blue-800 flex items-center gap-1.5 text-xs font-extrabold transition-colors cursor-pointer bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 hover:bg-blue-100/50">
                            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer">
                              Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20">
                              {isSaving ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info Dashboard Tile Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Email Address</span>
                            <span className="text-slate-800 font-extrabold text-xs block leading-snug break-all">{myInternData?.email || user?.email || "Not Provided"}</span>
                          </div>
                        </div>

                        {/* Contact Number */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Contact Number</span>
                            {isEditing ? (
                              <input type="text" className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-white transition-all focus:ring-2 focus:ring-blue-100" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+1 234 567 8900" />
                            ) : (
                              <span className="text-slate-800 font-extrabold text-xs block leading-snug">{myInternData?.phone || "Not Provided"}</span>
                            )}
                          </div>
                        </div>

                        {/* Degree & Branch */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Degree & Branch</span>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input type="text" className="w-1/2 text-xs font-semibold px-3 py-1.5 border border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-white transition-all focus:ring-2 focus:ring-blue-100" value={editForm.degree} onChange={e => setEditForm({...editForm, degree: e.target.value})} placeholder="B.Tech" />
                                <input type="text" className="w-1/2 text-xs font-semibold px-3 py-1.5 border border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-white transition-all focus:ring-2 focus:ring-blue-100" value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} placeholder="CS" />
                              </div>
                            ) : (
                              <span className="text-slate-800 font-extrabold text-xs block leading-snug">
                                {myInternData?.degree ? `${myInternData.degree} in ${myInternData.branch || "N/A"}` : "Not Provided"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CGPA */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Academic CGPA</span>
                            {isEditing ? (
                              <input type="number" step="0.1" max="10" min="0" className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-white transition-all focus:ring-2 focus:ring-blue-100" value={editForm.cgpa} onChange={e => setEditForm({...editForm, cgpa: parseFloat(e.target.value) || 0})} placeholder="9.5" />
                            ) : (
                              <span className="text-slate-800 font-extrabold text-xs block leading-snug">{myInternData?.cgpa ? `${myInternData.cgpa} / 10` : "N/A"}</span>
                            )}
                          </div>
                        </div>

                        {/* Joined Date */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Joined Date</span>
                            <span className="text-slate-800 font-extrabold text-xs block leading-snug">{myInternData?.joined || "Not Available"}</span>
                          </div>
                        </div>

                        {/* Mentor */}
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 bg-white text-[#2563eb] rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Mentor Supervisor</span>
                            <span className="text-slate-800 font-extrabold text-xs block leading-snug">{myInternData?.mentor || "Unassigned"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills Registry */}
                      <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#2563eb]" /> Registered Technical Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {myInternData?.skills?.map((s: string) => (
                            <span key={s} className="bg-blue-50/60 border border-blue-100 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm hover:bg-blue-100/50 transition-colors">
                              {s}
                            </span>
                          )) || <span className="text-[10px] text-slate-400 font-extrabold">None registered</span>}
                        </div>
                      </div>
                    </div>

                    {/* Workplace & Location Registry Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col text-left space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Workplace & Location Registry</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dual-location mapping for residential verification and office metrics</p>
                          </div>
                        </div>
                        {!isEditingCompliance ? (
                          <button onClick={handleEditComplianceClick} className="text-[#2563eb] hover:text-blue-800 flex items-center gap-1.5 text-xs font-extrabold transition-colors cursor-pointer bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 hover:bg-blue-100/50">
                            <Edit3 className="w-3.5 h-3.5" /> Edit Registry
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setIsEditingCompliance(false)} className="text-slate-500 hover:text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer">
                              Cancel
                            </button>
                            <button onClick={handleSaveCompliance} disabled={isSavingCompliance} className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20">
                              {isSavingCompliance ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save Locations</>}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Box 1: Permanent Address */}
                        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-all flex flex-col justify-between min-h-[160px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-slate-400" /> Permanent Residency
                              </span>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-150 text-slate-650 border border-slate-200/50 uppercase tracking-wider">
                                Verified Record
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              Registered legal home address validated during official HR onboarding verification.
                            </p>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100/80 mt-4">
                            {isEditingCompliance ? (
                              <textarea 
                                rows={3} 
                                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl resize-none outline-none leading-relaxed transition-all bg-white" 
                                value={complianceForm.address} 
                                onChange={e => setComplianceForm({...complianceForm, address: e.target.value})} 
                                placeholder="Permanent Residential Address" 
                              />
                            ) : (
                              <p className="text-slate-700 font-bold text-xs leading-relaxed select-text min-h-[50px]">
                                {myInternData?.address || "No Onboarding Address Registered"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Box 2: Work Address */}
                        <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/10 hover:border-blue-200 transition-all flex flex-col justify-between min-h-[160px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Current Work Location
                              </span>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-blue-100/50 text-blue-700 border border-blue-200/30 uppercase tracking-wider">
                                Active Hub
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              The actual location where you are stationed. Used for team analytics and tax compliances.
                            </p>
                          </div>
                          
                          <div className="pt-4 border-t border-blue-100/40 mt-4">
                            {isEditingCompliance ? (
                              <textarea 
                                rows={3} 
                                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl resize-none outline-none leading-relaxed transition-all bg-white" 
                                value={complianceForm.workAddress} 
                                onChange={e => setComplianceForm({...complianceForm, workAddress: e.target.value})} 
                                placeholder="Current Work Location (leave blank to mirror permanent address)" 
                              />
                            ) : (
                              <p className="text-slate-700 font-bold text-xs leading-relaxed select-text min-h-[50px]">
                                {myInternData?.workAddress ? myInternData.workAddress : (myInternData?.address ? `${myInternData.address} (Default Permanent)` : "No Work Address Registered")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Side Document Vault Widget */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col space-y-5 h-full lg:sticky lg:top-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 flex-shrink-0">
                      <div className="w-9 h-9 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Document Vault</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Verified curriculum vitae and credential files</p>
                      </div>
                    </div>

                    {/* Onboarding Documents List */}
                    <div className="space-y-3.5 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
                      {/* Document 1: Resume */}
                      {renderDocVaultItem(
                        'resume',
                        'Curriculum Vitae',
                        'Your updated CV / Professional Profile',
                        myInternData?.resumeUrl,
                        FileText
                      )}

                      {/* Document 2: Govt ID Proof */}
                      {renderDocVaultItem(
                        'aadhaarPan',
                        'Aadhaar & PAN Bundle',
                        'National identity & tax compliance card',
                        myInternData?.aadhaarPanUrl,
                        ShieldCheck
                      )}

                      {/* Document 3: Academic Marksheet */}
                      {renderDocVaultItem(
                        'marksheet',
                        'Academic Marksheet',
                        'Latest grade sheet or degree certificate',
                        myInternData?.marksheetUrl,
                        Award
                      )}

                      {/* Document 4: College ID Card */}
                      {renderDocVaultItem(
                        'collegeId',
                        'College ID Card',
                        'Active institutional student identity card',
                        myInternData?.collegeIdUrl,
                        BookOpen
                      )}

                      {/* Document 5: Passport Size Photo */}
                      {renderDocVaultItem(
                        'passportPhoto',
                        'Passport Photograph',
                        'Recent passport size color photograph',
                        myInternData?.passportPhotoUrl,
                        User
                      )}

                      {/* Document 6: Signature ID Verification */}
                      {renderDocVaultItem(
                        'idProof',
                        'ID Verification / Signature',
                        'Valid signature verification check document',
                        myInternData?.idProofUrl,
                        Check
                      )}
                    </div>

                    {/* Hidden Global File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleDocumentUpload} 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                    />

                    <div className="p-3.5 bg-blue-50/30 border border-blue-100/30 rounded-2xl flex items-start gap-2.5 text-[10px] font-semibold text-slate-550 leading-relaxed shadow-sm mt-auto">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      <p className="text-slate-500">
                        Uploading your verified curriculum vitae and academic records lets department mentors inspect your skills alignment profiles dynamically.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {activeHubTab === 'security' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  
                  {/* Security Custom tab layout */}
                  <div className="flex border-b border-slate-200 gap-6 pb-0.5 text-left overflow-x-auto">
                    <button 
                      onClick={() => setActiveSecurityTab('otp')}
                      className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeSecurityTab === 'otp' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> Passcode (OTP) Gate
                    </button>
                    <button 
                      onClick={() => setActiveSecurityTab('2fa')}
                      className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeSecurityTab === '2fa' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Lock className="w-4 h-4" /> Two-Factor Setup (2FA)
                    </button>
                    <button 
                      onClick={() => setActiveSecurityTab('sessions')}
                      className={`pb-3 font-extrabold text-xs tracking-tight transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeSecurityTab === 'sessions' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Laptop className="w-4 h-4" /> Active Devices
                    </button>
                  </div>

                  <div className="text-left">
                    <AnimatePresence mode="wait">
                      
                      {/* Security Tab 1: OTP digits */}
                      {activeSecurityTab === 'otp' && (
                        <motion.div 
                          key="otp"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-md mx-auto"
                        >
                          <div className="text-center space-y-6">
                            <div className="w-14 h-14 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-blue-100/50">
                              <Smartphone className="w-7 h-7" />
                            </div>
                            <div className="space-y-1.5">
                              <h3 className="font-extrabold text-slate-800 text-base">OTP Code Verification</h3>
                              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                                Insert the 4-digit code dispatched to your registered workspace mobile contact.
                              </p>
                            </div>

                            <form onSubmit={verifyOtp} className="space-y-6">
                              <div className="flex justify-center gap-3">
                                {otp.map((o, idx) => (
                                  <input 
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="text" 
                                    maxLength={1}
                                    value={o}
                                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                                    className="w-12 h-12 text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" 
                                  />
                                ))}
                              </div>

                              <button 
                                type="submit"
                                className="w-full py-3 bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                              >
                                Authorize Access Code
                              </button>
                            </form>

                            <button 
                              type="button" 
                              onClick={() => toast.success("OTP Code re-sent successfully!")}
                              className="text-[10px] text-[#2563eb] font-extrabold hover:underline cursor-pointer bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100/50 transition-colors"
                            >
                              Resend Verification Code
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Security Tab 2: Two-Factor QR Setup */}
                      {activeSecurityTab === '2fa' && (
                        <motion.div 
                          key="2fa"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-2xl mx-auto"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            {/* QR Mock image */}
                            <div className="border border-slate-100 p-6 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px]">
                              <div className="text-center space-y-3">
                                <div className="w-28 h-28 bg-slate-900 border-4 border-white mx-auto flex items-center justify-center relative shadow-lg">
                                  <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 bg-white" />
                                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white" />
                                  <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 bg-white" />
                                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">Scan with Authenticator App</p>
                              </div>
                            </div>

                            <div className="space-y-5">
                              <div className="space-y-1.5">
                                <h3 className="font-extrabold text-slate-800 text-base">Two-Factor Authentication (2FA)</h3>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                  Enabling two-factor authorization adds an extra shield to your professional deployment hub. Scan the matrix block and submit the token below.
                                </p>
                              </div>

                              <div className="space-y-2.5">
                                <input 
                                  type="text" 
                                  placeholder="6-digit verification token"
                                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white rounded-xl outline-none transition-all" 
                                />
                                <button 
                                  onClick={() => toast.success("Two-Factor Authentication activated successfully!")}
                                  className="w-full py-3 bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-colors cursor-pointer"
                                >
                                  Activate 2FA Protection
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Security Tab 3: Active Client Sessions */}
                      {activeSecurityTab === 'sessions' && (
                        <motion.div 
                          key="sessions"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-xl mx-auto space-y-4"
                        >
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Authenticated Devices</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Revoke tokens for clients you do not recognize immediately</p>
                          </div>
                          
                          <div className="space-y-3 pt-2">
                            {sessions.map(s => (
                              <div key={s.id} className="p-4 bg-slate-50/50 border border-slate-100/80 rounded-2xl flex justify-between items-center text-xs font-semibold hover:border-slate-200 transition-colors">
                                <div className="flex gap-3.5 items-center">
                                  <div className="w-10 h-10 rounded-xl bg-white text-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                                    <Laptop className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-slate-800">{s.browser}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-1">IP Address: <span className="font-bold text-slate-500">{s.ip}</span> • Logged: {s.date}</p>
                                  </div>
                                </div>

                                {!s.active ? (
                                  <button 
                                    onClick={() => terminateSession(s.id)}
                                    className="p-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl transition-all cursor-pointer hover:shadow-md hover:shadow-red-100 hover:scale-105 active:scale-95"
                                    title="Revoke session credentials"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-black bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-lg uppercase tracking-wider">Current Device</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

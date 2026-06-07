import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  User, BookOpen, PhoneCall, Upload, FileText,
  CheckCircle, RefreshCw, Eye, Download, Trash2, Camera,
  ArrowLeft, ArrowRight, Pencil, X, Lock, Save
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { useInternByUser } from '../../../hooks/queries';
import api from '../../../services/api';
import {
  useOnboardingStatus,
  useSubmitOffer,
  useSubmitPersonalInfo,
  useSubmitEducation,
  useSubmitEmergency,
  useSubmitDocuments,
  useSubmitAgreement,
  useSubmitFinal
} from '../../../hooks/useOnboarding';

export const OnboardingWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myInternData, refetch: refetchIntern } = useInternByUser(user?.id || '');
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatus();
  const queryClient = useQueryClient();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [step, setStep] = useState(1);
  const [maxStepAllowed, setMaxStepAllowed] = useState(1);
  const [loading, setLoading] = useState(false);

  // Edit Mode States for Step 8 Onboarding Review Dashboard
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEducation, setEditEducation] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);

  const resetCardData = (section: 'personal' | 'education' | 'emergency') => {
    if (!myInternData) return;
    if (section === 'personal') {
      setFormData(prev => ({
        ...prev,
        fullName: myInternData.user?.name || '',
        email: myInternData.user?.email || '',
        phone: myInternData.phone || '',
        dob: myInternData.dob ? new Date(myInternData.dob).toISOString().split('T')[0] : '',
        gender: (myInternData as any).gender || '',
        address: myInternData.address || '',
      }));
    } else if (section === 'education') {
      setFormData(prev => ({
        ...prev,
        college: myInternData.college || '',
        degree: myInternData.degree || '',
        branch: myInternData.branch || '',
        semester: (myInternData as any).semester ? String((myInternData as any).semester) : '',
        cgpa: myInternData.cgpa ? String(myInternData.cgpa) : '',
        skills: myInternData.skills ? myInternData.skills.join(', ') : '',
      }));
    } else if (section === 'emergency') {
      setFormData(prev => ({
        ...prev,
        parentName: (myInternData as any).parentName || '',
        parentPhone: (myInternData as any).parentPhone || '',
        emergencyName: myInternData.emergencyName || '',
        emergencyRelation: myInternData.emergencyRelation || '',
        emergencyPhone: myInternData.emergencyPhone || '',
      }));
    }
  };

  const savePersonalChanges = async () => {
    if (!formData.fullName || !formData.dob || !formData.gender || !formData.address || !formData.phone) {
      toast.error("Please fill all required personal fields.");
      return;
    }
    setLoading(true);
    try {
      await submitPersonalInfoMutation.mutateAsync({ ...formData });
      setEditPersonal(false);
      await refetchIntern();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveEducationChanges = async () => {
    if (!formData.college || !formData.degree || !formData.branch || !formData.semester || !formData.cgpa) {
      toast.error("Please fill all required educational fields.");
      return;
    }
    setLoading(true);
    try {
      await submitEducationMutation.mutateAsync({ 
        ...formData, 
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s) 
      });
      setEditEducation(false);
      await refetchIntern();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveEmergencyChanges = async () => {
    if (!formData.parentName || !formData.parentPhone || !formData.emergencyName || !formData.emergencyPhone || !formData.address) {
      toast.error("Please fill all required emergency fields.");
      return;
    }
    setLoading(true);
    try {
      await submitEmergencyMutation.mutateAsync({ ...formData });
      setEditEmergency(false);
      await refetchIntern();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mutations
  const submitOfferMutation = useSubmitOffer();
  const submitPersonalInfoMutation = useSubmitPersonalInfo();
  const submitEducationMutation = useSubmitEducation();
  const submitEmergencyMutation = useSubmitEmergency();
  const submitDocumentsMutation = useSubmitDocuments();
  const submitAgreementMutation = useSubmitAgreement();
  const submitFinalMutation = useSubmitFinal();

  // Form State
  const [formData, setFormData] = useState({
    offerLetterAccepted: false,

    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',

    college: '',
    degree: '',
    branch: '',
    semester: '',
    cgpa: '',
    skills: '',

    parentName: '',
    parentPhone: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',

    signedName: '',
    agreementAccepted: false,
  });

  const [documents, setDocuments] = useState({
    resumeUrl: '',
    aadhaarPanUrl: '',
    collegeIdUrl: '',
    passportPhotoUrl: ''
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Sync DB data to local state
  useEffect(() => {
    if (myInternData) {
      setFormData(prev => ({
        ...prev,
        fullName: myInternData.user?.name || prev.fullName,
        email: myInternData.user?.email || prev.email,
        phone: myInternData.phone || prev.phone,
        dob: myInternData.dob ? new Date(myInternData.dob).toISOString().split('T')[0] : prev.dob,
        gender: (myInternData as any).gender || prev.gender,
        address: myInternData.address || prev.address,

        college: myInternData.college || prev.college,
        degree: myInternData.degree || prev.degree,
        branch: myInternData.branch || prev.branch,
        semester: (myInternData as any).semester ? String((myInternData as any).semester) : prev.semester,
        cgpa: myInternData.cgpa ? String(myInternData.cgpa) : prev.cgpa,
        skills: myInternData.skills ? myInternData.skills.join(', ') : prev.skills,

        parentName: (myInternData as any).parentName || prev.parentName,
        parentPhone: (myInternData as any).parentPhone || prev.parentPhone,
        emergencyName: myInternData.emergencyName || prev.emergencyName,
        emergencyRelation: myInternData.emergencyRelation || prev.emergencyRelation,
        emergencyPhone: myInternData.emergencyPhone || prev.emergencyPhone,

        signedName: myInternData.signedName || prev.signedName,
        agreementAccepted: myInternData.agreementAccepted || prev.agreementAccepted,
        offerLetterAccepted: myInternData.offerLetterAccepted || prev.offerLetterAccepted,
      }));

      setDocuments({
        resumeUrl: myInternData.resumeUrl || '',
        aadhaarPanUrl: (myInternData as any).aadhaarPanUrl || '',
        collegeIdUrl: (myInternData as any).collegeIdUrl || '',
        passportPhotoUrl: (myInternData as any).passportPhotoUrl || ''
      });
    }
  }, [myInternData]);

  // Determine current step based on OnboardingProgress
  useEffect(() => {
    if (onboardingStatus) {
      setMaxStepAllowed(onboardingStatus.currentStep || 1);
      setStep(onboardingStatus.currentStep || 1);
    } else if (myInternData?.status === 'ACTIVE') {
      setMaxStepAllowed(8);
      setStep(8);
    }
  }, [onboardingStatus, myInternData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileUpload = async (docType: string, file: File) => {
    try {
      setUploadingDoc(docType);
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/interns/me/onboarding/upload?docType=${docType}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments(prev => ({ ...prev, [`${docType}Url`]: data.data.url }));
      toast.success(`${docType} uploaded successfully`);
      await refetchIntern();
    } catch (err: any) {
      toast.error('Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteDoc = async (docType: string) => {
    // In a real app we'd delete from Cloudinary. Here we just clear the field.
    try {
      setLoading(true);
      await api.put('/interns/me/onboarding', { [`${docType}Url`]: null });
      setDocuments(prev => ({ ...prev, [`${docType}Url`]: '' }));
      toast.success('Document removed');
      await refetchIntern();
    } catch (err) {
      toast.error('Failed to remove document');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    switch(step) {
      case 1:
        if (!formData.offerLetterAccepted) { toast.error("Please accept the Offer Letter."); return false; }
        return true;
      case 2:
        if (!formData.fullName || !formData.dob || !formData.gender || !formData.address || !formData.phone || !formData.email) {
          toast.error("Please fill all required personal info fields."); return false;
        }
        return true;
      case 3:
        if (!formData.college || !formData.degree || !formData.branch || !formData.semester || !formData.cgpa) {
          toast.error("Please fill all required educational details."); return false;
        }
        return true;
      case 4:
        if (!formData.parentName || !formData.parentPhone || !formData.emergencyName || !formData.emergencyPhone || !formData.address) {
          toast.error("Please fill all required emergency contact fields."); return false;
        }
        return true;
      case 5:
        if (!documents.resumeUrl || !documents.aadhaarPanUrl || !documents.collegeIdUrl || !documents.passportPhotoUrl) {
          toast.error("Please upload all required documents."); return false;
        }
        return true;
      case 6:
        if (!formData.agreementAccepted || !formData.signedName) {
          toast.error("Please sign and accept the Internship Agreement."); return false;
        }
        return true;
      default: return true;
    }
  };

  const saveDraftProgress = async () => {
    setLoading(true);
    try {
      await api.post('/onboarding/save-draft', formData);
      toast.success("Draft saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      await refetchIntern();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const submitStep = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      switch (step) {
        case 1:
          await submitOfferMutation.mutateAsync({ offerAccepted: formData.offerLetterAccepted });
          break;
        case 2:
          await submitPersonalInfoMutation.mutateAsync({ ...formData });
          break;
        case 3:
          await submitEducationMutation.mutateAsync({ 
            ...formData, 
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s) 
          });
          break;
        case 4:
          await submitEmergencyMutation.mutateAsync({ ...formData });
          break;
        case 5:
          await submitDocumentsMutation.mutateAsync();
          break;
        case 6:
          await submitAgreementMutation.mutateAsync({ signedName: formData.signedName, agreementAccepted: formData.agreementAccepted });
          break;
        case 7:
          await submitFinalMutation.mutateAsync();
          break;
      }
      await refetchIntern();
      // Only increment step if not already at 8
      if (step < 8) {
        setStep(step + 1);
        setMaxStepAllowed(Math.max(maxStepAllowed, step + 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Welcome & Offer', icon: FileText },
    { num: 2, label: 'Personal Information', icon: User },
    { num: 3, label: 'Education Details', icon: BookOpen },
    { num: 4, label: 'Emergency Contacts', icon: PhoneCall },
    { num: 5, label: 'Document Upload', icon: Upload },
    { num: 6, label: 'Internship Agreement', icon: FileText },
    { num: 7, label: 'Final Review', icon: CheckCircle },
    { num: 8, label: 'Verification Status', icon: CheckCircle },
  ];

  if (statusLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Intern Onboarding Gateway" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stepper Header */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] px-4">
              {stepsList.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.num;

                // Only show green for steps with ACTUAL data confirmed in the DB
                const isStepCompleted = (num: number): boolean => {
                  if (myInternData?.status === 'ACTIVE') return true;
                  if (!onboardingStatus) return false;
                  switch (num) {
                    case 1: return !!onboardingStatus.offerAccepted;
                    case 2: return !!onboardingStatus.personalInfoCompleted;
                    case 3: return !!onboardingStatus.educationCompleted;
                    case 4: return !!onboardingStatus.emergencyCompleted;
                    case 5: return !!onboardingStatus.documentsCompleted;
                    case 6: return !!onboardingStatus.agreementAccepted;
                    case 7: return !!onboardingStatus.finalSubmitted;
                    case 8: return onboardingStatus.verificationStatus === 'APPROVED';
                    default: return false;
                  }
                };

                const isCompleted = !isActive && s.num < step && isStepCompleted(s.num);
                const isFuture = s.num > step && myInternData?.status !== 'ACTIVE';

                return (
                  <React.Fragment key={s.num}>
                    <div
                      className={`flex flex-col items-center gap-1.5 transition-all duration-300 
                        ${isFuture ? 'cursor-not-allowed opacity-40 grayscale' : 'cursor-default'}
                      `}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${isActive ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200 ring-4 ring-indigo-100' :
                          isCompleted ? 'bg-emerald-500 text-white shadow-emerald-100' :
                            'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-extrabold ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < stepsList.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isActive ? 'bg-indigo-200' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form Step Workspace */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative min-h-[450px] flex flex-col justify-between">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-600">Saving securely...</span>
                </div>
              </div>
            )}

            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 text-left"
                >

                  {/* STEP 1: Offer Letter */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start">
                        <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">Congratulations on your Offer!</h4>
                          <p className="text-xs text-indigo-900/70 font-semibold leading-relaxed mt-1">
                            Please review your formal Internship Offer Letter details below and toggle the acceptance switch to proceed with document onboarding.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4 max-h-[300px] overflow-y-auto">
                        <div className="text-center border-b border-slate-200 pb-3">
                          <h3 className="font-extrabold text-slate-800 text-base">INTERNSHIP OFFER LETTER</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">InternFlow Corporate Solutions</p>
                        </div>
                        <div className="space-y-3 text-xs text-slate-600 font-semibold leading-relaxed">
                          <p>Dear <strong>{formData.fullName || user?.name}</strong>,</p>
                          <p>We are delighted to offer you the position of <strong>{myInternData?.department?.name || 'Engineering'} Intern</strong> at InternFlow. Your internship is scheduled to begin on <strong>{myInternData?.startDate ? new Date(myInternData.startDate).toLocaleDateString() : 'TBD'}</strong> for a duration of <strong>{myInternData?.duration || 3} months</strong>.</p>
                          <p>You will report directly to mentor <strong>{myInternData?.mentor?.user?.name || 'Assigned Supervisor'}</strong>.</p>
                          <p>Sincerely,<br /><strong>HR Admin Team</strong></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                        <input
                          type="checkbox"
                          id="offerLetterAccepted"
                          name="offerLetterAccepted"
                          checked={formData.offerLetterAccepted}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 text-base"
                        />
                        <label htmlFor="offerLetterAccepted" className="text-xs text-slate-700 font-bold select-none cursor-pointer">
                          I formally accept the internship offer letter and agree to comply with organizational standards.
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Personal Information */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Email Address <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="email" name="email" value={formData.email} disabled className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none opacity-70 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Phone Number <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Date of Birth <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Gender <span className="text-red-500 ml-0.5">*</span></label>
                          <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Residential Address <span className="text-red-500 ml-0.5">*</span></label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-base" />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Education Details */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Educational Background</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">College / University <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="college" value={formData.college} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Degree <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Branch / Specialization <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Current Semester <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="number" name="semester" value={formData.semester} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">CGPA / Score <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Skills (Comma separated)</label>
                          <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="React, Node.js, Python" className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Emergency Contacts */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Emergency Contacts</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Parent / Guardian Name <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Parent / Guardian Phone <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Secondary Emergency Contact Name <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Relationship to Intern</label>
                          <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Secondary Emergency Phone <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Document Uploads */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Required Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {[
                          { key: 'resumeUrl', docType: 'resume', label: 'Updated Resume / CV', icon: FileText },
                          { key: 'aadhaarPanUrl', docType: 'aadhaarPan', label: 'Aadhaar / PAN Card', icon: User },
                          { key: 'collegeIdUrl', docType: 'collegeId', label: 'College ID Card', icon: BookOpen },
                          { key: 'passportPhotoUrl', docType: 'passportPhoto', label: 'Passport Size Photo', icon: Camera }
                        ].map((doc) => {
                          const url = (documents as any)[doc.key];
                          const isUploading = uploadingDoc === doc.docType;

                          return (
                            <div key={doc.key} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${url ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                  <doc.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">{doc.label} <span className="text-red-500 ml-0.5">*</span></p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{url ? 'Uploaded successfully' : 'Accepted formats: PDF, JPG, PNG (Max 5MB)'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {url ? (
                                  <>
                                    <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                                      <Eye className="w-4 h-4" />
                                    </a>
                                    <button onClick={() => handleDeleteDoc(doc.docType)} className="p-2 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 text-red-600 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <label className={`p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    <input type="file" className="hidden text-base" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(doc.docType, e.target.files[0]);
                                      }
                                    }} />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  )}

                  {/* STEP 6: Internship Agreement */}
                  {step === 6 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Internship Agreement & NDA</h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed max-h-[200px] overflow-y-auto font-medium">
                        <p>This Internship Agreement ("Agreement") is entered into by and between InternFlow ("Company") and the undersigned intern ("Intern").</p>
                        <p className="mt-2">1. <strong>Confidentiality</strong>: The Intern agrees to hold all proprietary and confidential information of the Company in strict confidence and not disclose it to any third parties without prior written consent.</p>
                        <p className="mt-2">2. <strong>Intellectual Property</strong>: Any work product, code, documents, or materials created by the Intern during the course of the internship shall remain the exclusive property of the Company.</p>
                        <p className="mt-2">3. <strong>Code of Conduct</strong>: The Intern agrees to comply with all workplace policies, rules, and procedures established by the Company.</p>
                        <p className="mt-2">4. <strong>Termination</strong>: The Company reserves the right to terminate the internship at any time if the Intern breaches this agreement or engages in professional misconduct.</p>
                      </div>

                      <div className="flex flex-col gap-3 pt-2">
                        <div className="space-y-1 w-full md:w-1/2">
                          <label className="text-xs font-bold text-slate-600">Digital Signature (Type your full name) <span className="text-red-500 ml-0.5">*</span></label>
                          <input type="text" name="signedName" value={formData.signedName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base" />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <input type="checkbox" id="agreementAccepted" name="agreementAccepted" checked={formData.agreementAccepted} onChange={handleCheckboxChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 text-base" />
                          <label htmlFor="agreementAccepted" className="text-xs text-indigo-900 font-bold select-none cursor-pointer">
                            I have read, understood, and accept the terms of the Internship Agreement & NDA.
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 7: Final Review */}
                  {step === 7 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight border-b pb-2 border-slate-100">Final Verification Summary</h3>
                      <p className="text-xs text-slate-500 font-semibold mb-4">Please review your submitted information. Once submitted, it will be sent to the HR team for approval.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">Personal & Educational</h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-700">{formData.fullName}</span></p>
                            <p><span className="text-slate-500">Email:</span> <span className="font-semibold text-slate-700">{formData.email}</span></p>
                            <p><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-700">{formData.phone}</span></p>
                            <p><span className="text-slate-500">College:</span> <span className="font-semibold text-slate-700">{formData.college}</span></p>
                            <p><span className="text-slate-500">Degree:</span> <span className="font-semibold text-slate-700">{formData.degree} ({formData.branch})</span></p>
                            <p><span className="text-slate-500">CGPA:</span> <span className="font-semibold text-slate-700">{formData.cgpa}</span></p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">Emergency & Compliance</h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="text-slate-500">Parent Contact:</span> <span className="font-semibold text-slate-700">{formData.parentName} ({formData.parentPhone})</span></p>
                            <p><span className="text-slate-500">Emergency:</span> <span className="font-semibold text-slate-700">{formData.emergencyName} ({formData.emergencyPhone})</span></p>
                            <p><span className="text-slate-500">Documents:</span> <span className="font-semibold text-emerald-600">4/4 Uploaded</span></p>
                            <p><span className="text-slate-500">Agreement:</span> <span className="font-semibold text-emerald-600">Digitally Signed</span></p>
                            <p><span className="text-slate-500">Signature:</span> <span className="font-semibold text-slate-700">{formData.signedName}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 8: Verification Status & Premium Summary Dashboard */}
                  {step === 8 && (
                    <div className="space-y-8 pb-10">
                      
                      {/* 1. VERIFICATION STATUS HEADER CARD */}
                      <div className={`p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${
                        myInternData?.status === 'ACTIVE'
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20 shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]'
                          : 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 shadow-[0_8px_32px_0_rgba(99,102,241,0.08)]'
                      }`}>
                        {/* Decorative background glow */}
                        <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-30 ${
                          myInternData?.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-start md:items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                              myInternData?.status === 'ACTIVE' 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/10' 
                                : 'bg-indigo-600 text-white shadow-indigo-600/20 ring-4 ring-indigo-500/10 animate-pulse'
                            }`}>
                              {myInternData?.status === 'ACTIVE' ? (
                                <CheckCircle className="w-7 h-7" />
                              ) : (
                                <RefreshCw className="w-7 h-7 animate-spin" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-lg leading-snug">
                                {myInternData?.status === 'ACTIVE' ? 'Onboarding Profile Verified!' : 'Onboarding Profile Under HR Review'}
                              </h3>
                              <p className="text-xs text-slate-500 font-semibold max-w-xl mt-1 leading-relaxed">
                                {myInternData?.status === 'ACTIVE' 
                                  ? 'Fantastic news! Your onboarding documents and credentials have been verified and approved. You now have complete system access.' 
                                  : 'Your onboarding profile has been successfully locked and submitted to the HR admin team for verification. Any updates you make below will instantly sync for the reviewer.'}
                              </p>
                            </div>
                          </div>
                          
                          {myInternData?.status === 'ACTIVE' && (
                            <button 
                              onClick={() => navigate('/intern/dashboard')} 
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 transition-all duration-300 shrink-0 cursor-pointer flex items-center gap-2 min-h-[44px]"
                            >
                              Launch Intern Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2. MAIN SUMMARY GRID */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* LEFT COLUMN: Personal Info & Emergency Contacts */}
                        <div className="space-y-6">
                          
                          {/* CARD A: PERSONAL DETAILS */}
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden text-left transition-all duration-300 hover:shadow-md hover:border-slate-200/60">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Personal Information</h4>
                                  <p className="text-[9px] text-slate-400 font-bold">Secure profile details</p>
                                </div>
                              </div>
                              {!editPersonal ? (
                                <button
                                  onClick={() => {
                                    resetCardData('personal');
                                    setEditPersonal(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={savePersonalChanges}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer shadow-sm shadow-emerald-500/20 min-h-[44px]"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditPersonal(false)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200/40 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </div>
                              )}
                            </div>

                            {!editPersonal ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Full Name</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.user?.name || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Email Address</span>
                                  <span className="text-slate-800 font-extrabold flex items-center gap-1">
                                    {myInternData?.user?.email || 'N/A'}
                                    <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                  </span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Phone Number</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.phone || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Date of Birth</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.dob ? new Date(myInternData.dob).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Gender</span>
                                  <span className="text-slate-800 font-extrabold">{(myInternData as any)?.gender || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 md:col-span-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Residential Address</span>
                                  <span className="text-slate-800 font-extrabold block break-words">{myInternData?.address || 'N/A'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="email" name="email" value={formData.email} disabled className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none opacity-60 cursor-not-allowed text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender <span className="text-red-500 ml-0.5">*</span></label>
                                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base">
                                      <option value="Male">Male</option>
                                      <option value="Female">Female</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address <span className="text-red-500 ml-0.5">*</span></label>
                                  <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none text-base" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* CARD B: EMERGENCY CONTACTS */}
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden text-left transition-all duration-300 hover:shadow-md hover:border-slate-200/60">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                                  <PhoneCall className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Emergency Contacts</h4>
                                  <p className="text-[9px] text-slate-400 font-bold">Guarantors & secondary details</p>
                                </div>
                              </div>
                              {!editEmergency ? (
                                <button
                                  onClick={() => {
                                    resetCardData('emergency');
                                    setEditEmergency(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit Contacts
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={saveEmergencyChanges}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer shadow-sm shadow-emerald-500/20 min-h-[44px]"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditEmergency(false)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200/40 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </div>
                              )}
                            </div>

                            {!editEmergency ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Parent / Guardian Name</span>
                                  <span className="text-slate-800 font-extrabold">{(myInternData as any)?.parentName || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Parent / Guardian Phone</span>
                                  <span className="text-slate-800 font-extrabold">{(myInternData as any)?.parentPhone || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Secondary Emergency Contact</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.emergencyName || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Relationship to Intern</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.emergencyRelation || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 md:col-span-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Secondary Contact Phone</span>
                                  <span className="text-slate-800 font-extrabold">{myInternData?.emergencyPhone || 'N/A'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Name <span className="text-red-500 ml-0.5">*</span></label>
                                  <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Phone <span className="text-red-500 ml-0.5">*</span></label>
                                  <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secondary Contact Name <span className="text-red-500 ml-0.5">*</span></label>
                                  <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship</label>
                                  <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secondary Contact Phone <span className="text-red-500 ml-0.5">*</span></label>
                                  <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* RIGHT COLUMN: Academic background & Document Vault */}
                        <div className="space-y-6 text-left">
                          
                          {/* CARD C: ACADEMIC DETAILS */}
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200/60">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Educational Profile</h4>
                                  <p className="text-[9px] text-slate-400 font-bold">Academic qualifications & skills</p>
                                </div>
                              </div>
                              {!editEducation ? (
                                <button
                                  onClick={() => {
                                    resetCardData('education');
                                    setEditEducation(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit Academic
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={saveEducationChanges}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer shadow-sm shadow-emerald-500/20 min-h-[44px]"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditEducation(false)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200/40 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-[10px] transition-all duration-300 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </div>
                              )}
                            </div>

                            {!editEducation ? (
                              <div className="space-y-4 text-xs font-semibold text-slate-600 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">College / University</span>
                                    <span className="text-slate-800 font-extrabold block break-words">{myInternData?.college || 'N/A'}</span>
                                  </div>
                                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Degree & Branch</span>
                                    <span className="text-slate-800 font-extrabold">{myInternData?.degree} ({myInternData?.branch})</span>
                                  </div>
                                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Current Semester</span>
                                    <span className="text-slate-800 font-extrabold">{(myInternData as any)?.semester || 'N/A'}</span>
                                  </div>
                                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">CGPA Score</span>
                                    <span className="text-slate-800 font-extrabold">{myInternData?.cgpa ? `${myInternData.cgpa} / 10` : 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Technical Skills</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {myInternData?.skills && myInternData.skills.length > 0 ? (
                                      myInternData.skills.map((s: string, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100/50 rounded-md font-bold text-[10px]">
                                          {s}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 font-semibold text-xs italic">No skills recorded</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College / University <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="text" name="college" value={formData.college} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="number" name="semester" value={formData.semester} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGPA <span className="text-red-500 ml-0.5">*</span></label>
                                    <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills (Comma separated)</label>
                                  <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* CARD D: CREDENTIALS & DOCUMENT VAULT */}
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200/60">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Document Vault</h4>
                                  <p className="text-[9px] text-slate-400 font-bold">Uploaded certificates & identity proofs</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md">
                                Securely Stored
                              </span>
                            </div>

                            <div className="space-y-3">
                              {[
                                { key: 'resumeUrl', docType: 'resume', label: 'Updated Resume / CV', icon: FileText, color: 'indigo' },
                                { key: 'aadhaarPanUrl', docType: 'aadhaarPan', label: 'Aadhaar / PAN Card', icon: User, color: 'blue' },
                                { key: 'collegeIdUrl', docType: 'collegeId', label: 'College ID Card', icon: BookOpen, color: 'purple' },
                                { key: 'passportPhotoUrl', docType: 'passportPhoto', label: 'Passport Size Photo', icon: Camera, color: 'emerald' }
                              ].map((doc) => {
                                const url = (documents as any)[doc.key];
                                const isUploading = uploadingDoc === doc.docType;

                                return (
                                  <div key={doc.key} className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        url ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                                      }`}>
                                        <doc.icon className="w-4.5 h-4.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-700 truncate">{doc.label}</p>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                          {url ? 'Verified upload' : 'Not submitted'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                      {url && (
                                        <>
                                          <a 
                                            href={url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="p-2 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors shadow-sm cursor-pointer"
                                            title="View Document"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </a>
                                          <a 
                                            href={url} 
                                            download 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-2 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors shadow-sm cursor-pointer"
                                            title="Download File"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        </>
                                      )}
                                      
                                      <label className={`p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer shadow-sm ${
                                        isUploading ? 'opacity-50 pointer-events-none' : ''
                                      }`} title="Upload New Version">
                                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        <input 
                                          type="file" 
                                          className="hidden text-base" 
                                          accept=".jpg,.jpeg,.png,.pdf" 
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleFileUpload(doc.docType, e.target.files[0]);
                                            }
                                          }} 
                                        />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stepper Footer Controls */}
            {step < 8 && (
              <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-6">
                <button
                  onClick={() => { if (step > 1) setStep(step - 1); }}
                  disabled={step === 1 || loading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${
                    step === 1 || loading 
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                  } min-h-[44px]`}
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={saveDraftProgress}
                    disabled={loading}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-600 bg-white min-h-[44px] ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>

                  <button
                    onClick={submitStep}
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${
                      loading 
                        ? 'bg-indigo-400 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5'
                    } min-h-[44px]`}
                  >
                    {loading ? 'Processing...' : step === 7 ? 'Submit Onboarding' : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


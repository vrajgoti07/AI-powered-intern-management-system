import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, UserX, FileText, Check, X, Eye,
  ExternalLink, Calendar, Search, ShieldCheck,
  CreditCard, BookOpen, Camera, User
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useInterns } from '../../hooks/queries';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const OnboardingVerification: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();
  const { data: internsData, isLoading } = useInterns();
  const candidates = Array.isArray(internsData) ? internsData : [];

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleAction = async (id: string, newStatus: 'ACTIVE' | 'TERMINATED') => {
    try {
      await api.put(`/interns/${id}`, { status: newStatus });
      toast.success(`Candidate onboarding record ${newStatus === 'ACTIVE' ? 'APPROVED' : 'REJECTED'} successfully!`);
      setSelectedCandidateId(null);
      queryClient.invalidateQueries({ queryKey: ['interns'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update candidate status');
    }
  };

  const relevantCandidates = candidates.filter(c => c.status === 'ONBOARDING' || c.status === 'ACTIVE');

  const filteredCandidates = relevantCandidates.filter(c =>
    c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.college?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingSubmissions = filteredCandidates.filter(c => c.status === 'ONBOARDING');
  const approvedSubmissions = filteredCandidates.filter(c => c.status === 'ACTIVE');

  // Auto-select first if none selected
  const selectedCandidate = selectedCandidateId
    ? candidates.find(c => c.id === selectedCandidateId)
    : (pendingSubmissions.length > 0 ? pendingSubmissions[0] : (approvedSubmissions.length > 0 ? approvedSubmissions[0] : null));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="HR Onboarding Review Portal" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

            {/* Left Section: Candidates List */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col space-y-4 h-full max-h-[calc(100vh-120px)] overflow-hidden">
              {/* Search */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {isLoading ? (
                  <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading submissions...
                  </div>
                ) : (
                  <>
                    {/* Pending Section */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-500" /> Pending ({pendingSubmissions.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {pendingSubmissions.length > 0 ? (
                          pendingSubmissions.map(c => (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCandidateId(c.id)}
                              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 ${selectedCandidate?.id === c.id
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                                }`}
                            >
                              <h4 className="font-extrabold text-slate-800 text-xs">{c.user?.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">{c.college} • {c.department?.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-1">Submitted: {new Date(c.createdAt).toISOString().split('T')[0]}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[10px] font-semibold text-slate-400 border border-dashed border-slate-100 rounded-xl">
                            No pending submissions
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approved Section */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-500" /> Approved ({approvedSubmissions.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {approvedSubmissions.length > 0 ? (
                          approvedSubmissions.map(c => (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCandidateId(c.id)}
                              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 ${selectedCandidate?.id === c.id
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <h4 className="font-extrabold text-slate-800 text-xs">{c.user?.name}</h4>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">{c.college} • {c.department?.name}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[10px] font-semibold text-slate-400 border border-dashed border-slate-100 rounded-xl">
                            No approved submissions
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Section: Candidate details review */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCandidate ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">

                  {/* Summary Card Header */}
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-extrabold text-slate-800 text-base">{selectedCandidate.user?.name}</h2>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">{selectedCandidate.user?.email} • {selectedCandidate.college}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                        {selectedCandidate.department?.name} Dept
                      </span>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                        selectedCandidate.status === 'ACTIVE' 
                          ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                          : 'bg-amber-50 border border-amber-100 text-amber-600'
                      }`}>
                        {selectedCandidate.status === 'ACTIVE' ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />} 
                        {selectedCandidate.status === 'ACTIVE' ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  {/* Onboarding Form Details Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-xs">Submitted Onboarding Profile Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] font-semibold text-slate-600">
                      {/* Personal Column */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100/70 text-left">
                        <h4 className="font-extrabold text-indigo-600 mb-2 border-b border-slate-50 pb-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> Personal Info
                        </h4>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">Gender:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.gender || 'N/A'}</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">DOB:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.dob ? new Date(selectedCandidate.dob).toLocaleDateString() : 'N/A'}</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">Phone:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.phone || 'N/A'}</span></p>
                        <p className="flex flex-col mt-1"><span className="text-slate-400 font-bold mb-0.5">Address:</span> <span className="text-slate-800 font-extrabold leading-normal break-all break-words">{selectedCandidate.address || 'N/A'}</span></p>
                      </div>

                      {/* Academic Column */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100/70 text-left">
                        <h4 className="font-extrabold text-indigo-600 mb-2 border-b border-slate-50 pb-1 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Academic Info
                        </h4>
                        <p className="flex flex-col"><span className="text-slate-400 font-bold mb-0.5">College:</span> <span className="text-slate-800 font-extrabold break-all break-words" title={selectedCandidate.college}>{selectedCandidate.college || 'N/A'}</span></p>
                        <p className="flex flex-col"><span className="text-slate-400 font-bold mb-0.5">Degree & Branch:</span> <span className="text-slate-800 font-extrabold leading-tight break-all break-words">{selectedCandidate.degree || 'N/A'} in {selectedCandidate.branch || 'N/A'}</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">Semester:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.semester || 'N/A'}</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">CGPA:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.cgpa ? `${selectedCandidate.cgpa}/10` : 'N/A'}</span></p>
                      </div>

                      {/* Emergency Contacts Column */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100/70 text-left">
                        <h4 className="font-extrabold text-indigo-600 mb-2 border-b border-slate-50 pb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Emergency Contacts
                        </h4>
                        <p className="flex flex-col"><span className="text-slate-400 font-bold mb-0.5">Parent/Guardian:</span> <span className="text-slate-800 font-extrabold break-all break-words">{selectedCandidate.parentName || 'N/A'}</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">Parent Phone:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.parentPhone || 'N/A'}</span></p>
                        <p className="flex flex-col mt-1"><span className="text-slate-400 font-bold mb-0.5">Secondary Contact:</span> <span className="text-slate-800 font-extrabold break-all break-words">{selectedCandidate.emergencyName || 'N/A'} ({selectedCandidate.emergencyRelation || 'N/A'})</span></p>
                        <p className="flex justify-between gap-2"><span className="text-slate-400 font-bold shrink-0">Secondary Phone:</span> <span className="text-slate-800 font-extrabold text-right break-all break-words">{selectedCandidate.emergencyPhone || 'N/A'}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Document Grid */}
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-xs">Submitted Credentials & Contracts</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                      {/* Document 1: Resume */}
                      <div className={`border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 relative ${!selectedCandidate.resumeUrl ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <FileText className="w-6 h-6 text-slate-400" />
                          {selectedCandidate.resumeUrl ? (
                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                              <Eye className="w-4 h-4 text-indigo-500" />
                            </a>
                          ) : (
                            <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-not-allowed">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">Updated Resume / CV</p>
                          {selectedCandidate.resumeUrl ? (
                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-semibold mt-0.5 hover:underline truncate block">View Resume</a>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not Uploaded</p>
                          )}
                        </div>
                      </div>

                      {/* Document 2: Aadhaar / PAN */}
                      <div className={`border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 relative ${!selectedCandidate.aadhaarPanUrl ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <User className="w-6 h-6 text-slate-400" />
                          {selectedCandidate.aadhaarPanUrl ? (
                            <a href={selectedCandidate.aadhaarPanUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                              <Eye className="w-4 h-4 text-indigo-500" />
                            </a>
                          ) : (
                            <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-not-allowed">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">Aadhaar / PAN Card</p>
                          {selectedCandidate.aadhaarPanUrl ? (
                            <a href={selectedCandidate.aadhaarPanUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-semibold mt-0.5 hover:underline truncate block">View ID Proof</a>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not Uploaded</p>
                          )}
                        </div>
                      </div>

                      {/* Document 3: College ID */}
                      <div className={`border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 relative ${!selectedCandidate.collegeIdUrl ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <BookOpen className="w-6 h-6 text-slate-400" />
                          {selectedCandidate.collegeIdUrl ? (
                            <a href={selectedCandidate.collegeIdUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                              <Eye className="w-4 h-4 text-indigo-500" />
                            </a>
                          ) : (
                            <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-not-allowed">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">College ID Card</p>
                          {selectedCandidate.collegeIdUrl ? (
                            <a href={selectedCandidate.collegeIdUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-semibold mt-0.5 hover:underline truncate block">View College ID</a>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not Uploaded</p>
                          )}
                        </div>
                      </div>

                      {/* Document 4: Passport Photo */}
                      <div className={`border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 relative ${!selectedCandidate.passportPhotoUrl ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <Camera className="w-6 h-6 text-slate-400" />
                          {selectedCandidate.passportPhotoUrl ? (
                            <a href={selectedCandidate.passportPhotoUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                              <Eye className="w-4 h-4 text-indigo-500" />
                            </a>
                          ) : (
                            <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-not-allowed">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">Passport Size Photo</p>
                          {selectedCandidate.passportPhotoUrl ? (
                            <a href={selectedCandidate.passportPhotoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-semibold mt-0.5 hover:underline truncate block">View Passport Photo</a>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not Uploaded</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Digital Signature Audit */}
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-1.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Signing Audit Validation</p>
                    <p className="text-xs text-slate-700 font-semibold">
                      Candidate has completed signing the standard IP Internship Agreement with validation signature key:
                      <strong className="text-indigo-600 ml-1">"{selectedCandidate.signedName || 'N/A'}"</strong>
                    </p>
                  </div>

                  {/* Notes & Actions */}
                  {selectedCandidate.status === 'ONBOARDING' ? (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Reviewer Verification Feedback Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Add review feedback comments..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                        ></textarea>
                      </div>

                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => handleAction(selectedCandidate.id, 'TERMINATED')}
                          className="flex items-center gap-1 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Reject Profile
                        </button>
                        <button
                          onClick={() => handleAction(selectedCandidate.id, 'ACTIVE')}
                          className="flex items-center gap-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Verify & Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                      <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 font-extrabold text-xs rounded-xl border border-emerald-100 flex items-center gap-1 shadow-sm">
                        <Check className="w-4 h-4" /> Document Verification Completed
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center min-h-[300px]">
                  Select an applicant from the left to begin verification audit.
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

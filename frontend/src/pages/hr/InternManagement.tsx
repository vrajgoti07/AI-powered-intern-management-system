import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Pagination } from '../../components/Pagination';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { InternForm } from '../../components/forms/InternForm';
import { Search, Filter, UserPlus, Eye, Check, AlertCircle, Trash2, ChevronDown, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const InternManagement: React.FC = () => {
  const { state, refreshData } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters calculation
  const filteredInterns = state.interns.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || i.dept.toLowerCase() === deptFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || i.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage);
  const paginatedInterns = filteredInterns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter]);

  const handleAddIntern = async (internData: any) => {
    try {
      const userRes = await api.post('/auth/register', {
        name: internData.name,
        email: internData.email,
        role: 'INTERN',
        password: 'InternPass123!'
      });

      const userId = userRes.data.data.user.id;

      await api.post('/interns', {
        userId,
        phone: internData.phone,
        dob: internData.dob ? new Date(internData.dob).toISOString() : undefined,
        college: internData.college,
        degree: internData.degree,
        branch: internData.branch,
        cgpa: internData.cgpa,
        departmentId: internData.departmentId,
        mentorId: internData.mentorId || undefined,
        skills: internData.skills,
        duration: '3 Months',
        startDate: internData.startDate ? new Date(internData.startDate).toISOString() : new Date().toISOString()
      });

      toast.success("New intern registered successfully!");
      setShowAddModal(false);
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to register intern";
      toast.error(errMsg);
    }
  };

  const handleStatusChange = async (id: string, status: 'Active' | 'Completed' | 'Pending' | 'Onboarding') => {
    try {
      await api.put(`/interns/${id}`, { status: status.toUpperCase() });
      toast.success(`Intern status updated to ${status}`);
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to update intern status";
      toast.error(errMsg);
    }
  };

  const handleDeleteIntern = async (intern: any) => {
    if (window.confirm(`Are you sure you want to completely delete intern ${intern.name}? This action cannot be undone and will delete their user account.`)) {
      try {
        await api.delete(`/interns/${intern.id}`);
        toast.success(`Intern ${intern.name} deleted successfully!`);
        await refreshData();
      } catch (error: any) {
        console.error(error);
        const errMsg = error.response?.data?.message || "Failed to delete intern";
        toast.error(errMsg);
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Intern Management Portal" />

        {/* Action controls */}
        <div className="p-6 pb-0 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by intern name, university..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm text-base"
              />
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => { setIsDeptOpen(!isDeptOpen); setIsStatusOpen(false); }}
                  className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold text-slate-600"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {deptFilter === 'All' ? 'All Departments' : deptFilter}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDeptOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDeptOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                      {['All', 'Engineering', 'Design', 'Marketing', 'HR', 'Finance'].map(dept => (
                        <button
                          key={dept}
                          onClick={() => { setDeptFilter(dept); setIsDeptOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer ${deptFilter === dept ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                        >
                          {dept === 'All' ? 'All Departments' : dept}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => { setIsStatusOpen(!isStatusOpen); setIsDeptOpen(false); }}
                  className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold text-slate-600"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  {statusFilter === 'All' ? 'All Statuses' : statusFilter === 'Pending' ? 'Pending Review' : statusFilter}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { value: 'All', label: 'All Statuses' },
                        { value: 'Active', label: 'Active' },
                        { value: 'Onboarding', label: 'Onboarding' },
                        { value: 'Pending', label: 'Pending Review' },
                        { value: 'Completed', label: 'Completed' }
                      ].map(status => (
                        <button
                          key={status.value}
                          onClick={() => { setStatusFilter(status.value); setIsStatusOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer ${statusFilter === status.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer min-h-[44px]"
              >
                <UserPlus className="w-4 h-4" /> Add Intern
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="overflow-x-auto flex-1">
              {filteredInterns.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      <th className="px-6 py-4 font-bold">Intern</th>
                      <th className="px-4 py-4 font-bold">Department</th>
                      <th className="px-4 py-4 font-bold">Assigned Mentor</th>
                      <th className="px-4 py-4 font-bold">Joined</th>
                      <th className="px-4 py-4 font-bold">Grade</th>
                      <th className="px-4 py-4 font-bold">Attendance</th>
                      <th className="px-4 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedInterns.map((intern) => (
                      <tr key={intern.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={intern.name} />
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs tracking-tight">{intern.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{intern.college}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge type="dept" value={intern.dept} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-semibold">{intern.mentor}</td>
                        <td className="px-4 py-3.5 text-slate-400 font-semibold">{intern.joined}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <div className="w-14 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${intern.score}%` }}></div>
                            </div>
                            {intern.score}%
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold ${intern.attendance >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                            {intern.attendance}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge type="status" value={intern.status} />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setSelectedIntern(intern)}
                              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {intern.status === 'Pending' && (
                              <button 
                                onClick={() => handleStatusChange(intern.id, 'Onboarding')}
                                className="p-1.5 hover:bg-emerald-50 rounded-xl text-emerald-600 cursor-pointer"
                                title="Approve application for onboarding"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {intern.status === 'Active' && (
                              <button 
                                onClick={() => handleStatusChange(intern.id, 'Completed')}
                                className="p-1.5 hover:bg-slate-100 rounded-xl text-indigo-600 cursor-pointer"
                                title="Mark Completed"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteIntern(intern)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-red-500 hover:text-red-600 transition-colors cursor-pointer ml-1"
                              title="Delete Intern"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-bold">No matching interns found</p>
                  <p className="text-[10px] text-slate-400 font-medium">Try adjusting search filters or parameters</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </main>

      {/* 1. Add Intern manually Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Intern Profile">
        <InternForm 
          departments={state.departments}
          mentors={state.mentors}
          onSubmit={handleAddIntern} 
          onCancel={() => setShowAddModal(false)} 
        />
      </Modal>

      {/* 2. Intern Detailed Inspection Modal */}
      <Modal isOpen={selectedIntern !== null} onClose={() => setSelectedIntern(null)} title="Intern Detailed Dossier">
        {selectedIntern && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <Avatar name={selectedIntern.name} size="md" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">{selectedIntern.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedIntern.college}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 py-2">
              <div><span className="text-slate-400 font-bold block mb-0.5">Email Address:</span>{selectedIntern.email}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Phone:</span>{selectedIntern.phone || "N/A"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Academic Degree:</span>{selectedIntern.degree || "B.Tech"} - {selectedIntern.branch || "CS"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">CGPA Rank:</span>{selectedIntern.cgpa || 8.5}/10</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Department Alloc:</span>{selectedIntern.dept}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Assigned Supervisor:</span>{selectedIntern.mentor}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Joined Calendar:</span>{selectedIntern.joined}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Task Evaluation:</span>{selectedIntern.score}% average grade</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Attendance Score:</span>{selectedIntern.attendance}% average clock</div>
              <div className="col-span-2 pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Onboarding Residential Address:</span>
                  <p className="text-slate-700 font-extrabold">{selectedIntern.address || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Work Location & Map:</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-extrabold mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {selectedIntern.workAddress || "Bengaluru Hub / Remote Dev"}
                  </div>
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-150 shadow-inner bg-slate-50 relative">
                    <iframe
                      title={`Workspace Location Map for ${selectedIntern.name}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedIntern.workAddress || selectedIntern.address || "Bengaluru Hub / Remote Dev")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold block">Skills Checklist:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedIntern.skills?.map((s: string) => (
                  <span key={s} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {s}
                  </span>
                )) || "None provided"}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedIntern(null)}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

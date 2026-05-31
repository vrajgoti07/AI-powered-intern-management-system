import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Search, Star, Plus, Link, Sparkles, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const MentorManagement: React.FC = () => {
  const { state, refreshData } = useApp();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  
  // Mentor form state
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mDept, setMDept] = useState('Engineering');

  // Assignment form state
  const [selectedInternId, setSelectedInternId] = useState<string>('');

  const filteredMentors = state.mentors.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mEmail) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const departmentId = state.departments.find(d => d.name.toLowerCase() === mDept.toLowerCase())?.id;
      if (!departmentId) {
        toast.error("Selected department not found in database.");
        return;
      }

      const userRes = await api.post('/auth/register', {
        name: mName,
        email: mEmail,
        role: 'MENTOR',
        password: 'MentorPass123!'
      });

      const userId = userRes.data.data.user.id;

      await api.post('/mentors', {
        userId,
        departmentId,
        expertise: ['General']
      });

      toast.success("New Mentor registered successfully!");
      setMName('');
      setMEmail('');
      setShowAddMentorModal(false);
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to register mentor";
      toast.error(errMsg);
    }
  };

  const handleAssignIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternId || !selectedMentor) {
      toast.error("Please select an intern.");
      return;
    }
    try {
      await api.put(`/interns/${selectedInternId}/assign-mentor`, {
        mentorId: selectedMentor.id
      });
      toast.success(`Intern assigned to ${selectedMentor.name}!`);
      setShowAssignModal(false);
      setSelectedInternId('');
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to assign intern";
      toast.error(errMsg);
    }
  };

  const handleDeleteMentor = async (mentorId: string) => {
    if (!window.confirm("Are you sure you want to delete this mentor?")) return;
    try {
      await api.delete(`/mentors/${mentorId}`);
      toast.success("Mentor deleted successfully!");
      await refreshData();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to delete mentor";
      toast.error(errMsg);
    }
  };

  const openAssignModal = (mentor: any) => {
    setSelectedMentor(mentor);
    setShowAssignModal(true);
  };

  // Get interns who don't have this mentor assigned yet or are pending mentor assignments
  const assignableInterns = state.interns.filter(i => i.mentor !== selectedMentor?.name);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Mentor Directory" />

        {/* Action Header */}
        <div className="p-6 pb-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by mentor name, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
            />
          </div>

          <button 
            onClick={() => setShowAddMentorModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Mentor
          </button>
        </div>

        {/* Grid Container */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredMentors.map((m) => (
              <div 
                key={m.id} 
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left space-y-4"
              >
                <div className="flex items-start justify-between">
                  <Avatar name={m.name} size="md" />
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {m.rating.toFixed(1)}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMentor(m.id); }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Mentor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{m.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{m.email}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <StatusBadge type="dept" value={m.dept} />
                  <span className="text-[10px] text-slate-400 font-bold">
                    {m.assignedInterns} Assigned
                  </span>
                </div>

                {(() => {
                  const assignedToMentor = state.interns.filter(i => i.mentor === m.name);
                  return assignedToMentor.length > 0 && (
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5">Assigned Interns:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedToMentor.map(intern => (
                          <span key={intern.id} className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {intern.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/hr/mentors/${m.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[10px] font-extrabold text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button 
                    onClick={() => openAssignModal(m)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-extrabold text-slate-600 transition-colors cursor-pointer"
                  >
                    <Link className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* 1. Register Mentor */}
      <Modal isOpen={showAddMentorModal} onClose={() => setShowAddMentorModal(false)} title="Register Corporate Mentor">
        <form onSubmit={handleAddMentor} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mentor Full Name *</label>
            <input 
              type="text" 
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              placeholder="e.g. Vikram Seth"
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Corporate Email Address *</label>
            <input 
              type="email" 
              value={mEmail}
              onChange={(e) => setMEmail(e.target.value)}
              placeholder="vikram@company.com"
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Department Mapping *</label>
            <select 
              value={mDept}
              onChange={(e) => setMDept(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowAddMentorModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Register Mentor
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Assign Intern */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Intern to ${selectedMentor?.name}`}>
        <form onSubmit={handleAssignIntern} className="space-y-4 text-left">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2 text-xs font-semibold text-indigo-800">
            <Sparkles className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <p>
              Assigning an intern updates their direct supervisor mapping. The intern will instantly receive their task cards and notifications.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Intern *</label>
            <select 
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Choose Intern --</option>
              {assignableInterns.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.dept})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Assign Intern
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

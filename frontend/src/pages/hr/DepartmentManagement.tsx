import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { 
  Building2, Users, UserCheck, Briefcase, Plus, Search, 
  ArrowRightLeft, Crown, ShieldAlert, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const DepartmentManagement: React.FC = () => {
  const { state, refreshData } = useApp();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignHeadModal, setShowAssignHeadModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Selected Department for actions
  const [selectedDept, setSelectedDept] = useState<any>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    color: 'indigo',
    headId: ''
  });

  const [assignHeadForm, setAssignHeadForm] = useState({
    headId: ''
  });

  const [transferForm, setTransferForm] = useState({
    memberType: 'intern', // 'intern' | 'mentor'
    memberId: '',
    targetDeptId: ''
  });

  const colorsMap: Record<string, { border: string; bg: string; icon: string; tag: string; btn: string }> = {
    indigo: { border: "border-indigo-100", bg: "bg-indigo-50/30", icon: "text-indigo-600 bg-indigo-50", tag: "bg-indigo-100 text-indigo-700", btn: "bg-indigo-600 hover:bg-indigo-700" },
    purple: { border: "border-purple-100", bg: "bg-purple-50/30", icon: "text-purple-600 bg-purple-50", tag: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700" },
    pink: { border: "border-pink-100", bg: "bg-pink-50/30", icon: "text-pink-600 bg-pink-50", tag: "bg-pink-100 text-pink-700", btn: "bg-pink-600 hover:bg-pink-700" },
    emerald: { border: "border-emerald-100", bg: "bg-emerald-50/30", icon: "text-emerald-600 bg-emerald-50", tag: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700" },
    amber: { border: "border-amber-100", bg: "bg-amber-50/30", icon: "text-amber-600 bg-amber-50", tag: "bg-amber-100 text-amber-700", btn: "bg-amber-600 hover:bg-amber-700" },
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.code) {
      toast.error('Please enter name and code');
      return;
    }
    try {
      const payload = {
        name: createForm.name,
        code: createForm.code.toUpperCase(),
        description: createForm.description,
        color: createForm.color,
        headId: createForm.headId || null
      };
      await api.post('/departments', payload);
      toast.success('Enterprise division created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', code: '', description: '', color: 'indigo', headId: '' });
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create department');
    }
  };

  const handleAssignHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !assignHeadForm.headId) {
      toast.error('Please select a manager');
      return;
    }
    try {
      await api.post(`/departments/${selectedDept.id}/assign-head`, {
        headId: assignHeadForm.headId
      });
      toast.success(`Executive Head assigned for ${selectedDept.name}!`);
      setShowAssignHeadModal(false);
      setSelectedDept(null);
      setAssignHeadForm({ headId: '' });
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign head');
    }
  };

  const handleTransferMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { memberType, memberId, targetDeptId } = transferForm;
    if (!memberId || !targetDeptId) {
      toast.error('Please specify target member and division');
      return;
    }
    try {
      const endpoint = memberType === 'intern' 
        ? `/departments/${targetDeptId}/move-intern` 
        : `/departments/${targetDeptId}/assign-mentor`;
      const body = memberType === 'intern' ? { internId: memberId } : { mentorId: memberId };
      
      await api.post(endpoint, body);
      toast.success(`Team member transferred successfully!`);
      setShowTransferModal(false);
      setTransferForm({ memberType: 'intern', memberId: '', targetDeptId: '' });
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete transfer');
    }
  };

  // Filter departments based on search
  const filteredDepts = state.departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Company Registry" />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="space-y-1 text-left">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Enterprise Divisions</h2>
              <p className="text-xs font-semibold text-slate-400">Manage structure, assign department heads, and track corporate telemetry</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search divisions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all duration-300"
                />
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-300 shadow-sm cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                Transfer Member
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-300 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Division
              </button>
            </div>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepts.map((d) => {
              const styles = colorsMap[d.color] || colorsMap.indigo;
              return (
                <div 
                  key={d.id} 
                  className={`bg-white rounded-3xl p-6 border ${styles.border} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left flex flex-col justify-between space-y-6 relative group`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.icon} shadow-inner`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase ${styles.tag}`}>
                        {d.code}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{d.name}</h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{d.description || 'No division description provided. Setup standard operating workflows.'}</p>
                    
                    {/* Head of Department details */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">
                          {d.head ? d.head.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Division Head</p>
                          <p className="text-xs font-black text-slate-700">{d.head || 'Unassigned'}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => { setSelectedDept(d); setAssignHeadForm({ headId: '' }); setShowAssignHeadModal(true); }}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all cursor-pointer border border-slate-100 hover:border-slate-200 bg-white"
                        title="Assign Division Head"
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-50 text-slate-500 font-semibold text-[10px] bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400 font-bold">
                        <Users className="w-3.5 h-3.5" /> Interns
                      </div>
                      <p className="text-slate-800 font-black text-sm">{d.internCount}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400 font-bold">
                        <UserCheck className="w-3.5 h-3.5" /> Mentors
                      </div>
                      <p className="text-slate-800 font-black text-sm">{d.mentorCount}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400 font-bold">
                        <Briefcase className="w-3.5 h-3.5" /> Projects
                      </div>
                      <p className="text-slate-800 font-black text-sm">{d.projectsCount}</p>
                    </div>

                    {/* View Details Button overlay */}
                    <div 
                      onClick={() => navigate(`/hr/departments/${d.id}`)}
                      className="col-span-3 mt-4 flex items-center justify-center gap-1 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 text-indigo-600 rounded-xl cursor-pointer font-bold text-xs shadow-sm hover:shadow transition-all duration-300"
                    >
                      View Division Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 1. Create Division Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Establish New Division"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-700">Division Name</label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Unique Code</label>
              <input
                type="text"
                placeholder="e.g. AI"
                maxLength={10}
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Accent Theme</label>
              <select
                value={createForm.color}
                onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
              >
                <option value="indigo">Indigo</option>
                <option value="purple">Purple</option>
                <option value="pink">Pink</option>
                <option value="emerald">Emerald</option>
                <option value="amber">Amber</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={3}
              placeholder="Outline department scope, resources, and operating workflows..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Initial Division Head (Optional)</label>
            <select
              value={createForm.headId}
              onChange={(e) => setCreateForm({ ...createForm, headId: e.target.value })}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">Do not assign yet</option>
              {state.mentors.map(m => (
                <option key={m.id} value={m.userId}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Create Division
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Assign Head Modal */}
      <Modal
        isOpen={showAssignHeadModal}
        onClose={() => { setShowAssignHeadModal(false); setSelectedDept(null); }}
        title={`Assign Head for ${selectedDept?.name}`}
      >
        <form onSubmit={handleAssignHead} className="space-y-4 text-left">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-amber-800 text-xs font-semibold leading-relaxed border border-amber-100">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <p>
              Assigning a new head will automatically update the target user's role to <strong>DEPARTMENT_HEAD</strong>. Any previous head will be gracefully reverted back to a Mentor role.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Select Manager Profile</label>
            <select
              value={assignHeadForm.headId}
              onChange={(e) => setAssignHeadForm({ headId: e.target.value })}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">Select a manager</option>
              {state.mentors.map(m => (
                <option key={m.id} value={m.userId}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowAssignHeadModal(false); setSelectedDept(null); }}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!assignHeadForm.headId}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md cursor-pointer"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Transfer Team Member Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Team Member"
      >
        <form onSubmit={handleTransferMember} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Member Type</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTransferForm({ ...transferForm, memberType: 'intern', memberId: '' })}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transferForm.memberType === 'intern' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Intern
              </button>
              <button
                type="button"
                onClick={() => setTransferForm({ ...transferForm, memberType: 'mentor', memberId: '' })}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transferForm.memberType === 'mentor' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Mentor
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Select Member</label>
            <select
              value={transferForm.memberId}
              onChange={(e) => setTransferForm({ ...transferForm, memberId: e.target.value })}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">Select a person</option>
              {transferForm.memberType === 'intern' 
                ? state.interns.map(i => (
                    <option key={i.id} value={i.userId}>{i.name} ({i.dept || 'No Department'})</option>
                  ))
                : state.mentors.map(m => (
                    <option key={m.id} value={m.userId}>{m.name} ({m.dept || 'No Department'})</option>
                  ))
              }
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Division</label>
            <select
              value={transferForm.targetDeptId}
              onChange={(e) => setTransferForm({ ...transferForm, targetDeptId: e.target.value })}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">Select destination department</option>
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!transferForm.memberId || !transferForm.targetDeptId}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md cursor-pointer"
            >
              Transfer Member
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Building2, Users, UserCheck, Briefcase, GraduationCap, Edit3 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const DepartmentManagement: React.FC = () => {
  const { state, refreshData } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [newHead, setNewHead] = useState('');

  const handleUpdateHead = async () => {
    if (!selectedDept || !newHead) return;
    try {
      await api.put(`/departments/${selectedDept.id}`, { head: newHead });
      toast.success('Department head updated successfully!');
      setSelectedDept(null);
      refreshData();
    } catch (error) {
      toast.error('Failed to update department head');
    }
  };

  const colorsMap: Record<string, { border: string; bg: string; icon: string; tag: string }> = {
    indigo: { border: "border-indigo-100", bg: "bg-indigo-50/50", icon: "text-indigo-600 bg-indigo-50", tag: "bg-indigo-100 text-indigo-700" },
    purple: { border: "border-purple-100", bg: "bg-purple-50/50", icon: "text-purple-600 bg-purple-50", tag: "bg-purple-100 text-purple-700" },
    pink: { border: "border-pink-100", bg: "bg-pink-50/50", icon: "text-pink-600 bg-pink-50", tag: "bg-pink-100 text-pink-700" },
    emerald: { border: "border-emerald-100", bg: "bg-emerald-50/50", icon: "text-emerald-600 bg-emerald-50", tag: "bg-emerald-100 text-emerald-700" },
    amber: { border: "border-amber-100", bg: "bg-amber-50/50", icon: "text-amber-600 bg-amber-50", tag: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Department Directory" />

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.departments.map((d) => {
              const styles = colorsMap[d.color] || colorsMap.indigo;
              return (
                <div 
                  key={d.id} 
                  className={`bg-white rounded-3xl p-6 border ${styles.border} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left flex flex-col justify-between space-y-6`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${styles.icon}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${styles.tag}`}>
                      Active Division
                    </span>
                  </div>

                  <div className="space-y-1.5 relative">
                    <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{d.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-400">Head: <span className="text-slate-600 font-bold">{d.head}</span></p>
                      <button 
                        onClick={() => { setSelectedDept(d); setNewHead(d.head); }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Change Department Head"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-50 text-slate-500 font-semibold text-[10px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3.5 h-3.5" /> Interns
                      </div>
                      <p className="text-slate-800 font-extrabold text-xs">{d.internCount}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <UserCheck className="w-3.5 h-3.5" /> Mentors
                      </div>
                      <p className="text-slate-800 font-extrabold text-xs">{d.mentorCount}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Briefcase className="w-3.5 h-3.5" /> Projects
                      </div>
                      <p className="text-slate-800 font-extrabold text-xs">{d.projectsCount}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Edit Department Head Modal */}
      <Modal
        isOpen={selectedDept !== null}
        onClose={() => setSelectedDept(null)}
        title={`Change Head of ${selectedDept?.name}`}
      >
        <div className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-700">Select New Department Head</label>
            <select
              value={newHead}
              onChange={(e) => setNewHead(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">Select a head</option>
              {/* Combine unique current heads and active mentors */}
              {Array.from(new Set([
                ...state.departments.map(d => d.head),
                ...state.mentors.map(m => m.name)
              ])).filter(Boolean).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setSelectedDept(null)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateHead}
              disabled={!newHead || newHead === selectedDept?.head}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

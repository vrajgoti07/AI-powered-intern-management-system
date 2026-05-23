import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMentorInterns, assignIntern, removeIntern } from '../../../services/mentorDetailsApi';
import { useApp } from '../../../hooks/useApp';
import type { MentorInternData } from '../../../types';
import { Avatar } from '../../../components/common/Avatar';
import { Modal } from '../../../components/common/Modal';
import { UserPlus, UserMinus, ExternalLink, Loader2, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  mentorId: string;
}

export const MentorInternTable: React.FC<Props> = ({ mentorId }) => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [interns, setInterns] = useState<MentorInternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedInternId, setSelectedInternId] = useState('');
  const [internToRemove, setInternToRemove] = useState<MentorInternData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInterns();
  }, [mentorId]);

  const loadInterns = async () => {
    try {
      setLoading(true);
      const data = await fetchMentorInterns(mentorId);
      setInterns(data);
    } catch (err) {
      console.error('Failed to load interns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternId) return;
    try {
      setActionLoading(true);
      await assignIntern(mentorId, selectedInternId);
      toast.success('Intern assigned successfully');
      setShowAssignModal(false);
      setSelectedInternId('');
      await loadInterns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign intern');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!internToRemove) return;
    try {
      setActionLoading(true);
      await removeIntern(mentorId, internToRemove.id);
      toast.success('Intern removed successfully');
      setShowRemoveModal(false);
      setInternToRemove(null);
      await loadInterns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove intern');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter assigned interns from the global list for the assign modal
  const assignedIds = new Set(interns.map(i => i.id));
  const availableInterns = state.interns.filter(i => !assignedIds.has(i.id));

  const filteredInterns = interns.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'COMPLETED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ONBOARDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search interns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" /> Assign Intern
        </button>
      </div>

      {/* Table */}
      {filteredInterns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No interns assigned</p>
          <p className="text-xs text-slate-300 mt-1">Click "Assign Intern" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intern</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInterns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={intern.name} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{intern.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{intern.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-500">{intern.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-slate-700">{intern.attendance}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${intern.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{intern.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-extrabold text-slate-700">{intern.score}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-[10px] font-medium text-slate-500">
                      {intern.duration}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusColor(intern.status)}`}>
                        {intern.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/hr/interns`)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setInternToRemove(intern); setShowRemoveModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Intern">
        <form onSubmit={handleAssign} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Intern *</label>
            <select
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Choose Intern --</option>
              {availableInterns.map((i) => (
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
              disabled={actionLoading}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Assigning...' : 'Assign Intern'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal isOpen={showRemoveModal} onClose={() => setShowRemoveModal(false)} title="Remove Intern">
        <div className="space-y-4 text-left">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-700">
              Are you sure you want to remove <strong>{internToRemove?.name}</strong> from this mentor?
              The intern will become unassigned and may need to be reassigned.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowRemoveModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={actionLoading}
              className="px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Removing...' : 'Remove Intern'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import api from '../../services/api';
import {
  ShieldAlert, CheckCircle, XCircle, Clock,
  AlertTriangle, Check, X, RefreshCw, Eye, AlertCircle
} from 'lucide-react';

interface ErasureRequest {
  id: string;
  userId: string;
  organizationId: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  reason: string | null;
  confirmedAt: string | null;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
}

export const ErasureRequests: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [requests, setRequests] = useState<ErasureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal confirm overlays
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    requestId: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/gdpr/erasure/requests');
      if (res.data.success && res.data.data) {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load erasure requests:', err);
      setError(err.response?.data?.message || 'Could not fetch erasure compliance logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: string, type: 'approve' | 'reject') => {
    setActioningId(requestId);
    setConfirmModal(null);
    try {
      const endpoint = `/gdpr/erasure/requests/${requestId}/${type}`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        await fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${type} request`);
    } finally {
      setActioningId(null);
    }
  };

  const statusThemes = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-150',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    REJECTED: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Right to Erasure Requests" />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-lg">
                GDPR Compliance
              </span>
              <h1 className="text-2xl font-black text-slate-850 dark:text-white mt-1.5">
                Right to Erasure (Deletion Requests)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review and approve account anonymization deletion requests confirmed by interns.
              </p>
            </div>
            
            <button
              onClick={fetchRequests}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* List display */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[40vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-bold mt-3">Loading deletion requests...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-left">
                <AlertCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-900">GDPR Logs Error</h4>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 py-10">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-650">No Pending Erasure Requests</p>
                <p className="text-xs text-slate-400 mt-0.5">All user privacy logs are in full compliance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="text-[10px] font-black text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">User ID</th>
                      <th className="px-4 py-3">Requested At</th>
                      <th className="px-4 py-3">User Confirmed</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                          {req.userId}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-500">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {req.confirmedAt ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Link
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-550 max-w-xs truncate">
                          {req.reason || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusThemes[req.status] || ''}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'CONFIRMED' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'reject', requestId: req.id })}
                                disabled={actioningId !== null}
                                className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg hover:shadow-xs transition-colors cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'approve', requestId: req.id })}
                                disabled={actioningId !== null}
                                className="p-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                                title="Approve & Anonymize"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Confirm Dialog Modal Overlay */}
          {confirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 text-left space-y-4">
                <div className="flex items-center gap-2 text-rose-500">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Confirm Compliance Action
                  </h3>
                </div>

                <p className="text-xs text-slate-550 leading-relaxed">
                  {confirmModal.type === 'approve'
                    ? 'WARNING: Approving this request will permanently scrub all email credentials, session structures, and PII from the database while keeping anonymized performance telemetry. This cannot be undone.'
                    : 'Rejecting this request will mark the right to erasure request as declined. The user profile will remain active.'}
                </p>

                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-2 border border-slate-100 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(confirmModal.requestId, confirmModal.type)}
                    className={`flex-1 py-2 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer ${
                      confirmModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Shield, Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AuditLogs: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [limit] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };

      if (actionFilter) params.action = actionFilter;
      if (userIdFilter) params.userId = userIdFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
        setTotalPages(res.data.data.pagination.totalPages || 1);
        setTotalLogs(res.data.data.pagination.total || 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setActionFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act === 'LOGIN') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (act === 'LOGOUT') return 'bg-rose-50 text-rose-600 border border-rose-100';
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="System Security Audit Logs" />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Security Audit Trail</h2>
                <p className="text-xs font-semibold text-slate-400">Strict system-wide chronological operations and authentication audit trail logs.</p>
              </div>
            </div>
            <button 
              onClick={() => fetchLogs()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Logs
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <Activity className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Search Filters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Action Filter */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Reset Action */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer text-center uppercase tracking-wider"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Retrieving Operations Register...</p>
                </div>
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-semibold text-slate-500">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">
                      <th className="px-6 py-4">Timestamp (Date)</th>
                      <th className="px-6 py-4">Operator (User ID)</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Affected Entity</th>
                      <th className="px-6 py-4">Entity ID</th>
                      <th className="px-6 py-4 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {log.userId || 'System/Anonymous'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-bold">
                          {log.entity}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[10px]">
                          {log.entityId}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <Shield className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-bold">No system security audit logs matched your query.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Showing logs {logs.length} of {totalLogs}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-xs font-black text-slate-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
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
export default AuditLogs;

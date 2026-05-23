import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ShieldAlert, Settings, Users, Database, Activity, 
  Terminal, ShieldCheck, RefreshCw, Lock, Unlock
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import toast from 'react-hot-toast';

export const SuperAdmin: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  // DB Monitoring stats (Recharts area stats)
  const systemMetrics = [
    { time: '12:00', CPU: 35, RAM: 58, DBQueries: 120 },
    { time: '12:10', CPU: 42, RAM: 60, DBQueries: 240 },
    { time: '12:20', CPU: 58, RAM: 63, DBQueries: 380 },
    { time: '12:30', CPU: 38, RAM: 61, DBQueries: 150 }
  ];

  // Access control state
  const [roles, setRoles] = useState([
    { name: "Admin User", email: "admin@internflow.com", role: "hr", writeAccess: true },
    { name: "Priya Nair", email: "priyan@company.com", role: "mentor", writeAccess: true },
    { name: "Ankit Patil", email: "ankit@internflow.com", role: "intern", writeAccess: false }
  ]);

  const toggleWrite = (index: number) => {
    setRoles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], writeAccess: !updated[index].writeAccess };
      return updated;
    });
    toast.success("Security permissions updated!");
  };

  const syncDatabase = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Database normalized & indexed successfully!");
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Super Admin Control Deck" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Sync db action */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-2 border-b">
                  <Database className="w-5 h-5 text-indigo-600" /> Database Administration
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2">
                  Maintain operational normalization ratios by indexing PK tables and trimming orphan logs.
                </p>
              </div>
              <button 
                onClick={syncDatabase}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Optimize Indices"}
              </button>
            </div>

            {/* RAM/CPU Stats */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-2 col-span-2 relative">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-2 border-b">
                <Activity className="w-5 h-5 text-indigo-600" /> System Load Metrics
              </h3>
              
              <div className="w-full h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={systemMetrics}>
                    <XAxis dataKey="time" tick={{ fontSize: 8, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="CPU" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="RAM" stroke="#a855f7" fill="#a855f7" fillOpacity={0.05} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Access control dashboard */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-2 border-b">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Security Access Rules Matrix
              </h3>

              <div className="space-y-3">
                {roles.map((r, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div>
                      <p className="font-extrabold text-slate-800">{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{r.email} • Role: {r.role}</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleWrite(idx)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-sm transition-all duration-300 ${
                        r.writeAccess 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}
                    >
                      {r.writeAccess ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {r.writeAccess ? 'Write Authorized' : 'Read Only'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-2 border-b">
                <Terminal className="w-5 h-5 text-indigo-600" /> Security Audit Logs
              </h3>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {[
                  { act: "Indexed Tasks schema table", ip: "192.168.1.15", time: "12:20 PM" },
                  { act: "Role upgrade granted to Priyan", ip: "10.0.0.42", time: "11:05 AM" },
                  { act: "Token refresh validation keys updated", ip: "172.16.8.5", time: "Yesterday" }
                ].map((log, i) => (
                  <div key={i} className="p-3 border rounded-2xl text-[10px] font-semibold space-y-1">
                    <p className="text-slate-700 font-bold">{log.act}</p>
                    <div className="flex justify-between text-slate-400 text-[9px] font-bold">
                      <span>IP: {log.ip}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

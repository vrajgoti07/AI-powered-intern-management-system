import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { BarChartComponent } from '../../components/charts/BarChartComponent';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Award, Download, Calendar, Filter, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const ReportsAnalytics: React.FC = () => {
  const { state } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeframe, setTimeframe] = useState('This Month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const timeframes = ["This Week", "This Month", "This Quarter", "All Cohorts"];

  // Generate top interns leaderboard (sorted by score desc)
  const leaderboard = [...state.interns]
    .filter(i => i.status === 'Active' || i.status === 'Completed')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const performanceData = state.departments.map(d => {
    const deptInterns = state.interns.filter(i => i.dept.toLowerCase() === d.name.toLowerCase());
    const score = deptInterns.length > 0
      ? Math.round(deptInterns.reduce((s, i) => s + i.score, 0) / deptInterns.length)
      : 75;
    return { label: d.name, value: score };
  });

  const exportToExcel = () => {
    const headers = ['ID', 'Name', 'Department', 'Status', 'Score'];
    const csvContent = [
      headers.join(','),
      ...state.interns.map(intern => 
        `"${intern.id}","${intern.name || ''}","${intern.dept || ''}","${intern.status || ''}",${intern.score || 0}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `intern_report_${timeframe.replace(/\\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'excel') {
      toast.success('Generating Excel file...');
      exportToExcel();
    } else {
      toast.dismiss(); // Clear any existing toasts before print dialog appears
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  return (
    <>
      {/* Professional Print Layout - Only visible during printing */}
      <div className="hidden print:block bg-white text-slate-900 w-full min-h-screen font-sans">
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">InternFlow</h1>
            <h2 className="text-2xl font-bold text-slate-600 mt-2">Internship Performance Report</h2>
          </div>
          <div className="text-right text-sm text-slate-500 font-medium">
            <p className="uppercase tracking-wider font-bold text-slate-400 mb-1">Generated On</p>
            <p className="text-slate-800">{new Date().toLocaleDateString()}</p>
            <p className="text-slate-800 mt-1">Timeframe: <span className="font-bold text-slate-900">{timeframe}</span></p>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-slate-100 pb-2 uppercase tracking-wide">Department Averages</h3>
          <div className="grid grid-cols-2 gap-6">
            {performanceData.map(d => (
              <div key={d.label} className="flex justify-between items-center bg-slate-50 p-5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 text-lg">{d.label}</span>
                <span className="font-black text-indigo-600 text-3xl">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-slate-100 pb-2 uppercase tracking-wide">Top Intern Leaderboard</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y-2 border-slate-300">
                <th className="py-4 px-4 font-extrabold text-slate-700 uppercase tracking-wider">Rank</th>
                <th className="py-4 px-4 font-extrabold text-slate-700 uppercase tracking-wider">Intern Name</th>
                <th className="py-4 px-4 font-extrabold text-slate-700 uppercase tracking-wider">Department</th>
                <th className="py-4 px-4 font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 font-extrabold text-slate-700 uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((intern, i) => (
                <tr key={intern.id} className="border-b border-slate-200">
                  <td className="py-4 px-4 font-black text-slate-500 text-lg">#{i + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-900 text-base">{intern.name}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{intern.dept}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{intern.status}</td>
                  <td className="py-4 px-4 font-black text-indigo-600 text-lg text-right">{intern.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-semibold tracking-wider">
          <p>CONFIDENTIAL & PROPRIETARY. © {new Date().getFullYear()} INTERNFLOW INC.</p>
        </div>
      </div>

      {/* Main Screen Layout - Hidden during printing */}
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:hidden">
        <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Reports & Analytics" />

        {/* Filters bar */}
        <div className="p-6 pb-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all cursor-pointer min-w-[140px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">{timeframe}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden"
                >
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        setTimeframe(tf);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors ${timeframe === tf ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleExport('excel')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export PDF Report
            </button>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dept grades chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Average Grades by Department</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Evaluating performance curves across divisions</p>
              </div>
              <div className="pt-5">
                <BarChartComponent data={performanceData} height={220} />
              </div>
            </div>

            {/* Leaderboard widget */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col text-left justify-between space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Top Intern Leaderboard</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Active batch outstanding achievers</p>
                </div>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto">
                {leaderboard.map((intern, i) => (
                  <div key={intern.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <Avatar name={intern.name} />
                      <div>
                        <p className="font-bold text-slate-800 text-xs truncate max-w-[100px]">{intern.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold truncate max-w-[100px]">{intern.dept}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 border border-indigo-100 rounded-md">
                      {intern.score}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex items-start gap-2 text-[10px] font-semibold text-indigo-800 leading-relaxed">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Achievers are selected based on task averages, peer logs and mentor ratings. Highlight profiles to prompt Certificate issuance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Award, Download, Eye, RefreshCw, 
  CheckCircle2, FileSpreadsheet, ShieldAlert, Sparkles
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import api, { API_BASE_URL } from '../../../services/api';

export const ReportsCertificates: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name || "Intern";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const handleGenerate = (type: 'PDF' | 'Excel') => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(`${type} report downloaded successfully!`);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Report & Certificate Gateway" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Left Block: Exporters & Actions */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-5 relative">
              {generating && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center rounded-3xl">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Compiling report data...</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight pb-3 border-b">Document Export Options</h3>
                
                <div className="space-y-3">
                  {/* Action 1 */}
                  <div 
                    onClick={() => handleGenerate('PDF')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 items-center cursor-pointer hover:bg-indigo-50/20 hover:border-indigo-200 transition-all duration-300"
                  >
                    <FileText className="w-7 h-7 text-indigo-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">Export PDF Performance Report</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Generates detailed task summaries and grades.</p>
                    </div>
                  </div>

                  {/* Action 2 */}
                  <div 
                    onClick={() => handleGenerate('Excel')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 items-center cursor-pointer hover:bg-emerald-50/20 hover:border-emerald-200 transition-all duration-300"
                  >
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">Export Excel Attendance Logs</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Exports complete present/absent data logs.</p>
                    </div>
                  </div>

                  {/* Action 3 */}
                  <div 
                    onClick={() => setShowCertificate(true)}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 items-center cursor-pointer hover:bg-purple-50/20 hover:border-purple-200 transition-all duration-300"
                  >
                    <Award className="w-7 h-7 text-purple-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">Generate Completion Certificate</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Available for candidates with grades &gt; 75%.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block: Certificate preview workspace */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {showCertificate ? (
                  <motion.div 
                    key="certificate"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
                  >
                    {/* Toolbar */}
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-indigo-600" /> Certificate Template Preview</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const internId = (user as any)?.intern?.id;
                              if(!internId) return toast.error("Intern profile not found");
                              
                              const res = await api.post(`/documents/certificate/${internId}`);
                              const documentId = res.data?.data?.id;
                              
                              if(documentId) {
                                window.open(`${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/documents/download/${documentId}`, '_blank');
                                toast.success("Certificate downloaded successfully!");
                                setShowCertificate(false);
                              }
                            } catch(err) {
                              toast.error("Failed to generate certificate.");
                            }
                          }}
                          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors cursor-pointer min-h-[44px]"
                        >
                          <Download className="w-4 h-4" /> Download Certificate
                        </button>
                        <button 
                          onClick={() => setShowCertificate(false)}
                          className="px-3 py-2 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
                        >
                          Close Preview
                        </button>
                      </div>
                    </div>

                    {/* High Fidelity Certificate visual */}
                    <div className="border-[12px] border-double border-indigo-950 p-8 text-center space-y-6 bg-slate-50/50 rounded-2xl relative overflow-hidden font-serif">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02),transparent)]" />
                      
                      <div className="space-y-1 relative z-10">
                        <h4 className="text-indigo-900 font-bold tracking-widest text-[10px] uppercase font-sans">Certificate of Completion</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-sans">InternFlow Corporate Solutions</p>
                      </div>

                      <div className="space-y-2 relative z-10">
                        <p className="text-[10px] text-slate-500 italic">This credential document certifies that</p>
                        <h2 className="text-2xl font-extrabold text-indigo-950 tracking-wide">{userName}</h2>
                        <p className="text-[10px] text-slate-500 italic max-w-md mx-auto leading-relaxed">
                          has successfully fulfilled all milestones as an <strong>Engineering Intern</strong>, securing an average batch evaluation score of <strong>85%</strong> and maintaining standard attendance parameters.
                        </p>
                      </div>

                      {/* Seal / Signatures row */}
                      <div className="flex justify-between items-end pt-6 font-sans relative z-10">
                        <div className="text-left text-[9px] text-slate-500 border-t border-slate-300 pt-1.5 w-[110px]">
                          <p className="font-extrabold text-slate-700">Program Director</p>
                          <p className="font-bold text-[8px] text-slate-400">Engineering Lead</p>
                        </div>
                        
                        {/* Seal icon */}
                        <div className="w-12 h-12 bg-indigo-900 text-white rounded-full flex items-center justify-center font-bold text-[8px] shadow-lg border border-indigo-800">
                          FLOW SEAL
                        </div>

                        <div className="text-right text-[9px] text-slate-500 border-t border-slate-300 pt-1.5 w-[110px]">
                          <p className="font-extrabold text-slate-700">HR Admin</p>
                          <p className="font-bold text-[8px] text-slate-400">Human Resources</p>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center min-h-[350px]"
                  >
                    Select an export or click "Generate Completion Certificate" from the left panel to begin.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

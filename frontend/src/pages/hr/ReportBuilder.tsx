import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { useReportBuilderStore } from '../../store/useReportBuilderStore';
import api from '../../services/api';
import {
  FileSpreadsheet, FileText, CheckSquare, Settings2,
  Table, ChevronRight, ChevronLeft, Download, Eye,
  RefreshCw, ListPlus, Sliders, Calendar, AlertCircle
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

export const ReportBuilder: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    step,
    selectedColumns,
    filters,
    sortBy,
    sortOrder,
    previewData,
    loading,
    nextStep,
    prevStep,
    setStep,
    toggleColumn,
    updateFilter,
    setSort,
    setPreviewData,
    setLoading,
    resetBuilder
  } = useReportBuilderStore();

  // Load departments list for filters
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data.success && res.data.data) {
          setDepartments(res.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Standard fields definitions
  const allColumns = [
    { id: 'name', label: 'Name', category: 'Identity' },
    { id: 'email', label: 'Email', category: 'Identity' },
    { id: 'phone', label: 'Phone', category: 'Identity' },
    { id: 'college', label: 'College', category: 'Education' },
    { id: 'degree', label: 'Degree', category: 'Education' },
    { id: 'branch', label: 'Branch', category: 'Education' },
    { id: 'cgpa', label: 'CGPA', category: 'Education' },
    { id: 'joinedDate', label: 'Joined Date', category: 'Program Details' },
    { id: 'startDate', label: 'Start Date', category: 'Program Details' },
    { id: 'status', label: 'Status', category: 'Program Details' },
    { id: 'score', label: 'Performance Score', category: 'Performance' },
    { id: 'attendance', label: 'Attendance', category: 'Performance' },
    { id: 'skills', label: 'Skills', category: 'Performance' },
    { id: 'departmentName', label: 'Department', category: 'Program Details' },
    { id: 'mentorName', label: 'Mentor', category: 'Program Details' },
    { id: 'internId', label: 'Intern ID', category: 'Identity' },
  ];

  // Group columns by category
  const categories = Array.from(new Set(allColumns.map(c => c.category)));

  // Run dynamic report preview
  const handleGeneratePreview = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.post('/report-builder/generate', {
        filters,
        sortBy,
        sortOrder,
        selectedColumns,
      });

      if (res.data.success && res.data.data) {
        setPreviewData(res.data.data, res.data.count);
      }
    } catch (err: any) {
      console.error('Failed to generate preview:', err);
      setLoadError(err.response?.data?.message || 'Failed to fetch report results.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Excel/PDF downloads
  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      const res = await api.post('/report-builder/export', {
        filters,
        sortBy,
        sortOrder,
        selectedColumns,
        format,
      }, {
        responseType: 'blob', // Expect binary response
      });

      // Create download link
      const blob = new Blob([res.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `internflow_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error(`Failed to export ${format}:`, err);
      alert('Failed to download report. Please check filters and try again.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Custom Report Builder Wizard" />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-650 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-lg">
                Report Center
              </span>
              <h1 className="text-2xl font-black text-slate-850 dark:text-white mt-1.5">
                Custom Report Builder Wizard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Compile dynamic statistics spreadsheets, slice filters, and export tabular summaries instantly.
              </p>
            </div>
            
            <button
              onClick={resetBuilder}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:shadow-xs transition-all cursor-pointer"
            >
              Reset Builder
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl max-w-2xl mx-auto shadow-xs">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                step === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListPlus className="w-4 h-4" />
              <span>1. Columns</span>
            </button>

            <button
              onClick={() => setStep(2)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                step === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>2. Filters & Sort</span>
            </button>

            <button
              onClick={() => {
                setStep(3);
                handleGeneratePreview();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                step === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>3. Export</span>
            </button>
          </div>

          {/* Step Contents */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[40vh] flex flex-col justify-between">
            
            {/* STEP 1: Select Columns */}
            {step === 1 && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                    Select Report Columns
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Choose which fields should be included in your compiled report.</p>
                </div>

                <div className="space-y-6">
                  {categories.map(cat => (
                    <div key={cat} className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-1.5">
                        {cat}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {allColumns
                          .filter(col => col.category === cat)
                          .map(col => {
                            const checked = selectedColumns.includes(col.id);
                            return (
                              <button
                                key={col.id}
                                onClick={() => toggleColumn(col.id)}
                                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                  checked
                                    ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700'
                                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-650'
                                }`}
                              >
                                <span>{col.label}</span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  readOnly
                                  className="w-4.5 h-4.5 rounded-md accent-indigo-600 pointer-events-none"
                                />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Filters & Sorting */}
            {step === 2 && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-indigo-600" />
                    Refine Query Filters & Sorting
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter the records to select specific parameters and order results.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Department Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Department
                    </label>
                    <select
                      value={filters.departmentId || ''}
                      onChange={(e) => updateFilter('departmentId', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Intern Status
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="TERMINATED">Terminated</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  {/* Sort By Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Sort Results By
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSort(e.target.value, sortOrder)}
                        className="flex-1 text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="joinedDate">Joined Date</option>
                        <option value="score">Performance Score</option>
                        <option value="attendance">Attendance Rate</option>
                        <option value="cgpa">CGPA</option>
                        <option value="name">Name</option>
                      </select>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSort(sortBy, e.target.value as 'ASC' | 'DESC')}
                        className="w-20 text-xs font-semibold px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="DESC">DESC</option>
                        <option value="ASC">ASC</option>
                      </select>
                    </div>
                  </div>

                  {/* Score Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Performance Score Range (0 - 100)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.scoreMin || ''}
                        onChange={(e) => updateFilter('scoreMin', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.scoreMax || ''}
                        onChange={(e) => updateFilter('scoreMax', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Attendance Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Attendance Rate Range (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.attendanceMin || ''}
                        onChange={(e) => updateFilter('attendanceMin', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.attendanceMax || ''}
                        onChange={(e) => updateFilter('attendanceMax', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* CGPA Filter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      CGPA Range (0 - 10)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Min"
                        value={filters.cgpaMin || ''}
                        onChange={(e) => updateFilter('cgpaMin', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Max"
                        value={filters.cgpaMax || ''}
                        onChange={(e) => updateFilter('cgpaMax', e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Joined Date Filter */}
                  <div className="lg:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-450" />
                      Joined Program Date Bounds
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={filters.joinedDateStart || ''}
                        onChange={(e) => updateFilter('joinedDateStart', e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="date"
                        value={filters.joinedDateEnd || ''}
                        onChange={(e) => updateFilter('joinedDateEnd', e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: Preview & Download */}
            {step === 3 && (
              <div className="space-y-6 text-left flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-600" />
                        Preview Tabular Report Data
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Inspect rows returned by the query configuration.</p>
                    </div>
                    
                    <div className="flex gap-2.5 flex-wrap">
                      <button
                        onClick={() => handleDownload('excel')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Download Excel</span>
                      </button>
                      
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Preview Display */}
                <div className="flex-1 min-h-[200px] overflow-hidden border border-slate-100 rounded-2xl mt-4 bg-slate-50/50">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-xs text-slate-450 font-bold mt-2">Loading preview results...</p>
                    </div>
                  ) : loadError ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-rose-600">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-xs font-bold">{loadError}</p>
                    </div>
                  ) : previewData.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10 text-slate-400 italic text-xs">
                      No records matched the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
                      <table className="w-full text-xs text-left text-slate-700">
                        <thead className="text-[10px] font-black text-slate-400 uppercase bg-white border-b border-slate-100 sticky top-0">
                          <tr>
                            {selectedColumns.map(col => (
                              <th key={col} className="px-4 py-3 font-extrabold">
                                {allColumns.find(c => c.id === col)?.label || col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {previewData.slice(0, 15).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              {selectedColumns.map(col => (
                                <td key={col} className="px-4 py-3 font-semibold truncate max-w-[150px]">
                                  {String(row[col] !== undefined ? row[col] : '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.length > 15 && (
                        <div className="p-3 bg-white text-center text-[10px] font-bold text-slate-400 border-t border-slate-50">
                          Showing first 15 of {previewData.length} records. Download spreadsheet to view all records.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Wizard Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-650 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    nextStep();
                    if (step === 2) {
                      handleGeneratePreview();
                    }
                  }}
                  className="flex items-center gap-1 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGeneratePreview}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Preview</span>
                </button>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

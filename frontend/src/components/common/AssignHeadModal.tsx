import React, { useState, useMemo } from 'react';
import { Search, Crown, Check } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  userId: string;
}

interface AssignHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onConfirm: (userId: string) => void;
  isSubmitting?: boolean;
}

export const AssignHeadModal: React.FC<AssignHeadModalProps> = ({
  isOpen,
  onClose,
  employees,
  onConfirm,
  isSubmitting = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    onConfirm(selectedUserId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden flex flex-col text-left">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight font-sans">Assign Division Head</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-sans">Select an employee to lead this department</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100 font-sans font-bold text-xs"
          >
            Close
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex flex-col justify-between flex-1">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans"
            />
          </div>

          {/* List of employees */}
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredEmployees.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center font-bold py-6 italic font-sans">No matching employees found.</p>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedUserId === emp.userId;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedUserId(emp.userId)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between font-sans ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-left min-w-0">
                      <span className="font-extrabold text-xs text-slate-800 block truncate">{emp.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block leading-tight truncate">{emp.email}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Confirm Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

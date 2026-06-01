import React, { useState, useEffect } from 'react';
import { Intern, Task } from '../../types';

interface TaskFormProps {
  interns: Intern[];
  onSubmit: (taskData: { title: string; description: string; internId: string; priority: string; dueDate: string }) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ interns = [], onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [internId, setInternId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  // Synchronize dynamic initial select option once they load
  useEffect(() => {
    if (interns.length > 0 && !internId) {
      setInternId(interns[0].id);
    }
  }, [interns, internId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !internId || !dueDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSubmit({
      title,
      description,
      internId,
      priority,
      dueDate
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Task Title *</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Design Landing Page Mockups"
          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description *</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the task instructions, criteria, and outcomes..."
          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-base"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assign To *</label>
          <select 
            value={internId}
            onChange={(e) => setInternId(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            required
          >
            <option value="">-- Select Intern --</option>
            {interns.map((i: any) => (
              <option key={i.id} value={i.id}>{i.user?.name || "Unknown"} ({i.department?.name || "Unassigned"})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Priority *</label>
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Due Date *</label>
        <input 
          type="date" 
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          required
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer min-h-[44px]"
        >
          Create Task
        </button>
      </div>
    </form>
  );
};

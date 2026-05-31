import React, { useState, useEffect } from 'react';
import { Department, Mentor } from '../../types';

interface InternFormProps {
  departments?: Department[];
  mentors?: Mentor[];
  onSubmit: (internData: any) => void;
  onCancel: () => void;
}

export const InternForm: React.FC<InternFormProps> = ({ 
  departments = [], 
  mentors = [], 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [deptId, setDeptId] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState('');

  // Synchronize dynamic initial select options once they load
  useEffect(() => {
    if (departments.length > 0 && !deptId) {
      setDeptId(departments[0].id);
    }
  }, [departments, deptId]);

  useEffect(() => {
    if (mentors.length > 0 && !mentorId) {
      setMentorId('');
    }
  }, [mentors, mentorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !college || !cgpa || !deptId) {
      alert("Please fill in all required fields.");
      return;
    }
    onSubmit({
      name,
      email,
      college,
      departmentId: deptId,
      mentorId: mentorId || undefined,
      phone,
      dob,
      degree,
      branch,
      cgpa: parseFloat(cgpa) || 8.0,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aarav@example.com"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone *</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date of Birth</label>
          <input 
            type="date" 
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">College *</label>
          <input 
            type="text" 
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="IIT Delhi"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">CGPA *</label>
          <input 
            type="number" 
            step="0.01"
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="9.1"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Degree</label>
          <input 
            type="text" 
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="B.Tech"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Branch</label>
          <input 
            type="text" 
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Computer Science"
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Department Preference *</label>
          <select 
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            required
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assign Mentor</label>
          <select 
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          >
            <option value="">-- Choose Mentor (None) --</option>
            {mentors.map((m: any) => (
              <option key={m.id} value={m.id}>{m.user?.name || 'Unknown'} ({m.department?.name || 'Unassigned'})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Skills (comma separated)</label>
        <input 
          type="text" 
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="React, Node.js, Git, HTML"
          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
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
          Save Intern
        </button>
      </div>
    </form>
  );
};

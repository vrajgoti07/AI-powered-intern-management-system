import React, { useState } from 'react';
import { updateMentorProfile } from '../../../services/mentorDetailsApi';
import { useApp } from '../../../hooks/useApp';
import type { MentorDetails } from '../../../types';
import { Save, X, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  mentor: MentorDetails;
  onSaved: () => void;
}

export const MentorSettings: React.FC<Props> = ({ mentor, onSaved }) => {
  const { state } = useApp();

  const [form, setForm] = useState({
    name: mentor.user.name,
    email: mentor.user.email,
    phone: mentor.phone || '',
    departmentId: mentor.departmentId,
    designation: mentor.designation || '',
    experience: mentor.experience || 0,
    bio: mentor.bio || '',
    mentorCapacity: mentor.mentorCapacity,
    mentorStatus: mentor.mentorStatus,
    rating: mentor.rating,
  });

  const [skills, setSkills] = useState<string[]>(mentor.skills || []);
  const [expertise, setExpertise] = useState<string[]>(mentor.expertise || []);
  const [newSkill, setNewSkill] = useState('');
  const [newExpertise, setNewExpertise] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const removeExpertise = (exp: string) => {
    setExpertise(expertise.filter(e => e !== exp));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMentorProfile(mentor.id, {
        ...form,
        skills,
        expertise,
        experience: Number(form.experience),
        mentorCapacity: Number(form.mentorCapacity),
        rating: Number(form.rating),
      });
      toast.success('Mentor profile updated successfully');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-800">Edit Mentor Information</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-50 pb-2">Personal Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-50 pb-2">Professional Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Department</label>
            <select
              value={form.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              className={inputClass}
            >
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Experience (years)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={form.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Mentor Capacity</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.mentorCapacity}
              onChange={(e) => handleChange('mentorCapacity', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.mentorStatus}
              onChange={(e) => handleChange('mentorStatus', e.target.value)}
              className={inputClass}
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Rating (0-5)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) => handleChange('rating', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-50 pb-2">Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add a skill..."
            className="flex-1 text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addSkill}
            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expertise */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-50 pb-2">Expertise</h4>
        <div className="flex flex-wrap gap-1.5">
          {expertise.map((exp, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              {exp}
              <button onClick={() => removeExpertise(exp)} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
            placeholder="Add expertise area..."
            className="flex-1 text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addExpertise}
            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-50 pb-2">Bio / About</h4>
        <textarea
          value={form.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={4}
          placeholder="Write a brief bio about this mentor..."
          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  );
};

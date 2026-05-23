import React, { useState, useEffect } from 'react';
import type { MentorDetails, MentorWorkloadData } from '../../../types';
import { MentorWorkloadCard } from './MentorWorkloadCard';
import { fetchWorkload, triggerAIAnalysis } from '../../../services/mentorDetailsApi';
import type { MentorAIAnalysis } from '../../../types';
import { Avatar } from '../../../components/common/Avatar';
import {
  Mail, Phone, Building2, Briefcase, Calendar, Star, Award,
  Users, CheckCircle2, ClipboardList, Brain, Sparkles, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  mentor: MentorDetails;
  onRefresh: () => void;
}

export const MentorOverview: React.FC<Props> = ({ mentor, onRefresh }) => {
  const [workload, setWorkload] = useState<MentorWorkloadData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<MentorAIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchWorkload(mentor.id).then(setWorkload).catch(console.error);
  }, [mentor.id]);

  const handleAIAnalysis = async () => {
    try {
      setAiLoading(true);
      const analysis = await triggerAIAnalysis(mentor.id);
      setAiAnalysis(analysis);
      toast.success('AI analysis completed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const analytics = mentor.analytics?.[0];
  const activeInterns = mentor.interns.filter(i => i.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Profile + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar name={mentor.user.name} size="lg" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                mentor.mentorStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
              }`} />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{mentor.user.name}</h2>
                <p className="text-xs font-semibold text-indigo-500">{mentor.designation || 'Mentor'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{mentor.user.email}</span>
                </div>
                {mentor.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{mentor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{mentor.department.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{mentor.experience || 0} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Joined {new Date(mentor.user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-amber-600">{mentor.rating.toFixed(1)} Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Expertise */}
          <div className="mt-5 space-y-3">
            {mentor.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {mentor.expertise.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.map((exp, i) => (
                    <span key={i} className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {mentor.bio && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">About</p>
              <p className="text-xs text-slate-600 leading-relaxed">{mentor.bio}</p>
            </div>
          )}
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
              <Users className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-slate-800">{mentor.interns.length}</p>
              <p className="text-[10px] text-slate-400 font-bold">Total Interns</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-slate-800">{activeInterns}</p>
              <p className="text-[10px] text-slate-400 font-bold">Active Interns</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
              <ClipboardList className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-slate-800">{analytics?.taskReviews || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold">Tasks Reviewed</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
              <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-slate-800">{analytics?.completedInternships || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold">Completed</p>
            </div>
          </div>

          {/* AI Score Card */}
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">AI Mentor Score</span>
            </div>
            <p className="text-3xl font-extrabold">{analytics?.aiMentorScore?.toFixed(1) || '—'}<span className="text-sm font-bold opacity-60">/10</span></p>
            <button
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {aiLoading ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </div>

          {/* Workload Card */}
          {workload && <MentorWorkloadCard workload={workload} />}
        </div>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-extrabold text-slate-800">AI Effectiveness Analysis</h3>
            <span className="text-[10px] text-slate-400 font-medium ml-auto">
              {new Date(aiAnalysis.analyzedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
              <p className="text-xl font-extrabold text-indigo-600">{aiAnalysis.effectivenessScore}%</p>
              <p className="text-[10px] text-slate-500 font-bold">Effectiveness</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                aiAnalysis.effectivenessLevel === 'Excellent' ? 'bg-emerald-50 text-emerald-600' :
                aiAnalysis.effectivenessLevel === 'Good' ? 'bg-blue-50 text-blue-600' :
                aiAnalysis.effectivenessLevel === 'Average' ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600'
              }`}>{aiAnalysis.effectivenessLevel}</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
              <p className="text-xl font-extrabold text-emerald-600">{aiAnalysis.satisfactionScore}%</p>
              <p className="text-[10px] text-slate-500 font-bold">Satisfaction</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
              <p className="text-xl font-extrabold text-blue-600">{aiAnalysis.taskCompletionRate}%</p>
              <p className="text-[10px] text-slate-500 font-bold">Task Rate</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
              <p className="text-xl font-extrabold text-violet-600">{aiAnalysis.internSuccessRate}%</p>
              <p className="text-[10px] text-slate-500 font-bold">Success Rate</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Recommendations</p>
            <ul className="space-y-1.5">
              {aiAnalysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

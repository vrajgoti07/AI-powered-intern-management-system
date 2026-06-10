import React, { useState } from 'react';
import { useTodayStandup, useSubmitStandup } from '../../hooks/queries';
import { Modal } from '../common/Modal';
import { CalendarClock, Sparkles, Smile, Frown, Meh, AlertCircle, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export const StandupPrompt: React.FC = () => {
  const { data: todayStandup, isLoading } = useTodayStandup();
  const submitMutation = useSubmitStandup();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [mood, setMood] = useState<'GREAT' | 'GOOD' | 'OKAY' | 'STRUGGLING'>('OKAY');

  if (isLoading || (todayStandup && todayStandup.submittedAt)) {
    return null; // Don't show if already submitted or loading
  }

  const moods = [
    { id: 'GREAT', label: 'Great', emoji: '😊', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
    { id: 'GOOD', label: 'Good', emoji: '🙂', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
    { id: 'OKAY', label: 'Okay', emoji: '😐', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
    { id: 'STRUGGLING', label: 'Struggling', emoji: '😟', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterday.trim() || !today.trim()) {
      toast.error('Please fill in both Yesterday and Today progress details.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        yesterday,
        today,
        blockers: blockers.trim() || undefined,
        mood,
      });
      toast.success('Standup report submitted! +15 XP awarded. 🎉');
      setIsOpen(false);
      // Reset form fields
      setYesterday('');
      setToday('');
      setBlockers('');
      setMood('OKAY');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit standup report.');
    }
  };

  return (
    <>
      {/* Visual Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-600">
            <CalendarClock className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              Daily Standup Pending
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 max-w-md">
              Submit your check-in report details to update your mentor on your current tasks progress and earn <strong className="text-amber-600">+15 XP</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex-shrink-0 flex items-center gap-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/15 hover:shadow-lg hover:shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer relative z-10"
        >
          <Play className="w-3 h-3 fill-white" /> Open Standup Form
        </button>
      </div>

      {/* Standup Form Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Daily Standup Report">
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <p className="text-xs text-slate-400 font-semibold">
            Standups are shared with your assigned mentor and department supervisors automatically.
          </p>

          {/* Yesterday's input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              What did you do yesterday? *
            </label>
            <textarea
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              placeholder="e.g. Worked on landing page styling, fixed responsive layout grid bugs..."
              rows={3}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-20"
              required
            />
          </div>

          {/* Today's input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              What are you working on today? *
            </label>
            <textarea
              value={today}
              onChange={(e) => setToday(e.target.value)}
              placeholder="e.g. Setting up the multi-tenant middleware, writing unit tests for organization service..."
              rows={3}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-20"
              required
            />
          </div>

          {/* Blockers input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Are there any blockers? (Optional)
            </label>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Stuck on Stripe webhook decryption error..."
              rows={2}
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-16"
            />
          </div>

          {/* Mood input */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              How are you feeling today? *
            </label>
            
            {/* Grid selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {moods.map((m) => {
                const isActive = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? `${m.color} ring-2 ring-offset-1 ring-amber-500 border-transparent scale-102`
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-base leading-none">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-5">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

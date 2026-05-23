import React, { useState } from 'react';

interface FeedbackFormProps {
  internName: string;
  onSubmit: (feedbackData: {
    coding: number;
    teamwork: number;
    communication: number;
    initiative: number;
    planning: number;
    score: number;
  }) => void;
  onCancel: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ internName, onSubmit, onCancel }) => {
  const [coding, setCoding] = useState(80);
  const [teamwork, setTeamwork] = useState(80);
  const [communication, setCommunication] = useState(80);
  const [initiative, setInitiative] = useState(80);
  const [planning, setPlanning] = useState(80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const averageScore = Math.round((coding + teamwork + communication + initiative + planning) / 5);
    onSubmit({
      coding,
      teamwork,
      communication,
      initiative,
      planning,
      score: averageScore
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs text-slate-400 font-semibold mb-4">
        Assign grading scores (0 - 100) for <strong className="text-slate-800">{internName}</strong>:
      </p>

      {[
        { label: "Coding & Technical Competence", value: coding, setter: setCoding },
        { label: "Teamwork & Collaborative Skills", value: teamwork, setter: setTeamwork },
        { label: "Communication & Clarity", value: communication, setter: setCommunication },
        { label: "Initiative & Problem Solving", value: initiative, setter: setInitiative },
        { label: "Planning & Reliability", value: planning, setter: setPlanning },
      ].map((field) => (
        <div key={field.label} className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>{field.label}</span>
            <span className="text-indigo-600 font-extrabold">{field.value}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={field.value}
            onChange={(e) => field.setter(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          Submit Feedback
        </button>
      </div>
    </form>
  );
};

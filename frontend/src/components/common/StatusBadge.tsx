import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'dept' | 'priority';
  value: string;
}

const statusColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Completed: "bg-indigo-100 text-indigo-700",
  Pending: "bg-amber-100 text-amber-700",
  Todo: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-purple-100 text-purple-700",
};

const deptColors: Record<string, string> = {
  Engineering: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  Design: "bg-purple-50 text-purple-700 border border-purple-100",
  Marketing: "bg-pink-50 text-pink-700 border border-pink-100",
  HR: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Finance: "bg-amber-50 text-amber-700 border border-amber-100",
  AIML: "bg-blue-50 text-blue-700 border border-blue-100",
  "Web Development": "bg-sky-50 text-sky-700 border border-sky-100",
  "Data Science": "bg-teal-50 text-teal-700 border border-teal-100",
  Cybersecurity: "bg-rose-50 text-rose-700 border border-rose-100",
};

const priorityColors: Record<string, string> = {
  High: "bg-red-50 text-red-600 border border-red-100",
  Medium: "bg-amber-50 text-amber-600 border border-amber-100",
  Low: "bg-slate-50 text-slate-500 border border-slate-100",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let classes = "bg-slate-100 text-slate-700";
  if (type === 'status') {
    classes = statusColors[value] || classes;
  } else if (type === 'dept') {
    classes = deptColors[value] || `bg-slate-50 text-slate-700 border border-slate-100`;
  } else if (type === 'priority') {
    classes = priorityColors[value] || classes;
  }

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 shadow-sm transition-transform duration-300 hover:scale-105`}>
      {type === 'status' && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          value === 'Active' || value === 'Completed' ? 'bg-emerald-500' : value === 'Pending' || value === 'In Progress' ? 'bg-amber-500' : 'bg-slate-400'
        }`}></span>
      )}
      {value}
    </span>
  );
};

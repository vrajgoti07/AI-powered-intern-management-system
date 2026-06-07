import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { Intern, Mentor, Department, Task, Announcement, LeaveRequest } from '../types';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export interface ChatSource {
  source_file: string;
  page_number: number;
  chunk_text: string;
  file_url?: string;
}

interface AppState {
  interns: Intern[];
  mentors: Mentor[];
  departments: Department[];
  tasks: Task[];
  announcements: Announcement[];
  chatHistory: { sender: 'user' | 'bot'; text: string; sources?: ChatSource[] }[];
  attendanceLogs: Record<string, { date: string; checkIn: string; checkOut: string; status: 'Present' | 'Absent' | 'Half Day' }[]>;
  leaveRequests: LeaveRequest[];
}

type Action =
  | { type: 'SET_INTERNS'; payload: Intern[] }
  | { type: 'SET_MENTORS'; payload: Mentor[] }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'ADD_INTERN'; payload: Intern }
  | { type: 'UPDATE_INTERN_STATUS'; payload: { id: string; status: 'Active' | 'Completed' | 'Pending' } }
  | { type: 'UPDATE_INTERN_SCORE'; payload: { id: string; score: number } }
  | { type: 'ADD_MENTOR'; payload: Mentor }
  | { type: 'ASSIGN_INTERN'; payload: { mentorId: string; internId: string } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: Task['status'] } }
  | { 
      type: 'SUBMIT_TASK'; 
      payload: { 
        taskId: string; 
        submission: { fileUrl: string; notes?: string; submittedAt?: string } 
      } 
    }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'SEND_CHAT_MESSAGE'; payload: { sender: 'user' | 'bot'; text: string; sources?: ChatSource[] } }
  | { type: 'SET_CHAT_HISTORY'; payload: { sender: 'user' | 'bot'; text: string; sources?: ChatSource[] }[] }
  | { type: 'CLEAR_CHAT_HISTORY' }
  | { type: 'PUNCH_ATTENDANCE'; payload: { name: string } }
  | { type: 'LOG_ATTENDANCE'; payload: { internEmail: string; date: string; checkIn: string; checkOut: string; status: 'Present' | 'Absent' | 'Half Day' } }
  | { type: 'APPLY_LEAVE'; payload: LeaveRequest }
  | { type: 'UPDATE_LEAVE_STATUS'; payload: { id: string; status: 'Approved' | 'Rejected' } };

const initialState: AppState = {
  interns: [],
  mentors: [],
  departments: [],
  tasks: [],
  announcements: [],
  chatHistory: [
    { sender: 'bot', text: 'Hello! I am your AI Assistant. How can I help you today?' }
  ],
  attendanceLogs: {},
  leaveRequests: []
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INTERNS':
      return { ...state, interns: action.payload };
    case 'SET_MENTORS':
      return { ...state, mentors: action.payload };
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload };
    case 'ADD_INTERN': {
      const newIntern = action.payload;
      const updatedDeps = state.departments.map(d => 
        d.name.toLowerCase() === newIntern.dept.toLowerCase() 
          ? { ...d, internCount: d.internCount + 1 } 
          : d
      );
      return {
        ...state,
        interns: [...state.interns, newIntern],
        departments: updatedDeps
      };
    }
    case 'UPDATE_INTERN_STATUS':
      return {
        ...state,
        interns: state.interns.map(i => i.id === action.payload.id ? { ...i, status: action.payload.status } : i)
      };
    case 'UPDATE_INTERN_SCORE':
      return {
        ...state,
        interns: state.interns.map(i => i.id === action.payload.id ? { ...i, score: action.payload.score } : i)
      };
    case 'ADD_MENTOR': {
      const newMentor = action.payload;
      const updatedDeps = state.departments.map(d => 
        d.name.toLowerCase() === newMentor.dept.toLowerCase() 
          ? { ...d, mentorCount: d.mentorCount + 1 } 
          : d
      );
      return {
        ...state,
        mentors: [...state.mentors, newMentor],
        departments: updatedDeps
      };
    }
    case 'ASSIGN_INTERN': {
      const { mentorId, internId } = action.payload;
      const mentor = state.mentors.find(m => m.id === mentorId);
      if (!mentor) return state;

      const updatedInterns = state.interns.map(i => 
        i.id === internId ? { ...i, mentor: mentor.name } : i
      );

      const updatedMentors = state.mentors.map(m => 
        m.id === mentorId ? { ...m, assignedInterns: m.assignedInterns + 1 } : m
      );

      return {
        ...state,
        interns: updatedInterns,
        mentors: updatedMentors
      };
    }
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, status: action.payload.status } : t)
      };
    case 'SUBMIT_TASK': {
      const { taskId, submission } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                status: 'Review', 
                submission: {
                  fileUrl: submission.fileUrl,
                  notes: submission.notes || '',
                  submittedAt: submission.submittedAt || new Date().toLocaleString()
                }
              } 
            : t
        )
      };
    }
    case 'ADD_ANNOUNCEMENT':
      return {
        ...state,
        announcements: [action.payload, ...state.announcements]
      };
    case 'SEND_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload]
      };
    case 'SET_CHAT_HISTORY':
      return {
        ...state,
        chatHistory: action.payload
      };
    case 'CLEAR_CHAT_HISTORY':
      return {
        ...state,
        chatHistory: [
          { sender: 'bot', text: 'Hello! I am your AI Assistant. How can I help you today?' }
        ]
      };
    case 'PUNCH_ATTENDANCE': {
      const { name } = action.payload;
      return {
        ...state,
        interns: state.interns.map(i => 
          i.name === name 
            ? { ...i, attendance: Math.min(i.attendance + 1, 100) } 
            : i
        )
      };
    }
    case 'LOG_ATTENDANCE': {
      const { internEmail, date, checkIn, checkOut, status } = action.payload;
      const currentLogs = state.attendanceLogs[internEmail] || [];
      const index = currentLogs.findIndex(l => l.date === date);
      
      let updatedLogs = [...currentLogs];
      if (index > -1) {
        updatedLogs[index] = { date, checkIn, checkOut, status };
      } else {
        updatedLogs = [{ date, checkIn, checkOut, status }, ...updatedLogs];
      }
      const totalPresentDays = updatedLogs.filter(l => l.status === 'Present').length;
      const totalHalfDays = updatedLogs.filter(l => l.status === 'Half Day').length;
      const score = Math.round(((totalPresentDays + totalHalfDays * 0.5) / Math.max(updatedLogs.length, 1)) * 100);

      const updatedInterns = state.interns.map(i => 
        i.email === internEmail ? { ...i, attendance: score } : i
      );

      return {
        ...state,
        interns: updatedInterns,
        attendanceLogs: {
          ...state.attendanceLogs,
          [internEmail]: updatedLogs
        }
      };
    }
    case 'APPLY_LEAVE':
      return { ...state, leaveRequests: [...state.leaveRequests, action.payload] };
    case 'UPDATE_LEAVE_STATUS':
      return {
        ...state,
        leaveRequests: state.leaveRequests.map(leave => 
          leave.id === action.payload.id ? { ...leave, status: action.payload.status } : leave
        )
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  const refreshData = async () => {
    if (!user) return;
    try {
      // Fetch departments list
      const deptsRes = await api.get('/departments/list');
      if (deptsRes.data.success && deptsRes.data.data) {
        const mappedDepts = deptsRes.data.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          internCount: d._count?.interns || 0,
          mentorCount: d._count?.mentors || 0,
          projectsCount: d._count?.projects || 0,
          head: d.head?.name || 'N/A',
          color: d.colorTheme || 'indigo'
        }));
        dispatch({ type: 'SET_DEPARTMENTS', payload: mappedDepts });
      }

      // Fetch interns list
      const internsRes = await api.get('/interns');
      if (internsRes.data.success && internsRes.data.data) {
        const rawInterns = internsRes.data.data.data || [];
        const mappedInterns = rawInterns.map((i: any) => ({
          id: i.id,
          userId: i.user?.id || '',
          name: i.user?.name || '',
          email: i.user?.email || '',
          college: i.college,
          dept: i.department?.name || '',
          mentor: i.mentor?.user?.name || 'Unassigned',
          score: i.score,
          status: i.status === 'ACTIVE' ? 'Active' : i.status === 'COMPLETED' ? 'Completed' : 'Pending',
          joined: i.joinedDate ? new Date(i.joinedDate).toISOString().split('T')[0] : '',
          attendance: i.attendance,
          phone: i.phone,
          dob: i.dob ? new Date(i.dob).toISOString().split('T')[0] : '',
          degree: i.degree,
          branch: i.branch,
          cgpa: i.cgpa,
          skills: i.skills || [],
          duration: i.duration,
          startDate: i.startDate ? new Date(i.startDate).toISOString().split('T')[0] : '',
          whyJoin: i.whyJoin,
          resumeUrl: i.resumeUrl,
          avatarUrl: i.user?.avatarUrl,
          address: i.address || '',
          workAddress: i.workAddress || '',
          experience: i.experience
        }));
        dispatch({ type: 'SET_INTERNS', payload: mappedInterns });
      }

      // Fetch mentors list
      const mentorsRes = await api.get('/mentors');
      if (mentorsRes.data.success && mentorsRes.data.data) {
        const rawMentors = mentorsRes.data.data.data || [];
        const mappedMentors = rawMentors.map((m: any) => ({
          id: m.id,
          userId: m.user?.id || '',
          name: m.user?.name || '',
          email: m.user?.email || '',
          dept: m.department?.name || '',
          assignedInterns: m.interns?.length || m._count?.interns || 0,
          rating: m.rating || 5.0,
          avatarUrl: m.user?.avatarUrl
        }));
        dispatch({ type: 'SET_MENTORS', payload: mappedMentors });
      }

      // Fetch tasks list
      const tasksRes = await api.get('/tasks');
      if (tasksRes.data.success && tasksRes.data.data) {
        const rawTasks = tasksRes.data.data.data || [];
        const mappedTasks = rawTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          assignedTo: t.intern?.user?.name || t.internId,
          mentor: t.mentor?.user?.name || t.mentorId,
          priority: t.priority === 'HIGH' ? 'High' : t.priority === 'MEDIUM' ? 'Medium' : 'Low',
          status: t.status === 'TODO' ? 'Todo' : t.status === 'IN_PROGRESS' ? 'In Progress' : t.status === 'REVIEW' ? 'Review' : 'Completed',
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
          submission: t.submissionUrl ? {
            fileUrl: t.submissionUrl,
            submittedAt: t.submittedAt ? new Date(t.submittedAt).toLocaleString() : '',
            notes: t.submissionNotes
          } : undefined
        }));
        dispatch({ type: 'SET_TASKS', payload: mappedTasks });
      }
    } catch (err) {
      console.error('Failed to load initial workspace data:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      // Clear data when logged out
      dispatch({ type: 'SET_DEPARTMENTS', payload: [] });
      dispatch({ type: 'SET_INTERNS', payload: [] });
      dispatch({ type: 'SET_MENTORS', payload: [] });
      dispatch({ type: 'SET_TASKS', payload: [] });
      dispatch({ type: 'CLEAR_CHAT_HISTORY' });
      return;
    }

    // Load user-specific chat history from localStorage
    try {
      const stored = localStorage.getItem(`ai_chat_history_${user.id}`);
      if (stored) {
        dispatch({ type: 'SET_CHAT_HISTORY', payload: JSON.parse(stored) });
      } else {
        dispatch({ type: 'CLEAR_CHAT_HISTORY' });
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }

    refreshData();
  }, [user]);

  // Persist chat history changes to localStorage
  useEffect(() => {
    if (user && state.chatHistory.length > 0) {
      try {
        localStorage.setItem(`ai_chat_history_${user.id}`, JSON.stringify(state.chatHistory));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [state.chatHistory, user]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

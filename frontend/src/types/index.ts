export type UserRole = 'hr' | 'mentor' | 'intern' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Intern {
  id: string;
  name: string;
  email: string;
  college: string;
  dept: string;
  mentor: string;
  score: number;
  status: 'Active' | 'Completed' | 'Pending';
  joined: string;
  attendance: number;
  phone?: string;
  dob?: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  skills?: string[];
  duration?: string;
  startDate?: string;
  whyJoin?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  gender?: string;
  semester?: string;
  address?: string;
  workAddress?: string;
  parentName?: string;
  parentPhone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  aadhaarPanUrl?: string;
  collegeIdUrl?: string;
  passportPhotoUrl?: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  dept: string;
  assignedInterns: number; // Count of interns
  rating: number;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  internCount: number;
  mentorCount: number;
  projectsCount: number;
  head: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Intern name or email
  mentor: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  dueDate: string;
  submission?: {
    fileUrl: string;
    submittedAt: string;
    notes?: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  audience: 'All' | 'HR' | 'Mentors' | 'Interns' | 'Engineering' | 'Design' | 'Marketing' | 'HR Dept';
  createdAt: string;
  author: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface LeaveRequest {
  id: string;
  internName: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

// ─── Mentor Details Types ───

export interface MentorDetails {
  id: string;
  userId: string;
  departmentId: string;
  rating: number;
  expertise: string[];
  bio: string | null;
  phone: string | null;
  designation: string | null;
  experience: number | null;
  skills: string[];
  mentorCapacity: number;
  mentorStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
  };
  department: {
    id: string;
    name: string;
    head: string;
    color: string;
  };
  interns: Array<{
    id: string;
    userId: string;
    status: string;
    score: number;
    attendance: number;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
    department: { id: string; name: string };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    createdAt: string;
    intern: { user: { name: string; avatarUrl: string | null } };
  }>;
  feedbacks: Array<{
    id: string;
    rating: number;
    comment: string;
    category: string | null;
    createdAt: string;
  }>;
  analytics: MentorAnalyticsData[];
  documents: MentorDocumentData[];
  activities: MentorActivityData[];
}

export interface MentorAnalyticsData {
  id: string;
  mentorId: string;
  totalInterns: number;
  completedInternships: number;
  avgRating: number;
  attendanceReviews: number;
  taskReviews: number;
  leaveApprovalsHandled: number;
  aiMentorScore: number | null;
  performanceTrend: Array<{ month: string; score: number; tasks: number }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorDocumentData {
  id: string;
  mentorId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  uploadedAt: string;
}

export interface MentorActivityData {
  id: string;
  mentorId: string;
  activityType: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface MentorWorkloadData {
  currentInterns: number;
  maxCapacity: number;
  workloadPercent: number;
  pendingTasks: number;
  pendingLeaves: number;
  pendingReviews: number;
  workloadStatus: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE';
  workloadMessage: string;
  availableSlots: number;
}

export interface MentorInternData {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  department: string;
  attendance: number;
  score: number;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  duration: string;
  startDate: string;
  joinedDate: string;
}

export interface MentorAIAnalysis {
  mentorName: string;
  effectivenessScore: number;
  effectivenessLevel: string;
  satisfactionScore: number;
  avgRating: number;
  taskCompletionRate: number;
  internSuccessRate: number;
  totalInterns: number;
  completedInternships: number;
  recommendations: string[];
  analyzedAt: string;
}

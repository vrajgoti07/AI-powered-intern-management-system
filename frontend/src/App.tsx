import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Toaster } from 'react-hot-toast';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { ApplyPage } from './pages/public/ApplyPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { RegisterPage } from './pages/public/RegisterPage';

// HR Admin Pages
import { HRDashboard } from './pages/hr/HRDashboard';
import { InternManagement } from './pages/hr/InternManagement';
import { MentorManagement } from './pages/hr/MentorManagement';
import { DepartmentManagement } from './pages/hr/DepartmentManagement';
import { DepartmentDetails } from './pages/hr/DepartmentDetails';
import { ReportsAnalytics } from './pages/hr/ReportsAnalytics';
import { Announcements } from './pages/hr/Announcements';
import { OnboardingVerification } from './pages/hr/OnboardingVerification';
import { MentorDetailsPage } from './pages/hr/mentor-details/MentorDetailsPage';

// Mentor Pages
import { MentorDashboard } from './pages/mentor/MentorDashboard';
import { TaskManagement } from './pages/mentor/TaskManagement';
import { InternPerformance } from './pages/mentor/InternPerformance';
import { SubmissionReview } from './pages/mentor/SubmissionReview';

// Intern Pages
import { InternDashboard } from './pages/intern/InternDashboard';
import { MyTasks } from './pages/intern/MyTasks';
import { Attendance } from './pages/intern/Attendance';
import { Settings } from './pages/shared/Settings';
import { AIChatbot } from './pages/intern/AIChatbot';
import { OnboardingWorkflow } from './pages/intern/onboarding/OnboardingWorkflow';
import { TaskLifecycle } from './pages/intern/TaskLifecycle';
import { PortfolioDashboard } from './pages/intern/PortfolioDashboard';

// Shared Pages across portals
import { AIMatching } from './pages/ai-matching/AIMatching';
import { TaskCalendarView } from './pages/shared/TaskCalendarView';
import { PerformanceAnalytics } from './pages/shared/PerformanceAnalytics';
import { AIFeedback } from './pages/shared/feedback/AIFeedback';
import { CommunicationSystem } from './pages/shared/chat/CommunicationSystem';
import { AttendanceLeave } from './pages/shared/attendance/AttendanceLeave';
import { ReportsCertificates } from './pages/shared/reports/ReportsCertificates';
import { LifecycleTimeline } from './pages/shared/lifecycle/LifecycleTimeline';
import { SecurityPortal } from './pages/public/SecurityPortal';

// Super Admin Pages
import { SuperAdmin } from './pages/admin/SuperAdmin';

import { useAuth } from './hooks/useAuth';
import { useInternByUser } from './hooks/queries';
import { useOnboardingStatus } from './hooks/useOnboarding';

// Secure Role Route Guard Component
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole?: 'hr' | 'mentor' | 'intern' | 'admin';
  allowedRoles?: ('hr' | 'mentor' | 'intern' | 'admin')[];
  requireActiveIntern?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole, allowedRoles, requireActiveIntern }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);

  const userRoleLower = user.role.toLowerCase();
  const hasAccess = roles.includes(userRoleLower as any) || 
                    (userRoleLower === 'admin' && roles.includes('hr')) ||
                    (userRoleLower === 'department_head' && roles.includes('mentor'));
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  if (roles.includes('intern') && userRoleLower === 'intern' && requireActiveIntern) {
    return <ActiveInternGuard>{children}</ActiveInternGuard>;
  }

  return children;
};

const ActiveInternGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  const { data: myInternData, isLoading } = useInternByUser(user?.id || '');
  const { data: onboardingStatus, isLoading: obLoading } = useOnboardingStatus();

  if (isLoading || obLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Must be ACTIVE status
  const isOnboardingDone = myInternData?.status === 'ACTIVE';

  if (!myInternData || !isOnboardingDone) {
    return <Navigate to="/intern/onboarding" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'text-xs font-bold text-slate-800 bg-white border border-slate-100 rounded-2xl shadow-xl',
              duration: 3000,
            }} 
          />
          <Routes>
            {/* Public Access */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* HR Admin Secured Route Portal */}
            <Route 
              path="/hr/dashboard" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/interns" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <InternManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/onboarding-verification" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <OnboardingVerification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/mentors" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <MentorManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/mentors/:mentorId" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <MentorDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/departments" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <DepartmentManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/departments/:id" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <DepartmentDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/reports" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <ReportsAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/announcements" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <Announcements />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/settings" 
              element={
                <ProtectedRoute allowedRole="hr">
                  <Settings />
                </ProtectedRoute>
              } 
            />
            {/* Corporate Mentor Secured Route Portal */}
            <Route 
              path="/mentor/dashboard" 
              element={
                <ProtectedRoute allowedRole="mentor">
                  <MentorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/tasks" 
              element={
                <ProtectedRoute allowedRole="mentor">
                  <TaskManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/tasks/review" 
              element={
                <ProtectedRoute allowedRole="mentor">
                  <SubmissionReview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/performance" 
              element={
                <ProtectedRoute allowedRole="mentor">
                  <InternPerformance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/settings" 
              element={
                <ProtectedRoute allowedRole="mentor">
                  <Settings />
                </ProtectedRoute>
              } 
            />
            {/* Intern Personal Secured Route Portal */}
            <Route 
              path="/intern/dashboard" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <InternDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intern/onboarding" 
              element={
                <ProtectedRoute allowedRole="intern">
                  <OnboardingWorkflow />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intern/tasks" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <MyTasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intern/tasks/lifecycle" 
              element={<Navigate to="/intern/tasks" replace />} 
            />
            <Route 
              path="/intern/attendance" 
              element={<Navigate to="/shared/attendance-leave" replace />} 
            />
            <Route 
              path="/intern/profile" 
              element={<Navigate to="/intern/settings" replace />} 
            />
            <Route 
              path="/intern/settings" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intern/portfolio" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <PortfolioDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intern/chatbot" 
              element={<Navigate to="/shared/communication" replace />} 
            />

            {/* Shared Secure Portals */}
            <Route 
              path="/shared/ai-matching" 
              element={<Navigate to="/shared/performance-analytics" replace />} 
            />
            <Route 
              path="/shared/task-calendar" 
              element={<Navigate to="/intern/tasks" replace />} 
            />
            <Route 
              path="/shared/performance-analytics" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <PerformanceAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared/ai-feedback" 
              element={<Navigate to="/shared/performance-analytics" replace />} 
            />
            <Route 
              path="/shared/communication" 
              element={
                <ProtectedRoute allowedRoles={['intern', 'mentor']} requireActiveIntern>
                  <CommunicationSystem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared/attendance-leave" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <AttendanceLeave />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared/reports-certificates" 
              element={<Navigate to="/shared/performance-analytics" replace />} 
            />
            <Route 
              path="/shared/lifecycle-timeline" 
              element={
                <ProtectedRoute allowedRole="intern" requireActiveIntern>
                  <LifecycleTimeline />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared/security" 
              element={<Navigate to="/intern/settings" replace />} 
            />

            {/* Super Admin Secured Route Panel */}
            <Route 
              path="/admin/super-admin" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <SuperAdmin />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

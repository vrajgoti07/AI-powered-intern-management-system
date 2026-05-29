import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

// Public Pages
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/public/LoginPage').then(m => ({ default: m.LoginPage })));
const ApplyPage = React.lazy(() => import('./pages/public/ApplyPage').then(m => ({ default: m.ApplyPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/public/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/public/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const RegisterPage = React.lazy(() => import('./pages/public/RegisterPage').then(m => ({ default: m.RegisterPage })));
const RoadmapPage = React.lazy(() => import('./pages/public/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const AboutPage = React.lazy(() => import('./pages/public/AboutPage').then(m => ({ default: m.AboutPage })));
const CareersPage = React.lazy(() => import('./pages/public/CareersPage').then(m => ({ default: m.CareersPage })));
const PressPage = React.lazy(() => import('./pages/public/PressPage').then(m => ({ default: m.PressPage })));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage').then(m => ({ default: m.ContactPage })));
const PrivacyPage = React.lazy(() => import('./pages/public/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/public/TermsPage').then(m => ({ default: m.TermsPage })));
const CookieSettingsPage = React.lazy(() => import('./pages/public/CookieSettingsPage').then(m => ({ default: m.CookieSettingsPage })));
const SecurityPage = React.lazy(() => import('./pages/public/SecurityPage').then(m => ({ default: m.SecurityPage })));

// HR Admin Pages
const HRDashboard = React.lazy(() => import('./pages/hr/HRDashboard').then(m => ({ default: m.HRDashboard })));
const InternManagement = React.lazy(() => import('./pages/hr/InternManagement').then(m => ({ default: m.InternManagement })));
const MentorManagement = React.lazy(() => import('./pages/hr/MentorManagement').then(m => ({ default: m.MentorManagement })));
const DepartmentManagement = React.lazy(() => import('./pages/hr/DepartmentManagement').then(m => ({ default: m.DepartmentManagement })));
const DepartmentDetails = React.lazy(() => import('./pages/hr/DepartmentDetails').then(m => ({ default: m.DepartmentDetails })));
const DepartmentHeadDashboard = React.lazy(() => import('./pages/department-head/DepartmentDashboard').then(m => ({ default: m.DepartmentDashboard })));
const ReportsAnalytics = React.lazy(() => import('./pages/hr/ReportsAnalytics').then(m => ({ default: m.ReportsAnalytics })));
const Announcements = React.lazy(() => import('./pages/hr/Announcements').then(m => ({ default: m.Announcements })));
const OnboardingVerification = React.lazy(() => import('./pages/hr/OnboardingVerification').then(m => ({ default: m.OnboardingVerification })));
const MentorDetailsPage = React.lazy(() => import('./pages/hr/mentor-details/MentorDetailsPage').then(m => ({ default: m.MentorDetailsPage })));
const AIRecommendations = React.lazy(() => import('./pages/hr/AIRecommendations').then(m => ({ default: m.AIRecommendations })));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs').then(m => ({ default: m.AuditLogs })));

// Mentor Pages
const MentorDashboard = React.lazy(() => import('./pages/mentor/MentorDashboard').then(m => ({ default: m.MentorDashboard })));
const TaskManagement = React.lazy(() => import('./pages/mentor/TaskManagement').then(m => ({ default: m.TaskManagement })));
const InternPerformance = React.lazy(() => import('./pages/mentor/InternPerformance').then(m => ({ default: m.InternPerformance })));
const SubmissionReview = React.lazy(() => import('./pages/mentor/SubmissionReview').then(m => ({ default: m.SubmissionReview })));

// Intern Pages
const InternDashboard = React.lazy(() => import('./pages/intern/InternDashboard').then(m => ({ default: m.InternDashboard })));
const MyTasks = React.lazy(() => import('./pages/intern/MyTasks').then(m => ({ default: m.MyTasks })));
// const Attendance = React.lazy(() => import('./pages/intern/Attendance').then(m => ({ default: m.Attendance })));
const Settings = React.lazy(() => import('./pages/shared/Settings').then(m => ({ default: m.Settings })));
// const AIChatbot = React.lazy(() => import('./pages/intern/AIChatbot').then(m => ({ default: m.AIChatbot })));
const OnboardingWorkflow = React.lazy(() => import('./pages/intern/onboarding/OnboardingWorkflow').then(m => ({ default: m.OnboardingWorkflow })));
// const TaskLifecycle = React.lazy(() => import('./pages/intern/TaskLifecycle').then(m => ({ default: m.TaskLifecycle })));
const PortfolioDashboard = React.lazy(() => import('./pages/intern/PortfolioDashboard').then(m => ({ default: m.PortfolioDashboard })));

// Shared Pages across portals
// const AIMatching = React.lazy(() => import('./pages/ai-matching/AIMatching').then(m => ({ default: m.AIMatching })));
// const TaskCalendarView = React.lazy(() => import('./pages/shared/TaskCalendarView').then(m => ({ default: m.TaskCalendarView })));
const PerformanceAnalytics = React.lazy(() => import('./pages/shared/PerformanceAnalytics').then(m => ({ default: m.PerformanceAnalytics })));
// const AIFeedback = React.lazy(() => import('./pages/shared/feedback/AIFeedback').then(m => ({ default: m.AIFeedback })));
const CommunicationSystem = React.lazy(() => import('./pages/shared/chat/CommunicationSystem').then(m => ({ default: m.CommunicationSystem })));
const AttendanceLeave = React.lazy(() => import('./pages/shared/attendance/AttendanceLeave').then(m => ({ default: m.AttendanceLeave })));
// const ReportsCertificates = React.lazy(() => import('./pages/shared/reports/ReportsCertificates').then(m => ({ default: m.ReportsCertificates })));
const LifecycleTimeline = React.lazy(() => import('./pages/shared/lifecycle/LifecycleTimeline').then(m => ({ default: m.LifecycleTimeline })));
// const SecurityPortal = React.lazy(() => import('./pages/public/SecurityPortal').then(m => ({ default: m.SecurityPortal })));

// Super Admin Pages
const SuperAdmin = React.lazy(() => import('./pages/admin/SuperAdmin').then(m => ({ default: m.SuperAdmin })));

import { PageLoader } from './components/PageLoader';

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
  const hasAccess = roles.includes(userRoleLower as 'hr' | 'mentor' | 'intern' | 'admin') ||
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
  const { isLoading: obLoading } = useOnboardingStatus();

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
        <NotificationProvider>
          <AppProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'text-xs font-bold text-slate-800 bg-white border border-slate-100 rounded-2xl shadow-xl',
                duration: 3000,
              }}
            />
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Access */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/apply" element={<ApplyPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/press" element={<PressPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookieSettingsPage />} />
                <Route path="/security" element={<SecurityPage />} />

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
                  path="/hr/ai-recommendations"
                  element={
                    <ProtectedRoute allowedRole="hr">
                      <AIRecommendations />
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
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRole="hr">
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />

                {/* Department Head Dashboard */}
                <Route
                  path="/department-head/dashboard"
                  element={
                    <ProtectedRoute allowedRole="mentor">
                      <DepartmentHeadDashboard />
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
            </React.Suspense>
          </AppProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

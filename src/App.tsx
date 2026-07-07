import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage"; // 👈 सीधे हमारा मुख्य पेज लोड होगा
const Preferences = React.lazy(() => import("./pages/Preferences"));
const CompanyPreferences = React.lazy(() => import("./pages/CompanyPreferences"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const CompanyDashboard = React.lazy(() => import("./pages/CompanyDashboard"));
const AddProject = React.lazy(() => import("./pages/AddProject"));
const MyProjects = React.lazy(() => import("./pages/MyProjects"));
const ApplicantsHub = React.lazy(() => import("./pages/ApplicantsHub"));
const AnalyticsDashboard = React.lazy(() => import("./pages/AnalyticsDashboard"));
const StudentProfile = React.lazy(() => import("./pages/StudentProfile"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const ChatPage = React.lazy(() => import("./pages/ChatPage"));
import ProtectedRoute from "./components/ProtectedRoute";
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const ProjectDetails = React.lazy(() => import("./pages/ProjectDetails"));
import Navbar from "./components/Navbar";
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const TermsPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.TermsPage })));
const PrivacyPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.PrivacyPage })));
const RefundPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.RefundPage })));
import { WebSocketProvider } from "./components/WebSocketContext";
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const CalendarView = React.lazy(() => import("./pages/CalendarView"));
const CompanySettings = React.lazy(() => import("./pages/CompanySettings"));
const CollegeDashboard = React.lazy(() => import("./pages/CollegeDashboard"));
const PlacementPipeline = React.lazy(() => import("./pages/PlacementPipeline"));
import { ThemeProvider } from "./components/ThemeContext";
import AIAssistant from "./components/AIAssistant";
const ResumeChecker = React.lazy(() => import("./pages/ResumeChecker"));
const FacultyDashboard = React.lazy(() => import("./pages/FacultyDashboard"));

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const savedUser = localStorage.getItem("user");
  
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.userRole === "company") {
      return <Navigate to="/company-dashboard" replace />;
    } else if (user.userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.userRole === "college") {
      return <Navigate to="/college-dashboard" replace />;
    } else if (user.userRole === "faculty") {
      return <Navigate to="/faculty-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

const ProtectedLayout = ({ allowedRoles, children }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Navbar />
      {children}
      <AIAssistant />
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-transparent dark:text-ink-100 transition-colors duration-200">
        <WebSocketProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-transparent text-marigold-500 font-bold tracking-widest text-sm uppercase">Loading Platform...</div>}>
          <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
                <Route path="/about" element={<AboutPage />} />
                
                <Route path="/preferences" element={<ProtectedRoute allowedRoles={["student"]}><Preferences /></ProtectedRoute>} />
                <Route path="/company-preferences" element={<ProtectedRoute allowedRoles={["company"]}><CompanyPreferences /></ProtectedRoute>} />
                
                <Route path="/dashboard" element={<ProtectedLayout allowedRoles={["student"]}><Dashboard /></ProtectedLayout>} />
                <Route path="/project/:projectId" element={<ProtectedLayout allowedRoles={["student"]}><ProjectDetails /></ProtectedLayout>} />
                
                {/* ========================================================================= */}
                {/* 🚀 NEW CORPORATE MANAGEMENT ROUTES (Phase 1, 2 & 5)                       */}
                {/* ========================================================================= */}
                <Route path="/company-dashboard" element={<ProtectedLayout allowedRoles={["company"]}><CompanyDashboard /></ProtectedLayout>} />
                <Route path="/add-project" element={<ProtectedLayout allowedRoles={["company"]}><AddProject /></ProtectedLayout>} />
                <Route path="/my-projects" element={<ProtectedLayout allowedRoles={["company"]}><MyProjects /></ProtectedLayout>} />
                <Route path="/applicants" element={<ProtectedLayout allowedRoles={["company"]}><ApplicantsHub /></ProtectedLayout>} />
                <Route path="/analytics" element={<ProtectedLayout allowedRoles={["company"]}><AnalyticsDashboard /></ProtectedLayout>} />
                <Route path="/calendar" element={<ProtectedLayout allowedRoles={["company"]}><CalendarView /></ProtectedLayout>} />
                <Route path="/company-settings" element={<ProtectedLayout allowedRoles={["company"]}><CompanySettings /></ProtectedLayout>} />
                <Route path="/placement-pipeline" element={<ProtectedLayout allowedRoles={["company", "college"]}><PlacementPipeline /></ProtectedLayout>} />
                
                <Route path="/student-profile/:email" element={<ProtectedLayout><StudentProfile /></ProtectedLayout>} />
                <Route path="/student/:email" element={<ProtectedLayout><StudentProfile /></ProtectedLayout>} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/chat" element={<ProtectedLayout><ChatPage /></ProtectedLayout>} />
                <Route path="/chat/:recipientEmail" element={<ProtectedLayout><ChatPage /></ProtectedLayout>} />
                
                <Route path="/admin-dashboard" element={<ProtectedLayout allowedRoles={["admin"]}><AdminDashboard /></ProtectedLayout>} />
                <Route path="/college-dashboard" element={<ProtectedLayout allowedRoles={["college"]}><CollegeDashboard /></ProtectedLayout>} />
                <Route path="/faculty-dashboard" element={<ProtectedLayout allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedLayout>} />
                <Route path="/resume-checker" element={<ProtectedLayout><ResumeChecker /></ProtectedLayout>} />
                
                {/* 404 Wildcard Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
          </WebSocketProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
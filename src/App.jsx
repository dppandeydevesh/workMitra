import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage"; // 👈 सीधे हमारा मुख्य पेज लोड होगा
import Preferences from "./pages/Preferences";
import CompanyPreferences from "./pages/CompanyPreferences"; // 👈 न्यू कंपनी प्रिफरेंस पेज
import Dashboard from "./pages/Dashboard";
import CompanyDashboard from "./pages/CompanyDashboard"; // 👈 🏢 न्यू इम्पोर्ट: कंपनी डैशबोर्ड
import AddProject from "./pages/AddProject";             // 👈 ➕ न्यू इम्पोर्ट: प्रोजेक्ट फॉर्म पेज
import MyProjects from "./pages/MyProjects";             // 👈 📂 न्यू इम्पोर्ट: प्रोजेक्ट एनालिसिस हब
import ApplicantsHub from "./pages/ApplicantsHub";       // 👈 👨‍🎓 न्यू इम्पोर्ट: एप्लिकेंट्स कमांड सेंटर
import AnalyticsDashboard from "./pages/AnalyticsDashboard"; // 👈 📈 न्यू इम्पोर्ट: रिक्रूटर एनालिटिक्स हब
import StudentProfile from "./pages/StudentProfile";       // 👈 🎓 न्यू इम्पोर्ट: स्टूडेंट प्रोफाइल/पोर्टफोलियो
import ResetPasswordPage from "./pages/ResetPasswordPage"; // 👈 🔑 न्यू इम्पोर्ट: रीसेट पासवर्ड पेज
import ChatPage from "./pages/ChatPage"; // 👈 💬 न्यू इम्पोर्ट: चैट रूम पेज
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import ProjectDetails from "./pages/ProjectDetails";       // 👈 📂 न्यू इम्पोर्ट: प्रोजेक्ट डिटेल्स
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import { TermsPage, PrivacyPage, RefundPage } from "./pages/LegalPages";
import { WebSocketProvider } from "./components/WebSocketContext";
import AdminDashboard from "./pages/AdminDashboard";
import CalendarView from "./pages/CalendarView";
import CompanySettings from "./pages/CompanySettings";
import CollegeDashboard from "./pages/CollegeDashboard";
import PlacementPipeline from "./pages/PlacementPipeline";

const PublicRoute = ({ children }) => {
  const savedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (savedUser && token) {
    const user = JSON.parse(savedUser);
    if (user.userRole === "company") {
      return <Navigate to="/company-dashboard" replace />;
    } else if (user.userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.userRole === "college") {
      return <Navigate to="/college-dashboard" replace />;
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
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ToastProvider>
      <WebSocketProvider>
        <BrowserRouter>
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
            
            {/* 404 Wildcard Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </ToastProvider>
  );
}

export default App;
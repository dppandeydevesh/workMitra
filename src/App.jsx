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

const PublicRoute = ({ children }) => {
  const savedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (savedUser && token) {
    const user = JSON.parse(savedUser);
    if (user.userRole === "company") {
      return <Navigate to="/company-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🚀 वेबसाइट खुलते ही (यानी '/') सीधे लॉगिन पेज दिखेगा */}
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        
        <Route path="/preferences" element={<ProtectedRoute allowedRoles={["student"]}><Preferences /></ProtectedRoute>} />
        <Route path="/company-preferences" element={<ProtectedRoute allowedRoles={["company"]}><CompanyPreferences /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><Dashboard /></ProtectedRoute>} />
        
        {/* ========================================================================= */}
        {/* 🚀 NEW CORPORATE MANAGEMENT ROUTES (Phase 1, 2 & 5)                       */}
        {/* ========================================================================= */}
        <Route path="/company-dashboard" element={<ProtectedRoute allowedRoles={["company"]}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/add-project" element={<ProtectedRoute allowedRoles={["company"]}><AddProject /></ProtectedRoute>} />
        <Route path="/my-projects" element={<ProtectedRoute allowedRoles={["company"]}><MyProjects /></ProtectedRoute>} />
        <Route path="/applicants" element={<ProtectedRoute allowedRoles={["company"]}><ApplicantsHub /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={["company"]}><AnalyticsDashboard /></ProtectedRoute>} />
        
        <Route path="/student-profile/:email" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:recipientEmail" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        
        {/* 404 Wildcard Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
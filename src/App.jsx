import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🚀 वेबसाइट खुलते ही (यानी '/') सीधे लॉगिन पेज दिखेगा */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/company-preferences" element={<CompanyPreferences />} /> {/* 🏢 न्यू कंपनी रूट */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* ========================================================================= */}
        {/* 🚀 NEW CORPORATE MANAGEMENT ROUTES (Phase 1, 2 & 5)                       */}
        {/* ========================================================================= */}
        <Route path="/company-dashboard" element={<CompanyDashboard />} />
        <Route path="/add-project" element={<AddProject />} />
        <Route path="/my-projects" element={<MyProjects />} /> {/* 📊 न्यू प्रोजेक्ट एनालिसिस रूट */}
        <Route path="/applicants" element={<ApplicantsHub />} /> {/* 👨‍🎓 न्यू एप्लिकेंट्स रूट */}
        <Route path="/analytics" element={<AnalyticsDashboard />} /> {/* 📈 न्यू एनालिटिक्स रूट */}
        <Route path="/student-profile/:email" element={<StudentProfile />} /> {/* 🎓 न्यू स्टूडेंट प्रोफाइल रूट */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
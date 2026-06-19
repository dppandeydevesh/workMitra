import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage"; // 👈 सीधे हमारा मुख्य पेज लोड होगा
import Preferences from "./pages/Preferences";
import CompanyPreferences from "./pages/CompanyPreferences"; // 👈 न्यू कंपनी प्रिफरेंस पेज
import Dashboard from "./pages/Dashboard";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
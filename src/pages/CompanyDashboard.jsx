import { useNavigate } from "react-router-dom";

export default function CompanyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-10 object-contain" />
            </div>
            <div className="flex space-x-4">
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => navigate("/company-preferences")}>Profile</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Company Command Center</h1>
            <p className="text-gray-600 mt-1">Deploy new tracks, review technical solutions, and manage student talent nodes.</p>
          </div>

          {/* Core Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            
            {/* Action Card 1: Add New Project */}
            <button 
              onClick={() => navigate("/add-project")}
              className="group text-left p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <div className="text-3xl mb-4">➕</div>
              <h3 className="font-bold text-lg mb-1">Add New Project</h3>
              <p className="text-blue-100 text-xs leading-relaxed">Deploy a fresh project stack onto the student live marketplace grid.</p>
            </button>

            {/* Action Card 2: My Projects */}
            <button 
              onClick={() => navigate("/my-projects")}
              className="group text-left p-6 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100/70 transition transform hover:-translate-y-0.5"
            >
              <div className="text-3xl mb-4">📂</div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">My Projects</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Monitor requirements status updates, edit data payloads, and view lifecycles.</p>
            </button>

            {/* Action Card 3: Analytics */}
            <div className="p-6 bg-purple-50 border border-purple-100 rounded-xl opacity-75 relative cursor-not-allowed">
              <span className="absolute top-3 right-3 bg-purple-200 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Phase 7</span>
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Analytics</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Analyze applicant data distributions, matching counts, and average ratings.</p>
            </div>

            {/* Action Card 4: Applicants */}
            <div className="p-6 bg-green-50 border border-green-100 rounded-xl opacity-75 relative cursor-not-allowed">
              <span className="absolute top-3 right-3 bg-green-200 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Phase 6</span>
              <div className="text-3xl mb-4">👨‍🎓</div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Applicants</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Audit code applications, view matching profiles, and filter portfolios.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
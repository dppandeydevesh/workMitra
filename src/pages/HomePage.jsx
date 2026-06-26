import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function HomePage() {
  const navigate = useNavigate();
  
  // Aeroplane animation state
  const [position, setPosition] = useState(0);

  // Aeroplane moving animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 30);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      

      {/* Aeroplane */}
      <div 
        className="fixed z-40 transition-all duration-75"
        style={{ 
          left: `${position}%`, 
          top: '20%',
          transform: 'translateY(-50%)'
        }}
      >
        <div className="text-5xl animate-pulse">✈️</div>
        {/* Trail effect */}
        <div className="absolute -z-10 w-32 h-1 bg-gradient-to-r from-transparent to-blue-500 right-full top-1/2" />
      </div>

      {/* Moving line path */}
      <div className="absolute top-[20%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

      {/* Navbar */}
      <nav className="bg-white shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="text-xl font-bold text-blue-600">Spacelance</div>
            
            {/* Nav Links - Desktop */}
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600">Home</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Find work</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Find Freelancers</a>
            </div>

            {/* Buttons */}
            <div className="hidden md:flex space-x-4">
              <button 
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Post a project
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">Are you looking for</h2>
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mt-2">Freelancers?</h1>
        </div>

        {/* Description */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-gray-600 text-lg">
            Hire Great Freelancers, Fast. <span className="font-semibold">Spacelance</span> helps you 
            hire elite freelancers at a moment's notice
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <button 
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Hire a freelancer →
          </button>
          <button 
            onClick={() => navigate("/login")}
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            search freelance work →
          </button>
        </div>

        {/* 2 CARDS - (Pehle 3 the, ab 2) */}
        <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          
          {/* Card 1: Search Jobs */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Search Jobs</h3>
            <p className="text-gray-500">Find the best freelance work that matches your skills</p>
          </div>

          {/* Card 2: Search Freelancers */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Search Freelancers</h3>
            <p className="text-gray-500">Hire top-rated freelancers for your projects</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mt-16 pt-8 border-t border-gray-200">
          © 2024 Spacelance. All rights reserved.
        </div>
      </div>
    </div>
  );
}
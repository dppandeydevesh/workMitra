import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-6 select-none">
      <div className="text-center space-y-6 max-w-md bg-white p-8 rounded-[40px] shadow-[0_20px_50px_rgba(100,50,150,0.08)] border border-white/60">
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">404</h1>
        <h2 className="text-2xl font-extrabold text-purple-950">Page Not Found</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          The connection node you are looking for does not exist or has been archived.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition hover:opacity-95"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}

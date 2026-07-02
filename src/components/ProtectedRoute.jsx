import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const savedUser = localStorage.getItem("user");
  
  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    user = JSON.parse(savedUser);
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // If role checks are enabled
  if (allowedRoles && !allowedRoles.includes(user.userRole)) {
    if (user.userRole === "company") {
      return <Navigate to="/company-dashboard" replace />;
    } else if (user.userRole === "college") {
      return <Navigate to="/college-dashboard" replace />;
    } else if (user.userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Enforce profile onboarding completion
  const currentPath = window.location.pathname;
  if (user.userRole !== "college" && user.userRole !== "admin" && !user.hasCompletedProfile && currentPath !== "/preferences" && currentPath !== "/company-preferences") {
    if (user.userRole === "company") {
      return <Navigate to="/company-preferences" replace />;
    } else {
      return <Navigate to="/preferences" replace />;
    }
  }

  return children;
}

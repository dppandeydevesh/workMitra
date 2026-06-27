import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const savedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!savedUser || !token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(savedUser);

  // If role checks are enabled
  if (allowedRoles && !allowedRoles.includes(user.userRole)) {
    // Redirect students to student dashboard, companies to company dashboard
    if (user.userRole === "company") {
      return <Navigate to="/company-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Enforce profile onboarding completion
  const currentPath = window.location.pathname;
  if (!user.hasCompletedProfile && currentPath !== "/preferences" && currentPath !== "/company-preferences") {
    if (user.userRole === "company") {
      return <Navigate to="/company-preferences" replace />;
    } else {
      return <Navigate to="/preferences" replace />;
    }
  }

  return children;
}

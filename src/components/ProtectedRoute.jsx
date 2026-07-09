import React, { useEffect, useState} from"react";
import { Navigate, useLocation} from"react-router-dom";
import { fetchWithAuth} from"../services/apiClient";
import { API_BASE_URL} from"../config";

export default function ProtectedRoute({ children, allowedRoles}) {const [isVerifying, setIsVerifying] = useState(true);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [userRole, setUserRole] = useState(null);
 const location = useLocation();

 useEffect(() => {let isMounted = true;
 const verifySession = async () => {try {const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/me`);
 if (res.ok) {const user = await res.json();
 if (isMounted) {setIsAuthenticated(true);
 setUserRole(user.userRole);
 
 // Sync with localStorage for legacy components that depend on it
 localStorage.setItem("user", JSON.stringify(user));
 if (user.hasPaidPass) {localStorage.setItem("hasPaidPass","true");
}
}
} else {if (isMounted) setIsAuthenticated(false);
}
} catch (err) { console.error(err);if (isMounted) setIsAuthenticated(false);
} finally {if (isMounted) setIsVerifying(false);
}
};
 
 verifySession();
 return () => { isMounted = false;};
}, []);

 if (isVerifying) {return (
 <div className="min-h-screen flex items-center justify-center bg-ink-50">
 <div className="flex flex-col items-center">
 <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
 <p className="mt-4 text-ink-500 font-medium animate-pulse">Authenticating securely...</p>
 </div>
 </div>
 );
}

 if (!isAuthenticated) {return <Navigate to="/login" state={{ from: location}} replace />;
}



 // If role checks are enabled
 if (allowedRoles && !allowedRoles.includes(userRole)) {return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50">
 <span className="text-6xl mb-4">⛔</span>
 <h1 className="text-2xl font-bold text-ink-800 mb-2">Access Denied</h1>
 <p className="text-ink-500 mb-6">You don"t have permission to view this page.</p>
 <button 
 onClick={() => window.location.href ="/"} 
 className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition">
 Return Home
 </button>
 </div>
 );
}

 // Enforce profile onboarding completion
 const currentPath = window.location.pathname;
 try {const user = JSON.parse(localStorage.getItem("user") ||"{}");
 if (user.userRole !=="college" && user.userRole !=="admin" && !user.hasCompletedProfile && currentPath !=="/preferences" && currentPath !=="/company-preferences") {if (user.userRole ==="company") {return <Navigate to="/company-preferences" replace />;
} else {return <Navigate to="/preferences" replace />;
}
}
// eslint-disable-next-line no-unused-vars
} catch (e) {
  // ignore parsing errors
}

 return children;
}

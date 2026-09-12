import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // If route requires a role they don't have, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and authorized, render the child components
  return children;
};

export default ProtectedRoute;

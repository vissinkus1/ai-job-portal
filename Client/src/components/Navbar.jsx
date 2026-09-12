import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";
import { SERVER_URL } from "../config/apiConfig";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      api.get("/profile/me")
        .then((res) => {
          setRole(res.data.role);
          setIsAdmin(!!res.data.isAdmin);
          setProfilePic(res.data.profilePicture?.filename || null);
          setUserName(res.data.name || "");
        })
        .catch(() => { setRole(null); setIsAdmin(false); setProfilePic(null); });
    } else {
      setRole(null);
      setProfilePic(null);
    }
  }, [token, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚡ AI Job Portal
      </Link>

      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" className={isActive("/")}>Home</Link>
        <Link to="/jobs" className={isActive("/jobs")}>Jobs</Link>

        {token ? (
          <>
            <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
            <Link to="/recommendations" className={isActive("/recommendations")}>🤖 AI Match</Link>
            <Link to="/skill-gap" className={isActive("/skill-gap")}>🧠 Skill Gap</Link>
            <Link to="/resume-score" className={isActive("/resume-score")}>📄 Resume AI</Link>
            <Link to="/chat" className={isActive("/chat")}>💬 Chat</Link>
            <Link to="/analytics" className={isActive("/analytics")}>📊 Analytics</Link>

            {role === "employer" ? (
              <Link to="/manage-jobs" className={isActive("/manage-jobs")}>Manage Jobs</Link>
            ) : (
              <>
                <Link to="/my-applications" className={isActive("/my-applications")}>My Apps</Link>
                <Link to="/saved-jobs" className={isActive("/saved-jobs")}>🔖 Saved</Link>
                <Link to="/job-alerts" className={isActive("/job-alerts")}>🔔 Alerts</Link>
              </>
            )}

            {isAdmin && <Link to="/admin" className={isActive("/admin")}>📊 Admin</Link>}

            <Link to="/profile" className={`${isActive("/profile")} nav-profile-link`}>
              {profilePic ? (
                <img
                  src={`${SERVER_URL}/uploads/${profilePic}`}
                  alt=""
                  className="nav-avatar-img"
                />
              ) : (
                <span className="nav-avatar-letter">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </span>
              )}
              Profile
            </Link>
            <Link to="/settings" className={isActive("/settings")}>⚙️ Settings</Link>
            <div className="nav-divider" />
            <div className="nav-actions-row">
              <NotificationBell />
              <ThemeToggle />
            </div>
            <button onClick={handleLogout} className="nav-button ghost">Logout</button>
          </>
        ) : (
          <>
            <div className="nav-divider" />
            <div className="nav-actions-row">
              <ThemeToggle />
            </div>
            <Link to="/login" className="nav-button ghost">Login</Link>
            <Link to="/register" className="nav-button primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

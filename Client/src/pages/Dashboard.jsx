import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, jobsRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/jobs"),
      ]);
      setUser(profileRes.data);
      setJobs(jobsRes.data);

      // Fetch applications
      try {
        const appsRes = await api.get("/applications/me");
        setMyApps(appsRes.data);
      } catch {
        setMyApps([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const myJobs = user ? jobs.filter((j) => j.postedBy?._id === user._id) : [];
  const profileComplete = user
    ? [user.name, user.bio, user.phone, user.skills?.length > 0].filter(Boolean).length
    : 0;

  const acceptedApps = myApps.filter((a) => a.status === "accepted").length;
  const pendingApps = myApps.filter((a) => a.status === "pending").length;

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="dashboard-banner fade-in-up">
        <div className="banner-content">
          <div className="banner-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1>Welcome back, {user?.name?.split(" ")[0] || "User"} 👋</h1>
            <p className="banner-role">
              <span className={`badge ${user?.role === "employer" ? "secondary" : "primary"}`}>
                {user?.role === "employer" ? "👔 Employer" : "🔍 Job Seeker"}
              </span>
              <span className="banner-email">{user?.email}</span>
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="glass-button secondary small">
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="stat-card">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-info">
            <span className="stat-card-number">{profileComplete}/4</span>
            <span className="stat-card-label">Profile Complete</span>
          </div>
          <div className="stat-card-bar">
            <div className="stat-card-fill" style={{ width: `${(profileComplete / 4) * 100}%` }} />
          </div>
        </div>

        {user?.role === "employer" ? (
          <>
            <div className="stat-card">
              <div className="stat-card-icon">📝</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{myJobs.length}</span>
                <span className="stat-card-label">Jobs Posted</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">💼</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{jobs.length}</span>
                <span className="stat-card-label">Total Jobs</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-icon">📨</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{myApps.length}</span>
                <span className="stat-card-label">Applications</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{acceptedApps}</span>
                <span className="stat-card-label">Accepted</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">⏳</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{pendingApps}</span>
                <span className="stat-card-label">Pending</span>
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-info">
            <span className="stat-card-number">{user?.skills?.length || 0}</span>
            <span className="stat-card-label">Skills Listed</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="dashboard-section-title">Quick Actions</h2>
      <div className="quick-actions fade-in-up" style={{ animationDelay: "0.2s" }}>
        <Link to="/profile" className="action-card">
          <div className="action-icon">👤</div>
          <h3>Edit Profile</h3>
          <p>Update your info and skills</p>
        </Link>

        <Link to="/jobs" className="action-card">
          <div className="action-icon">🔍</div>
          <h3>Browse Jobs</h3>
          <p>Find your next opportunity</p>
        </Link>

        {user?.role === "employer" ? (
          <>
            <Link to="/post-job" className="action-card">
              <div className="action-icon">📝</div>
              <h3>Post a Job</h3>
              <p>Find the right talent</p>
            </Link>
            <Link to="/manage-jobs" className="action-card">
              <div className="action-icon">📋</div>
              <h3>Manage Jobs</h3>
              <p>View applicants & listings</p>
            </Link>
          </>
        ) : (
          <Link to="/my-applications" className="action-card">
            <div className="action-icon">📨</div>
            <h3>My Applications</h3>
            <p>Track your submissions</p>
          </Link>
        )}
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <>
          <h2 className="dashboard-section-title" style={{ marginTop: "32px" }}>Recent Jobs</h2>
          <div className="recent-jobs fade-in-up" style={{ animationDelay: "0.3s" }}>
            {jobs.slice(0, 5).map((job) => (
              <Link to={`/jobs/${job._id}`} key={job._id} className="recent-job-item">
                <div className="company-avatar small">
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className="recent-job-info">
                  <h4>{job.title}</h4>
                  <p>{job.company} • {job.location}</p>
                </div>
                <span className="badge primary">{job.type || "Full-time"}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

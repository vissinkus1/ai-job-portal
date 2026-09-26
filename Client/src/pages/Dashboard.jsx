import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import SEO from "../components/SEO";
import "../App.css";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [empStats, setEmpStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, jobsRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/jobs?limit=5&sort=-createdAt"),
      ]);
      setUser(profileRes.data);
      const jobsData = jobsRes.data.jobs || jobsRes.data;
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      // Fetch role-specific data
      if (profileRes.data.role === "employer") {
        try {
          const statsRes = await api.get("/dashboard/employer-stats");
          setEmpStats(statsRes.data);
        } catch { /* ignore */ }
      } else {
        try {
          const [appsRes, seekerRes] = await Promise.all([
            api.get("/applications/me"),
            api.get("/dashboard/seeker-stats").catch(() => ({ data: null })),
          ]);
          setMyApps(appsRes.data);
          if (seekerRes.data) setEmpStats(seekerRes.data); // reuse empStats for seeker analytics
        } catch { setMyApps([]); }
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
      <SEO title="Dashboard" description="Your personal dashboard — view applications, manage jobs, and track your career progress." />
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
              <div className="stat-card-icon">👥</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{empStats?.totalApplicants || 0}</span>
                <span className="stat-card-label">Total Applicants</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">📅</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{empStats?.interviewCount || 0}</span>
                <span className="stat-card-label">Interviews</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">📈</div>
              <div className="stat-card-info">
                <span className="stat-card-number">{empStats?.acceptanceRate || 0}%</span>
                <span className="stat-card-label">Accept Rate</span>
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
            {empStats && (
              <>
                <div className="stat-card">
                  <div className="stat-card-icon">📊</div>
                  <div className="stat-card-info">
                    <span className="stat-card-number">{empStats.responseRate}%</span>
                    <span className="stat-card-label">Response Rate</span>
                  </div>
                  <div className="stat-card-bar">
                    <div className="stat-card-fill" style={{ width: `${empStats.responseRate}%` }} />
                  </div>
                </div>
              </>
            )}
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

      {/* Employer Pipeline */}
      {user?.role === "employer" && empStats && (
        <>
          <h2 className="dashboard-section-title" style={{ marginTop: "32px" }}>Applicant Pipeline</h2>
          <div className="stats-grid fade-in-up" style={{ animationDelay: "0.15s" }}>
            {[
              { label: "Pending", count: empStats.statusCounts.pending, color: "#f59e0b", emoji: "⏳" },
              { label: "Reviewed", count: empStats.statusCounts.reviewed, color: "#00c6ff", emoji: "👀" },
              { label: "Accepted", count: empStats.statusCounts.accepted, color: "#22c55e", emoji: "✅" },
              { label: "Rejected", count: empStats.statusCounts.rejected, color: "#ef4444", emoji: "❌" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="stat-card-icon">{s.emoji}</div>
                <div className="stat-card-info">
                  <span className="stat-card-number">{s.count}</span>
                  <span className="stat-card-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {empStats.topJobs?.length > 0 && (
            <>
              <h2 className="dashboard-section-title" style={{ marginTop: "24px" }}>Top Jobs by Applicants</h2>
              <div className="recent-jobs fade-in-up" style={{ animationDelay: "0.2s" }}>
                {empStats.topJobs.map((j) => (
                  <Link to={`/manage-jobs/${j.jobId}/applicants`} key={j.jobId} className="recent-job-item">
                    <div className="recent-job-info">
                      <h4>{j.title}</h4>
                    </div>
                    <span className="badge primary">{j.applicants} applicant{j.applicants !== 1 ? "s" : ""}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Seeker Weekly Chart */}
      {user?.role === "seeker" && empStats?.weeklyData && (
        <>
          <h2 className="dashboard-section-title" style={{ marginTop: "32px" }}>📈 Applications This Month</h2>
          <div className="stat-card fade-in-up" style={{ animationDelay: "0.15s", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "100px" }}>
              {empStats.weeklyData.map((week, i) => {
                const maxCount = Math.max(...empStats.weeklyData.map(w => w.count), 1);
                const heightPct = Math.max((week.count / maxCount) * 100, 8);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-color)" }}>{week.count}</span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "50px",
                        height: `${heightPct}%`,
                        background: "var(--accent-gradient)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "height 0.5s ease",
                        minHeight: "6px",
                      }}
                    />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{week.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="dashboard-section-title" style={{ marginTop: "32px" }}>Quick Actions</h2>
      <div className="quick-actions fade-in-up" style={{ animationDelay: "0.25s" }}>
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

        <Link to="/analytics" className="action-card">
          <div className="action-icon">📊</div>
          <h3>Skill Analytics</h3>
          <p>Market trends & insights</p>
        </Link>

        <Link to="/skill-gap" className="action-card">
          <div className="action-icon">🧠</div>
          <h3>Skill Gap Analysis</h3>
          <p>AI-powered career roadmap</p>
        </Link>

        <Link to="/resume-score" className="action-card">
          <div className="action-icon">📄</div>
          <h3>Resume AI Score</h3>
          <p>ATS check & optimization</p>
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
          <>
            <Link to="/my-applications" className="action-card">
              <div className="action-icon">📨</div>
              <h3>My Applications</h3>
              <p>Track your submissions</p>
            </Link>
            <Link to="/job-alerts" className="action-card">
              <div className="action-icon">🔔</div>
              <h3>Job Alerts</h3>
              <p>Get notified of new matches</p>
            </Link>
          </>
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

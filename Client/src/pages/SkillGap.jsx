import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./SkillGap.css";

export default function SkillGap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [expandedPath, setExpandedPath] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const fetchData = async (role = "") => {
    setLoading(true);
    try {
      const url = role
        ? `/skill-gap/analysis?role=${encodeURIComponent(role)}`
        : "/skill-gap/analysis";
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch skill gap analysis");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/skill-gap/roles");
      setRoles(res.data.roles || []);
    } catch {
      // ignore
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    fetchData(role);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!data || data.readinessScore === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h3>No skills to analyze</h3>
          <p>{data?.message || "Add skills to your profile to get AI-powered skill gap analysis"}</p>
          <Link to="/profile" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Add Skills →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🧠 AI Skill Gap Analysis</h1>
        <p>{data.message}</p>
      </div>

      {/* Tab Navigation */}
      <div className="sg-tabs">
        {[
          { key: "overview", label: "📊 Overview", },
          { key: "gaps", label: "🎯 Skill Gaps" },
          { key: "paths", label: "🛤️ Learning Paths" },
          { key: "roles", label: "👔 Role Fit" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`sg-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="sg-tab-content fade-in-up">
          {/* Readiness Gauge */}
          <div className="sg-readiness-section">
            <div className="sg-gauge-card">
              <div className="sg-gauge">
                <svg viewBox="0 0 200 120" className="sg-gauge-svg">
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="var(--card-border)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.readinessScore / 100) * 251.2}, 251.2`}
                  />
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="sg-gauge-value">
                  <span className="sg-gauge-number">{data.readinessScore}</span>
                  <span className="sg-gauge-label">Market Readiness</span>
                </div>
              </div>
              <p className="sg-gauge-desc">
                {data.readinessScore >= 75
                  ? "🔥 Excellent! Your skills are highly aligned with market demand."
                  : data.readinessScore >= 50
                  ? "📈 Good foundation! A few strategic additions will boost your value significantly."
                  : data.readinessScore >= 25
                  ? "🎯 Growing profile. Focus on the high-priority skills below to level up fast."
                  : "🚀 Just getting started — the learning paths below will accelerate your growth."}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="sg-quick-stats">
              <div className="sg-stat-mini">
                <span className="sg-stat-mini-number">{data.ownedSkills?.length || 0}</span>
                <span className="sg-stat-mini-label">Your Skills</span>
              </div>
              <div className="sg-stat-mini">
                <span className="sg-stat-mini-number">{data.gapSkills?.length || 0}</span>
                <span className="sg-stat-mini-label">Gap Skills</span>
              </div>
              <div className="sg-stat-mini">
                <span className="sg-stat-mini-number">{data.learningPaths?.length || 0}</span>
                <span className="sg-stat-mini-label">Learning Paths</span>
              </div>
              <div className="sg-stat-mini">
                <span className="sg-stat-mini-number">{data.totalJobsAnalyzed}</span>
                <span className="sg-stat-mini-label">Jobs Analyzed</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {data.categoryBreakdown?.length > 0 && (
            <div className="sg-section">
              <h2>📂 Skill Category Breakdown</h2>
              <div className="sg-category-grid">
                {data.categoryBreakdown.map((cat, i) => (
                  <div key={i} className={`sg-category-card ${cat.strength}`}>
                    <div className="sg-cat-header">
                      <span className="sg-cat-name">{cat.category}</span>
                      <span className={`badge ${cat.strength === "strong" ? "primary" : cat.strength === "moderate" ? "secondary" : "danger"}`}>
                        {cat.strength === "strong" ? "💪 Strong" : cat.strength === "moderate" ? "📊 Building" : "🌱 New"}
                      </span>
                    </div>
                    <div className="sg-cat-stats">
                      <span className="sg-cat-owned">✅ {cat.owned} skills</span>
                      {cat.gaps > 0 && <span className="sg-cat-gaps">📚 {cat.gaps} gaps</span>}
                    </div>
                    {cat.topGaps.length > 0 && (
                      <div className="sg-cat-gaps-list">
                        {cat.topGaps.map((g, j) => (
                          <span key={j} className="badge skill-gap">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Strongest Skills */}
          {data.ownedSkills?.length > 0 && (
            <div className="sg-section">
              <h2>⚡ Your Skills by Market Demand</h2>
              <div className="sg-owned-skills">
                {data.ownedSkills.slice(0, 12).map((skill, i) => (
                  <div key={i} className="sg-owned-row">
                    <span className="sg-owned-name">{skill.skill}</span>
                    <div className="sg-owned-bar-track">
                      <div
                        className="sg-owned-bar-fill"
                        style={{
                          width: `${Math.min(skill.demandPercentage * 3, 100)}%`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    </div>
                    <span className="sg-owned-demand">
                      {skill.demand} job{skill.demand !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── GAPS TAB ─────────────────────────────────────────── */}
      {activeTab === "gaps" && (
        <div className="sg-tab-content fade-in-up">
          <div className="sg-section">
            <h2>🎯 Priority Skill Gaps</h2>
            <p className="sg-section-desc">
              Skills in highest demand that you haven't listed yet, ranked by priority.
            </p>

            {data.gapSkills?.length > 0 ? (
              <div className="sg-gap-list">
                {data.gapSkills.map((gap, i) => (
                  <div key={i} className="sg-gap-card fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="sg-gap-priority">
                      <div
                        className="sg-priority-ring"
                        style={{
                          background: gap.priority >= 60
                            ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : gap.priority >= 35
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        }}
                      >
                        {gap.priority}
                      </div>
                    </div>
                    <div className="sg-gap-info">
                      <div className="sg-gap-header">
                        <h4>{gap.skill}</h4>
                        <span className="badge secondary">{gap.category}</span>
                      </div>
                      <div className="sg-gap-meta">
                        <span>📊 {gap.demand} jobs require this</span>
                        <span>📈 {gap.demandPercentage}% of all postings</span>
                      </div>
                      <div className="sg-gap-bar-track">
                        <div
                          className="sg-gap-bar-fill"
                          style={{
                            width: `${Math.min(gap.demandPercentage * 3, 100)}%`,
                            animationDelay: `${i * 0.06}s`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No significant gaps found!</h3>
                <p>Your skills are well-aligned with current market demand.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── LEARNING PATHS TAB ───────────────────────────────── */}
      {activeTab === "paths" && (
        <div className="sg-tab-content fade-in-up">
          <div className="sg-section">
            <h2>🛤️ Personalized Learning Paths</h2>
            <p className="sg-section-desc">
              Step-by-step roadmaps based on your current skills and market demand.
            </p>

            {data.learningPaths?.length > 0 ? (
              <div className="sg-paths-list">
                {data.learningPaths.map((path, i) => (
                  <div key={i} className="sg-path-card fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="sg-path-header" onClick={() => setExpandedPath(expandedPath === i ? null : i)}>
                      <div className="sg-path-target">
                        <span className="sg-path-icon">🎯</span>
                        <div>
                          <h4>Learn {path.target}</h4>
                          <span className="sg-path-meta">
                            {path.steps.length} steps • ~{path.estimatedWeeks} weeks •{" "}
                            <span className={`sg-difficulty ${path.difficulty}`}>{path.difficulty}</span>
                          </span>
                        </div>
                      </div>
                      <div className="sg-path-demand">
                        <span className="sg-path-demand-num">{path.targetDemand}</span>
                        <span className="sg-path-demand-label">jobs</span>
                      </div>
                      <span className="sg-path-toggle">{expandedPath === i ? "▲" : "▼"}</span>
                    </div>

                    {expandedPath === i && (
                      <div className="sg-path-steps">
                        {path.steps.map((step, j) => (
                          <div key={j} className="sg-step">
                            <div className={`sg-step-dot ${step.relationship}`}>
                              {step.relationship === "target" ? "🎯" :
                               step.relationship === "prerequisite" ? "📋" :
                               step.relationship === "complementary" ? "🔗" : `${j + 1}`}
                            </div>
                            <div className="sg-step-content">
                              <span className="sg-step-skill">{step.skill}</span>
                              <span className="sg-step-reason">{step.reason}</span>
                            </div>
                            <span className={`badge ${step.relationship === "target" ? "primary" :
                              step.relationship === "prerequisite" ? "secondary" : "success"}`}>
                              {step.relationship}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🛤️</div>
                <h3>No learning paths available</h3>
                <p>Add more skills to your profile to get personalized learning recommendations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ROLE FIT TAB ─────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="sg-tab-content fade-in-up">
          {/* Role Selector */}
          <div className="sg-section">
            <h2>👔 Role-Based Analysis</h2>
            <p className="sg-section-desc">Select a target role to see exactly what skills you need.</p>

            <div className="sg-role-selector">
              {roles.map((role) => (
                <button
                  key={role}
                  className={`sg-role-btn ${selectedRole === role ? "active" : ""}`}
                  onClick={() => handleRoleChange(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Role Analysis Result */}
          {data.roleAnalysis && (
            <div className="sg-section fade-in-up">
              <div className="sg-role-result-card">
                <div className="sg-role-header">
                  <h3>{data.roleAnalysis.role}</h3>
                  <div className="sg-role-readiness">
                    <span className="sg-role-readiness-num">{data.roleAnalysis.readiness}%</span>
                    <span className="sg-role-readiness-label">Role Readiness</span>
                  </div>
                </div>

                <div className="sg-role-bar-wrapper">
                  <div className="sg-role-bar-fill" style={{ width: `${data.roleAnalysis.readiness}%` }} />
                </div>

                {/* Core / Recommended / Bonus skill checklist */}
                {["core", "recommended", "bonus"].map((tier) => {
                  const tierData = data.roleAnalysis[tier];
                  if (!tierData) return null;
                  return (
                    <div key={tier} className="sg-tier-section">
                      <h4 className="sg-tier-title">
                        {tier === "core" ? "🔴 Core Skills" : tier === "recommended" ? "🟡 Recommended" : "🟢 Bonus"}
                        <span className="sg-tier-count">
                          {tierData.matched}/{tierData.total}
                        </span>
                      </h4>
                      <div className="sg-tier-skills">
                        {tierData.skills.map((s, i) => (
                          <div key={i} className={`sg-tier-skill ${s.has ? "has" : "missing"}`}>
                            <span className="sg-tier-check">{s.has ? "✅" : "⬜"}</span>
                            <span>{s.skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {data.roleAnalysis.nextSteps?.length > 0 && (
                  <div className="sg-next-steps">
                    <h4>🚀 Next Steps to Qualify</h4>
                    <div className="sg-next-steps-list">
                      {data.roleAnalysis.nextSteps.map((skill, i) => (
                        <span key={i} className="badge skill-gap">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-detected role matches */}
          {data.roleMatches?.length > 0 && (
            <div className="sg-section">
              <h2>🎯 Best Matching Roles</h2>
              <div className="sg-role-matches">
                {data.roleMatches.map((match, i) => (
                  <div
                    key={i}
                    className={`sg-role-match-card ${selectedRole === match.role ? "selected" : ""}`}
                    onClick={() => handleRoleChange(match.role)}
                  >
                    <div className="sg-match-header">
                      <h4>{match.role}</h4>
                      <span className="sg-match-percentage">{match.matchPercentage}%</span>
                    </div>
                    <div className="sg-match-bar-track">
                      <div
                        className="sg-match-bar-fill"
                        style={{ width: `${match.matchPercentage}%` }}
                      />
                    </div>
                    <div className="sg-match-detail">
                      <span>{match.matchedCount}/{match.totalSkills} skills matched</span>
                      {match.missingCore.length > 0 && (
                        <span className="sg-match-missing">
                          Missing: {match.missingCore.slice(0, 3).join(", ")}
                          {match.missingCore.length > 3 && ` +${match.missingCore.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

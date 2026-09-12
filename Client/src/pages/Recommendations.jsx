import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Recommendations.css";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("score"); // score, recency, skill
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/recommendations");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  const getSorted = () => {
    if (!data?.recommendations) return [];
    const recs = [...data.recommendations];
    if (sortBy === "recency") {
      recs.sort((a, b) => new Date(b.job.createdAt) - new Date(a.job.createdAt));
    } else if (sortBy === "skill") {
      recs.sort((a, b) => (b.breakdown?.skillMatch || 0) - (a.breakdown?.skillMatch || 0));
    }
    // Default is already sorted by matchScore
    return recs;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const sorted = getSorted();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 AI Job Recommendations</h1>
        <p>{data?.message}</p>
      </div>

      {data?.userSkills?.length > 0 && (
        <div className="user-skills-bar">
          <span className="skills-label">Your Skills:</span>
          {data.userSkills.map((s, i) => (
            <span key={i} className="badge primary">{s}</span>
          ))}
          <Link to="/profile" className="edit-skills-link">Edit →</Link>
        </div>
      )}

      {/* Sort Controls */}
      {sorted.length > 0 && (
        <div className="rec-sort-bar">
          <span className="sort-label">Sort by:</span>
          <div className="sort-buttons">
            {[
              { key: "score", label: "🏆 AI Score" },
              { key: "recency", label: "🕐 Newest" },
              { key: "skill", label: "⚡ Skill Match" },
            ].map((opt) => (
              <button
                key={opt.key}
                className={`sort-btn ${sortBy === opt.key ? "active" : ""}`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="rec-count">{sorted.length} matches</span>
        </div>
      )}

      {!sorted.length ? (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <h3>No recommendations yet</h3>
          <p>Add skills to your profile to get AI-powered job matches</p>
          <Link to="/profile" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Update Skills →
          </Link>
        </div>
      ) : (
        <div className="recommendations-list">
          {sorted.map((rec, index) => {
            const isExpanded = expandedId === rec.job._id;
            return (
              <div
                key={rec.job._id}
                className="rec-card fade-in-up"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <Link to={`/jobs/${rec.job._id}`} className="rec-card-link">
                  <div className="rec-card-left">
                    <div className="rec-score-ring">
                      <svg viewBox="0 0 36 36" className="score-svg">
                        <path
                          className="score-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="score-fill"
                          strokeDasharray={`${rec.matchScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{
                            stroke: rec.matchScore >= 75 ? "#22c55e" : rec.matchScore >= 50 ? "#00c6ff" : "#f59e0b"
                          }}
                        />
                      </svg>
                      <span className="score-text">{rec.matchScore}%</span>
                    </div>
                  </div>

                  <div className="rec-card-main">
                    <div className="rec-card-header">
                      <div className="company-avatar">
                        {rec.job.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>{rec.job.title}</h3>
                        <p className="rec-company">{rec.job.company} • {rec.job.location}</p>
                      </div>
                    </div>

                    <div className="rec-card-tags">
                      <span className="badge primary">{rec.job.type || "Full-time"}</span>
                      {rec.job.experienceLevel && (
                        <span className="badge secondary">{rec.job.experienceLevel}</span>
                      )}
                      {rec.job.salary && rec.job.salary !== "Not disclosed" && (
                        <span className="badge success">💰 {rec.job.salary}</span>
                      )}
                    </div>

                    {/* Matched Skills */}
                    <div className="rec-matched-skills">
                      <span className="matched-label">✅ Matched:</span>
                      {rec.matchedSkills.map((s, i) => (
                        <span key={i} className="badge skill-match">{s}</span>
                      ))}
                    </div>

                    {/* Missing Skills (Skill Gap) */}
                    {rec.missingSkills?.length > 0 && (
                      <div className="rec-missing-skills">
                        <span className="missing-label">📚 To Learn:</span>
                        {rec.missingSkills.slice(0, 4).map((s, i) => (
                          <span key={i} className="badge skill-gap">{s}</span>
                        ))}
                        {rec.missingSkills.length > 4 && (
                          <span className="badge skill-gap">+{rec.missingSkills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Score Breakdown Toggle */}
                {rec.breakdown && (
                  <div className="rec-breakdown-section">
                    <button
                      className="breakdown-toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : rec.job._id);
                      }}
                    >
                      {isExpanded ? "▲ Hide Score Breakdown" : "▼ Score Breakdown"}
                    </button>

                    {isExpanded && (
                      <div className="breakdown-grid">
                        {[
                          { key: "skillMatch", label: "Skill Match", weight: "30%", icon: "⚡" },
                          { key: "tfidfSimilarity", label: "TF-IDF Similarity", weight: "15%", icon: "🧠" },
                          { key: "experienceFit", label: "Experience Fit", weight: "15%", icon: "📊" },
                          { key: "locationFit", label: "Location Fit", weight: "12%", icon: "📍" },
                          { key: "recency", label: "Recency", weight: "8%", icon: "🕐" },
                          { key: "engagement", label: "Engagement", weight: "12%", icon: "💡" },
                          { key: "collaborative", label: "Collaborative", weight: "8%", icon: "👥" },
                        ].map((factor) => (
                          <div key={factor.key} className="breakdown-item">
                            <div className="breakdown-header">
                              <span>{factor.icon} {factor.label}</span>
                              <span className="breakdown-weight">×{factor.weight}</span>
                            </div>
                            <div className="breakdown-bar-wrapper">
                              <div
                                className="breakdown-bar"
                                style={{
                                  width: `${rec.breakdown[factor.key]}%`,
                                  background: rec.breakdown[factor.key] >= 70
                                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                                    : rec.breakdown[factor.key] >= 40
                                    ? "linear-gradient(90deg, #00c6ff, #0072ff)"
                                    : "linear-gradient(90deg, #f59e0b, #d97706)",
                                }}
                              />
                            </div>
                            <span className="breakdown-score">{rec.breakdown[factor.key]}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

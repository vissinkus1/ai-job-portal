import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Recommendations.css";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

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

      {!data?.recommendations?.length ? (
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
          {data.recommendations.map((rec, index) => (
            <Link
              to={`/jobs/${rec.job._id}`}
              key={rec.job._id}
              className="rec-card fade-in-up"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
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
                  {rec.job.salary && rec.job.salary !== "Not disclosed" && (
                    <span className="badge success">💰 {rec.job.salary}</span>
                  )}
                </div>

                <div className="rec-matched-skills">
                  <span className="matched-label">Matched:</span>
                  {rec.matchedSkills.map((s, i) => (
                    <span key={i} className="badge secondary">{s}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

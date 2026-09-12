import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./ResumeScore.css";

export default function ResumeScore() {
  const [data, setData] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const [scoreRes, benchRes] = await Promise.all([
        api.get("/resume-score/score"),
        api.get("/resume-score/benchmark").catch(() => ({ data: null })),
      ]);
      setData(scoreRes.data);
      setBenchmark(benchRes.data);
    } catch (err) {
      if (err.response?.status === 400) {
        setData({ error: err.response.data.message });
      } else {
        console.error("Failed to fetch resume score");
      }
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

  if (data?.error || !data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No Resume Found</h3>
          <p>{data?.error || "Upload a resume to get your AI-powered analysis"}</p>
          <Link to="/profile" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Upload Resume →
          </Link>
        </div>
      </div>
    );
  }

  const gradeColor = data.overallScore >= 80 ? "#22c55e" :
    data.overallScore >= 60 ? "#06b6d4" :
    data.overallScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 AI Resume Analysis</h1>
        <p>Analyzing: <strong>{data.resumeFile}</strong></p>
      </div>

      {/* Score Hero */}
      <div className="rs-hero fade-in-up">
        <div className="rs-score-circle">
          <svg viewBox="0 0 120 120" className="rs-circle-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--card-border)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={gradeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(data.overallScore / 100) * 326.7}, 326.7`}
              transform="rotate(-90 60 60)"
              className="rs-circle-progress"
            />
          </svg>
          <div className="rs-score-text">
            <span className="rs-score-number" style={{ color: gradeColor }}>{data.overallScore}</span>
            <span className="rs-score-grade" style={{ color: gradeColor }}>{data.grade}</span>
          </div>
        </div>

        <div className="rs-hero-info">
          <p className="rs-summary">{data.summary}</p>

          {/* Mini breakdown bars */}
          <div className="rs-breakdown-mini">
            {[
              { label: "Sections", score: data.breakdown.sections.score, weight: data.breakdown.sections.weight },
              { label: "ATS Compat.", score: data.breakdown.atsCompatibility.score, weight: data.breakdown.atsCompatibility.weight },
              { label: "Skill Coverage", score: data.breakdown.skillCoverage.score, weight: data.breakdown.skillCoverage.weight },
              { label: "Content Quality", score: data.breakdown.contentQuality.score, weight: data.breakdown.contentQuality.weight },
            ].map((item, i) => (
              <div key={i} className="rs-mini-bar">
                <div className="rs-mini-header">
                  <span className="rs-mini-label">{item.label}</span>
                  <span className="rs-mini-score">{item.score}%</span>
                </div>
                <div className="rs-mini-track">
                  <div
                    className="rs-mini-fill"
                    style={{
                      width: `${item.score}%`,
                      background: item.score >= 70 ? "#22c55e" : item.score >= 40 ? "#f59e0b" : "#ef4444",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                </div>
                <span className="rs-mini-weight">×{item.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark */}
        {benchmark && benchmark.totalCompared > 0 && (
          <div className="rs-benchmark-card">
            <h4>📈 Competitive Position</h4>
            <div className="rs-benchmark-stat">
              <span className="rs-benchmark-num">{benchmark.percentile}th</span>
              <span className="rs-benchmark-label">Percentile</span>
            </div>
            <p className="rs-benchmark-detail">
              Better than <strong>{benchmark.betterThan}%</strong> of {benchmark.totalCompared} applicants
            </p>
            <span className={`badge ${benchmark.rank === "exceptional" || benchmark.rank === "strong" ? "primary" :
              benchmark.rank === "above-average" ? "secondary" : "danger"}`}>
              {benchmark.rank === "exceptional" ? "🏆 Exceptional" :
               benchmark.rank === "strong" ? "💪 Strong" :
               benchmark.rank === "above-average" ? "📈 Above Average" :
               benchmark.rank === "average" ? "📊 Average" : "🔧 Needs Improvement"}
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="rs-tabs">
        {[
          { key: "overview", label: "📋 Sections" },
          { key: "ats", label: "🤖 ATS Check" },
          { key: "improvements", label: "🚀 Improvements" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`rs-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SECTIONS TAB ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="rs-tab-content fade-in-up">
          <div className="rs-section-grid">
            {data.breakdown.sections.results.map((section, i) => (
              <div
                key={i}
                className={`rs-section-card ${section.status}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="rs-section-status">
                  {section.status === "present" ? "✅" : section.status === "partial" ? "⚠️" : "❌"}
                </div>
                <div className="rs-section-info">
                  <h4>{section.label}</h4>
                  <div className="rs-section-score-bar">
                    <div
                      className="rs-section-score-fill"
                      style={{ width: `${(section.earnedPoints / section.maxPoints) * 100}%` }}
                    />
                  </div>
                  <span className="rs-section-points">
                    {section.earnedPoints}/{section.maxPoints} pts
                  </span>
                </div>
                {section.suggestion && (
                  <p className="rs-section-suggestion">{section.suggestion}</p>
                )}
              </div>
            ))}
          </div>

          {/* Skills found */}
          {data.breakdown.skillCoverage.skillCount > 0 && (
            <div className="rs-detected-skills">
              <h3>🔍 Detected Skills ({data.breakdown.skillCoverage.skillCount})</h3>
              <div className="rs-skills-wrap">
                {data.breakdown.skillCoverage.skills.map((s, i) => (
                  <span key={i} className="badge primary">{s.skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quality indicators */}
          <div className="rs-quality-section">
            <h3>📝 Content Quality Indicators</h3>
            <div className="rs-quality-grid">
              {data.breakdown.contentQuality.indicators.map((ind, i) => (
                <div key={i} className={`rs-quality-item ${ind.status}`}>
                  <span className="rs-quality-icon">
                    {ind.status === "good" ? "✅" : ind.status === "ok" ? "🔵" : ind.status === "warning" ? "⚠️" : "❌"}
                  </span>
                  <div>
                    <span className="rs-quality-label">{ind.label}</span>
                    <span className="rs-quality-detail">{ind.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ATS TAB ──────────────────────────────────────────── */}
      {activeTab === "ats" && (
        <div className="rs-tab-content fade-in-up">
          <div className="rs-ats-header">
            <h2>🤖 ATS Compatibility Score: {data.breakdown.atsCompatibility.score}%</h2>
            <p>Applicant Tracking Systems (ATS) scan resumes before human reviewers. Pass these checks to ensure your resume is readable.</p>
          </div>

          <div className="rs-ats-checklist">
            {data.breakdown.atsCompatibility.results.map((check, i) => (
              <div
                key={i}
                className={`rs-ats-check ${check.passed ? "passed" : "failed"}`}
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
              >
                <div className="rs-ats-check-header">
                  <span className="rs-ats-icon">{check.passed ? "✅" : "❌"}</span>
                  <div className="rs-ats-check-info">
                    <h4>{check.label}</h4>
                    <p className="rs-ats-desc">{check.description}</p>
                  </div>
                  <span className="rs-ats-weight">+{check.weight} pts</span>
                </div>
                {!check.passed && expandedSection === i && (
                  <div className="rs-ats-suggestion">
                    💡 <strong>Fix:</strong> {check.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── IMPROVEMENTS TAB ─────────────────────────────────── */}
      {activeTab === "improvements" && (
        <div className="rs-tab-content fade-in-up">
          <h2>🚀 Prioritized Improvements</h2>
          <p className="sg-section-desc">
            Ordered by impact — fix high-priority items first for the biggest score boost.
          </p>

          {data.improvements?.length > 0 ? (
            <div className="rs-improvements-list">
              {data.improvements.map((imp, i) => (
                <div
                  key={i}
                  className={`rs-improvement-card ${imp.priority} fade-in-up`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="rs-imp-priority">
                    <span className={`rs-imp-badge ${imp.priority}`}>
                      {imp.priority === "high" ? "🔴" : imp.priority === "medium" ? "🟡" : "🟢"}
                      {" "}{imp.priority}
                    </span>
                    <span className="rs-imp-impact">+{imp.impact} pts</span>
                  </div>
                  <div className="rs-imp-content">
                    <h4>{imp.label}</h4>
                    <p>{imp.suggestion}</p>
                  </div>
                  <span className="rs-imp-category badge secondary">{imp.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>Your resume looks great!</h3>
              <p>No major improvements needed. Keep it up!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

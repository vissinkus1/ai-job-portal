import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Analytics.css";

export default function Analytics() {
  const token = localStorage.getItem("token");
  const [skillTrends, setSkillTrends] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [demandData, setDemandData] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [mySkillValue, setMySkillValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState(90);

  useEffect(() => {
    fetchAnalytics();
  }, [trendPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendsRes, salaryRes, demandRes, companiesRes] = await Promise.all([
        api.get(`/analytics/skill-trends?days=${trendPeriod}`),
        api.get("/analytics/salary-by-skill"),
        api.get("/analytics/demand-over-time?weeks=8"),
        api.get("/analytics/top-companies-hiring"),
      ]);

      setSkillTrends(trendsRes.data.skills || []);
      setSalaryData(salaryRes.data || []);
      setDemandData(demandRes.data || []);
      setTopCompanies(companiesRes.data || []);

      // Personal skill value — only if logged in
      if (token) {
        try {
          const myRes = await api.get("/analytics/my-skill-market-value");
          setMySkillValue(myRes.data);
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const maxTrend = skillTrends.length > 0 ? Math.max(...skillTrends.map((s) => s.count)) : 1;
  const maxDemand = demandData.length > 0 ? Math.max(...demandData.map((d) => d.jobs), 1) : 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Skill Analytics & Market Intelligence</h1>
        <p>Understand job market trends, in-demand skills, and salary insights</p>
      </div>

      {/* Personal Skill Value — Only for logged in users */}
      {mySkillValue && mySkillValue.skills?.length > 0 && (
        <div className="analytics-section fade-in-up">
          <div className="section-header">
            <h2>🎯 Your Skills Market Value</h2>
            <span className="section-meta">{mySkillValue.totalJobsAnalyzed} jobs analyzed • {mySkillValue.period}</span>
          </div>
          <div className="skill-value-grid">
            {mySkillValue.skills.map((s, i) => (
              <div key={i} className="skill-value-card">
                <div className="skill-value-header">
                  <span className="skill-value-name">{s.skill}</span>
                  <span className={`skill-value-badge ${s.demandPercentage >= 20 ? "hot" : s.demandPercentage >= 10 ? "warm" : "cool"}`}>
                    {s.demandPercentage >= 20 ? "🔥 Hot" : s.demandPercentage >= 10 ? "📈 Growing" : "📊 Stable"}
                  </span>
                </div>
                <div className="skill-value-stats">
                  <div className="skill-stat">
                    <span className="skill-stat-number">{s.demand}</span>
                    <span className="skill-stat-label">Jobs</span>
                  </div>
                  <div className="skill-stat">
                    <span className="skill-stat-number">{s.demandPercentage}%</span>
                    <span className="skill-stat-label">Market Share</span>
                  </div>
                  <div className="skill-stat">
                    <span className="skill-stat-number">{s.avgApplicantsPerJob}</span>
                    <span className="skill-stat-label">Avg Competition</span>
                  </div>
                </div>
                <div className="skill-value-bar-wrapper">
                  <div
                    className="skill-value-bar"
                    style={{ width: `${Math.min(s.demandPercentage * 3, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Skills */}
      <div className="analytics-section fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="section-header">
          <h2>🔥 Trending Skills</h2>
          <div className="period-toggle">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                className={`period-btn ${trendPeriod === d ? "active" : ""}`}
                onClick={() => setTrendPeriod(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {skillTrends.length > 0 ? (
          <div className="horizontal-bar-chart">
            {skillTrends.map((s, i) => (
              <div key={i} className="h-bar-row">
                <span className="h-bar-label">{s.skill}</span>
                <div className="h-bar-track">
                  <div
                    className="h-bar-fill"
                    style={{
                      width: `${(s.count / maxTrend) * 100}%`,
                      animationDelay: `${i * 0.03}s`,
                    }}
                  />
                </div>
                <span className="h-bar-value">{s.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="analytics-empty">No skill data available yet</div>
        )}
      </div>

      <div className="analytics-two-col">
        {/* Job Demand Timeline */}
        <div className="analytics-section fade-in-up" style={{ animationDelay: "0.15s" }}>
          <h2>📈 Job Posting Activity</h2>
          {demandData.length > 0 ? (
            <div className="demand-chart">
              {demandData.map((d, i) => (
                <div key={i} className="demand-col">
                  <span className="demand-value">{d.jobs}</span>
                  <div
                    className="demand-bar"
                    style={{ height: `${Math.max((d.jobs / maxDemand) * 100, 6)}%` }}
                  />
                  <span className="demand-label">{d.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty">No demand data yet</div>
          )}
        </div>

        {/* Top Hiring Companies */}
        <div className="analytics-section fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2>🏢 Top Hiring Companies</h2>
          {topCompanies.length > 0 ? (
            <div className="top-companies-list">
              {topCompanies.map((c, i) => (
                <div key={i} className="top-company-row">
                  <span className="company-rank">#{i + 1}</span>
                  <div className="company-avatar small">
                    {c.company?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="company-name">{c.company}</span>
                  <span className="badge primary">{c.jobCount} job{c.jobCount !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty">No company data yet</div>
          )}
        </div>
      </div>

      {/* Salary Insights */}
      <div className="analytics-section fade-in-up" style={{ animationDelay: "0.25s" }}>
        <h2>💰 Salary Insights by Skill</h2>
        {salaryData.length > 0 ? (
          <div className="salary-grid">
            {salaryData.map((s, i) => (
              <div key={i} className="salary-card">
                <h4>{s.skill}</h4>
                <div className="salary-range">
                  <span className="salary-avg">{formatSalary(s.avgSalary)}</span>
                  <span className="salary-label">avg</span>
                </div>
                <div className="salary-minmax">
                  <span>{formatSalary(s.minSalary)} – {formatSalary(s.maxSalary)}</span>
                </div>
                <span className="salary-jobs">{s.jobCount} job{s.jobCount !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="analytics-empty">No salary data available</div>
        )}
      </div>

      {/* CTA for non-logged-in users */}
      {!token && (
        <div className="analytics-cta fade-in-up">
          <h3>Want personalized skill insights?</h3>
          <p>Sign up to see how your skills compare to market demand</p>
          <Link to="/register" className="glass-button">Get Started Free →</Link>
        </div>
      )}
    </div>
  );
}

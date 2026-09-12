import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Home.css";

/* ─── Animated Counter Hook ─────────────────────────────────────── */
function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (target === 0 || ref.current) return;
    ref.current = true;
    const steps = 50;
    const step = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

/* ─── Stat Item ─────────────────────────────────────────────────── */
function StatItem({ value, label }) {
  const animated = useCountUp(value);
  const formatted =
    value >= 10000 ? `${(animated / 1000).toFixed(0)}K+` :
    value >= 1000 ? `${(animated / 1000).toFixed(1)}K+` :
    animated.toString() || "0";

  return (
    <div className="stat-item">
      <span className="stat-number">{formatted}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Home() {
  const token = localStorage.getItem("token");
  const [stats, setStats] = useState({ totalJobs: 0, totalCompanies: 0, totalSeekers: 0 });
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/public/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/public/featured").then((r) => setFeatured(r.data)).catch(() => {});
  }, []);

  const features = [
    {
      icon: "🧠",
      title: "AI Skill Gap Analysis",
      desc: "Discover exactly which skills you need, with a personalized learning roadmap built from real market data.",
      tag: "New",
      link: "/skill-gap",
    },
    {
      icon: "📄",
      title: "Resume AI Scorer",
      desc: "Get an instant ATS compatibility score with actionable improvement tips to beat applicant tracking systems.",
      tag: "New",
      link: "/resume-score",
    },
    {
      icon: "🤖",
      title: "Smart TF-IDF Matching",
      desc: "Our 7-factor AI engine uses cosine similarity and collaborative filtering to surface the most relevant jobs.",
      tag: "",
      link: "/recommendations",
    },
    {
      icon: "📊",
      title: "Market Intelligence",
      desc: "Live analytics on trending skills, salary benchmarks, and in-demand roles to inform every career move.",
      tag: "",
      link: "/analytics",
    },
    {
      icon: "💬",
      title: "Real-Time Messaging",
      desc: "Chat directly with recruiters and hiring managers inside the platform, with instant notifications.",
      tag: "",
      link: "/chat",
    },
    {
      icon: "🔔",
      title: "Smart Job Alerts",
      desc: "Set up intelligent alerts that notify you the moment your ideal job is posted — before the crowd.",
      tag: "",
      link: "/job-alerts",
    },
  ];

  const howItWorks = [
    { step: "01", title: "Build Your Profile", desc: "Upload your resume and let our AI extract your skills, experience, and strengths automatically." },
    { step: "02", title: "Get AI-Matched", desc: "Our TF-IDF engine scores thousands of jobs against your profile in real-time for precision matches." },
    { step: "03", title: "Analyze & Grow", desc: "Use Skill Gap Analysis to know exactly what to learn next and track your market readiness score." },
    { step: "04", title: "Apply & Land", desc: "Apply with one click, message recruiters directly, and track every application in your dashboard." },
  ];

  return (
    <div className="home-page">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        {/* Ambient orbs */}
        <div className="hero-orb orb-1" aria-hidden="true" />
        <div className="hero-orb orb-2" aria-hidden="true" />
        <div className="hero-orb orb-3" aria-hidden="true" />

        <div className="hero-content fade-in-up">
          <div className="hero-badge">
            <span className="badge primary">
              <span className="badge-dot" />
              🚀 AI-Powered Career Platform
            </span>
          </div>

          <h1 className="hero-title">
            Find Your Dream Job<br />
            <span className="gradient-text">With AI Intelligence</span>
          </h1>

          <p className="hero-subtitle">
            The only job portal that uses TF-IDF semantic matching, skill gap analysis,
            and collaborative filtering to connect you with roles you'll actually love.
          </p>

          <div className="hero-actions">
            <Link to="/jobs" className="hero-btn primary">
              Browse Jobs
              <span className="hero-btn-arrow">→</span>
            </Link>
            {!token && (
              <Link to="/register" className="hero-btn outline">
                Get Started Free
              </Link>
            )}
            {token && (
              <Link to="/recommendations" className="hero-btn outline">
                🤖 AI Match
              </Link>
            )}
          </div>

          <div className="hero-stats">
            <StatItem value={stats.totalJobs} label="Active Jobs" />
            <div className="stat-divider" />
            <StatItem value={stats.totalCompanies} label="Companies" />
            <div className="stat-divider" />
            <StatItem value={stats.totalSeekers} label="Job Seekers" />
          </div>
        </div>

        <div className="hero-visual fade-in">
          {/* Main visual card */}
          <div className="hero-main-card">
            <div className="hmc-header">
              <div className="hmc-avatar">AI</div>
              <div>
                <div className="hmc-title">AI Match Score</div>
                <div className="hmc-sub">For your profile</div>
              </div>
              <div className="hmc-score">94%</div>
            </div>
            <div className="hmc-bars">
              {[
                { label: "Skill Match", val: 92 },
                { label: "TF-IDF Score", val: 88 },
                { label: "Experience Fit", val: 95 },
              ].map((b) => (
                <div key={b.label} className="hmc-bar-row">
                  <span>{b.label}</span>
                  <div className="hmc-track">
                    <div className="hmc-fill" style={{ width: `${b.val}%` }} />
                  </div>
                  <span className="hmc-pct">{b.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div className="floating-card card-1">
            <div className="fc-icon">🧠</div>
            <div className="fc-text">Skill Gap Analysis</div>
          </div>
          <div className="floating-card card-2">
            <div className="fc-icon">📄</div>
            <div className="fc-text">Resume Score: 87/100</div>
          </div>
          <div className="floating-card card-3">
            <div className="fc-icon">📊</div>
            <div className="fc-text">Market Readiness: 73%</div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          {[
            { label: "AI Matches Made", value: "10K+" },
            { label: "Avg. Match Score", value: "89%" },
            { label: "Time to First Interview", value: "< 5 days" },
            { label: "Placement Rate", value: "78%" },
          ].map((s, i) => (
            <div key={i} className="stats-bar-item">
              <span className="stats-bar-value">{s.value}</span>
              <span className="stats-bar-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured Jobs ─────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="home-section-header">
              <h2>🔥 <span className="gradient-text">Featured Jobs</span></h2>
              <Link to="/jobs" className="see-all-link">View All →</Link>
            </div>
            <div className="featured-grid">
              {featured.slice(0, 6).map((job, i) => (
                <Link
                  to={`/jobs/${job._id}`}
                  key={job._id}
                  className="featured-job-card fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="fjc-header">
                    <div className="company-avatar" style={{ width: "44px", height: "44px", fontSize: "1.1rem", borderRadius: "12px" }}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="fjc-info">
                      <h3>{job.title}</h3>
                      <p>{job.company}</p>
                    </div>
                  </div>
                  <div className="fjc-badges">
                    <span className="badge primary">{job.type || "Full-time"}</span>
                    {job.experienceLevel && <span className="badge secondary">{job.experienceLevel}</span>}
                    <span className="fjc-location">📍 {job.location}</span>
                  </div>
                  {job.salary && <p className="fjc-salary">{job.salary}</p>}
                  <div className="fjc-footer">
                    <span className="fjc-apply">Apply Now →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── How It Works ──────────────────────────────────── */}
      <section className="home-section how-it-works">
        <div className="home-section-inner">
          <div className="home-section-header center">
            <h2>How It <span className="gradient-text">Works</span></h2>
            <p className="section-desc">Four steps to your next career breakthrough</p>
          </div>
          <div className="hiw-grid">
            {howItWorks.map((step, i) => (
              <div key={i} className="hiw-card fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="hiw-step-num">{step.step}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < howItWorks.length - 1 && <div className="hiw-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Grid ──────────────────────────────────── */}
      <section className="home-section features-section">
        <div className="home-section-inner">
          <div className="home-section-header center">
            <h2>Everything You Need to <span className="gradient-text">Land Your Dream Job</span></h2>
            <p className="section-desc">A complete AI-powered platform, not just a job board.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <Link
                to={f.link}
                key={i}
                className="feature-card fade-in-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="feature-card-top">
                  <div className="feature-icon">{f.icon}</div>
                  {f.tag && <span className="badge success feature-tag">{f.tag}</span>}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="feature-link">Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Strip ─────────────────────────────────────── */}
      {!token && (
        <section className="cta-section">
          <div className="cta-inner">
            <div className="cta-orb" aria-hidden="true" />
            <h2>Ready to find your next opportunity?</h2>
            <p>Join thousands of professionals using AI to land better jobs, faster.</p>
            <div className="cta-actions">
              <Link to="/register" className="hero-btn primary">Create Free Account →</Link>
              <Link to="/jobs" className="hero-btn outline">Browse Jobs</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;

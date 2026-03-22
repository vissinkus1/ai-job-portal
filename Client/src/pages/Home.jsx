import { Link } from "react-router-dom";
import "../App.css";

function Home() {
  const token = localStorage.getItem("token");

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content fade-in-up">
          <div className="hero-badge">
            <span className="badge primary">🚀 AI-Powered Job Matching</span>
          </div>
          <h1 className="hero-title">
            Find Your Dream Job<br />
            <span className="gradient-text">With AI Intelligence</span>
          </h1>
          <p className="hero-subtitle">
            Discover opportunities tailored to your skills. Whether you're a job seeker 
            or employer, our AI-powered platform connects the right talent with the right roles.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="hero-btn primary">
              Browse Jobs →
            </Link>
            {!token && (
              <Link to="/register" className="hero-btn outline">
                Get Started Free
              </Link>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Active Jobs</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">1,200+</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Job Seekers</span>
            </div>
          </div>
        </div>

        <div className="hero-visual fade-in">
          <div className="floating-card card-1">
            <div className="fc-icon">🤖</div>
            <div className="fc-text">AI Resume Analysis</div>
          </div>
          <div className="floating-card card-2">
            <div className="fc-icon">🎯</div>
            <div className="fc-text">Smart Job Matching</div>
          </div>
          <div className="floating-card card-3">
            <div className="fc-icon">📊</div>
            <div className="fc-text">Skill Analytics</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose <span className="gradient-text">AI Job Portal?</span></h2>
        <div className="features-grid">
          <div className="feature-card fade-in-up">
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Find jobs that match your skills and experience with AI-powered search and recommendations.</p>
          </div>
          <div className="feature-card fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="feature-icon">⚡</div>
            <h3>Quick Apply</h3>
            <p>Apply to multiple positions with one click. Your profile does the talking.</p>
          </div>
          <div className="feature-card fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="feature-icon">📈</div>
            <h3>Career Growth</h3>
            <p>Get insights on trending skills and salary benchmarks to accelerate your career.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>⚡ AI Job Portal</h3>
          <p>Connecting talent with opportunity through intelligent matching.</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/jobs">Browse Jobs</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/login">Sign In</Link>
          </div>
          <div className="footer-column">
            <h4>Features</h4>
            <Link to="/recommendations">AI Matching</Link>
            <Link to="/saved-jobs">Saved Jobs</Link>
            <Link to="/post-job">Post a Job</Link>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <span>About Us</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} AI Job Portal. Built with ❤️</p>
      </div>
    </footer>
  );
}

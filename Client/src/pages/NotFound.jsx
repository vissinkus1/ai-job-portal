import { Link } from "react-router-dom";
import "../App.css";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-content fade-in-up">
        <div className="notfound-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="glass-button" style={{ display: "inline-block", marginTop: "20px" }}>
          ← Go Home
        </Link>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="auth-page">
      <div className="card">
        <h1>403 — Unauthorized</h1>
        <p className="subtitle">
          You're logged in, but your role doesn't have permission to view
          this route.
        </p>
        <Link to="/dashboard">
          <button>Back to dashboard</button>
        </Link>
      </div>
    </div>
  );
}

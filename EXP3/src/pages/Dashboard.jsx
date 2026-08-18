import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/axiosInstance.js";
import { decodeToken } from "../auth/jwt.js";
import { can } from "../rbac/permissions.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const decoded = decodeToken(localStorage.getItem("accessToken"));

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function callProtectedEndpoint() {
    setLoading(true);
    setApiError("");
    setApiResult(null);
    try {
      // If the access token has expired, this will 401, the response
      // interceptor will silently refresh it, and this request auto-retries.
      const { data } = await api.get("/protected-data");
      setApiResult(data);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">
            Logged in as <strong>{user.name}</strong> — role: <span className="badge">{user.role}</span>
          </p>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        {can(user.role, "read") && <Link to="/editor">Editor Area</Link>}
        {user.role === "admin" && <Link to="/admin">Admin Panel</Link>}
      </nav>

      <section className="card">
        <h2>Decoded JWT payload</h2>
        <p className="subtitle">
          This is what the client can read from the access token without ever
          contacting the server — exactly the header.payload.signature
          structure from the lab sheet.
        </p>
        <pre className="code-block">{JSON.stringify(decoded, null, 2)}</pre>
      </section>

      <section className="card">
        <h2>Conditional rendering by role</h2>
        <ul className="permission-list">
          <li>{can(user.role, "read") ? "✅" : "❌"} View content</li>
          <li>{can(user.role, "create") ? "✅" : "❌"} Create content</li>
          <li>{can(user.role, "edit") ? "✅" : "❌"} Edit content</li>
          <li>{can(user.role, "delete") ? "✅" : "❌"} Delete content</li>
        </ul>
        {user.role === "admin" && <button className="danger">Delete Post</button>}
      </section>

      <section className="card">
        <h2>Axios interceptor + token refresh demo</h2>
        <p className="subtitle">
          Access tokens expire after 45 seconds. Wait past that, then click
          the button — the request interceptor attaches the (now expired)
          token, the response interceptor catches the 401, silently calls
          <code> /refresh</code>, and retries the original request.
        </p>
        <button onClick={callProtectedEndpoint} disabled={loading}>
          {loading ? "Calling..." : "Call protected endpoint"}
        </button>
        {apiResult && <pre className="code-block success">{JSON.stringify(apiResult, null, 2)}</pre>}
        {apiError && <div className="alert alert-error">{apiError}</div>}
      </section>
    </div>
  );
}

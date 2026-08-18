import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { can } from "../rbac/permissions.js";

export default function EditorPanel() {
  const { user } = useAuth();

  return (
    <div className="page">
      <header className="topbar">
        <h1>Editor Area</h1>
      </header>
      <p className="subtitle">
        <Link to="/dashboard">← Back to dashboard</Link>
      </p>
      <section className="card">
        <h2>Restricted to roles: admin, editor</h2>
        <p>Viewers cannot reach this route — they're redirected to /unauthorized.</p>
        {can(user.role, "create") && <button>Create Post</button>}
        {can(user.role, "edit") && <button>Edit Post</button>}
        {!can(user.role, "delete") && (
          <p className="subtitle">Delete is disabled for your role ({user.role}).</p>
        )}
      </section>
    </div>
  );
}

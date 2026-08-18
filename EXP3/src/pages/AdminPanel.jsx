import { Link } from "react-router-dom";

export default function AdminPanel() {
  return (
    <div className="page">
      <header className="topbar">
        <h1>Admin Panel</h1>
      </header>
      <p className="subtitle">
        <Link to="/dashboard">← Back to dashboard</Link>
      </p>
      <section className="card">
        <h2>Restricted to role: admin</h2>
        <p>
          You're only seeing this page because <code>ProtectedRoute</code>{" "}
          verified your decoded role claim against{" "}
          <code>allowedRoles=["admin"]</code>. Editors and viewers are
          redirected to <code>/unauthorized</code>.
        </p>
        <ul>
          <li>Manage users</li>
          <li>Delete any content</li>
          <li>View system audit logs</li>
        </ul>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../services/authService';

export default function Login() {
  const { login, sessionMessage, setSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      setSessionMessage(null);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function quickFill(u) {
    setUsername(u.username);
    setPassword(u.password);
    setError(null);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-mark">RBAC</span>
          <h1>Role-Based Authentication</h1>
          <p>JWT login · route protection · permission-aware UI</p>
        </div>

        {sessionMessage && <div className="banner banner-warn">{sessionMessage}</div>}
        {error && <div className="banner banner-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Verifying credentials…' : 'Log in'}
          </button>
        </form>

        <div className="demo-accounts">
          <p className="demo-accounts-label">Demo accounts — click to fill</p>
          {USERS.map((u) => (
            <button key={u.username} type="button" className="demo-account" onClick={() => quickFill(u)}>
              <span className={`role-badge role-${u.role}`}>{u.role}</span>
              <span>{u.username} / {u.password}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { secondsUntilExpiry } from '../services/fakeJwt';
import { hasPermission } from '../services/permissions';

export default function Navbar() {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    setSecondsLeft(secondsUntilExpiry(accessToken));
    const id = setInterval(() => setSecondsLeft(secondsUntilExpiry(accessToken)), 1000);
    return () => clearInterval(id);
  }, [accessToken]);

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="brand-mark">RBAC</span>
        <span className="brand-sub">Experiment 3</span>
      </div>
      <nav className="navbar-links">
        <Link to="/">Dashboard</Link>
        {hasPermission(user.role, 'manage_users') && <Link to="/admin">Admin Panel</Link>}
      </nav>
      <div className="navbar-meta">
        <span className={`token-pill ${secondsLeft <= 8 ? 'token-pill-warn' : ''}`}>
          token expires in {secondsLeft}s
        </span>
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <span className="user-name">{user.name}</span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            logout(null);
            navigate('/login');
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}

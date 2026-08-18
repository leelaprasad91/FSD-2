import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ROLE_LABELS } from '../services/permissions';

export default function AdminPanel() {
  const { pushLog } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/users')
      .then((res) => {
        pushLog({ type: 'api', message: 'GET /admin/users → 200 (admin-only route)' });
        setUsers(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message);
        pushLog({ type: 'error', message: `GET /admin/users → ${err.response?.status}` });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-head">
          <h2>User management</h2>
          <span className="hint">Only reachable by roles with the manage_users permission</span>
        </div>
        {error && <div className="banner banner-error">{error}</div>}
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  <span className="hint"> — {ROLE_LABELS[u.role]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

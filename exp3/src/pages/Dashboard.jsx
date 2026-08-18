import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { hasPermission } from '../services/permissions';
import { decodeHeader, decodeToken } from '../services/fakeJwt';

export default function Dashboard() {
  const { user, accessToken, pushLog, log } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [editingId, setEditingId] = useState(null);

  const canCreate = hasPermission(user.role, 'create');
  const canEdit = hasPermission(user.role, 'edit');
  const canDelete = hasPermission(user.role, 'delete');

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/posts');
      pushLog({ type: 'api', message: 'GET /posts → 200 (token attached by request interceptor)' });
      setPosts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      pushLog({ type: 'error', message: `GET /posts failed: ${err.response?.data?.message || err.message}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/posts', JSON.stringify({ title: draftTitle, body: draftBody }));
      pushLog({ type: 'api', message: `POST /posts → 201 (created by ${user.username})` });
      setDraftTitle('');
      setDraftBody('');
      loadPosts();
    } catch (err) {
      pushLog({ type: 'error', message: `POST /posts → ${err.response?.status}: ${err.response?.data?.message}` });
      setError(err.response?.data?.message || err.message);
    }
  }

  async function handleSaveEdit(post) {
    try {
      await api.put(`/posts/${post.id}`, JSON.stringify({ title: post.title, body: post.body }));
      pushLog({ type: 'api', message: `PUT /posts/${post.id} → 200` });
      setEditingId(null);
      loadPosts();
    } catch (err) {
      pushLog({ type: 'error', message: `PUT /posts/${post.id} → ${err.response?.status}: ${err.response?.data?.message}` });
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/posts/${id}`);
      pushLog({ type: 'api', message: `DELETE /posts/${id} → 200` });
      loadPosts();
    } catch (err) {
      pushLog({ type: 'error', message: `DELETE /posts/${id} → ${err.response?.status}: ${err.response?.data?.message}` });
    }
  }

  const header = decodeHeader(accessToken);
  const payload = decodeToken(accessToken);

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-head">
          <h2>Content ({user.role} view)</h2>
          <span className="hint">
            {canCreate && canEdit && canDelete && 'Full access: create, edit, delete'}
            {canCreate && canEdit && !canDelete && 'Can create and edit — delete is admin-only'}
            {!canCreate && !canEdit && 'Read-only — create/edit/delete are hidden'}
          </span>
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        {canCreate && (
          <form className="create-form" onSubmit={handleCreate}>
            <input
              placeholder="Post title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              required
            />
            <input
              placeholder="Post body"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">Create</button>
          </form>
        )}

        {loading ? (
          <p className="hint">Loading posts…</p>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <li key={post.id} className="post-item">
                {editingId === post.id ? (
                  <InlineEditor post={post} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                ) : (
                  <>
                    <div>
                      <h3>{post.title}</h3>
                      <p>{post.body}</p>
                      <span className="hint">by {post.author}</span>
                    </div>
                    <div className="post-actions">
                      {canEdit && (
                        <button className="btn btn-ghost" onClick={() => setEditingId(post.id)}>Edit</button>
                      )}
                      {canDelete && (
                        <button className="btn btn-danger" onClick={() => handleDelete(post.id)}>Delete</button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="panel panel-token">
        <h2>Live token inspector</h2>
        <p className="hint">Decoded client-side — this is exactly what a server would read off the JWT.</p>
        <TokenBlock label="Header" value={header} />
        <TokenBlock label="Payload" value={payload} />

        <h3>Interceptor &amp; RBAC activity log</h3>
        <ul className="activity-log">
          {log.length === 0 && <li className="hint">Nothing logged yet.</li>}
          {log.map((entry, i) => (
            <li key={i} className={`log-entry log-${entry.type}`}>
              <span className="log-time">{entry.time}</span> {entry.message}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function TokenBlock({ label, value }) {
  return (
    <div className="token-block">
      <span className="token-block-label">{label}</span>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function InlineEditor({ post, onSave, onCancel }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  return (
    <div className="inline-editor">
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <input value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="post-actions">
        <button className="btn btn-primary" onClick={() => onSave({ ...post, title, body })}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

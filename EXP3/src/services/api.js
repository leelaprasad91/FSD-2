import axios from 'axios';
import { isTokenExpired, decodeToken } from './fakeJwt';
import { refreshAccessToken } from './authService';
import { hasPermission } from './permissions';
import { USERS } from './authService';

// authRef is populated by AuthContext so the interceptors can read live
// auth state and trigger a refresh/logout without a circular import.
export const authRef = { current: null };

export const api = axios.create({ baseURL: '/api' });

// ---- Request interceptor: attach the bearer token to every call ----
api.interceptors.request.use((config) => {
  const auth = authRef.current;
  if (auth?.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

// ---- Response interceptor: on 401, refresh the token once and retry ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = authRef.current;
    const status = error.response?.status;

    if (status === 401 && auth?.refreshToken && !error.config._retried) {
      try {
        const newAccessToken = refreshAccessToken(auth.refreshToken);
        auth.setAccessToken(newAccessToken);
        error.config._retried = true;
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        auth.logout('Session expired — please log in again.');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------
// Mock backend. There is no real server for this experiment, so a
// custom axios adapter stands in for one — this is what actually makes
// every button "work": requests are authenticated, authorized by role,
// and mutate real in-memory data, exactly like a live API would.
// ------------------------------------------------------------------

let posts = [
  { id: 1, title: 'Welcome to the RBAC demo', body: 'Log in as admin, editor, or viewer to see permissions change.', author: 'admin' },
  { id: 2, title: 'JWT is stateless', body: 'The server does not need to store session data — the token carries it.', author: 'editor' },
];
let nextPostId = 3;

function respond(status, data, config) {
  if (status >= 200 && status < 300) {
    return { status, data, config, headers: {}, statusText: 'OK' };
  }
  const err = new Error(data?.message || 'Request failed');
  err.response = { status, data, config };
  err.config = config;
  throw err;
}

function authorize(config) {
  const token = (config.headers?.Authorization || '').replace('Bearer ', '');
  if (!token || isTokenExpired(token)) {
    const err = new Error('Unauthorized');
    err.response = { status: 401, data: { message: 'Token missing or expired' }, config };
    err.config = config;
    throw err;
  }
  return decodeToken(token);
}

async function mockAdapter(config) {
  await new Promise((r) => setTimeout(r, 400)); // simulated latency

  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';

  // GET /posts is public-ish but still requires a valid (non-expired) token,
  // matching "protected routes" restricting access to authenticated users.
  const claims = authorize(config);

  if (url === '/posts' && method === 'get') {
    return respond(200, posts, config);
  }

  if (url === '/posts' && method === 'post') {
    if (!hasPermission(claims.role, 'create')) {
      return respond(403, { message: `Role '${claims.role}' cannot create posts` }, config);
    }
    const body = JSON.parse(config.data || '{}');
    const post = { id: nextPostId++, title: body.title, body: body.body, author: claims.username };
    posts = [post, ...posts];
    return respond(201, post, config);
  }

  const editMatch = url.match(/^\/posts\/(\d+)$/);
  if (editMatch && method === 'put') {
    if (!hasPermission(claims.role, 'edit')) {
      return respond(403, { message: `Role '${claims.role}' cannot edit posts` }, config);
    }
    const id = Number(editMatch[1]);
    const body = JSON.parse(config.data || '{}');
    posts = posts.map((p) => (p.id === id ? { ...p, ...body } : p));
    return respond(200, posts.find((p) => p.id === id), config);
  }

  if (editMatch && method === 'delete') {
    if (!hasPermission(claims.role, 'delete')) {
      return respond(403, { message: `Role '${claims.role}' cannot delete posts` }, config);
    }
    const id = Number(editMatch[1]);
    posts = posts.filter((p) => p.id !== id);
    return respond(200, { id }, config);
  }

  if (url === '/admin/users' && method === 'get') {
    if (!hasPermission(claims.role, 'manage_users')) {
      return respond(403, { message: `Role '${claims.role}' cannot view user management` }, config);
    }
    return respond(200, USERS.map(({ password, ...u }) => u), config);
  }

  return respond(404, { message: `No mock route for ${method.toUpperCase()} ${url}` }, config);
}

api.defaults.adapter = mockAdapter;

# Experiment 3 — Role-Based Authentication & Route Protection

React + Vite frontend implementing JWT-simulated authentication, RBAC,
protected routing, Axios interceptors, and token refresh — matching every
requirement in the Unit 1 / Experiment 3 lab sheet.

## Why there's no real backend

The lab sheet is a frontend architecture exercise (JWT storage, interceptors,
protected routes, conditional rendering). To keep this **runnable with zero
external setup** — no database, no server process, no ports to configure —
`src/api/mockBackend.js` simulates login/refresh/protected-data endpoints,
and `src/api/axiosInstance.js` wires them through a **real axios instance**
via a custom adapter, so the actual `axios.interceptors.request.use(...)`
and `axios.interceptors.response.use(...)` calls from the PDF are genuinely
exercised — they just route to the mock instead of the network. Swap the
adapter for a real backend later without touching any component code.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

Or build for production:
```bash
npm run build
npm run preview
```

## Demo accounts

| Username | Password    | Role   |
|----------|-------------|--------|
| admin    | admin123    | admin  |
| editor   | editor123   | editor |
| viewer   | viewer123   | viewer |

(Also shown as clickable autofill chips on the login page.)

## What maps to what (PDF → code)

| PDF section | File |
|---|---|
| JWT structure, decode payload | `src/auth/jwt.js` |
| Token storage (localStorage) | `src/auth/AuthContext.jsx` |
| Axios interceptors (attach token) | `src/api/axiosInstance.js` — request interceptor |
| Token expiry + refresh mechanism | `src/api/axiosInstance.js` — response interceptor, `mockBackend.js` |
| RBAC permissions map | `src/rbac/permissions.js` |
| Protected routes | `src/routes/ProtectedRoute.jsx` |
| Conditional rendering by role | `src/pages/Dashboard.jsx`, `EditorPanel.jsx` |
| Secure frontend architecture flow | `src/App.jsx` (route tree), `AuthContext.jsx` |

## Trying the token refresh flow (Assignment 5)

1. Log in as any user.
2. Access tokens expire after **45 seconds** (see `ACCESS_TOKEN_TTL_SECONDS`
   in `mockBackend.js`).
3. Wait 45+ seconds on the Dashboard, then click **"Call protected
   endpoint"**.
4. Watch it succeed anyway: the response interceptor caught the 401,
   silently called `/refresh`, stored the new access token, and retried the
   original request — no visible error, no re-login.

## Trying RBAC (Assignments 3 & 4)

- Log in as `viewer` → the "Editor Area" and "Admin Panel" links don't even
  render (conditional rendering), and manually navigating to `/admin` or
  `/editor` redirects to `/unauthorized` (route guard).
- Log in as `editor` → can reach `/editor` but not `/admin`.
- Log in as `admin` → full access, including the "Delete Post" button that
  only renders for `role === "admin"`.

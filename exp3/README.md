# Experiment 3 — Role-Based Authentication & Route Protection

A fully working React app (Vite + React Router + Axios) implementing every
piece from the brief: JWT-style auth, RBAC, protected routes, Axios
interceptors, token refresh, and permission-driven UI. There's no real
backend — a custom Axios adapter (`src/services/api.js`) acts as one, so
every button performs a real (in-memory) create/edit/delete instead of just
toggling visibility.

## Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL. Log in with one of the three seeded
accounts (buttons on the login screen fill them in for you):

| Username | Password    | Role   | Can do                          |
|----------|-------------|--------|----------------------------------|
| admin    | admin123    | admin  | create, edit, delete, manage users, view Admin Panel |
| editor   | editor123   | editor | create, edit                     |
| viewer   | viewer123   | viewer | read only                        |

## Where each part of the brief lives

- **JWT structure & generation** — `src/services/fakeJwt.js`. Builds a real
  `HEADER.PAYLOAD.SIGNATURE` token (base64url), with `decodeToken`,
  `isTokenExpired`, `secondsUntilExpiry`. The dashboard's "Live token
  inspector" panel shows the decoded header/payload updating in real time.
- **Auth flow (login → issue token → store → attach to requests)** —
  `src/services/authService.js` issues access + refresh tokens;
  `src/context/AuthContext.jsx` holds them in React state and exposes
  `login`/`logout`.
- **Axios interceptors** — `src/services/api.js`. Request interceptor
  attaches `Authorization: Bearer <token>` to every call. Response
  interceptor catches `401`, calls the refresh endpoint, retries the
  original request once, and force-logs-out if the refresh token is also
  dead.
- **Token expiry & refresh** — access tokens are set to expire in 25s
  (on purpose, so you can watch it happen instead of waiting). The navbar
  countdown pill turns red near expiry; when it hits 0, the next API call
  gets a `401`, the interceptor refreshes silently, and the request
  succeeds — logged live in the activity panel.
- **RBAC** — `src/services/permissions.js` is the single permission map
  (`admin`: create/edit/delete/publish/manage_users, `editor`:
  create/edit, `viewer`: read). Enforced in **two** places, matching
  defense-in-depth: client-side (buttons only render if `hasPermission`
  passes) and server-side in the mock adapter (rejects with `403` even if
  someone forged a request).
- **Protected routes** — `src/components/ProtectedRoute.jsx` redirects to
  `/login` if unauthenticated, or `/unauthorized` if authenticated but
  missing a required permission (see `/admin`, gated on `manage_users`).
- **Conditional rendering by role** — Dashboard buttons (Create/Edit/
  Delete) and the "Admin Panel" nav link only render for roles that hold
  the relevant permission.

## Try this to see it all work together

1. Log in as **viewer** — no create/edit/delete buttons, no Admin Panel
   link; typing `/admin` in the URL bounces you to "403 — Not permitted".
2. Log in as **editor** — Create and Edit appear, Delete doesn't. Try
   deleting via a forged request (edit the network call in devtools) and
   the mock backend still rejects it with 403 — RBAC isn't just hidden
   buttons.
3. Log in as **admin** — full CRUD, plus the Admin Panel listing all
   seeded users and their roles.
4. Stay logged in and idle for ~25s, then click anything that hits the
   API — watch the activity log show the 401, the silent refresh, and the
   automatic retry succeeding.

## Build for submission

```bash
npm run build
```

Outputs a production bundle to `dist/`.

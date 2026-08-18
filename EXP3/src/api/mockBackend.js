import { createToken, decodeToken, isTokenExpired } from "../auth/jwt.js";

// Simulated user directory. In a real system this lives behind a server
// and passwords are hashed — this is purely so the experiment is runnable
// without standing up a backend.
const USERS = [
  { userId: "1", name: "Alice Admin", username: "admin", password: "admin123", role: "admin" },
  { userId: "2", name: "Eddie Editor", username: "editor", password: "editor123", role: "editor" },
  { userId: "3", name: "Vic Viewer", username: "viewer", password: "viewer123", role: "viewer" },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Access tokens expire quickly on purpose so the refresh flow (Assignment 5)
// is easy to observe/demo. Refresh tokens live longer.
const ACCESS_TOKEN_TTL_SECONDS = 45;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24;

/** Simulates POST /login */
export async function mockLogin(username, password) {
  await delay(500);
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }
  const claims = { userId: user.userId, name: user.name, role: user.role };
  return {
    accessToken: createToken(claims, ACCESS_TOKEN_TTL_SECONDS),
    refreshToken: createToken({ ...claims, type: "refresh" }, REFRESH_TOKEN_TTL_SECONDS),
    user: { userId: user.userId, name: user.name, role: user.role },
  };
}

/** Simulates POST /refresh — issues a new access token from a valid refresh token. */
export async function mockRefresh(refreshToken) {
  await delay(400);
  if (!refreshToken || isTokenExpired(refreshToken)) {
    const err = new Error("Refresh token expired or missing");
    err.status = 401;
    throw err;
  }
  const payload = decodeToken(refreshToken);
  const claims = { userId: payload.userId, name: payload.name, role: payload.role };
  return {
    accessToken: createToken(claims, ACCESS_TOKEN_TTL_SECONDS),
  };
}

/** Simulates a protected GET /me — only succeeds with a valid, unexpired access token. */
export async function mockProtectedData(accessToken) {
  await delay(350);
  if (isTokenExpired(accessToken)) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  const payload = decodeToken(accessToken);
  return {
    message: `Hello ${payload.name}, this data came from a protected endpoint.`,
    fetchedAt: new Date().toISOString(),
  };
}

export const DEMO_ACCOUNTS = USERS.map(({ username, password, role }) => ({
  username,
  password,
  role,
}));

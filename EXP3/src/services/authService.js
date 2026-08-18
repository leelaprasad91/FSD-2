import { generateToken, decodeToken } from './fakeJwt';

// Hardcoded user directory — stands in for a real user/auth database.
export const USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Aditi Sharma' },
  { id: 2, username: 'editor', password: 'editor123', role: 'editor', name: 'Rohit Verma' },
  { id: 3, username: 'viewer', password: 'viewer123', role: 'viewer', name: 'Simran Kaur' },
];

// Access tokens expire fast (25s) on purpose so the refresh flow
// (Experiment 3.1 / Assignment 5) is easy to observe in the demo.
const ACCESS_TOKEN_TTL = 25;
const REFRESH_TOKEN_TTL = 60 * 60;

export function login(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = USERS.find((u) => u.username === username && u.password === password);
      if (!user) {
        reject(new Error('Invalid username or password'));
        return;
      }
      const payload = { userId: user.id, username: user.username, role: user.role, name: user.name };
      resolve({
        accessToken: generateToken(payload, ACCESS_TOKEN_TTL),
        refreshToken: generateToken(payload, REFRESH_TOKEN_TTL),
        user: payload,
      });
    }, 350); // simulated network latency
  });
}

export function refreshAccessToken(refreshToken) {
  const payload = decodeToken(refreshToken);
  if (!payload || Date.now() / 1000 > payload.exp) {
    throw new Error('Refresh token expired — please log in again');
  }
  const { exp, iat, ...claims } = payload;
  return generateToken(claims, ACCESS_TOKEN_TTL);
}

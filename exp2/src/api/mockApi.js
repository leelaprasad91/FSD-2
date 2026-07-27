// Simulated backend. In a real app this would be a fetch() call to a server.
// Kept here so createAsyncThunk has a realistic async source to intercept.

const SEED_POSTS = [
  {
    id: "p1",
    platform: "Twitter",
    content: "Excited to launch our new product this week! #launch",
    createdAt: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "p2",
    platform: "LinkedIn",
    content:
      "Reflecting on the last quarter — grateful for the team's hard work and the milestones we hit together. More big things coming soon.",
    createdAt: "2026-07-21T10:30:00.000Z",
  },
  {
    id: "p3",
    platform: "Instagram",
    content: "Behind the scenes at today's shoot ✨📸",
    createdAt: "2026-07-22T14:15:00.000Z",
  },
];

// Simulates network latency and returns a fresh copy of the data.
export function fetchPostsApi() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SEED_POSTS.map((post) => ({ ...post })));
    }, 800);
  });
}

import { createSelector } from "reselect";
import { postsAdapterSelectors } from "./postsSlice";

// --- Basic (non-memoized) selectors -----------------------------------
// These just read straight out of the store. Cheap, so no memoization needed.
export const selectAllPosts = postsAdapterSelectors.selectAll;
export const selectPostById = postsAdapterSelectors.selectById;
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostsError = (state) => state.posts.error;

// --- Derived / memoized selectors --------------------------------------
// A recompute counter proves the memoization is working: it only increments
// when `posts` actually changes, not on every render/selector call.
let shortPostsRecomputeCount = 0;
export const selectShortPosts = createSelector([selectAllPosts], (posts) => {
  shortPostsRecomputeCount += 1;
  return posts.filter((post) => post.content.length < 100);
});
export const getShortPostsRecomputeCount = () => shortPostsRecomputeCount;

// Selector factory: filter posts by platform (used by the calendar / per
// platform views). createSelector memoizes per the last arguments it saw.
export const selectPostsByPlatform = createSelector(
  [selectAllPosts, (_state, platform) => platform],
  (posts, platform) =>
    platform === "All" ? posts : posts.filter((post) => post.platform === platform)
);

// Analytics: aggregate stats derived from the posts collection. Recomputed
// only when the posts array reference changes, keeping the Analytics view cheap.
export const selectPostStats = createSelector([selectAllPosts], (posts) => {
  const total = posts.length;
  const avgLength = total
    ? Math.round(posts.reduce((sum, p) => sum + p.content.length, 0) / total)
    : 0;

  const byPlatform = posts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {});

  return { total, avgLength, byPlatform };
});

// Calendar view: posts grouped by the calendar date they were created on.
export const selectPostsByDate = createSelector([selectAllPosts], (posts) => {
  return posts.reduce((acc, post) => {
    const date = post.createdAt.slice(0, 10); // YYYY-MM-DD
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});
});

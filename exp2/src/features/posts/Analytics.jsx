import { useSelector } from "react-redux";
import { selectPostStats, selectShortPosts, getShortPostsRecomputeCount } from "./postsSelectors";

// Purely derived from `posts` via memoized selectors — nothing here is
// stored redundantly in the store (Section 5: Derived State and Selectors).
export default function Analytics() {
  const stats = useSelector(selectPostStats);
  const shortPosts = useSelector(selectShortPosts);

  return (
    <div className="analytics">
      <h2>Analytics</h2>
      <p>Total posts: {stats.total}</p>
      <p>Average length: {stats.avgLength} chars</p>
      <p>Short posts (&lt;100 chars): {shortPosts.length}</p>
      <p className="hint">
        selectShortPosts recomputed {getShortPostsRecomputeCount()} time(s) so far — it only
        reruns when the posts collection changes, not on every render.
      </p>
      <ul>
        {Object.entries(stats.byPlatform).map(([platform, count]) => (
          <li key={platform}>
            {platform}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}

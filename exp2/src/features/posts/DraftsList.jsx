import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import DraftItem from "./DraftItem";
import { removePost } from "./postsSlice";
import { startEditingPost } from "../ui/uiSlice";
import { selectAllPosts, selectPostsLoading, selectPostsError } from "./postsSelectors";

export default function DraftsList() {
  const dispatch = useDispatch();
  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostsLoading);
  const error = useSelector(selectPostsError);

  // useCallback keeps these handler references stable across renders, so
  // React.memo on DraftItem can actually skip re-rendering unrelated cards.
  const handleEdit = useCallback(
    (id) => {
      const post = posts.find((p) => p.id === id);
      if (post) dispatch(startEditingPost(post));
    },
    [posts, dispatch]
  );

  const handleDelete = useCallback(
    (id) => {
      dispatch(removePost(id));
    },
    [dispatch]
  );

  if (loading) return <p>Loading drafts…</p>;
  if (error) return <p className="error-text">Error: {error}</p>;
  if (posts.length === 0) return <p>No Drafts Yet</p>;

  return (
    <div>
      {posts.map((post) => (
        <DraftItem key={post.id} post={post} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
    </div>
  );
}

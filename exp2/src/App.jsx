import "./App.css";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchPosts } from "./features/posts/postsSlice";
import PlatformSelector from "./features/platforms/PlatformSelector";
import PostComposer from "./features/posts/PostComposer";
import DraftsList from "./features/posts/DraftsList";
import Analytics from "./features/posts/Analytics";

function App() {
  const dispatch = useDispatch();

  // Async Thunk: load the initial set of posts from the (mock) server once,
  // on mount. Redux handles pending/fulfilled/rejected via extraReducers.
  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  return (
    <div className="container">
      <h2>📢 Social Media Post Composer</h2>

      <PlatformSelector />
      <PostComposer />

      <hr />

      <h2>Saved Drafts</h2>
      <DraftsList />

      <hr />

      <Analytics />
    </div>
  );
}

export default App;

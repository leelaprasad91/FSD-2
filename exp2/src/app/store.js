import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "../features/posts/postsSlice";
import platformsReducer from "../features/platforms/platformsSlice";
import uiReducer from "../features/ui/uiSlice";

// Single store, single source of truth. Each slice owns its own domain:
//   posts      -> normalized { ids, entities } collection + loading/error
//   platforms  -> list of platforms + which one is selected
//   ui         -> transient composer state, kept apart from data state
export const store = configureStore({
  reducer: {
    posts: postsReducer,
    platforms: platformsReducer,
    ui: uiReducer,
  },
});

import { createSlice, createEntityAdapter, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchPostsApi } from "../../api/mockApi";

// createEntityAdapter normalizes the posts collection into { ids: [], entities: {} }
// instead of a plain array. This avoids O(n) lookups/updates by id and keeps
// the state flat, matching the "State Normalization" section of the experiment.
const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

// Async Thunk: simulates fetching posts from a server. RTK automatically
// generates posts/fetchPosts/pending, /fulfilled and /rejected action types.
export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  const data = await fetchPostsApi();
  return data;
});

const initialState = postsAdapter.getInitialState({
  loading: false,
  error: null,
});

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    // Assignment 1: add / update / delete actions on the normalized slice.
    addPost: {
      reducer: (state, action) => {
        postsAdapter.addOne(state, action.payload);
      },
      prepare: ({ content, platform }) => ({
        payload: {
          id: `p_${Date.now()}`,
          content,
          platform,
          createdAt: new Date().toISOString(),
        },
      }),
    },
    updatePost: (state, action) => {
      const { id, changes } = action.payload;
      postsAdapter.updateOne(state, { id, changes });
    },
    removePost: (state, action) => {
      postsAdapter.removeOne(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        // setAll replaces the whole normalized collection with the fetched data.
        postsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch posts";
      });
  },
});

export const { addPost, updatePost, removePost } = postsSlice.actions;
export const postsAdapterSelectors = postsAdapter.getSelectors((state) => state.posts);
export default postsSlice.reducer;

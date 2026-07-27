import { createSlice } from "@reduxjs/toolkit";

// Separation of concerns: transient "what is the user doing right now" state
// lives here, completely separate from the `posts` data slice. This mirrors
// the { posts, platforms, ui } structure described in the theory section.
const initialState = {
  draftText: "",
  editingPostId: null, // null = composing a new post, otherwise editing existing id
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setDraftText: (state, action) => {
      state.draftText = action.payload;
    },
    startEditingPost: (state, action) => {
      state.editingPostId = action.payload.id;
      state.draftText = action.payload.content;
    },
    clearComposer: (state) => {
      state.editingPostId = null;
      state.draftText = "";
    },
  },
});

export const { setDraftText, startEditingPost, clearComposer } = uiSlice.actions;

export const selectDraftText = (state) => state.ui.draftText;
export const selectEditingPostId = (state) => state.ui.editingPostId;

export default uiSlice.reducer;

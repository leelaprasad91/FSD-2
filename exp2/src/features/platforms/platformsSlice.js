import { createSlice } from "@reduxjs/toolkit";

// Domain-based slice, kept separate from `posts` (modular state design).
// Each platform carries its own character limit, used by the composer.
const initialState = {
  list: [
    { name: "Twitter", maxLength: 280 },
    { name: "LinkedIn", maxLength: 3000 },
    { name: "Instagram", maxLength: 2200 },
  ],
  selected: "Twitter",
};

const platformsSlice = createSlice({
  name: "platforms",
  initialState,
  reducers: {
    setSelectedPlatform: (state, action) => {
      state.selected = action.payload;
    },
  },
});

export const { setSelectedPlatform } = platformsSlice.actions;

// Selectors
export const selectPlatforms = (state) => state.platforms.list;
export const selectSelectedPlatform = (state) => state.platforms.selected;
export const selectSelectedPlatformConfig = (state) =>
  state.platforms.list.find((p) => p.name === state.platforms.selected);

export default platformsSlice.reducer;

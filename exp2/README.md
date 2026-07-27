# Post Composer — Redux Toolkit Edition

Unit 1 · Experiment 2 — Redux-Based Content State Management

A social-media post composer (Twitter / LinkedIn / Instagram) rebuilt from
local `useState` onto a centralized **Redux Toolkit** store, with
normalization, async data fetching, memoized selectors and render
optimization, as specified in the experiment brief.

## Run it

```bash
npm install
npm run dev
```

## Project structure

```
src/
  app/
    store.js                 -> configureStore, combines all slices
  api/
    mockApi.js                -> simulated backend (setTimeout + seed data)
  features/
    posts/
      postsSlice.js            -> createEntityAdapter + createAsyncThunk (fetchPosts)
      postsSelectors.js        -> plain + memoized (reselect) selectors
      PostComposer.jsx         -> textarea, char counter, save/update
      DraftsList.jsx           -> renders posts, useCallback handlers
      DraftItem.jsx             -> React.memo'd draft card w/ render counter
      Analytics.jsx             -> derived stats via memoized selectors
    platforms/
      platformsSlice.js        -> platform list + selected platform
      PlatformSelector.jsx
    ui/
      uiSlice.js                -> transient composer state (draft text, editing id)
  App.jsx
  main.jsx                      -> wraps <App /> in <Provider store={store}>
```

State shape:

```js
{
  posts:     { ids: [], entities: {}, loading, error },   // normalized data
  platforms: { list: [...], selected: "Twitter" },        // domain slice
  ui:        { draftText: "", editingPostId: null },      // UI-only state
}
```

## How each part of the brief is implemented

**Section 1 — Centralized state / `createSlice`**
`postsSlice.js` and `platformsSlice.js` each own one domain of state
(single source of truth, immutable updates via Immer, pure reducers).

**Section 2 — Async state with `createAsyncThunk`**
`fetchPosts` in `postsSlice.js` calls the mock API and is handled in
`extraReducers` across `pending` / `fulfilled` / `rejected`, driving the
loading/error UI in `DraftsList.jsx`.

**Section 3 — Normalization with `createEntityAdapter`**
Posts are stored as `{ ids: [], entities: {} }` instead of a raw array.
`postsAdapter.getSelectors()` gives O(1) lookups; `addOne` / `updateOne` /
`removeOne` / `setAll` back the CRUD reducers.

**Section 4 — State design / separation of concerns**
Data (`posts`, `platforms`) is kept apart from transient UI state (`ui`),
so the composer's in-progress text never pollutes the data layer.

**Section 5 & 6 — Derived state & memoized selectors**
`postsSelectors.js` exposes plain selectors (`selectAllPosts`) and
memoized ones built with `reselect`'s `createSelector`
(`selectShortPosts`, `selectPostStats`, `selectPostsByDate`,
`selectPostsByPlatform`). `selectShortPosts` logs a recompute counter to
demonstrate it only reruns when `posts` changes.

**Section 7 — Performance / avoiding re-renders**
`DraftItem.jsx` is wrapped in `React.memo` and shows a live render count
per card. `DraftsList.jsx` passes stable `useCallback` handlers so
editing/deleting one draft doesn't re-render the others. `PostComposer.jsx`
uses `useMemo` for the derived `maxLength`.

## Assignments

| # | Assignment | Where |
|---|---|---|
| 1 | Redux Slice Implementation | `postsSlice.js` (`addPost`, `updatePost`, `removePost`) + `PostComposer.jsx` / `DraftsList.jsx` |
| 2 | Async Data Handling | `postsSlice.js` (`fetchPosts` thunk) + loading/error branches in `DraftsList.jsx` |
| 3 | State Normalization | `postsSlice.js` (`createEntityAdapter`, adapter methods) |
| 4 | Selector Optimization | `postsSelectors.js` (`createSelector`, recompute counter) |
| 5 | Performance Optimization | `DraftItem.jsx` (`React.memo`, render counter), `DraftsList.jsx` (`useCallback`), `PostComposer.jsx` (`useMemo`) |

To see #4 and #5 in action: open the dev console, edit one draft, and note
that only that card's render count changes while `selectShortPosts`'s
recompute counter only bumps when the posts collection itself changes
(not on every keystroke in the composer, since that only touches `ui`
state).

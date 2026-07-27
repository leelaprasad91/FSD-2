import { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addPost, updatePost } from "./postsSlice";
import { setDraftText, clearComposer } from "../ui/uiSlice";
import { selectDraftText, selectEditingPostId } from "../ui/uiSlice";
import { selectSelectedPlatform, selectSelectedPlatformConfig } from "../platforms/platformsSlice";

export default function PostComposer() {
  const dispatch = useDispatch();
  const draftText = useSelector(selectDraftText);
  const editingPostId = useSelector(selectEditingPostId);
  const selectedPlatform = useSelector(selectSelectedPlatform);
  const platformConfig = useSelector(selectSelectedPlatformConfig);

  // Derived value, recomputed only when its inputs change.
  const maxLength = useMemo(() => platformConfig?.maxLength ?? 280, [platformConfig]);

  const handleChange = useCallback(
    (e) => dispatch(setDraftText(e.target.value)),
    [dispatch]
  );

  const handleSave = useCallback(() => {
    if (draftText.trim() === "") {
      alert("Please write something first.");
      return;
    }

    if (editingPostId) {
      dispatch(updatePost({ id: editingPostId, changes: { content: draftText } }));
    } else {
      dispatch(addPost({ content: draftText, platform: selectedPlatform }));
    }
    dispatch(clearComposer());
  }, [dispatch, draftText, editingPostId, selectedPlatform]);

  return (
    <>
      <textarea
        rows="8"
        placeholder="Write your post..."
        value={draftText}
        onChange={handleChange}
      />
      <h3 className="counter">
        Characters : {draftText.length}/{maxLength}
      </h3>
      <button onClick={handleSave} disabled={draftText.length > maxLength}>
        {editingPostId ? "Update Draft" : "Save Draft"}
      </button>
    </>
  );
}

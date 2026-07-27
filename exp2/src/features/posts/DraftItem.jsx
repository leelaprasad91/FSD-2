import { memo, useRef } from "react";

// React.memo skips re-rendering this component unless its props change.
// Combined with the useCallback handlers passed down from DraftsList, editing
// or deleting one draft no longer re-renders every other draft card.
function DraftItem({ post, onEdit, onDelete }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div className="draft">
      <div className="draft-meta">
        <span className="badge">{post.platform}</span>
        <span className="render-count" title="Times this card has rendered">
          renders: {renderCount.current}
        </span>
      </div>
      <h3>{post.content}</h3>
      <button className="edit" onClick={() => onEdit(post.id)}>
        Edit
      </button>
      <button className="delete" onClick={() => onDelete(post.id)}>
        Delete
      </button>
    </div>
  );
}

export default memo(DraftItem);

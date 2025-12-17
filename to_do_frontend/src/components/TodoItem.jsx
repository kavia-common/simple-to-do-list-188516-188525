import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  /** A single todo item with edit, toggle, and delete actions. */
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const editBtnRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = async () => {
    const trimmed = (title || "").trim();
    if (!trimmed || trimmed.length > 120) {
      // basic validation
      return;
    }
    setSaving(true);
    const res = await onUpdate(todo.id, { title: trimmed });
    setSaving(false);
    if (res && res.ok) {
      setEditing(false);
      // restore focus to edit button for accessibility
      editBtnRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTitle(todo.title);
      setEditing(false);
      editBtnRef.current?.focus();
    }
  };

  return (
    <li className={`todo-item surface ${todo.completed ? "completed" : ""}`}>
      <div className="item-main">
        <input
          type="checkbox"
          className="checkbox"
          checked={!!todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
        />
        {editing ? (
          <input
            ref={inputRef}
            className="input inline-edit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Edit task title"
            maxLength={120}
          />
        ) : (
          <span className="title-text">{todo.title}</span>
        )}
      </div>
      <div className="item-actions">
        {editing ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setTitle(todo.title);
                setEditing(false);
                editBtnRef.current?.focus();
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              ref={editBtnRef}
              className="btn btn-ghost btn-sm"
              onClick={() => setEditing(true)}
              aria-label={`Edit "${todo.title}"`}
            >
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(todo.id)}
              aria-label={`Delete "${todo.title}"`}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}

TodoItem.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

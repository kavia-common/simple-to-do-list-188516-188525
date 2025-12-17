import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const MAX_LEN = 120;

// PUBLIC_INTERFACE
export default function TodoForm({ onAdd }) {
  /** Input form for adding a task with inline validation and accessibility. */
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const errorId = "new-task-error";
  const helpId = "new-task-help";

  useEffect(() => {
    // Autofocus input on mount for quick entry
    inputRef.current?.focus();
  }, []);

  const validate = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter a task title.";
    if (trimmed.length > MAX_LEN) return `Task title is too long (max ${MAX_LEN}).`;
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validate(title);
    if (validation) {
      setError(validation);
      inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await onAdd(title.trim());
      if (res && res.ok) {
        setTitle("");
        inputRef.current?.focus();
      } else if (res && res.error) {
        setError(res.error);
        inputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="todo-form card surface" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor="task-title">
          Task title
        </label>
        <div className="control">
          <input
            id="task-title"
            ref={inputRef}
            type="text"
            className={`input ${error ? "input-error" : ""}`}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
            maxLength={MAX_LEN}
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            aria-label="Add task"
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </div>
        <div className="assist">
          <small id={helpId} className="muted">
            Max {MAX_LEN} characters.
          </small>
          <small className="muted">{MAX_LEN - title.length} left</small>
        </div>
        {error ? (
          <div id={errorId} className="error-text" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}

TodoForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

import PropTypes from "prop-types";

// PUBLIC_INTERFACE
export default function Header({ total, completed }) {
  /** App header with title and simple stats. */
  const remaining = Math.max(0, (total || 0) - (completed || 0));
  return (
    <header className="app-header" role="banner">
      <div className="container header-inner">
        <h1 className="title" aria-label="To-Do application title">
          To-Do
        </h1>
        <div className="stats" aria-live="polite">
          <span className="badge">
            {remaining} {remaining === 1 ? "task" : "tasks"} remaining
          </span>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  total: PropTypes.number,
  completed: PropTypes.number,
};

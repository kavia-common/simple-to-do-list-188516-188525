import PropTypes from "prop-types";
import TodoItem from "./TodoItem";
import EmptyState from "./EmptyState";

// PUBLIC_INTERFACE
export default function TodoList({ todos, onToggle, onDelete, onUpdate }) {
  /** Renders todo list with items or an empty state. */
  if (!todos || todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="todo-list" aria-label="Todo list">
      {todos.map((t) => (
        <TodoItem
          key={t.id}
          todo={t}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  );
}

TodoList.propTypes = {
  todos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      completed: PropTypes.bool,
    })
  ),
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

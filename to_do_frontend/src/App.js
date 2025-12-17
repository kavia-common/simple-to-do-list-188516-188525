import "./App.css";
import Header from "./components/Header";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import useTodos from "./hooks/useTodos";

// PUBLIC_INTERFACE
export default function App() {
  /** Root application entrypoint rendering header, form, list, and error banner. */
  const {
    todos,
    loading,
    error,
    clearError,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
  } = useTodos();

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;

  return (
    <div className="app">
      <Header total={total} completed={completed} />
      <main className="container main">
        {error ? (
          <div
            className="error-banner"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="error-message">{error}</div>
            <button className="btn btn-ghost btn-sm" onClick={clearError} aria-label="Dismiss error">
              Dismiss
            </button>
          </div>
        ) : null}

        <TodoForm onAdd={addTodo} />

        {loading ? (
          <div className="loading" role="status" aria-live="polite">
            Loading tasks...
          </div>
        ) : (
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
          />
        )}
      </main>
    </div>
  );
}

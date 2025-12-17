import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTodos as apiGetTodos,
  createTodo as apiCreateTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
  toggleTodo as apiToggleTodo,
} from "../api/client";

/**
 * Generate a temporary id for optimistic items.
 */
function tempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Safely replace a todo in array by id.
 */
function replaceById(items, id, next) {
  return items.map((t) => (t.id === id ? next : t));
}

/**
 * Safely remove a todo from array by id.
 */
function removeById(items, id) {
  return items.filter((t) => t.id !== id);
}

// PUBLIC_INTERFACE
export default function useTodos() {
  /** Manage todo list state with optimistic updates and error handling. */
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSafe = (fn) => {
    if (isMounted.current) fn();
  };

  const clearError = useCallback(() => setError(""), []);

  const loadTodos = useCallback(async () => {
    setSafe(() => setLoading(true));
    try {
      const list = await apiGetTodos();
      if (Array.isArray(list)) {
        setSafe(() => setTodos(list));
      }
    } catch (e) {
      setSafe(() =>
        setError(
          e && e.message
            ? e.message
            : "Failed to load todos. You can still add tasks; errors will be shown here."
        )
      );
    } finally {
      setSafe(() => setLoading(false));
    }
  }, []);

  // Load on mount except during tests to avoid requiring fetch mocks
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    loadTodos();
  }, [loadTodos]);

  // PUBLIC_INTERFACE
  const addTodo = useCallback(async (title) => {
    /**
     * Add a new todo by title with client-side validation and optimistic UI.
     * Returns { ok: boolean, error?: string }
     */
    const trimmed = (title || "").trim();
    if (!trimmed) {
      const msg = "Please enter a task title.";
      setSafe(() => setError(msg));
      return { ok: false, error: msg };
    }
    if (trimmed.length > 120) {
      const msg = "Task title is too long (max 120 characters).";
      setSafe(() => setError(msg));
      return { ok: false, error: msg };
    }

    const optimistic = {
      id: tempId(),
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setSafe(() => setTodos((prev) => [optimistic, ...prev]));

    try {
      const created = await apiCreateTodo(trimmed);
      if (created && created.id) {
        setSafe(() =>
          setTodos((prev) =>
            // Replace the optimistic item with the server item
            replaceById(prev, optimistic.id, { ...created, optimistic: false })
          )
        );
      }
      return { ok: true };
    } catch (e) {
      setSafe(() => {
        setTodos((prev) => removeById(prev, optimistic.id));
        setError(e?.message || "Failed to create task.");
      });
      return { ok: false, error: e?.message || "Failed to create task." };
    }
  }, []);

  // PUBLIC_INTERFACE
  const updateTodo = useCallback(async (id, updates) => {
    /** Update a todo with optimistic UI and revert on error. */
    const prevList = todos;
    const idx = prevList.findIndex((t) => t.id === id);
    if (idx === -1) return { ok: false, error: "Task not found." };

    const updated = { ...prevList[idx], ...updates };
    setSafe(() => setTodos((curr) => replaceById(curr, id, updated)));

    try {
      const server = await apiUpdateTodo(id, updates);
      if (server) {
        setSafe(() => setTodos((curr) => replaceById(curr, id, server)));
      }
      return { ok: true };
    } catch (e) {
      // revert
      setSafe(() => setTodos(prevList));
      setSafe(() => setError(e?.message || "Failed to update task."));
      return { ok: false, error: e?.message || "Failed to update task." };
    }
  }, [todos]);

  // PUBLIC_INTERFACE
  const toggleTodo = useCallback(async (id) => {
    /** Toggle the 'completed' state of a todo with optimistic UI. */
    const prevList = todos;
    const item = prevList.find((t) => t.id === id);
    if (!item) return { ok: false, error: "Task not found." };

    const nextCompleted = !item.completed;
    setSafe(() =>
      setTodos((curr) =>
        replaceById(curr, id, { ...item, completed: nextCompleted })
      )
    );

    try {
      const server = await apiToggleTodo(id, nextCompleted);
      if (server) {
        setSafe(() => setTodos((curr) => replaceById(curr, id, server)));
      }
      return { ok: true };
    } catch (e) {
      // revert
      setSafe(() => setTodos(prevList));
      setSafe(() => setError(e?.message || "Failed to toggle task."));
      return { ok: false, error: e?.message || "Failed to toggle task." };
    }
  }, [todos]);

  // PUBLIC_INTERFACE
  const deleteTodo = useCallback(async (id) => {
    /** Delete a todo with optimistic UI and revert on error. */
    const prevList = todos;
    setSafe(() => setTodos((curr) => removeById(curr, id)));

    try {
      await apiDeleteTodo(id);
      return { ok: true };
    } catch (e) {
      // revert
      setSafe(() => setTodos(prevList));
      setSafe(() => setError(e?.message || "Failed to delete task."));
      return { ok: false, error: e?.message || "Failed to delete task." };
    }
  }, [todos]);

  return {
    todos,
    loading,
    error,
    clearError,
    loadTodos,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
  };
}

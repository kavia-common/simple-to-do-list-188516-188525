// 
// API client for interacting with the backend To-Do REST API.
// Uses REACT_APP_API_BASE for the base URL; falls back to REACT_APP_BACKEND_URL + "/api" if unset.
// Avoids hardcoding; values are provided through .env.* files.
//
/* eslint-disable no-console */

// Determine the API base from environment variables at build time.
// Prefer REACT_APP_API_BASE; fallback to REACT_APP_BACKEND_URL + "/api".
function resolveApiBase() {
  let base = "";
  if (typeof process !== "undefined" && process.env) {
    const apiBase = process.env.REACT_APP_API_BASE || "";
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
    if (apiBase) {
      base = apiBase;
    } else if (backendUrl) {
      base = `${backendUrl.replace(/\/+$/, "")}/api`;
    } else {
      base = "";
    }
  }
  // Normalize: remove trailing slash
  return (base || "").replace(/\/+$/, "");
}

const API_BASE = resolveApiBase();

// Join a base URL and a path ensuring exactly one slash between them.
function joinUrl(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").startsWith("/") ? path : `/${path || ""}`;
  return `${b}${p}`;
}

/**
 * Perform a JSON fetch request.
 * @param {string} path - API path starting with '/' (e.g., '/todos')
 * @param {object} options - fetch options including method, body, headers
 * @returns {Promise<any>} - parsed JSON response or null
 */
async function jsonRequest(path, options = {}) {
  if (!API_BASE && typeof window !== "undefined" && !jsonRequest._warned) {
    // Helpful warning during development if env is not configured
    console.warn(
      "API base URL not configured. Set REACT_APP_API_BASE in to_do_frontend/.env.local. " +
      "Falling back to same-origin (this will fail unless a proxy is configured)."
    );
    jsonRequest._warned = true;
  }

  const url = API_BASE ? joinUrl(API_BASE, path) : path; // fallback to relative if no base
  const opts = {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    // Network or CORS error
    const err = new Error("Network error connecting to API");
    err.cause = e;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  let payload = null;
  if (contentType.includes("application/json")) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else {
    // In case backend returns no content or text
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const message =
      (payload && payload.message) ||
      (typeof payload === "string" ? payload : "") ||
      res.statusText ||
      "Request failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

// PUBLIC_INTERFACE
export async function getTodos() {
  /** Fetch all todos. Returns an array of todos: [{ id, title, completed, createdAt? }] */
  return jsonRequest("/todos", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createTodo(title) {
  /** Create a todo by title. Returns the created todo object. */
  return jsonRequest("/todos", { method: "POST", body: { title } });
}

// PUBLIC_INTERFACE
export async function updateTodo(id, updates) {
  /** Update a todo by id with provided partial fields. Returns updated todo. */
  return jsonRequest(`/todos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: updates,
  });
}

// PUBLIC_INTERFACE
export async function deleteTodo(id) {
  /** Delete a todo by id. Returns nothing on success. */
  return jsonRequest(`/todos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// PUBLIC_INTERFACE
export async function toggleTodo(id, completed) {
  /** Toggle the completed flag for a todo by id. Returns updated todo. */
  // Many APIs support PATCH with partial fields; prefer that if supported by backend
  try {
    return await jsonRequest(`/todos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { completed },
    });
  } catch (err) {
    // Fallback to PUT-based update if PATCH not supported (405/404)
    if (err && (err.status === 404 || err.status === 405)) {
      return jsonRequest(`/todos/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: { completed },
      });
    }
    throw err;
  }
}

export default {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
};

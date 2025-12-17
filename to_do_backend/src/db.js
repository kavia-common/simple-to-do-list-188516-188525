"use strict";

/**
 * SQLite database layer using better-sqlite3.
 * Initializes the todos table if not present and provides CRUD helpers.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "..", "data", "todos.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Open database connection
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create schema if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at
  AFTER UPDATE ON todos
  FOR EACH ROW
  BEGIN
    UPDATE todos SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
`);

/**
 * Normalize a DB row to API shape.
 */
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: !!row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// PUBLIC_INTERFACE
function getAllTodos() {
  /** Fetch all todos ordered by created_at desc. */
  const stmt = db.prepare(
    "SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY datetime(created_at) DESC, id DESC"
  );
  const rows = stmt.all();
  return rows.map(mapRow);
}

// PUBLIC_INTERFACE
function findTodoById(id) {
  /** Find a todo by id. Returns null if not found. */
  const stmt = db.prepare(
    "SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?"
  );
  const row = stmt.get(id);
  return mapRow(row);
}

// PUBLIC_INTERFACE
function createTodo(title) {
  /** Create a todo with specified title. Returns the created todo. */
  const insert = db.prepare("INSERT INTO todos (title, completed) VALUES (?, 0)");
  const info = insert.run(title);
  return findTodoById(info.lastInsertRowid);
}

// PUBLIC_INTERFACE
function updateTodoFull(id, data) {
  /**
   * Full update of a todo requiring both title and completed fields.
   * Returns the updated todo or null if not found.
   */
  const update = db.prepare("UPDATE todos SET title = ?, completed = ? WHERE id = ?");
  const res = update.run(data.title, data.completed ? 1 : 0, id);
  if (res.changes === 0) return null;
  return findTodoById(id);
}

// PUBLIC_INTERFACE
function patchTodo(id, fields) {
  /**
   * Partial update. Supports setting title and/or completed.
   * Returns the updated todo or null if not found.
   */
  const parts = [];
  const args = [];
  if (Object.prototype.hasOwnProperty.call(fields, "title")) {
    parts.push("title = ?");
    args.push(fields.title);
  }
  if (Object.prototype.hasOwnProperty.call(fields, "completed")) {
    parts.push("completed = ?");
    args.push(fields.completed ? 1 : 0);
  }
  if (parts.length === 0) {
    return findTodoById(id); // nothing to change
  }
  const sql = `UPDATE todos SET ${parts.join(", ")} WHERE id = ?`;
  args.push(id);
  const update = db.prepare(sql);
  const res = update.run(...args);
  if (res.changes === 0) return null;
  return findTodoById(id);
}

// PUBLIC_INTERFACE
function deleteTodo(id) {
  /** Delete a todo by id. Returns true if deleted, false if not found. */
  const del = db.prepare("DELETE FROM todos WHERE id = ?");
  const res = del.run(id);
  return res.changes > 0;
}

module.exports = {
  getAllTodos,
  findTodoById,
  createTodo,
  updateTodoFull,
  patchTodo,
  deleteTodo,
};

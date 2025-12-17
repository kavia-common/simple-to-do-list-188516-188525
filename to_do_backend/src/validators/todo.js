"use strict";

const { createError } = require("../middleware/errorHandler");

const MAX_TITLE_LEN = 120;

// PUBLIC_INTERFACE
function parseIdParam(idParam) {
  /** Parse and validate a numeric id path parameter. */
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) {
    throw createError(400, "Invalid id parameter");
  }
  return n;
}

// PUBLIC_INTERFACE
function validateCreate(body) {
  /**
   * Validate a create request body.
   * Returns an object { title } with sanitized/trimmed values.
   */
  if (!body || typeof body !== "object") {
    throw createError(400, "Invalid JSON body");
  }
  const titleRaw = (body.title ?? "").toString().trim();
  if (titleRaw.length === 0) {
    throw createError(400, "Title is required");
  }
  if (titleRaw.length > MAX_TITLE_LEN) {
    throw createError(400, `Title must be at most ${MAX_TITLE_LEN} characters`);
  }
  return { title: titleRaw };
}

// PUBLIC_INTERFACE
function validateUpdate(body, options = {}) {
  /**
   * Validate an update (PUT/PATCH) request body.
   * options:
   *  - requireTitle: if true, title must be present
   *  - requireCompleted: if true, completed must be present
   * Returns a partial object { title?, completed? } with sanitized values.
   */
  if (!body || typeof body !== "object") {
    throw createError(400, "Invalid JSON body");
  }

  const out = {};

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = (body.title ?? "").toString().trim();
    if (title.length === 0) throw createError(400, "Title cannot be empty");
    if (title.length > MAX_TITLE_LEN) {
      throw createError(400, `Title must be at most ${MAX_TITLE_LEN} characters`);
    }
    out.title = title;
  } else if (options.requireTitle) {
    throw createError(400, "Title is required");
  }

  if (Object.prototype.hasOwnProperty.call(body, "completed")) {
    const c = body.completed;
    if (typeof c !== "boolean") {
      throw createError(400, "Completed must be a boolean");
    }
    out.completed = !!c;
  } else if (options.requireCompleted) {
    throw createError(400, "Completed is required");
  }

  if (!options.requireTitle && !options.requireCompleted && Object.keys(out).length === 0) {
    throw createError(400, "At least one of 'title' or 'completed' must be provided");
  }

  return out;
}

module.exports = {
  parseIdParam,
  validateCreate,
  validateUpdate,
};

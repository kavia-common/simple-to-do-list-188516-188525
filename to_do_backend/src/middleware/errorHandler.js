"use strict";

/**
 * Generic JSON error handling middleware and helpers.
 */

// PUBLIC_INTERFACE
function createError(status, message, details) {
  /** Create an HTTP error object carrying a status and optional details. */
  const err = new Error(message || "Error");
  err.status = status || 500;
  if (details !== undefined) err.details = details;
  return err;
}

// PUBLIC_INTERFACE
function notFoundHandler(req, res, next) {
  /** 404 handler for unmatched routes. */
  next(createError(404, "Not Found"));
}

// PUBLIC_INTERFACE
function jsonErrorHandler(err, req, res, _next) {
  /**
   * JSON error response formatter.
   * Emits { message, details? } with appropriate status code.
   */
  const status = err.status || 500;
  const payload = {
    message: err.message || "Internal Server Error",
  };
  if (err.details !== undefined) {
    payload.details = err.details;
  }
  res.status(status).json(payload);
}

module.exports = {
  createError,
  notFoundHandler,
  jsonErrorHandler,
};

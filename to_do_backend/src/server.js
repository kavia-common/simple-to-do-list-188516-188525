"use strict";

/**
 * Express server entrypoint for the To-Do backend.
 * Provides REST API under /api and a health check endpoint.
 * - CORS configured for frontend origin
 * - JSON body parsing
 * - Swagger/OpenAPI docs at /api/docs
 * - Health check at /healthz (configurable)
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const { notFoundHandler, jsonErrorHandler } = require("./middleware/errorHandler");
const todosRouter = require("./routes/todos");

const app = express();

const rawPort = process.env.PORT || process.env.REACT_APP_PORT;
const PORT = parseInt(rawPort, 10) || 4000;

const TRUST_PROXY_RAW = process.env.TRUST_PROXY ?? process.env.REACT_APP_TRUST_PROXY ?? "";
const TRUST_PROXY =
  TRUST_PROXY_RAW.toString().toLowerCase() === "true" || TRUST_PROXY_RAW.toString() === "1";

const LOG_LEVEL_RAW = process.env.LOG_LEVEL || process.env.REACT_APP_LOG_LEVEL || "dev";
// Ensure we use a valid morgan preset; fallback to "dev" if unknown (e.g., "info")
const LOG_FORMAT = ["combined", "common", "dev", "short", "tiny"].includes(LOG_LEVEL_RAW)
  ? LOG_LEVEL_RAW
  : "dev";

const HEALTH_PATH =
  process.env.HEALTHCHECK_PATH || process.env.REACT_APP_HEALTHCHECK_PATH || "/healthz";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || `http://localhost:${PORT}`;

// Trust proxy if behind a reverse proxy (e.g., ingress)
if (TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// Middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan(LOG_FORMAT));

// Health check (not under /api for k8s/infra probes)
/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Service health check
 *     description: Returns basic service status and uptime.
 *     tags:
 *       - Health
 *     responses:
 *       '200':
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 timestamp:
 *                   type: string
 *                   example: 2025-01-01T00:00:00.000Z
 */
app.get(HEALTH_PATH, (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", todosRouter);

// Swagger/OpenAPI setup
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "To-Do API",
    version: "1.0.0",
    description:
      "Simple To-Do REST API built with Express and SQLite (better-sqlite3). Endpoints are under /api.",
  },
  servers: [
    {
      url: `${BACKEND_URL}/api`,
      description: "Primary server",
    },
  ],
  tags: [
    { name: "Todos", description: "Manage to-do tasks" },
    { name: "Health", description: "Service health endpoints" },
  ],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, "./routes/*.js"), path.join(__dirname, "./server.js")],
};

const openapiSpec = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

// 404 and error handlers
app.use(notFoundHandler);
app.use(jsonErrorHandler);

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `To-Do backend listening on port ${PORT}\n` +
      `- API base: ${BACKEND_URL}/api\n` +
      `- Swagger docs: ${BACKEND_URL}/api/docs\n` +
      `- Health: ${BACKEND_URL}${HEALTH_PATH}\n` +
      `- CORS allowed origin: ${FRONTEND_ORIGIN}`
  );
});

module.exports = app;

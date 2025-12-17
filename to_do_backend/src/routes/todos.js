"use strict";

const express = require("express");
const router = express.Router();

const db = require("../db");
const { validateCreate, validateUpdate, parseIdParam } = require("../validators/todo");
const { createError } = require("../middleware/errorHandler");

/**
 * @openapi
 * components:
 *   schemas:
 *     Todo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Buy milk"
 *         completed:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           example: "2025-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           example: "2025-01-01T00:00:00.000Z"
 *     CreateTodoRequest:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           description: Task title (1-120 chars)
 *           example: "Learn Express"
 *     UpdateTodoRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Task title (1-120 chars)
 *         completed:
 *           type: boolean
 *           description: Completion status
 */

/**
 * @openapi
 * /todos:
 *   get:
 *     summary: List all todos
 *     tags: [Todos]
 *     responses:
 *       '200':
 *         description: An array of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 */
router.get("/todos", (req, res) => {
  const items = db.getAllTodos();
  res.json(items);
});

/**
 * @openapi
 * /todos:
 *   post:
 *     summary: Create a new todo
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *     responses:
 *       '201':
 *         description: Created todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       '400':
 *         description: Validation error
 */
router.post("/todos", (req, res, next) => {
  try {
    const { title } = validateCreate(req.body);
    const created = db.createTodo(title);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *     summary: Update a todo (full)
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       '200':
 *         description: Updated todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       '400':
 *         description: Validation error
 *       '404':
 *         description: Not found
 */
router.put("/todos/:id", (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const { title, completed } = validateUpdate(req.body, { requireCompleted: true, requireTitle: true });
    const updated = db.updateTodoFull(id, { title, completed });
    if (!updated) return next(createError(404, "Todo not found"));
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   patch:
 *     summary: Partially update a todo
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       '200':
 *         description: Updated todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       '400':
 *         description: Validation error
 *       '404':
 *         description: Not found
 */
router.patch("/todos/:id", (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const { title, completed } = validateUpdate(req.body, { requireCompleted: false, requireTitle: false });
    const updated = db.patchTodo(id, { ...(title !== undefined ? { title } : {}), ...(completed !== undefined ? { completed } : {}) });
    if (!updated) return next(createError(404, "Todo not found"));
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *     summary: Delete a todo
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       '204':
 *         description: Deleted
 *       '404':
 *         description: Not found
 */
router.delete("/todos/:id", (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const ok = db.deleteTodo(id);
    if (!ok) return next(createError(404, "Todo not found"));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PUBLIC_INTERFACE
module.exports = router;

# To-Do Backend (Node.js + Express + SQLite)

This container provides a simple RESTful backend for a To-Do application using:
- Express.js
- SQLite (via better-sqlite3) with automatic schema initialization
- CORS for the React frontend
- JSON error handling
- Swagger/OpenAPI docs at `/api/docs`

## Endpoints

- GET `/healthz` — service health
- GET `/api/todos` — list todos
- POST `/api/todos` — create todo (body: `{ "title": "text" }`)
- PUT `/api/todos/:id` — full update (body: `{ "title": "text", "completed": true|false }`)
- PATCH `/api/todos/:id` — partial update (body: `{ "title"?: "text", "completed"?: true|false }`)
- DELETE `/api/todos/:id` — delete todo

## Quick Start

1) Install dependencies
```
cd simple-to-do-list-188516-188525/to_do_backend
npm install
```

2) Run in development
```
npm run dev
```

3) Production start
```
npm start
```

By default the server listens on port `4000`:
- API base: `http://localhost:4000/api`
- Docs: `http://localhost:4000/api/docs`
- Health: `http://localhost:4000/healthz`

## Environment Variables

Create a `.env` file in `to_do_backend` folder based on `.env.example`:

- REACT_APP_PORT: Port to run the backend on (default: 4000)
- REACT_APP_FRONTEND_URL: Origin allowed by CORS (default: http://localhost:3000)
- REACT_APP_BACKEND_URL: Public URL for the backend (used for Swagger servers list)
- REACT_APP_TRUST_PROXY: "true"/"false" if behind proxy
- REACT_APP_LOG_LEVEL: morgan log format (e.g., "dev")
- REACT_APP_HEALTHCHECK_PATH: health endpoint path (default: /healthz)
- REACT_APP_API_BASE, REACT_APP_WS_URL, REACT_APP_NODE_ENV, REACT_APP_NEXT_TELEMETRY_DISABLED,
  REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED:
  Included for consistency; not required by this backend.

See `.env.example` for all keys.

## Integrating with the Frontend

In the React frontend, set:
```
REACT_APP_API_BASE=http://localhost:4000/api
```

Restart the frontend dev server after changing env variables.

## Example cURL

- Create a todo:
```
curl -s -X POST http://localhost:4000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

- List todos:
```
curl -s http://localhost:4000/api/todos | jq
```

- Update todo:
```
curl -s -X PATCH http://localhost:4000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

- Delete todo:
```
curl -s -X DELETE http://localhost:4000/api/todos/1 -i
```

## Notes

- Data is stored at `to_do_backend/data/todos.db`. The file is created on first run.
- Schema is initialized automatically; no manual migration needed.

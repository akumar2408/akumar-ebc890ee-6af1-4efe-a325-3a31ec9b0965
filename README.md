# Secure Task Management (RBAC) — Monorepo

A small-but-solid full-stack app that demonstrates **role-based access control (RBAC)** across a NestJS API and an Angular dashboard, all inside an **Nx** workspace. It’s meant to be easy to run, easy to read, and easy to extend.

---

## Quickstart (TL;DR)

```bash
# 1) Install deps
npm i

# 2) Seed dev data (SQLite) and run both apps
rm -f data.db
TS_NODE_PROJECT=apps/api/tsconfig.app.json npm run seed
TS_NODE_PROJECT=apps/api/tsconfig.app.json npm run dev
# API  : http://localhost:3333
# UI   : http://localhost:4200  (proxied to /api)

# 3) Login (seeded users)
# owner@demo.com / password
# admin@demo.com / password
# viewer@demo.com / password

# 4) Tests
npx nx run api:test
npx nx run dashboard:test
```

---

## Setup Instructions

### 1) Env file

Create a **.env** at the repo root:

```dotenv
# JWT
JWT_SECRET=dev_super_secret_change_me
JWT_EXPIRES_IN=1d

# Database (SQLite default)
DB_TYPE=sqlite
DB_PATH=./data.db

# (Optional) PostgreSQL alternative
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASS=postgres
# DB_NAME=secure_task
```

The API reads these values in its TypeORM/JWT configs. By default it uses the SQLite file at **./data.db**.

### 2) Install & run

```bash
npm i

# seed orgs + users + example hierarchy
TS_NODE_PROJECT=apps/api/tsconfig.app.json npm run seed

# run API + Dashboard together (concurrently)
TS_NODE_PROJECT=apps/api/tsconfig.app.json npm run dev
```

- **API**: http://localhost:3333  
- **Dashboard**: http://localhost:4200  
  (Angular dev server proxies `/api` to the backend)

### 3) Authentication

Use the seeded credentials:

- **Owner**: `owner@demo.com` / `password`  
- **Admin**: `admin@demo.com` / `password`  
- **Viewer**: `viewer@demo.com` / `password`

---

## Architecture Overview

### Why Nx?

Nx gives us a single workspace with strong boundaries:

- `apps/` contain runnable applications  
- `libs/` contain shared, reusable code  
- Consistent tooling for build, test, and serve across the stack

### Workspace Layout

```
apps/
  api/         # NestJS backend
  dashboard/   # Angular frontend

libs/
  auth/        # Reusable RBAC logic (guards/decorators)
  data/        # Shared DTOs/interfaces (frontend + backend)
```

### Backend modules (NestJS)

- **AuthModule**: JWT login & strategy, guards  
- **OrgsModule**: org tree queries  
- **TasksModule**: CRUD with org scoping  
- **AuditModule**: audit endpoint (restricted)  
- **UsersModule**: user persistence

### Frontend (Angular)

- **Auth interceptor** injects JWT on every API request  
- **TaskBoardComponent**: create/edit/delete tasks, drag & drop status, filtering, categories, light/dark mode, keyboard shortcuts  
- **LoginComponent**: authenticates against the backend, persists token

---

## Data Model

We model organizations with a simple 2-level hierarchy and attach users to orgs via a membership that carries a role.

```mermaid
erDiagram
  User ||--o{ UserOrgRole : "memberships"
  Organization ||--o{ UserOrgRole : "memberships"
  Organization ||--o{ Organization : "children (parent_id)"
  Organization ||--o{ Task : "has many"
  User ||--o{ Task : "owner"

  User {
    int id PK
    string email
    string passwordHash
  }

  Organization {
    int id PK
    string name
    int parentId FK nullable
  }

  UserOrgRole {
    int id PK
    int userId FK
    int orgId FK
    enum role  "OWNER | ADMIN | VIEWER"
  }

  Task {
    int id PK
    string title
    string description
    string category  "Work | Personal | Other"
    enum status      "todo | in_progress | done"
    int orgId FK
    int ownerUserId FK
    datetime createdAt
    datetime updatedAt
  }
```

---

## Access Control (RBAC)

### Roles

- **OWNER** – full control scoped to their org (and children)  
- **ADMIN** – manage tasks within org scope  
- **VIEWER** – read-only within org scope

### Permissions (simplified)

| Permission  | OWNER | ADMIN | VIEWER |
|-------------|:-----:|:-----:|:------:|
| VIEW_TASKS  |  ✅   |  ✅   |   ✅    |
| CREATE_TASK |  ✅   |  ✅   |   ❌    |
| UPDATE_TASK |  ✅   |  ✅   |   ❌    |
| DELETE_TASK |  ✅   |  ✅   |   ❌    |
| AUDIT_VIEW  |  ✅   |  ✅   |   ❌    |

### Org scoping

Requests **must** specify an org scope via `?orgId=` (preferred) or `X-Org-Id` header.  
The RBAC guard checks the caller’s membership in that org (or child) and the required permission for the route.

### JWT integration

- `POST /auth/login` returns a signed JWT.  
- Client sends `Authorization: Bearer <token>` in every request.  
- A Passport JWT strategy decodes and attaches `req.user`.  
- The RBAC guard reads `req.user` + org scope to authorize per-route.  
- All protected routes use both **JWT auth guard** and **RBAC guard**.

---

## API Docs (high level)

**Base URL:** `http://localhost:3333`

### Auth

**POST `/auth/login`**

**Request**
```json
{ "email": "owner@demo.com", "password": "password" }
```

**Response**
```json
{ "access_token": "<JWT>" }
```

> Use the token as `Authorization: Bearer <JWT>`.

### Tasks (scoped by org)

Pass `?orgId=1` (preferred) or header `X-Org-Id: 1`.

**GET `/tasks?orgId=1`** — Roles: Owner/Admin/Viewer  
Response: Array of tasks visible in the org

```bash
curl -H "Authorization: Bearer $TOKEN"      "http://localhost:3333/tasks?orgId=1"
```

**POST `/tasks?orgId=1`** — Roles: Owner/Admin

**Body**
```json
{ "title": "Ship RBAC", "description": "end-to-end", "category": "Work" }
```

```bash
curl -X POST -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json"   -d '{"title":"Ship RBAC","category":"Work"}'   "http://localhost:3333/tasks?orgId=1"
```

**PUT `/tasks/:id?orgId=1`** — Roles: Owner/Admin

**Body (partial updates allowed)**
```json
{ "title": "Ship RBAC v2", "status": "in_progress" }
```

**DELETE `/tasks/:id?orgId=1`** — Roles: Owner/Admin

**Response**
```json
{ "affected": 1 }
```

### Audit

**GET `/audit-log`** — Roles: Owner/Admin  
**Scope:** `X-Org-Id` required

**Response**
```json
{ "message": "Audit logs are emitted to server console." }
```

---

## Frontend (Angular) Features

- **Login** screen (stores JWT, interceptor sends it on all requests)  
- **Task board**:  
  - Create / Edit / Delete  
  - Filter by text and category  
  - Drag-and-drop status changes (CDK)  
  - Dark / Light toggle  
  - Keyboard shortcuts:
    - **⌘/Ctrl + N** → new task
    - **⌘/Ctrl + F** → focus filter
- **Org switcher** (scopes API calls)

**Run locally:**

```bash
# both apps
TS_NODE_PROJECT=apps/api/tsconfig.app.json npm run dev

# or separately
npx nx run api:serve
npx nx run dashboard:serve
```

---

## Testing

### Backend

Unit & e2e (Jest + Supertest). In tests, we spin up in-memory SQLite and verify **401/403/2xx** across roles.

```bash
npx nx run api:test
```

### Frontend

Karma + Jasmine unit tests for board logic (split/filter/columns).

```bash
npx nx run dashboard:test
```

---

## Future Considerations

### Advanced delegation

- Project-level roles; time-boxed grants; approval flows

### Production-grade auth

- Refresh tokens & rotation  
- CSRF protection (if moving to cookie-based auth)  
- Revocation lists / logout everywhere

### RBAC performance

- Cache membership lookups (e.g., per request or in Redis)  
- Pre-compute org ancestry for fast scope checks

### Security hardening

- Rate limiting, helmet, strict CORS  
- Structured audit logs shipped to SIEM

### Observability

- Metrics, tracing, structured logs

### Migrations & multi-DB

- TypeORM migrations for schema evolution  
- First-class Postgres config in `.env` + docker-compose

---

## Notes

- Angular dev server proxies `/api` to `http://localhost:3333` (see `apps/dashboard/proxy.conf.json`).  
- All guarded endpoints require:
  - `Authorization: Bearer <JWT>`
  - An org scope (`?orgId=` or `X-Org-Id` where applicable)

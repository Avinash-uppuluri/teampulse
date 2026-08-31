# TeamPulse — Part 1: Authentication, Role Management & Admin/User Management

This is Part 1 of the TeamPulse platform: login, JWT authentication,
role-based redirects, and the Admin dashboard + full user management
(create/edit/deactivate/delete/reset password). It is built to plug
into the same MySQL database and JWT scheme that Parts 2, 3, and 4
will use.

## Stack

- **Frontend:** React + Vite, React Router, Axios, Lucide icons
- **Backend:** Python, Flask, Flask-JWT-Extended, bcrypt
- **Database:** MySQL

## Folder structure

```
team-pulse/
  frontend/         React app (Vite)
  backend/          Flask API
  database/         schema.sql + seed.sql
```

## 1. Set up the database

```bash
mysql -u root -p < database/schema.sql
```

This creates `teampulse_db` and the centralized `users` table.

## 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DB_USER, DB_PASSWORD, JWT_SECRET_KEY, etc.

# Create the initial ADMIN account (bcrypt-hashed, safe way to seed it)
python seed_admin.py

python run.py
```

The API runs at `http://localhost:5000`.

### Test credentials (from `.env.example` defaults)

```
Email:    admin@teampulse.com
Password: Admin@12345
```

Change this password after first login (via User Management → Reset
Password, or by editing `SEED_ADMIN_PASSWORD` before running
`seed_admin.py`).

## 3. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env    # defaults already point at http://localhost:5000/api
npm run dev
```

The app runs at `http://localhost:5173`.

## API documentation

All responses follow `{ success, message, data? }`. Protected routes
require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Log in, returns `{ token, user }` |
| POST | `/api/auth/logout` | JWT | Stateless logout (client discards token) |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/admin/stats` | ADMIN | Dashboard counts |
| GET | `/api/admin/users` | ADMIN | List users — query: `search, role, status, page, per_page` |
| GET | `/api/admin/users/:id` | ADMIN | Get one user |
| POST | `/api/admin/users` | ADMIN | Create user (`name, email, password, role, department`) |
| PUT | `/api/admin/users/:id` | ADMIN | Update `name` / `role` / `department` |
| PATCH | `/api/admin/users/:id/status` | ADMIN | `{ status: "ACTIVE" \| "INACTIVE" }` |
| PATCH | `/api/admin/users/:id/reset-password` | ADMIN | `{ password }` |
| DELETE | `/api/admin/users/:id` | ADMIN | Delete user |

Roles: `ADMIN, PROJECT_MANAGER, TEAM_LEAD, DEVELOPER, QA_TESTER, CLIENT`.
Only ADMIN accounts are excluded from `POST /api/admin/users` — they
are created exclusively via `backend/seed_admin.py`, never through the
API or public registration.

## Security implemented

- Passwords hashed with bcrypt, never returned to the frontend
- JWT-based auth (`flask-jwt-extended`), role embedded as a claim
- `@roles_required(...)` middleware re-checks the role **on the
  backend** for every protected route — the frontend's `RoleRoute` is
  UX only, not the source of truth
- Duplicate-email prevention on user creation
- Parameterized SQL everywhere (no string-built queries)
- CORS restricted to `FRONTEND_ORIGIN`
- Generic "Invalid email or password" message on failed login (never
  reveals whether the email exists)
- Admins cannot delete their own account
- All secrets/config via `.env`, never hardcoded

## Integration notes for Parts 2, 3, 4

- **Use the same MySQL database** (`teampulse_db`) and the same
  `users` table — do not create a second users table. Reference
  `users.id` as a foreign key (e.g. `projects.project_manager_id`,
  `tasks.assigned_to`).
- **Use the same `JWT_SECRET_KEY`** (share the `.env` value) so
  tokens issued by this login endpoint are valid on your APIs too.
  Decode the token to get `identity` (user id) and claims `role`,
  `name`, `email` — no extra DB call needed for basic checks.
- Copy `backend/app/middleware/auth_middleware.py` (or import it, once
  merged into one Flask app) to protect your own routes with
  `@token_required` and `@roles_required("PROJECT_MANAGER", ...)`.
- When merged into one app, register your blueprints in
  `backend/app/__init__.py` alongside `auth_bp` and `admin_bp`.
- On the frontend, reuse `ProtectedRoute`, `RoleRoute`, `AuthContext`,
  `Sidebar`/`Navbar`, and `services/api.js` (the Axios instance
  already attaches the JWT and handles 401s) rather than rebuilding
  auth plumbing in your module.
- `/admin/stats` already checks for a `projects` table and will
  report `total_projects` automatically once Part 2 creates it — no
  change needed on your end.

## Run commands (quick reference)

```bash
# Backend
cd backend && python run.py

# Frontend
cd frontend && npm run dev
```

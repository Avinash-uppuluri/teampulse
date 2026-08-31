# Integration Guide — connecting Part 3 to Parts 1, 2, and 4

Part 3 is deliberately narrow: it only owns `tasks`, `task_dependencies`,
`task_comments`, and `task_submissions`. Everything else is read from
tables the other parts own. This doc says exactly where those seams are.

## 1. Shared database

All four parts must point at the **same MySQL database** (`teampulse` in
the examples here). Part 3's `schema.sql` only issues `CREATE TABLE IF NOT
EXISTS` for its own 4 tables — it never creates or alters `users`,
`projects`, `teams`, or `team_members`.

Run order:
1. Part 1's schema (users, auth tables)
2. Part 2's schema (projects, teams, team_members, milestones)
3. Part 3's schema (this module) — `backend/schema.sql`
4. Part 4's schema (bugs, reports, monitoring)

If Part 2's table/column names differ from what's assumed here, there are
exactly three places to update:

| File | What to change |
|---|---|
| `backend/models.py` | `User`, `Project`, `Team`, `TeamMember` mirror classes — column names must match Part 2's actual schema |
| `backend/permissions.py` | Raw SQL in `is_team_lead_of`, `manages_project`, `is_member_of_team`, `team_ids_led_by` — table/column names |
| `backend/routes/teams.py`, `routes/developers.py` | Any direct queries against `Team`/`User` |

## 2. Shared authentication (JWT)

Part 3 **never logs anyone in**. It only verifies the JWT that Part 1's
login endpoint already issued.

To make this work:
- `backend/config.py`'s `JWT_SECRET` / `JWT_ALGORITHM` must be **byte-for-byte
  identical** to what Part 1 uses to sign tokens.
- Part 1's token payload must include `user_id` and `role` (and ideally
  `email`). If Part 1 uses different claim names (e.g. `sub` instead of
  `user_id`), update `_extract_identity()` in `backend/auth_utils.py` —
  it's the single place that maps token claims to `g.current_user`.
- Roles must use these exact strings, matching the spec's permission
  table: `ADMIN`, `PROJECT_MANAGER`, `TEAM_LEAD`, `DEVELOPER`, `QA`, `CLIENT`.

On the frontend, Part 1's shell app is expected to store the token and
user after login:

```js
localStorage.setItem("tp_token", jwt);
localStorage.setItem("tp_user", JSON.stringify({ id, name, role, email }));
```

`frontend/src/api/client.js` reads `tp_token` on every request; `AuthContext.jsx`
reads `tp_user`. If Part 1's shell uses a different storage key or a React
context of its own instead of `localStorage`, swap those two reads only —
nothing else in Part 3 needs to change.

## 3. Mounting the module in the shell app

This repo's `frontend/src/App.jsx` is a **standalone demo shell** so Part 3
can run and be reviewed on its own. In the real TeamPulse app, Part 1/2's
shell should instead:

1. Own the top-level router/layout (nav, project switcher, team switcher).
2. Render `<DeveloperDashboard />` or `<TeamLeadTaskDashboard projectId={...} teamId={...} developers={...} />`
   as a routed page/tab, passing in whatever project/team is currently
   selected in Part 2's UI.
3. Provide the `developers` prop as `[{ id, name }]` — sourced from Part 2's
   team-membership data (Part 3 does not fetch user lists itself, since
   that's Part 1's domain).

Concretely, replace this repo's `ModuleRouter` with the shell's own route
that does the same role check and prop-passing.

## 4. Backend service topology

Part 3 runs as its own Flask process (default port `5003`) so each part's
backend can be developed, tested, and scaled independently. Two options
for production:

- **Separate services** behind a reverse proxy/API gateway that routes
  `/api/tasks*`, `/api/developers*`, `/api/teams/*/workload` etc. to Part 3,
  and other prefixes to Parts 1/2/4. This is the default assumption baked
  into `CORS_ORIGINS` and the `/api/*` blueprint prefixes here.
- **Single Flask app**: import Part 3's blueprints
  (`routes.tasks.tasks_bp`, `routes.comments.comments_bp`,
  `routes.submissions.submissions_bp`, `routes.developers.developers_bp`,
  `routes.teams.teams_bp`) and `register_blueprint()` them on a shared app
  alongside Parts 1/2/4's blueprints, sharing one `SQLAlchemy` instance.
  If you do this, drop Part 3's own `db.init_app()` call in `app.py` and
  reuse the shell's `db` object instead.

## 5. Real-time updates (Socket.IO)

Part 3 emits: `taskCreated`, `taskUpdated`, `taskAssigned`, `taskCompleted`,
`taskBlocked`, `taskSubmitted`. If Part 2 or Part 4 already run their own
Socket.IO server, either:
- point `frontend/src/utils/useTaskSocket.js`'s `SOCKET_URL` at that shared
  server and have Part 3's Flask blueprint register its event handlers
  there instead of running its own `socketio.run()`, or
- keep Part 3's Socket.IO server separate (default here) and have the
  frontend open two connections — one per backend service.

## 6. What Part 4 (QA/reports) should expect from Part 3

Part 4 can read (but should not write) Part 3's tables directly for
reporting, or call:
- `GET /api/teams/:id/workload` — per-developer completion stats
- `GET /api/developers/:id/dashboard` — individual stats
- `GET /api/tasks?project_id=...` — raw task list for a project

`review_status` on `task_submissions` (`PENDING` / `APPROVED` /
`CHANGES_REQUESTED`) is a useful signal for QA readiness reporting: a task
whose latest submission is `APPROVED` has completed code review.

## 7. Things Part 3 intentionally does NOT do

Per the spec, this module never implements: login/registration, the users
table, project creation, team creation, bug tracking, or reports. Any
request to add those belongs in Parts 1, 2, or 4 respectively — Part 3
only consumes that data via the read-only mirrors in `models.py` and the
scoping checks in `permissions.py`.

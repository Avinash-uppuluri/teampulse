# Integration Guide — Merging Part 2 into TeamPulse

This module is built to run standalone during development, then fold
directly into the single shared TeamPulse backend and frontend. This
document describes exactly how.

---

## 1. Database merge

Part 2 assumes a **single shared MySQL database** (`teampulse`) used by
all four parts. No separate database, no duplicated `users` table.

- Part 1's migration must run first and create `users`.
- Run `sql/schema.sql` after Part 1's migration (skip the commented-out
  `users` reference stub at the top — that's for standalone dev only).
- Part 3 (tasks) and Part 4 (QA/reports) should add their own tables
  in the same database, with foreign keys back to `projects.id`,
  `teams.id`, and `milestones.id` as needed — never duplicate project,
  team, or milestone data into their own tables.

If each part currently maintains its own Alembic/Flask-Migrate
history, consolidate into one migrations directory before merge, or
sequence them explicitly: `part1_migrations` → `part2_migrations` →
`part3_migrations` → `part4_migrations`.

## 2. Backend merge

Part 2's Flask app is structured as **blueprints**, specifically so it
can be dropped into a shared Flask app rather than run as its own
process:

```python
# in the merged app's factory (e.g. teampulse_backend/app.py)
from part2.routes.projects import projects_bp
from part2.routes.teams import teams_bp
from part2.routes.milestones import milestones_bp

app.register_blueprint(projects_bp)
app.register_blueprint(teams_bp)
app.register_blueprint(milestones_bp)
```

Steps:
1. Copy `backend/models/*`, `backend/routes/*`, and `backend/utils/*`
   into the shared backend package (e.g. under a `part2/` namespace,
   or flatten into the shared `models/` and `routes/` directories —
   either works, just keep imports consistent).
2. Point `db = SQLAlchemy()` at the **same instance** the shared app
   already initializes — don't call `db.init_app()` twice. Remove
   Part 2's own `extensions.py` in favor of the shared one, and update
   imports (`from extensions import db` → wherever the shared instance
   lives).
3. Delete Part 2's own `UserRef` model if the shared app already has a
   canonical `User` model from Part 1 — just import that instead and
   drop the `UserRef` file. Keep the `.to_summary()`-style helper
   though; routes and `to_dict()` methods depend on that shape.
3. Confirm `JWT_SECRET_KEY` is shared app-wide (it should already be,
   since Part 1 configures it) — Part 2's `config.py` becomes
   redundant once merged; keep only the DB/CORS settings if the shared
   config doesn't already define them.
4. Run `flask routes` (or equivalent) after merge and confirm no path
   collisions with Part 3/4 routes.

## 3. Frontend merge

1. Copy `frontend/src/components/*` and `frontend/src/pages/*` into
   the shared React app's equivalent directories.
2. Copy `frontend/src/api/client.js`'s `ProjectsAPI`, `TeamsAPI`, and
   `MilestonesAPI` exports into the shared app's API layer (or keep as
   a separate file and import from it — either is fine as long as the
   shared app has one axios instance with one JWT interceptor, not
   several racing to read `localStorage`).
3. Replace the `useCurrentUser()` stub in `App.jsx` with whatever
   Part 1 actually provides (context, a hook, or props) for the
   authenticated user. Every component here only needs
   `{ id, role, name }` — adapt the shape if Part 1's differs.
4. Merge `styles/tokens.css` and `styles/app.css` into the shared
   stylesheet, watching for class-name collisions with Part 3/4's
   CSS (all of Part 2's classes are prefixed `tp-` specifically to
   reduce this risk — keep that convention if Part 3/4 don't already
   have their own prefix).
5. Add routes into the shared router:
   ```jsx
   <Route path="/projects" element={<ProjectDashboard currentUser={user} />} />
   <Route path="/projects/:id" element={<ProjectDetails currentUser={user} />} />
   ```
   Part 3's task board and Part 4's QA/reports views should link back
   to `/projects/:id` rather than duplicating project chrome.

## 4. Where Part 3 (Tasks) plugs in

Part 3 will need:
- `project_id` — to scope its task board to a project.
- `team_id` — to scope tasks to a team, and to know which developers
  are assignable (via `GET /api/teams/:id` → `members[].user_id`).
- `team_lead_id` — to know who can assign/reassign within a team.

Part 2's `ProjectDetails` page deliberately has **no task UI** — Part 3
should add its own tab (e.g. "Tasks") alongside Overview / Teams /
Milestones / Activity, driven by the same `project.id`. The cleanest
integration point is extending the `TABS` array in
`pages/ProjectDetails.jsx` once Part 3's component exists.

Part 3 should treat `milestones.id` as an optional foreign key on
tasks (e.g. `tasks.milestone_id`) if tasks should roll up into
milestone progress — Part 2's `Milestone.progress` is currently set
manually by the PM, but could be recomputed from task completion once
Part 3 exists (a `PATCH` from Part 3 into `PUT /api/milestones/:id`
with a computed `progress` is the simplest bridge, no schema change
needed).

## 5. Where Part 4 (QA / Monitoring / Reports) plugs in

Part 4 will need:
- `project_id` — to scope QA runs and reports.
- `team_id` — to attribute defects/QA results to a team.
- `milestone_id` — to tie QA sign-off or report periods to a
  milestone's due date.

Part 4's reports should read `GET /api/projects/:id` for the
authoritative `health`, `status`, `progress`, and `is_at_risk` /
`is_delayed` flags rather than recomputing them — Part 2 owns that
logic so it stays consistent everywhere it's shown (dashboard cards,
detail page, and any report Part 4 generates).

## 6. Activity feed as a shared bus

`project_activity` is intentionally generic (`project_id`, `user_id`,
`action`, `details`, `created_at`) so Part 3 and Part 4 can write into
it too — e.g. Part 3 logs `TASK_COMPLETED`, Part 4 logs
`QA_REPORT_GENERATED` — and Part 2's Activity tab will render them
automatically without any code change, since it just lists the most
recent 50 rows for a project. If Part 3/4 prefer their own activity
tables instead, that's fine too; just don't duplicate this one.

## 7. Environment variables after merge

Once merged, Part 2's standalone `.env` collapses into the shared
app's single `.env`. The variables Part 2 needs (all likely already
present since Part 1 needs most of them too):

```
DATABASE_URL=...
JWT_SECRET_KEY=...
CORS_ORIGINS=...
```

No Part-2-specific variables are required beyond what Part 1 already
configures.

## 8. Checklist before considering the merge done

- [ ] `sql/schema.sql` tables exist in the shared DB, FKs resolve against the real `users` table
- [ ] `flask routes` shows no path collisions across all four parts
- [ ] A JWT issued by the real Part 1 login endpoint successfully authorizes `GET /api/projects`
- [ ] `ProjectDashboard` renders using the real logged-in user's role (PM sees only their projects, Team Lead sees only their team's project, etc.)
- [ ] Part 3's task UI links into `/projects/:id` and doesn't reintroduce a duplicate project header
- [ ] Part 4's reports pull `health`/`status`/`progress` from Part 2's API rather than recalculating independently

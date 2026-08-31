# TeamPulse — Merge Notes

This is the four standalone parts (`team-pulse-part1.zip`, `teampulse-part2.zip`,
`teampulse-part3.zip`, `teampulse-part4.zip`) merged into one Flask + React +
MySQL app, following the plan each part's own `INTEGRATION.md`/`SETUP.md`
already laid out. The merge itself surfaced **12 real bugs** — places where
two parts' code disagreed about a shared contract (a column name, a JWT
claim, a database name, a localStorage key...) that would only show up at
runtime, after merging, against real data. All are fixed in this codebase.
This file is the record of what they were.

## Backend bugs

1. **`teams.lead_id` vs `teams.team_lead_id`.** Part 2's real schema column
   is `team_lead_id`. Part 3's model, `permissions.py` (x2), and its
   `routes/tasks.py` all referenced `lead_id` instead — and so did Part 4's
   `monitoring.py` and `reports.py`. Every team-lead permission check and
   every "who leads this team" lookup across Parts 3 and 4 would have
   silently failed post-merge. Fixed in all 4 locations
   (`backend/utils/task_permissions.py`, `backend/routes/tasks.py`,
   `backend/routes/monitoring.py`, `backend/routes/reports.py`).

2. **`users.team_id` doesn't exist.** Part 4's `monitoring.py` queried
   `SELECT COUNT(*) FROM users WHERE team_id = %s` to count a team's
   developers. Team membership actually lives in Part 2's `team_members`
   join table (a developer can be on several teams). Rewritten as a join.

3. **`project_clients` table doesn't exist.** Part 4's `client.py` joined
   against a `project_clients(project_id, client_id)` mapping table. Part 2
   models client assignment as a single `client_id` column directly on
   `projects`. (Part 4's own `SETUP.md` flagged this as something to check
   before merge — it just hadn't been fixed yet.) Rewritten to query
   `projects.client_id` directly.

4. **Two incompatible, both-broken JWT decoders.** Part 3's `auth_utils.py`
   and Part 4's `auth.py` each hand-rolled their own PyJWT decoding and
   expected a `user_id` claim. Part 1 (the actual token issuer) uses
   Flask-JWT-Extended, which puts the user id in the standard `sub` claim —
   so `g.user_id` / `g.current_user["user_id"]` would have been `None` for
   every request in both modules against a real Part 1 token. Replaced both
   with one shared decorator (`backend/utils/shared_auth.py`) built on
   Flask-JWT-Extended, exposing the same `g.current_user` / `g.role` shapes
   so no route code needed to change.

5. **Role-name mismatch.** Part 3/4 route decorators used legacy role
   strings `"QA"` and `"LEAD"`; Part 1's real roles (issued in the JWT) are
   `"QA_TESTER"` and `"TEAM_LEAD"`. Every `@roles_required("QA", ...)` /
   `@roles_required("LEAD", ...)` call would have 403'd real QA testers and
   team leads. Fixed with a `ROLE_ALIASES` map inside the shared decorator
   (`shared_auth.py`) rather than editing every call site.

6. **Blueprint name collision.** Part 2 and Part 3 each registered a
   Flask blueprint named `"teams"` (`Blueprint("teams", __name__)`).
   Registering both on one app throws at startup. Renamed Part 3's to
   `team_insights` (`backend/routes/team_insights.py`); its URL paths
   (`/api/teams/<id>/tasks`, `/workload`, `/deadlines`) didn't collide with
   Part 2's team-CRUD paths, only the blueprint's internal name did.

7. **`UserRef.is_active` maps to a column that doesn't exist.** Part 2's
   read-only user-mirror model declared `is_active = db.Column(db.Boolean)`.
   Part 1's real `users` table has `status ENUM('ACTIVE','INACTIVE')`, not
   an `is_active` boolean. Any query touching that model would have errored
   against the real table. Replaced with one canonical `models/user.py`
   whose columns actually match Part 1's schema, and Part 3's separate
   duplicate `User`/`Project`/`Team`/`TeamMember` mirror classes were
   dropped in favor of it too (one model per table, not three).

8. **Database name mismatch.** Part 1's `schema.sql` creates database
   `teampulse_db`. Part 2's `schema.sql` separately created (and `USE`d) a
   *different* database, `teampulse`; Part 3's did `USE teampulse;` too.
   Run as originally written, Part 2 and Part 3's tables would land in a
   database with no `users` table in it, and every foreign key to `users`
   would fail. The merged `sql/schema.sql` uses Part 1's name throughout;
   Part 2's own `CREATE DATABASE`/commented `users` reference stub was
   removed entirely.

## Frontend bugs

9. **Three different JWT localStorage keys.** Part 1 (and Part 2, matching
   it) store the token under `"teampulse_token"`. Part 3 read
   `"tp_token"`. Part 4 read `"token"`. Both Part 3's and Part 4's frontend
   modules would have sent every request unauthenticated post-merge. Fixed
   by rebuilding both modules' API clients on one shared axios instance
   (`frontend/src/api/http.js`, re-exporting `frontend/src/services/api.js`)
   that reads the one real key.

10. **Build-tool / env-var mismatch.** Part 1 uses Vite (`import.meta.env.VITE_*`).
    Parts 2/3/4 were built for Create React App (`process.env.REACT_APP_*`),
    which doesn't exist in a Vite build — those reads would just be
    `undefined` at build time. Standardized the merged frontend on Vite
    (Part 1's tooling, since it's the shell everything else plugs into);
    rewrote the five affected files
    (`api/client.js`, `api/taskClient.js` [formerly Part 3's `api/client.js`],
    `api/api.js`, `api/socket.js`, `utils/useTaskSocket.js`).

11. **Dead standalone ports.** Part 3's and Part 4's frontends pointed at
    `http://localhost:5003` and `http://localhost:5001` respectively —
    each part's own dev server, which no longer exists once merged onto one
    backend. Both now default to `VITE_API_BASE_URL` / `VITE_SOCKET_URL`
    (one backend, one Socket.IO server, per `.env.example`).

## Integration work (not bugs, just wiring)

- `frontend/src/pages/ProjectDetails.jsx` gained two tabs beyond Part 2's
  original four (Overview/Teams/Milestones/Activity): **Tasks** (Part 3's
  task board, one per team on the project) and **QA & Bugs** (Part 4's QA
  and bug dashboards, scoped to the project) — exactly the extension point
  Part 2's own `INTEGRATION.md` called for.
- Part 1's five placeholder role-dashboard pages (`PMDashboardPage`,
  `TeamLeadDashboardPage`, `DeveloperDashboardPage`, `QADashboardPage`,
  `ClientDashboardPage`) were replaced with real ones: PM/Team
  Lead/QA all land on Part 2's `ProjectDashboard` (server-side role scoping
  already handles who sees what); Developer lands on Part 3's
  `DeveloperDashboard`; Client lands on Part 4's `ClientDashboard` +
  `ClientFeedback`.
- Added `/admin/monitoring`, `/admin/reports` (and PM equivalents) wiring
  Part 4's `ProjectMonitoring`/`Reports` components in.

## Known remaining gap

- `ClientFeedback.jsx`'s submit form needs a `projectId` to attach feedback
  to; the merged `/client/dashboard` route doesn't yet pass one in (this
  mirrors a limitation already present in Part 4's own example `App.jsx`,
  which used a hardcoded placeholder project id). Viewing existing feedback
  works; submitting new feedback needs a project-selection UI added.
- The merged schema/backend/frontend were validated structurally (Flask app
  boots with all 79 routes, `npm run build` succeeds) but not against a live
  MySQL instance — run `sql/schema.sql` and the app's own sanity checks
  (`docs/SETUP.md`-equivalent below) before treating this as
  production-ready.

## Running it

```bash
# 1. Database
mysql -u root -p < sql/schema.sql

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DB creds + JWT_SECRET_KEY
python app.py           # http://localhost:5000

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

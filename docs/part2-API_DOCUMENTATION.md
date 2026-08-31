# TeamPulse — Part 2 API Documentation

Base URL: `http://localhost:5002/api` (configurable via `PORT`)

All endpoints (except `/health`) require a valid JWT issued by **Part 1**,
sent as:

```
Authorization: Bearer <token>
```

The token must be signed with the same `JWT_SECRET_KEY` Part 1 uses, and
must contain these claims:

```json
{
  "sub": "3",
  "role": "PROJECT_MANAGER",
  "name": "Priya Sharma",
  "email": "priya@example.com"
}
```

## Roles & access rules

| Role | Access |
|---|---|
| `ADMIN` | Full access to everything |
| `PROJECT_MANAGER` | Full CRUD on projects they manage; can view/manage teams & milestones on those projects |
| `TEAM_LEAD` | Read access to projects/teams they lead; can add/remove members on their own team only |
| `DEVELOPER` | Read access to projects/teams they belong to |
| `CLIENT` | Read-only access to projects where they are the client |

Every list/detail endpoint automatically scopes results to what the
caller is allowed to see — the frontend never needs to filter manually.

---

## Projects

### `POST /api/projects`
Create a project. **Role: PROJECT_MANAGER (or ADMIN on behalf of a PM)**

```json
{
  "name": "E-Commerce Platform Revamp",
  "project_code": "ECOM-2026",
  "description": "Rebuild storefront and checkout.",
  "category": "Web Application",
  "client_id": 11,
  "start_date": "2026-01-15",
  "end_date": "2026-11-30",
  "priority": "HIGH",
  "status": "PLANNING",
  "health": "GREEN",
  "budget": 450000,
  "department": "Engineering"
}
```
`201 Created` → full project object (see shape below).

### `GET /api/projects`
List projects, scoped to the caller's role. Query params:

| Param | Description |
|---|---|
| `status`, `health`, `priority` | Exact-match filters |
| `search` | Matches project name or code |
| `include_archived` | `true` to include archived projects |
| `page`, `per_page` | Pagination (default 20, max 100) |

Response:
```json
{
  "items": [ { ...project } ],
  "page": 1,
  "per_page": 20,
  "total": 4,
  "total_pages": 1
}
```

### `GET /api/projects/dashboard`
Aggregate stats for `ProjectDashboard`, scoped to the caller.
```json
{
  "total_projects": 4,
  "active_projects": 2,
  "completed_projects": 1,
  "delayed_projects": 1,
  "projects_at_risk": 2,
  "upcoming_deadlines": [ { ...project } ]
}
```

### `GET /api/projects/:id`
Full project detail, including nested `teams` (with `members`) and
`milestones`. 403 if the caller has no access.

### `PUT /api/projects/:id`
Update editable fields (`name`, `description`, `category`, `client_id`,
`priority`, `status`, `health`, `budget`, `department`, `start_date`,
`end_date`). **Role: PROJECT_MANAGER (owner) or ADMIN**

### `PATCH /api/projects/:id/archive`
Body: `{ "archived": true }` (defaults to `true`). Soft-hides the
project from active views and sets `status = ARCHIVED`.

### `DELETE /api/projects/:id`
Hard delete — cascades to teams, team members, and milestones.
**Role: PROJECT_MANAGER (owner) or ADMIN.** Use archiving in normal
operation; this is for cleanup only.

### `GET /api/projects/:id/activity`
Returns the last 50 activity log entries for the project (powers the
**Activity** tab).

---

## Teams

### `POST /api/projects/:id/teams`
```json
{ "name": "Team Alpha", "description": "Frontend squad", "team_lead_id": 4 }
```

### `GET /api/projects/:id/teams`
Returns all non-archived teams for the project, each including its
`members` array.

### `GET /api/teams/:id`
Single team with members. Team leads/developers can only fetch teams
they belong to.

### `PUT /api/teams/:id`
Update `name`, `description`, `team_lead_id` (pass `null` to unassign).

### `DELETE /api/teams/:id`
Archives the team by default. Pass `?hard=true` to permanently delete
(also removes all `team_members` rows via cascade).

### `POST /api/teams/:id/members`
```json
{ "user_id": 7 }
```
**Role: PROJECT_MANAGER (project owner) or the team's own TEAM_LEAD.**

### `DELETE /api/teams/:id/members/:userId`
Removes a developer from the team. Same role rules as above.

### `GET /api/team-leads/:id/developers`
Returns the developers on every team led by user `:id` — this is the
enforcement point for "a team lead only sees their own developers,"
never the whole company.

---

## Milestones

### `POST /api/projects/:id/milestones`
```json
{
  "name": "Payment Gateway Integration",
  "description": "Stripe + Razorpay",
  "due_date": "2026-07-15",
  "status": "IN_PROGRESS",
  "progress": 55
}
```

### `GET /api/projects/:id/milestones`
Ordered by `due_date` ascending (nulls last).

### `GET /api/milestones/:id`

### `PUT /api/milestones/:id`
Update any of `name`, `description`, `due_date`, `status`, `progress`.
Setting `status = COMPLETED` auto-sets `progress = 100`.

### `DELETE /api/milestones/:id`

---

## Data shapes

### Project object
```json
{
  "id": 1,
  "name": "E-Commerce Platform Revamp",
  "project_code": "ECOM-2026",
  "description": "...",
  "category": "Web Application",
  "manager_id": 2,
  "manager": { "id": 2, "name": "Priya Sharma", "email": "...", "role": "PROJECT_MANAGER" },
  "client_id": 11,
  "client": { "id": 11, "name": "Acme Corp Client", "email": "...", "role": "CLIENT" },
  "start_date": "2026-01-15",
  "end_date": "2026-11-30",
  "priority": "HIGH",
  "status": "ACTIVE",
  "health": "GREEN",
  "budget": 450000.0,
  "department": "Engineering",
  "is_archived": false,
  "progress": 51,
  "is_delayed": false,
  "is_at_risk": false,
  "team_count": 2,
  "team_member_count": 5,
  "milestone_count": 3,
  "created_at": "2026-01-10T09:00:00",
  "updated_at": "2026-06-01T10:12:00",

  "teams": [ { ...team, "members": [ { ...member } ] } ],
  "milestones": [ { ...milestone } ]
}
```
`teams` and `milestones` are only included on `GET /api/projects/:id`.

### Team object
```json
{
  "id": 1,
  "project_id": 1,
  "name": "Team Alpha",
  "description": "Frontend squad",
  "team_lead_id": 4,
  "team_lead": { "id": 4, "name": "Rahul Verma", "email": "...", "role": "TEAM_LEAD" },
  "member_count": 3,
  "is_archived": false,
  "created_at": "...",
  "updated_at": "..."
}
```

### Team member object
```json
{
  "id": 1,
  "team_id": 1,
  "user_id": 6,
  "user": { "id": 6, "name": "Ana", "email": "...", "role": "DEVELOPER" },
  "joined_at": "..."
}
```

### Milestone object
```json
{
  "id": 1,
  "project_id": 1,
  "name": "Checkout Flow Redesign",
  "description": "...",
  "due_date": "2026-04-30",
  "status": "COMPLETED",
  "progress": 100,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Error format
All errors follow the same envelope:
```json
{ "error": "FORBIDDEN", "message": "You do not have access to this project." }
```

| HTTP | `error` code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Validation failure |
| 401 | `UNAUTHORIZED` / `TOKEN_EXPIRED` | Missing/invalid/expired JWT |
| 403 | `FORBIDDEN` | Authenticated but not permitted |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate (e.g. project_code, team name, existing member) |
| 500 | `SERVER_ERROR` | Unhandled error |

---

## Stable IDs for Part 3 & Part 4

These IDs are contractually stable and safe to store as foreign keys
in other modules' tables:

- `project_id` → `projects.id`
- `team_id` → `teams.id`
- `team_lead_id` → `users.id` (nullable on `teams`)
- team member `user_id` → `users.id`
- `milestone_id` → `milestones.id`

Part 3 (tasks) should reference `project_id` and `team_id`, and may
reference `assignee_id` directly against `users.id`. Part 4 (QA /
reports) should reference `project_id`, `team_id`, and `milestone_id`
when tying QA results or reports back to a milestone.

# TeamPulse — Part 4 API Documentation

Base URL: `http://localhost:5001/api`

All endpoints require `Authorization: Bearer <JWT>` issued by Part 1's
existing auth system. This module does not issue tokens.

## QA / Test Cases

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/qa/test-cases?project_id=&status=&task_id=` | any | List test cases |
| GET | `/qa/test-cases/:id` | any | Get one test case |
| POST | `/qa/test-cases` | QA, ADMIN, LEAD | Create test case |
| PUT | `/qa/test-cases/:id` | QA, ADMIN, LEAD | Update / execute test case (set status + actual_result) |
| GET | `/qa/dashboard?project_id=` | any | QA dashboard counts (test cases + bugs) |

**POST /qa/test-cases** body:
```json
{
  "project_id": 1,
  "task_id": 3,
  "title": "Login form validation",
  "description": "...",
  "steps": "1. ...\n2. ...",
  "expected_result": "..."
}
```

## Bugs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/bugs?project_id=&status=&severity=&assigned_to=` | any | List bugs |
| GET | `/bugs/:id` | any | Get one bug |
| POST | `/bugs` | QA, ADMIN, LEAD | Report a bug |
| PUT | `/bugs/:id` | QA, ADMIN, LEAD, DEVELOPER | Edit bug fields (not status) |
| PATCH | `/bugs/:id/status` | QA, ADMIN, LEAD, DEVELOPER | Transition bug status (validated workflow) |
| GET | `/bugs/:id/history` | any | Full bug lifecycle history |

**Status workflow** (enforced server-side in `routes/bugs.py`):
```
OPEN → ASSIGNED → IN_PROGRESS → FIXED → RETEST → CLOSED
                                          ↳ REOPENED / IN_PROGRESS (if still broken)
OPEN / ASSIGNED → REJECTED (also allowed)
```

**PATCH /bugs/:id/status** body:
```json
{ "status": "ASSIGNED", "comment": "Assigning to backend team" }
```
Invalid transitions return `400` with the allowed next statuses.

## Project Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/monitoring/dashboard` | Org-wide dashboard cards + project status chart |
| GET | `/monitoring/projects/:id` | Project progress, health, upcoming deadlines |
| GET | `/monitoring/teams/:id` | Team performance metrics |
| GET | `/monitoring/developers/:id` | Developer performance metrics |
| GET | `/monitoring/calendar?project_id=&team_id=` | Combined task/bug calendar feed |

Project health (`GREEN` / `YELLOW` / `RED`) is calculated from overdue task
%, open critical bugs, and total open bugs, using thresholds stored in the
`health_config` table — edit that table to retune without a code change.

## Reports

| Method | Endpoint | Filters |
|---|---|---|
| GET | `/reports/project` | project, status |
| GET | `/reports/team` | team |
| GET | `/reports/developer` | developer |
| GET | `/reports/tasks` | project, status, developer, date_from, date_to |
| GET | `/reports/bugs` | project, status, priority, date_from, date_to |
| GET | `/reports/qa` | project, status |
| GET | `/reports/milestones` | project, status |

Add `?export=csv` to any report endpoint to download a CSV instead of JSON.

## Client (restricted)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/client/projects` | CLIENT | Client-safe project view (progress, milestones, health, high-level issue counts only) |
| POST | `/client/feedback` | CLIENT | Submit feedback (`project_id`, `message`, `rating` 1-5) |
| GET | `/client/feedback` | CLIENT, ADMIN, LEAD | List feedback (clients see only their own) |
| PATCH | `/client/feedback/:id/status` | ADMIN, LEAD | Update feedback status (NEW/REVIEWED/RESOLVED) |

Client responses deliberately exclude internal comments, developer
performance data, and any sensitive/internal fields.

## Real-time (Socket.IO)

Events emitted server-side (hook the `emit_*` helpers in `app.py` into the
route handlers where noted): `bugCreated`, `bugUpdated`, `bugFixed`,
`bugClosed`, `testCompleted`, `projectHealthUpdated`.

Frontend subscribes via `src/api/socket.js`.

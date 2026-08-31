# TeamPulse — Part 3: Task Management & Developer Workspace

This is a standalone, runnable module implementing **only** Part 3 of TeamPulse:
task management for Team Leads and a personal workspace for Developers. It
does not implement login, registration, users, project/team creation, bug
tracking, or reports — those belong to Parts 1, 2, and 4 and are consumed
here as existing data.

## Folder structure

```
teampulse-part3/
├── backend/
│   ├── app.py                 # Flask app factory, blueprint registration
│   ├── run.py                 # Entry point (flask-socketio server)
│   ├── config.py              # DB + JWT config (JWT_SECRET must match Part 1)
│   ├── extensions.py          # Shared db / socketio instances
│   ├── auth_utils.py          # Verifies Part 1's JWTs (does not issue them)
│   ├── permissions.py         # Role + team/project scoping rules
│   ├── models.py              # Task, TaskComment, TaskSubmission, TaskDependency
│   │                          # (+ thin read-only mirrors of users/projects/teams)
│   ├── sockets.py             # Socket.IO events for live dashboard refresh
│   ├── schema.sql             # CREATE TABLE for the 4 tables Part 3 owns
│   ├── seed_data.sql          # Sample tasks/comments/submissions
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── tasks.py           # /api/tasks CRUD, status, progress, assignment
│       ├── comments.py        # /api/tasks/:id/comments
│       ├── submissions.py     # /api/tasks/:id/submissions + review
│       ├── developers.py      # /api/developers/:id/tasks + dashboard
│       └── teams.py           # /api/teams/:id/tasks, /workload, /deadlines
│
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── public/index.html
│   └── src/
│       ├── App.jsx            # Role-based module router (demo shell)
│       ├── index.js
│       ├── index.css          # Design tokens + component styles
│       ├── api/
│       │   ├── client.js      # fetch wrapper, attaches Part 1's JWT
│       │   └── taskApi.js     # All Part 3 API calls
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── utils/
│       │   ├── taskHelpers.js
│       │   └── useTaskSocket.js
│       └── components/
│           ├── DeveloperDashboard.jsx
│           ├── TeamLeadTaskDashboard.jsx
│           ├── TaskList.jsx
│           ├── TaskCard.jsx
│           ├── TaskDetails.jsx
│           ├── TaskForm.jsx
│           ├── TaskAssignment.jsx
│           ├── TaskProgress.jsx
│           ├── TaskComments.jsx
│           ├── TaskSubmission.jsx
│           ├── DeveloperWorkload.jsx
│           ├── TaskFilters.jsx
│           ├── DeadlineList.jsx
│           └── TaskCalendar.jsx
│
└── docs/
    └── INTEGRATION.md         # How this plugs into Parts 1, 2, 4
```

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env:
#  - point DB_* at the SAME MySQL database Parts 1/2/4 use
#  - set JWT_SECRET to the EXACT value Part 1 uses to sign tokens

# Apply schema (only creates tasks/task_dependencies/task_comments/task_submissions)
mysql -u root -p teampulse < schema.sql

# Optional sample data (assumes Part 1/2 seed IDs - see comments in the file)
mysql -u root -p teampulse < seed_data.sql

python run.py
# Server on http://localhost:5003
```

Health check: `GET http://localhost:5003/api/health`

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
# Dev server on http://localhost:3000
```

The demo `App.jsx` expects a JWT and user object already in `localStorage`
(as Part 1's login flow would set them):

```js
localStorage.setItem("tp_token", "<jwt from Part 1 login>");
localStorage.setItem("tp_user", JSON.stringify({ id: 3, name: "Dev One", role: "DEVELOPER" }));
```

Then reload — you'll see the Developer Dashboard (role `DEVELOPER`) or the
Team Lead Task Board (role `TEAM_LEAD`).

## API summary

```
GET    /api/tasks                        list (filters: status, priority,
                                          developer_id, project_id, team_id,
                                          search, due_before, due_after)
GET    /api/tasks/:id
POST   /api/tasks                        TEAM_LEAD only
PUT    /api/tasks/:id                    TEAM_LEAD only
DELETE /api/tasks/:id                    TEAM_LEAD only
PATCH  /api/tasks/:id/assign             TEAM_LEAD only (assign/reassign)
PATCH  /api/tasks/:id/status             TEAM_LEAD or assigned DEVELOPER
PATCH  /api/tasks/:id/progress           TEAM_LEAD or assigned DEVELOPER

POST   /api/tasks/:id/comments
GET    /api/tasks/:id/comments

POST   /api/tasks/:id/submissions        assigned DEVELOPER
GET    /api/tasks/:id/submissions
PATCH  /api/tasks/submissions/:id/review TEAM_LEAD only

GET    /api/developers/:id/tasks
GET    /api/developers/:id/dashboard     stats used by DeveloperDashboard

GET    /api/teams/:id/tasks
GET    /api/teams/:id/workload           per-developer breakdown
GET    /api/teams/:id/deadlines          upcoming, sorted, non-completed
```

All endpoints require `Authorization: Bearer <JWT>` issued by Part 1.

See `docs/INTEGRATION.md` for how this module connects to Parts 1, 2, and 4.

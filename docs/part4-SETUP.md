# Setup & Integration — TeamPulse Part 4

## What this module is / is not

This is **Part 4 only**: QA/Testing, Bug Tracking, Project Monitoring,
Client Dashboard, and Reports. It does **not** include login, registration,
the users table, project/team/task creation — those belong to Parts 1-3 and
are assumed to already exist in the shared MySQL database.

## 1. Database

```bash
mysql -u root -p teampulse < backend/schema.sql
# optional, for local testing:
mysql -u root -p teampulse < backend/sample_data.sql
```

`schema.sql` only creates tables owned by Part 4 (`test_cases`, `bugs`,
`bug_history`, `client_feedback`, `project_health_log`, `health_config`).
It references `users`, `projects`, `tasks`, `teams`, and `milestones` via
foreign keys — those must already exist from Parts 1-3. If your team's
`milestones` table doesn't exist yet, either add it or remove the
`/reports/milestones` and milestone lookups in `routes/client.py`.

If clients are matched to projects via a different structure than a
`project_clients(project_id, client_id)` table, adjust the query at the
top of `routes/client.py::client_projects`.

## 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=yourpassword
export MYSQL_DB=teampulse
export JWT_SECRET=<same secret Part 1 uses to sign tokens>
export CORS_ORIGINS=http://localhost:3000

python app.py
# Flask + Socket.IO server runs on http://localhost:5001
```

**Integration note:** if Parts 1-3 already run their own Flask app, don't
run this as a second server — instead move the blueprint registrations in
`app.py` into the shared app factory:

```python
from routes.qa import qa_bp
from routes.bugs import bugs_bp
from routes.monitoring import monitoring_bp
from routes.reports import reports_bp
from routes.client import client_bp

app.register_blueprint(qa_bp)
app.register_blueprint(bugs_bp)
app.register_blueprint(monitoring_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(client_bp)
```

and reuse the existing `db.py` / connection pool if Parts 1-3 already have one.

## 3. Auth

`backend/auth.py` only **validates** JWTs — it expects the same
`JWT_SECRET` and a payload containing `user_id` and `role`. If Part 1's
token payload uses different claim names, update `_extract_token` /
`login_required` in `auth.py` accordingly. Roles referenced throughout:
`ADMIN`, `LEAD`, `QA`, `DEVELOPER`, `CLIENT`.

## 4. Frontend

```bash
cd frontend
npm install chart.js react-chartjs-2 socket.io-client
```

Copy `src/components/*` and `src/api/*` into the main TeamPulse React app.
Set environment variables (e.g. in `.env`):

```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

`src/App.jsx` is a minimal example of wiring the components together with
role-based views — merge its routing into the project's real router
(react-router-dom) and navigation shell rather than using it as-is.

## 5. Real-time updates (optional but recommended)

`app.py` defines `emit_bug_created`, `emit_bug_updated`, `emit_bug_fixed`,
`emit_bug_closed`, `emit_test_completed`, `emit_project_health_updated`.
Call the relevant one at the end of the corresponding route handler in
`routes/bugs.py` / `routes/qa.py` / `routes/monitoring.py` to push live
updates to connected dashboards (already wired up on the frontend via
`BugDashboard.jsx` and `ProjectMonitoring.jsx`).

## 6. Folder structure

```
teampulse-part4/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── auth.py
│   ├── schema.sql
│   ├── sample_data.sql
│   ├── requirements.txt
│   └── routes/
│       ├── qa.py
│       ├── bugs.py
│       ├── monitoring.py
│       ├── reports.py
│       └── client.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api/
│       │   ├── api.js
│       │   └── socket.js
│       └── components/
│           ├── part4.css
│           ├── QA/ (QADashboard, TestCaseList, TestCaseForm)
│           ├── Bugs/ (BugDashboard, BugList, BugDetails, BugForm, BugHistory)
│           ├── Monitoring/ (ProjectMonitoring, ProjectHealth, TeamPerformance,
│           │                DeveloperPerformance, AnalyticsCharts)
│           ├── Reports/ (Reports, ReportFilters)
│           └── Client/ (ClientDashboard, ClientFeedback)
├── API_DOCUMENTATION.md
└── SETUP.md
```

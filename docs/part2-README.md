# TeamPulse — Part 2: Project, Team & Milestone Management

A complete, working module for the TeamPulse platform, covering:

- **Project management** — create/edit/archive projects, status,
  priority, health, deadlines, budget, client assignment.
- **Team management** — teams under a project, one Team Lead per team,
  many developers per team, developers may belong to multiple teams.
- **Milestone tracking** — deadlines, status, and progress per project.
- **Project dashboard** — portfolio stats and a filterable project card grid.
- **Project details page** — Overview / Teams / Milestones / Activity tabs.

Built to run standalone for development and to merge directly into
the shared TeamPulse backend/frontend (see `docs/INTEGRATION.md`).

## Stack

- **Frontend:** React, plain CSS (design tokens), Chart.js-ready (`chart.js` + `react-chartjs-2` included, not yet wired into a chart — see note below)
- **Backend:** Flask, Flask-SQLAlchemy, Flask-JWT-Extended
- **Database:** MySQL (shared `teampulse` schema)
- **Auth:** JWT issued by Part 1, verified here (no login system of its own)

## Folder structure

```
teampulse-part2/
├── backend/
│   ├── app.py               # Flask app factory
│   ├── run.py                # entrypoint for flask run / gunicorn
│   ├── config.py             # env-driven configuration
│   ├── extensions.py         # shared db / jwt / cors instances
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── user_ref.py       # read-only mapping onto Part 1's users table
│   │   ├── project.py
│   │   ├── team.py           # Team + TeamMember
│   │   ├── milestone.py
│   │   └── activity.py       # project_activity (Activity tab feed)
│   ├── routes/
│   │   ├── projects.py
│   │   ├── teams.py
│   │   └── milestones.py
│   └── utils/
│       ├── auth.py           # JWT verification + role decorators
│       └── helpers.py        # validation, pagination, access scoping
│
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── public/index.html
│   └── src/
│       ├── App.jsx
│       ├── index.js
│       ├── api/client.js     # ProjectsAPI / TeamsAPI / MilestonesAPI
│       ├── pages/
│       │   ├── ProjectDashboard.jsx
│       │   └── ProjectDetails.jsx
│       ├── components/
│       │   ├── ProjectCard.jsx
│       │   ├── ProjectList.jsx
│       │   ├── ProjectForm.jsx
│       │   ├── ProjectFilters.jsx
│       │   ├── ProjectStats.jsx
│       │   ├── HealthIndicator.jsx
│       │   ├── DeadlineBadge.jsx
│       │   ├── TeamManagement.jsx
│       │   ├── TeamMemberList.jsx
│       │   ├── MilestoneList.jsx
│       │   └── MilestoneForm.jsx
│       └── styles/
│           ├── tokens.css
│           └── app.css
│
├── sql/
│   ├── schema.sql            # projects, teams, team_members, milestones, project_activity
│   └── seed.sql               # demo data (4 projects, 5 teams, milestones)
│
└── docs/
    ├── API_DOCUMENTATION.md
    ├── SETUP.md
    └── INTEGRATION.md
```

## Quick start

```bash
# 1. Database
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DB creds + JWT_SECRET_KEY
python app.py           # http://localhost:5002

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env
npm start                # http://localhost:3000
```

Full instructions, including how to mint a test JWT before Part 1 is
wired up, are in `docs/SETUP.md`.

## Role hierarchy enforced throughout

```
ADMIN
 └─ PROJECT MANAGER      (owns projects)
     └─ PROJECT           (has teams + milestones)
         └─ TEAM
             └─ TEAM LEAD  (sees only their own team's developers)
                 └─ MANY DEVELOPERS (may belong to multiple teams/projects)
```

This is enforced **server-side** in `utils/helpers.py`
(`user_can_access_project`, `scope_projects_query`) and in each route's
per-role checks — the frontend doesn't need to (and shouldn't) be the
only thing hiding unauthorized data.

## What's intentionally NOT here

Per the brief, this module does **not** include: a login/auth system,
a `users` table, student/teacher features, task management, bug/QA
management, or a separate database. Those belong to Parts 1, 3, and 4
respectively — see `docs/INTEGRATION.md` for exactly how this module's
IDs and API responses are meant to be consumed by them.

## Note on Chart.js

The brief allows Chart.js "if required." The current dashboard uses
plain stat cards and progress bars, which cover every metric asked
for (totals, active/completed/delayed, at-risk, upcoming deadlines)
without a chart. `chart.js` and `react-chartjs-2` are included in
`package.json` so a trend chart (e.g. project health over time, once
Part 4 supplies historical data) can be added without a new
dependency — there's no historical time-series data in Part 2's own
schema to chart yet.

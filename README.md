# TeamPulse

A team/project-management platform: project & milestone tracking, team
management, task boards, QA/bug tracking, monitoring, and a client
dashboard — one Flask + React + MySQL app, merged from four originally
standalone parts.

**Start here:** [`MERGE_NOTES.md`](./MERGE_NOTES.md) — what got merged,
and the 12 real cross-part bugs found and fixed along the way (mismatched
column names, incompatible JWT decoders, three different localStorage keys
for the same token, two different database names, a blueprint collision,
and more).

## Structure

```
teampulse/
├── backend/          Flask app (all 4 parts' blueprints on one app)
├── frontend/          React app (Vite) — one router, one API layer
├── sql/schema.sql     Merged schema (all 4 parts' tables, one database)
├── docs/               Each original part's own README/API docs, for reference
└── MERGE_NOTES.md      What changed during the merge, and why
```

## Quick start

```bash
# 1. Database
mysql -u root -p < sql/schema.sql

# 2. Backend  (http://localhost:5000)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DB creds + JWT_SECRET_KEY
python app.py

# 3. Frontend  (http://localhost:5173)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Health check: `curl http://localhost:5000/api/health`

## What's in each part (now merged)

| | Owns | Roles it introduces |
|---|---|---|
| Part 1 | Auth, `users` table, admin user management | login/JWT issuance for everyone |
| Part 2 | Projects, teams, milestones, activity feed | `PROJECT_MANAGER`, `TEAM_LEAD` scoping |
| Part 3 | Tasks, comments, submissions, dependencies | `DEVELOPER` task board |
| Part 4 | QA/test cases, bugs, monitoring, reports, client portal | `QA_TESTER`, `CLIENT` |

Each part's original docs (API reference, its own setup instructions) are
kept under `docs/` for reference — the merged app follows the plan they
already laid out (see each `*-INTEGRATION.md`), with the bugs found along
the way fixed and documented in `MERGE_NOTES.md`.

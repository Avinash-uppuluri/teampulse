# Setup Instructions — TeamPulse Part 2

This module runs standalone for development, and is designed to merge
directly into the shared TeamPulse backend/frontend.

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MySQL 8.x
- A running (or stubbed) Part 1 auth service issuing JWTs, OR a
  hand-crafted test JWT (see below) for local development.

## 1. Database

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql   # optional demo data
```

> `sql/schema.sql` creates the `teampulse` database and Part 2's
> tables (`projects`, `teams`, `team_members`, `milestones`,
> `project_activity`). It assumes Part 1 has already created the
> `users` table in the same database. If you're running Part 2 fully
> standalone with no Part 1 database, uncomment the reference `users`
> stub near the top of `schema.sql` first.

## 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: DB credentials + JWT_SECRET_KEY (must match Part 1)

python app.py
# Backend runs on http://localhost:5002
```

Health check:
```bash
curl http://localhost:5002/api/health
# {"status": "ok", "service": "teampulse-part2"}
```

## 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't on localhost:5002

npm start
# Frontend runs on http://localhost:3000
```

## 4. Generating a test JWT (no Part 1 running yet)

For local development before Part 1 is wired up, generate a token
signed with the same secret as `JWT_SECRET_KEY` in `backend/.env`:

```python
# run inside backend/venv
import jwt, datetime
token = jwt.encode(
    {
        "sub": "2",
        "role": "PROJECT_MANAGER",
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
    },
    "same-secret-as-part1",     # must match JWT_SECRET_KEY
    algorithm="HS256",
)
print(token)
```

Then in the browser console on `http://localhost:3000`:
```js
localStorage.setItem("teampulse_token", "PASTE_TOKEN_HERE");
location.reload();
```

## 5. Test data

`sql/seed.sql` inserts 4 demo projects, 5 teams, team memberships and
milestones. It assumes certain `users` rows already exist — see the
comment block at the top of that file for the exact IDs/roles it
expects, and adjust to match your real Part 1 data before running.

## Running tests / sanity checks

```bash
# List projects (as the seeded PM, user id 2)
curl http://localhost:5002/api/projects -H "Authorization: Bearer <token>"

# Dashboard stats
curl http://localhost:5002/api/projects/dashboard -H "Authorization: Bearer <token>"

# Project detail with teams + milestones
curl http://localhost:5002/api/projects/1 -H "Authorization: Bearer <token>"
```

## Merging into the main TeamPulse repo

See `docs/INTEGRATION.md` for exactly how this module's backend
blueprints and frontend routes fold into the shared app.

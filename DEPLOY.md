# Deploying TeamPulse to a live URL

Three pieces need to be hosted: the MySQL database, the Flask backend, and
the React frontend. This uses **Railway** (database + backend, free trial
credit) and **Vercel** (frontend, free). Both just need a GitHub account —
no credit card required to start.

## 0. Push this project to GitHub

1. Go to https://github.com/new, create an empty repo (e.g. `teampulse`).
2. On your PC, in the `teampulse` folder from the zip:
   ```
   git init
   git add .
   git commit -m "TeamPulse merged"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/teampulse.git
   git push -u origin main
   ```
   (If `git` isn't installed: install it from git-scm.com, or just use
   GitHub Desktop's "Add existing folder" instead of the commands above.)

## 1. Database — Railway

1. Go to https://railway.app, sign up/log in with GitHub.
2. **New Project → Provision MySQL.** Wait ~30 seconds for it to spin up.
3. Click the MySQL service → **Data** tab → **Query** — paste the contents
   of `sql/schema.sql` from this project and run it. This creates all the
   tables.

## 2. Backend — Railway

1. In the same Railway project: **New → GitHub Repo** → pick your
   `teampulse` repo.
2. Once it's added, click the new service → **Settings**:
   - **Root Directory**: `backend`
3. Click **Variables** and add these (click the MySQL service first to see
   its auto-generated credentials, then reference them):
   ```
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   JWT_SECRET_KEY=<any long random string>
   SECRET_KEY=<any other random string>
   CORS_ORIGINS=https://your-frontend-name.vercel.app
   ```
   (You'll fill in the real Vercel URL after step 3 — Railway lets you
   edit variables any time, it just redeploys.)
4. Railway will detect `backend/Procfile` and `backend/requirements.txt`
   automatically and deploy. Once it's live, click **Settings → Networking
   → Generate Domain** to get a public URL like
   `https://teampulse-backend-production.up.railway.app`.
5. Check it worked: visit `https://YOUR-BACKEND-URL/api/health` in a
   browser — should show `{"status": "ok", ...}`.

## 3. Frontend — Vercel

1. Go to https://vercel.com, sign up/log in with GitHub.
2. **Add New → Project** → pick your `teampulse` repo.
3. **Root Directory**: `frontend` (Vercel auto-detects Vite).
4. Under **Environment Variables**, add:
   ```
   VITE_API_BASE_URL=https://YOUR-BACKEND-URL/api
   VITE_SOCKET_URL=https://YOUR-BACKEND-URL
   ```
   (the backend URL from step 2.4)
5. Click **Deploy**. In a minute or two you get a live URL like
   `https://teampulse.vercel.app`.
6. Go back to Railway's backend **Variables** and set `CORS_ORIGINS` to
   that real Vercel URL (step 2.3's placeholder), so the backend accepts
   requests from it.

## 4. Create a first login

Part 1 has no open self-registration endpoint on purpose — only an
existing `ADMIN` can create other users (`POST /api/admin/users`), which
is a chicken-and-egg problem for the very first user. `sql/seed-admin.sql`
solves that: it inserts one ready-to-use admin login directly.

In Railway, click the MySQL service → **Data** tab → **Query**, paste the
contents of `sql/seed-admin.sql`, and run it. That creates:

```
email:    admin@example.com
password: changeme123
```

Log in with that at your Vercel URL, then immediately go to **User
Management** and either change that password or create your real admin
account and delete this one.

## Costs

Railway's free trial gives $5 credit/month, which comfortably covers a
small MySQL + Flask app running lightly. Vercel's frontend hosting is free
for personal projects. If the Railway trial runs out, Railway also has a
$5/mo hobby plan.

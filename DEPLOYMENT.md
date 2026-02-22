# Deployment Guide

## Architecture

This project is a static multi-page frontend (`public/`) plus an Express API backend (`server/`).
It is not Next.js and not React.

- Frontend host: Vercel (static pages)
- Backend host: Render (Node web service)
- DB: SQLite on Render persistent disk (`/var/data/activity_guide.db`)

## 1) Deploy Backend on Render

1. Push this repository to GitHub.
2. In Render, create a **New Web Service** from this repo.
3. Configure:
   - Build Command: `npm ci`
   - Start Command: `npm start`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `SERVE_STATIC=false`
   - `CORS_ORIGIN=https://systemdesigntracker.vercel.app`
   - `DB_FILE=/var/data/activity_guide.db`
5. Attach a persistent disk:
   - Mount path: `/var/data`
   - Size: 1GB
6. Deploy and confirm health endpoint:
   - `https://<your-render-service>.onrender.com/api/health`

## 2) Configure Frontend API Base URL

Update this file before deploying frontend:

- `public/assets/js/runtime-config.js`

Set:

```js
window.RUNTIME_CONFIG = {
  API_BASE_URL: 'https://<your-render-service>.onrender.com'
};
```

## 3) Deploy Frontend on Vercel

1. In Vercel, import the same GitHub repo.
2. Framework Preset: **Other**.
3. No build command required.
4. Deploy.

Vercel routes are defined in `vercel.json` and map paths to static files under `public/`.

## 4) Verify Endpoints

Run these checks in browser/devtools:

- `GET /api/classes`
- `PUT /api/progress/1` with `{ "status": "completed" }`
- `GET /api/notes/1`
- `GET /api/bookmarks`

From frontend, verify:

- `/` loads hub
- `/topic?id=1` opens topic page
- `/modules/system-design` and `/modules/lld` load
- Notes/progress/bookmarks persist via backend

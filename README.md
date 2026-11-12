# Travel Plan

Mobile-first app for planning trips as an ordered list of stops on a map.

| Part     | Stack                                                                 |
| -------- | --------------------------------------------------------------------- |
| `api/`   | Python 3.12, FastAPI, PyMongo (async), Firebase ID-token verification |
| `web/`   | React 19, Vite, Tailwind v4, shadcn/ui, Firebase Auth, Mapbox GL JS   |
| Database | MongoDB 7                                                             |
| Runtime  | Docker Compose (nginx serves the SPA and proxies `/api` + `/uploads`) |

## Setup

1. **Firebase** — create a project, add a Web app, and enable the *Email/Password*, *Google* and *Facebook*
   sign-in providers (Facebook needs an App ID/secret from developers.facebook.com, with Firebase's OAuth
   redirect URI added there). Add `localhost` to *Authorized domains*.
2. **Mapbox** — create a public access token (`pk.*`) at account.mapbox.com; it covers Mapbox GL JS and
   the Geocoding API. Restrict it to your app's URLs for production.
3. `cp .env.example .env` and fill in the values.

## Run with Docker Compose

```bash
docker compose up -d --build
```

- App: http://localhost:8080
- API docs: http://localhost:8000/docs

The `VITE_*` values are baked in at build time, so rebuild `web` after changing them.

## Local development

```bash
docker compose up -d mongo
cd api && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
FIREBASE_PROJECT_ID=your-project UPLOAD_DIR=./uploads uvicorn app.main:app --reload
```

```bash
cd web && npm install && npm run dev   # http://localhost:5173, proxies /api to :8000
```

Tests: `cd api && pytest`.

`AUTH_DEV_BYPASS=true` makes the API accept `Authorization: Bearer dev` as a fake user, handy for curl.
Never enable it outside your machine.

## Data model

**Plan** — `name`, `description`, `author`, `photo_url`, plus `total_distance_km` and `total_spent`,
which the API recomputes whenever stops change (distance = straight-line sum between consecutive stops).

**Plan item (stop)** — `name`, `author`, `plan_id`, `planned_stop_time`, `stopped_time`, `order`,
`location {lat, lng, address}`, `spent_money`, `photo_url`.

## API

All routes need `Authorization: Bearer <Firebase ID token>`; users only see their own data.

| Method | Path                                | Purpose                         |
| ------ | ----------------------------------- | ------------------------------- |
| GET    | `/api/plans`                        | List my plans                   |
| POST   | `/api/plans`                        | Create plan                     |
| GET    | `/api/plans/{id}`                   | Plan with its ordered stops     |
| PATCH  | `/api/plans/{id}`                   | Update plan                     |
| DELETE | `/api/plans/{id}`                   | Delete plan and its stops       |
| POST   | `/api/plans/{id}/items`             | Add stop (optional `order`)     |
| PATCH  | `/api/plans/{id}/items/{itemId}`    | Update stop                     |
| DELETE | `/api/plans/{id}/items/{itemId}`    | Delete stop                     |
| PUT    | `/api/plans/{id}/items/order`       | Reorder: `{"item_ids": [...]}`  |
| GET    | `/api/items`                        | All my stops (map page)         |
| POST   | `/api/uploads`                      | Upload image (multipart `file`) |

Photos are stored in the `uploads` Docker volume and served from `/uploads/...`.

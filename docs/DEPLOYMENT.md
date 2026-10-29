# Deployment and operations

## Configuration checklist

Before deploying, prepare:

- A reachable MongoDB database and connection URI.
- A Cloudinary account for profile image and resume uploads.
- A long, random `SECRET_KEY` that is not reused elsewhere.
- The final frontend and API HTTPS origins.
- Optionally, a Groq API key if AI-backed coaching is wanted.

Use the environment variable reference in the [README](../README.md#environment-variables). Keep all secrets in the hosting provider's environment settings; do not commit `.env` files.

## Render API

The root `render.yaml` defines a Node web service with root directory `backend`, build command `npm install`, start command `npm start`, and health check `/health`.

Set these values in Render:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB connection URI, including database name. |
| `SECRET_KEY` | Long random session-signing secret. |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary credentials. |
| `FRONTEND_URL` | Exact production frontend origin, e.g. `https://example.vercel.app`. No path or trailing slash. |
| `FRONTEND_URLS` | Optional comma-separated exact extra origins. |
| `GROQ_API_KEY` | Optional Groq API key. |
| `GROQ_MODEL` | Optional model override. |

Render supplies `PORT`. The API connects to MongoDB before listening, so an invalid/unreachable database prevents startup. `/health` reports process readiness after startup, but does not run a fresh database check.

## Vercel frontend

Configure the Vercel project root as `frontend`. Use:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-api-host>`

The included `frontend/vercel.json` rewrites client-side routes to `index.html`, which allows refreshing nested React Router pages. Set `VITE_API_URL` for each Vercel environment before building.

After deployment, add the frontend's exact origin to the API's `FRONTEND_URL`. For preview deployments, list only trusted preview origins in `FRONTEND_URLS`.

## Cookie and CORS behavior

The API enables credentialed CORS only for listed frontend origins. In production, the authentication cookie is HTTP-only, `Secure`, and `SameSite=None`; both sites must use HTTPS. The frontend's Axios calls need `withCredentials: true` for session requests. Do not use wildcard CORS origins with credentials.

For local development, the API automatically allows `http://localhost:5173` when `NODE_ENV` is not `production`; configure the frontend API base as `http://localhost:3000`.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| API fails during startup | Confirm `MONGO_URI`, database network access rules, and MongoDB availability. Review Render logs for the connection error. |
| Browser reports CORS errors | Compare the browser's exact frontend origin (scheme and host) with `FRONTEND_URL`/`FRONTEND_URLS`; remove trailing slashes. |
| Login does not persist in production | Confirm both sites use HTTPS, the API has `NODE_ENV=production`, and requests include credentials. Inspect cookie blocking settings in the browser. |
| Frontend requests localhost in production | Rebuild with `VITE_API_URL` set in the Vercel environment. Vite variables are baked into the build. |
| Uploads fail | Verify all Cloudinary credentials and check provider limits/file types. Candidate resumes accept PDF, DOC, or DOCX. |
| AI features use fallback output | Confirm `GROQ_API_KEY`, model availability, network egress, and API logs. Fallbacks are expected when AI is disabled or a request fails. |
| Application index creation fails on an existing database | Remove duplicate `(job, applicant)` application records, then restart so MongoDB can create the unique index. |

## Operational notes

- Login and registration have a limit of 20 requests per 15 minutes. API traffic is limited to 600 requests per 15 minutes, and coach AI endpoints to 40 per hour per client.
- Expired jobs are checked at startup and every minute while the process is running.
- Candidate resumes are uploaded as Cloudinary raw assets. Treat resume URLs as sensitive and review Cloudinary access settings for the account.
- The current application does not define automated deployment workflows or a root-level package manager workspace; deploy frontend and backend as separate services.


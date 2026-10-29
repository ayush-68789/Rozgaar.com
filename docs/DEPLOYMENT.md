# Deployment and operations

This guide covers the environment configuration and hosting setup represented by the repository's Render and Vercel deployment files.

## Configuration checklist

Before deployment, prepare the following:

- A reachable MongoDB database and connection URI.
- A Cloudinary account for profile image and resume uploads.
- A long, random `SECRET_KEY` that is not reused elsewhere.
- The final frontend and API HTTPS origins.
- Optionally, a Groq API key if AI-backed coaching is wanted.

Use the [README environment-variable reference](../README.md#environment-variables) when configuring the services. Store secrets in the hosting provider's environment settings; never commit `.env` files.

### Recommended deployment order

1. Create the MongoDB database and allow network connections from the API host.
2. Create the Cloudinary account and record its server-side credentials.
3. Deploy the API with `MONGO_URI`, `SECRET_KEY`, Cloudinary credentials, and `NODE_ENV=production` configured.
4. Confirm the API's `/health` endpoint responds and review the service logs for successful database connection.
5. Deploy the frontend with `VITE_API_URL` set to the API's HTTPS origin.
6. Set `FRONTEND_URL` on the API to the deployed frontend's exact origin and redeploy/restart the API if required by the hosting provider.
7. Test registration, login persistence, a public job listing, and one authenticated operation from the deployed frontend.

Set the final API and frontend origins before production rollout. Preview deployments use separate origins; only add preview origins that are trusted and actively needed.

## Render API

The root `render.yaml` defines a Node web service using `backend` as its root directory, `npm install` as its build command, `npm start` as its start command, and `/health` as its health-check path.

Configure the following values in Render:

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

Render supplies `PORT`. The API connects to MongoDB before listening; an invalid or unreachable database therefore prevents startup. After startup, `/health` reports that the process is responding but does not run a new database connectivity check.

## Vercel frontend

Set the Vercel project root to `frontend` and configure:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-api-host>`

The included `frontend/vercel.json` rewrites client-side routes to `index.html`, allowing nested React Router pages to load on direct navigation and refresh. Set `VITE_API_URL` for each Vercel environment before building.

After deployment, set the API's `FRONTEND_URL` to the frontend's exact origin. For preview deployments, add only trusted origins to `FRONTEND_URLS`.

## Cookie and CORS behavior

The API enables credentialed CORS only for configured frontend origins. In production, the authentication cookie is HTTP-only, `Secure`, and `SameSite=None`; both services must use HTTPS. Frontend Axios requests must set `withCredentials: true` to send the session cookie. Wildcard origins cannot be used with credentialed CORS.

For local development, the API automatically allows `http://localhost:5173` when `NODE_ENV` is not `production`. Set the frontend API origin to `http://localhost:3000`.

The API normalizes trailing slashes from configured origins before comparing them to the browser's `Origin` header. Include the scheme and hostname, and include a port when using a nonstandard port. Do not include a path such as `/api` in `FRONTEND_URL`.

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
| Login succeeds but protected requests return `401` | Confirm the browser stores the `token` cookie, the frontend request includes credentials, and the cookie is not blocked by browser privacy settings. |
| Protected requests return `403` | Check that the signed-in account has the required role and that the resource belongs to that account. |
| API returns `429` | Wait for the applicable limit window to reset. Credential, global API, and AI endpoints have separate rate-limit scopes. |
| Direct navigation to a nested frontend URL returns `404` | Confirm Vercel is using `frontend/vercel.json` and the frontend project root is set to `frontend`. |
| Job listings do not appear | Check whether a listing is open, whether its application deadline has passed, and whether the keyword filters match the job fields. |
| AI coach returns template-based results | This is expected when `GROQ_API_KEY` is absent or an AI response cannot be used. Review API logs and provider connectivity if AI output is required. |

## Operational considerations

- Login and registration are limited to 20 requests per client per 15 minutes. API traffic is limited to 600 requests per client per 15 minutes; AI-backed coaching endpoints are limited to 40 requests per hour.
- Expired jobs are checked at startup and once per minute while the API process is running.
- Candidate resumes are uploaded as Cloudinary raw assets. Treat resume URLs as sensitive and review the Cloudinary account's access settings.
- The repository does not define automated deployment workflows or a root-level package-manager workspace. Deploy the frontend and backend as separate services.

## Release verification checklist

After each deployment, verify the following in the target environment:

- The API service starts and logs a successful MongoDB connection.
- `GET /health` returns HTTP `200` with `{ "status": "ok" }`.
- The frontend was built with the correct `VITE_API_URL` for this environment.
- Browser requests from the frontend origin pass credentialed CORS preflight and carry the session cookie after login.
- The production cookie is marked `HttpOnly`, `Secure`, and `SameSite=None`.
- Candidate and recruiter access checks behave as expected, including attempts to manage resources owned by another account.
- Cloudinary uploads work with the configured account, and resume access settings match the deployment's privacy requirements.
- Optional Groq and news functionality can reach their external services, or the fallback behavior is acceptable.

## Environment separation

Use distinct database credentials and secret values for development, preview, and production where possible. Configure frontend and backend values as a matched pair in each environment: the frontend's `VITE_API_URL` must point to that environment's API, and the API must allow the corresponding frontend origin. Avoid adding broad wildcard or unrelated preview origins to the CORS allowlist.


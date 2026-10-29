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

## Operational considerations

- Login and registration are limited to 20 requests per client per 15 minutes. API traffic is limited to 600 requests per client per 15 minutes; AI-backed coaching endpoints are limited to 40 requests per hour.
- Expired jobs are checked at startup and once per minute while the API process is running.
- Candidate resumes are uploaded as Cloudinary raw assets. Treat resume URLs as sensitive and review the Cloudinary account's access settings.
- The repository does not define automated deployment workflows or a root-level package-manager workspace. Deploy the frontend and backend as separate services.


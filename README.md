# Rozgaar.com

Rozgaar.com is a full-stack employment platform for candidates and recruiters, with an optional AI-assisted career coach. Candidates can discover and apply for jobs, maintain a professional profile, track applications, and follow tailored skill-development plans. Recruiters can manage company profiles and job listings, then review and manage applicants.

The platform consists of a React single-page application and an Express API backed by MongoDB. Sessions use JWTs stored in HTTP-only cookies. Profile and resume uploads are handled by Cloudinary. Optional coaching features use Groq and include built-in fallbacks when AI is unavailable.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Deploy](#deploy)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Scripts](#scripts)
- [Security and data notes](#security-and-data-notes)

## Features

### Candidates

- Build a profile with skills, a resume, education, experience, projects, certificates, and achievements.
- Browse and search job listings, review job details, submit one application per job, and track application status.
- Review skill alignment with job requirements and receive job recommendations.
- Use the career coach to analyze career goals, create role- or job-specific learning plans, complete weekly quizzes, and record demonstrated skills.
- Analyze a stored resume, manage portfolio projects, and browse technology news.
- Receive in-app notifications about application activity and status changes.

### Recruiters

- Create and maintain company profiles and job listings.
- Review applicants and skill alignment, shortlist candidates, update application statuses, and manage applications.
- Enforce the number of available positions and automatically close listings when all positions are filled.

### Application lifecycle

Candidate applications begin in the `pending` state. Recruiters can move an application through shortlisting, interview, offer, acceptance, or rejection. Candidates can review their submitted applications and receive notifications when a recruiter changes a status. A job listing closes when its deadline passes or its available positions have been filled.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS |
| API | Node.js, Express 4 |
| Data | MongoDB with Mongoose |
| Authentication | JWT sessions in HTTP-only cookies; bcrypt password hashing |
| File storage | Cloudinary; Multer processes multipart uploads |
| Career coaching | Optional Groq chat completions with built-in template and rule-based fallbacks |
| Hosting configuration | Render API (`render.yaml`), Vercel frontend (`frontend/vercel.json`) |

## Run locally

Requirements: Node.js 20.19 or newer, npm, and a MongoDB database. Cloudinary credentials are required for image and resume uploads. A Groq API key is optional.

1. Clone the repository and create environment files from the examples:

   ```bash
   git clone https://github.com/ayush-68789/Rozgaar.com.git
   cd Rozgaar.com
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows PowerShell, use `Copy-Item backend/.env.example backend/.env` and `Copy-Item frontend/.env.example frontend/.env`.

2. Configure `backend/.env` as described below. In `frontend/.env`, set `VITE_API_URL=http://localhost:3000`.

3. Start the API:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   By default, the API listens on `http://localhost:3000`. It connects to MongoDB before accepting requests. The health endpoint is available at `http://localhost:3000/health`.

4. In another terminal, start the web app:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Vite prints the local development URL (typically `http://localhost:5173`).

### Verify the local setup

Open the frontend URL printed by Vite, register either a candidate or recruiter account, and confirm that the session persists across page navigation. The API health endpoint can be checked independently:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok"}
```

The health endpoint confirms that the API process is responding. It does not perform a new database connectivity check; database connectivity is established before the server begins listening.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `SECRET_KEY` | Yes | Long, random secret used to sign session JWTs. |
| `CLOUD_NAME` | Yes for uploads | Cloudinary cloud name. |
| `API_KEY` | Yes for uploads | Cloudinary API key. |
| `API_SECRET` | Yes for uploads | Cloudinary API secret. |
| `FRONTEND_URL` | Yes in production | Exact deployed frontend origin allowed by credentialed CORS. |
| `FRONTEND_URLS` | Optional | Additional comma-separated allowed frontend origins, such as preview deployments. |
| `GROQ_API_KEY` | Optional | Enables AI-backed coaching; without it the coach uses fallbacks. |
| `GROQ_MODEL` | Optional | Groq model name; defaults to `openai/gpt-oss-20b`. |
| `PORT` | Optional | API port; defaults to `3000` (Render supplies this automatically). |
| `NODE_ENV` | Optional | Set to `production` when deployed; affects secure cookie settings. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Recommended | Backend origin without a trailing slash, e.g. `http://localhost:3000`. Defaults to `http://localhost:3000`. |

Do not commit `.env` files or place server-side secrets in frontend variables. Vite embeds `VITE_*` values in the browser bundle, where users can inspect them.

## Deploy

The repository includes a Render blueprint for the API and a Vercel rewrite for client-side React Router paths.

### API on Render

1. Create a Render web service from `render.yaml`, or configure a Node service with `backend` as its root directory.
2. Set the build command to `npm install`, the start command to `npm start`, and the health check path to `/health`.
3. Configure the backend environment variables listed above. Set `FRONTEND_URL` to the exact deployed frontend origin; add trusted preview origins to `FRONTEND_URLS` if needed.
4. Set `NODE_ENV=production`. Render provides the `PORT` value.

### Frontend on Vercel

1. Import the repository and set the project root to `frontend`.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Set `VITE_API_URL` to the deployed API origin without a trailing slash.
4. Deploy the frontend, then add its exact origin to the API's `FRONTEND_URL`.

Production authentication requires HTTPS because the session cookie is `Secure` and uses `SameSite=None`. Both deployments must use HTTPS, and browser requests must include credentials.

## Project structure

```text
backend/
  controllers/       Request handlers and application logic
  middlewares/       Authentication, role checks, and uploads
  models/            Mongoose schemas
  routes/            REST route definitions
  utils/             Database, AI, resume, matching, upload, and notification helpers
  index.js           Express setup and server startup
frontend/
  src/components/    Shared, candidate, recruiter, and coach UI
  src/context/       Shared application/session state
  src/hooks/         Data-fetching hooks
  src/pages/         Route-level pages
  src/utils/         API endpoint configuration and helpers
  vercel.json        SPA route rewrite
render.yaml          Render API service blueprint
```

### Request flow

1. The browser loads the Vite-built React application and reads the API origin from `VITE_API_URL`.
2. Frontend requests send credentials so the browser can attach the API's HTTP-only session cookie.
3. Express applies security headers, CORS policy, parsing, and rate limits before dispatching requests to route middleware and controllers.
4. Controllers apply role, ownership, and application rules, then persist data through Mongoose.
5. Profile and resume files are sent to Cloudinary. Optional career-coaching requests are sent from the backend to Groq.

## Documentation

- [API reference](docs/API.md): routes, access rules, and request conventions.
- [Architecture and data model](docs/ARCHITECTURE.md): request flow, domain entities, and coaching workflow.
- [Deployment and operations](docs/DEPLOYMENT.md): environment setup, hosting, and troubleshooting.

## Scripts

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the API with nodemon. |
| `backend` | `npm start` | Start the API with Node.js. |
| `backend` | `npm test` | Run the Node built-in test runner. |
| `frontend` | `npm run dev` | Start Vite's development server. |
| `frontend` | `npm run build` | Build the production frontend into `dist/`. |
| `frontend` | `npm run preview` | Serve the built frontend locally. |
| `frontend` | `npm run lint` | Run ESLint. |

Run commands from the relevant package directory (`backend` or `frontend`). There is no root package manifest or shared workspace command.

## Configuration reference

| Component | Local address | Production configuration |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | Vercel project rooted at `frontend`; API origin supplied by `VITE_API_URL`. |
| API | `http://localhost:3000` | Render service rooted at `backend`; `PORT` is supplied by Render. |
| Database | Your configured MongoDB URI | `MONGO_URI` must be reachable from the API host. |
| File storage | Your Cloudinary account | `CLOUD_NAME`, `API_KEY`, and `API_SECRET` are backend-only settings. |
| AI provider | Optional | `GROQ_API_KEY` and optional `GROQ_MODEL` are backend-only settings. |

See the [deployment guide](docs/DEPLOYMENT.md) for service configuration and the [API reference](docs/API.md) for endpoint details.

## Security and data considerations

- API sessions are signed JWTs in HTTP-only cookies; passwords are hashed with bcrypt.
- Production cookies require HTTPS. Credentialed CORS permits only configured frontend origins.
- Login and registration are limited to 20 requests per client per 15 minutes. API routes are limited to 600 requests per client per 15 minutes; AI-backed coach endpoints are limited to 40 requests per hour.
- Candidate resumes are stored as Cloudinary raw assets. Review the account's access settings; the current upload flow does not make resume assets private.
- Applications have a unique `(job, applicant)` index. Existing duplicate records must be removed before MongoDB can create this index.
- The frontend and API are deployed separately. Configure CORS and `VITE_API_URL` for the same environment.

## Contributing

For substantial changes, open an issue for discussion before submitting a pull request. Include a concise summary and relevant verification steps. Never include credentials or personal data in a commit.


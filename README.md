# Rozgaar.com

Rozgaar.com is a full-stack job portal for candidates and recruiters, with an optional AI-assisted career coach. Candidates can discover and apply for jobs, build a profile, track applications, and work through skill plans. Recruiters can manage companies and job listings and review applicants.

The application is a React/Vite single-page app backed by an Express API and MongoDB. Authentication uses an HTTP-only cookie. File uploads use Cloudinary; optional coaching features use Groq.

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

- Create a candidate profile with skills, resume, education, experience, projects, certificates, and achievements.
- Browse and search job listings, view job details, apply once per job, and follow application status.
- See skill fit against job requirements and receive job recommendations.
- Use the career coach to analyze a career goal, create a learning plan for a role or job, take weekly quizzes, and track demonstrated skills.
- Analyze a stored resume, maintain portfolio projects, and browse a technology news feed.
- Receive in-app notifications for application events and status changes.

### Recruiters

- Create and manage company profiles and job listings.
- Review applicants and their skill fit, shortlist applicants, update application status, and remove applications.
- Job openings are enforced; filled listings close automatically.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS |
| API | Node.js, Express 4 |
| Data | MongoDB with Mongoose |
| Authentication | JWT in an HTTP-only cookie; bcrypt password hashing |
| Uploads | Cloudinary; Multer handles incoming multipart files |
| Career coach | Optional Groq chat completions; built-in template/rule-based fallbacks |
| Hosting configuration | Render API (`render.yaml`), Vercel frontend (`frontend/vercel.json`) |

## Run locally

Requirements: Node.js 18 or newer, npm, MongoDB, and Cloudinary credentials. A Groq API key is optional.

1. Clone the repository and create environment files from the examples:

   ```bash
   git clone https://github.com/ayush-68789/Rozgaar.com.git
   cd Rozgaar.com
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows PowerShell, use `Copy-Item backend/.env.example backend/.env` and `Copy-Item frontend/.env.example frontend/.env`.

2. Fill in `backend/.env` as described below. Set the frontend API URL to `http://localhost:3000` in `frontend/.env`.

3. Start the API:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   The API listens on `http://localhost:3000` by default. It connects to MongoDB before accepting requests. The health check is `http://localhost:3000/health`.

4. In another terminal, start the web app:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Vite prints the local URL (normally `http://localhost:5173`).

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

Never commit `.env` files or put server-side secrets in frontend variables. Vite exposes `VITE_*` values to the browser bundle.

## Deploy

The repository includes a Render blueprint for the API and a Vercel rewrite for React Router deep links.

### API on Render

1. Create a Render web service from `render.yaml` (or configure a Node service with root directory `backend`).
2. Use `npm install` for build and `npm start` for start. The health check path is `/health`.
3. Set the secret environment values listed in the backend table. `FRONTEND_URL` must exactly match the deployed frontend origin; add any trusted preview origins to `FRONTEND_URLS`.
4. Set `NODE_ENV=production`. Render sets `PORT` automatically.

### Frontend on Vercel

1. Import the repository and set the project root to `frontend`.
2. Configure the Vite build (`npm run build`) and output directory (`dist`).
3. Set `VITE_API_URL` to the deployed API origin, without a trailing slash.
4. Deploy, then set that exact Vercel origin in the API's `FRONTEND_URL`.

Production login depends on HTTPS because the session cookie is `Secure` and uses `SameSite=None`. Confirm both deployments use HTTPS and that browser requests allow credentials.

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

## Security and data notes

- API sessions are signed JWTs in HTTP-only cookies; passwords are hashed with bcrypt.
- Production cookies require HTTPS. Credentialed CORS permits only configured frontend origins.
- Login and registration are limited to 20 requests per 15 minutes per client; API routes have a 600-request per 15-minute limit. AI endpoints have a 40-request per-hour limit.
- Candidate resumes are stored as Cloudinary raw assets. Configure Cloudinary and access policies with this in mind; the current upload model does not make resume assets private.
- Applications have a unique `(job, applicant)` index. Existing databases with duplicate application records may need those duplicates cleaned up before MongoDB can create the index.
- The frontend and API are separate deployments; CORS and `VITE_API_URL` must point to the same intended environment.

## Contributing

Open an issue to discuss a substantial change, then submit a pull request with a clear summary and verification steps. Keep credentials and personal data out of commits.


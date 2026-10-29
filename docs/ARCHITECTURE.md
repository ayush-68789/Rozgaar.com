# Architecture and data model

This guide describes the main application components, request flow, data entities, and career-coaching workflow.

## System overview

```text
Browser (React + Vite)
  ├─ React Router pages and shared application context
  └─ Axios requests with session cookies
       │ HTTPS and credentialed CORS
       ▼
Express API (backend/index.js)
  ├─ security headers, JSON parsing, CORS, rate limits
  ├─ routes → authentication/role middleware → controllers
  ├─ Mongoose models → MongoDB
  ├─ profile/resume uploads → Cloudinary
  └─ optional career-coach requests → Groq API
```

The frontend and backend are deployed independently. `VITE_API_URL` selects the API origin when the frontend is built. The backend accepts browser requests only from origins configured in `FRONTEND_URL` and the comma-separated `FRONTEND_URLS` value.

## Backend request lifecycle

1. Express applies Helmet security headers, request parsers, cookie parsing, and credentialed CORS.
2. API requests pass through global and route-specific rate limits.
3. Authentication middleware validates the JWT cookie where required. Recruiter-only routes also verify the account role.
4. Controllers enforce ownership and business rules, then access MongoDB through Mongoose models.
5. The API returns JSON responses. Unmatched paths return a JSON 404; the error handler masks unexpected server errors.

At startup, the API connects to MongoDB and closes expired jobs before listening on `PORT` (or `3000`). A background interval checks for expired jobs once per minute.

## Frontend organization

- `frontend/src/App.jsx` declares public, candidate, and recruiter-facing routes.
- `frontend/src/context/AppContext.jsx` maintains shared session/application state.
- `frontend/src/components/` contains reusable UI and feature areas (auth, recruiter admin, coach, notifications).
- `frontend/src/pages/` contains route-level pages.
- `frontend/src/utils/constant.js` builds API base URLs from `VITE_API_URL`; coach requests are collected in `frontend/src/utils/coachApi.js`.
- `frontend/vercel.json` rewrites paths to `index.html` so React Router routes work on refresh.

## Core data entities

| Entity | Purpose and key relationships |
| --- | --- |
| User | Candidate or recruiter account. The profile stores skills, resume metadata, recommendations, demonstrated skills, projects, education, experience, achievements, and certificates. |
| Company | Recruiter-owned company profile. |
| Job | Job listing associated with a company/recruiter; includes requirements, position count, expiry and open/closed state. |
| Application | Connects a job and candidate; has a lifecycle status. A unique `(job, applicant)` index permits one application per candidate/job. |
| Plan | Candidate learning plan, optionally associated with a job; contains ordered skill weeks, unlock/pass state, and portfolio ideas. |
| Notification | User-targeted in-app event with read state. |

Model definitions are in `backend/models/`. The `Job` schema is defined in `backend/models/Job.js`; `backend/models/job.model.js` re-exports it.

## Candidate coaching workflow

1. The API normalizes role or job requirements and compares them with the candidate's listed and quiz-demonstrated skills.
2. Goal analysis or job-fit evaluation identifies skill gaps. A learning plan contains up to eight ordered weekly units.
3. The first unit is unlocked initially. A passing score of at least 70% unlocks the next unit and records the demonstrated skill.
4. Recruiter applicant views can use skill-fit results and demonstrated skills alongside application and profile information.

When `GROQ_API_KEY` is configured, the API sends coaching requests to Groq's OpenAI-compatible chat-completions endpoint. If AI is disabled or unavailable, the application uses built-in goal and plan templates, self-assessment quizzes, and rule-based resume analysis. The API key is used only by the backend.

## External services

- **MongoDB** stores accounts, companies, jobs, applications, plans, and notifications.
- **Cloudinary** stores profile images and candidate resume files.
- **Groq** optionally provides goal analysis, generated plans and quizzes, and resume analysis.
- **Hacker News** supplies technology news; the backend caches feed results.

## Useful entry points

- API startup and middleware: `backend/index.js`
- Route definitions: `backend/routes/`
- Controllers: `backend/controllers/`
- Schema definitions: `backend/models/`
- Coach matching and AI fallback logic: `backend/controllers/coach.controller.js`, `backend/utils/skills.js`, and `backend/utils/ai.js`
- Frontend route map: `frontend/src/App.jsx`


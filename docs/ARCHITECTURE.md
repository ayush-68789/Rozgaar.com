# Architecture and data model

## System overview

```text
Browser (React + Vite)
  ├─ React Router pages and shared application context
  └─ Axios requests with session cookies
       │ HTTPS + credentialed CORS
       ▼
Express API (backend/index.js)
  ├─ security headers, JSON parsing, CORS, rate limits
  ├─ routes → authentication/role middleware → controllers
  ├─ Mongoose models → MongoDB
  ├─ profile/resume uploads → Cloudinary
  └─ optional career-coach requests → Groq API
```

The frontend and backend are independently deployed. `VITE_API_URL` selects the API origin at frontend build time. The backend only allows configured frontend origins (`FRONTEND_URL` and comma-separated `FRONTEND_URLS`).

## Backend request lifecycle

1. Express applies Helmet, JSON/urlencoded parsers, cookie parsing, and credentialed CORS.
2. API requests pass through global and route-specific rate limits.
3. Route middleware validates the JWT cookie where required and loads the account role for recruiter-only operations.
4. Controllers enforce ownership and business rules, then read/write MongoDB through Mongoose models.
5. Responses are JSON; unmatched paths return a JSON 404 and the error middleware masks unexpected server errors.

At startup the API connects to MongoDB, closes expired jobs, and then listens on `PORT` (or `3000`). A scheduled process checks expired jobs once per minute.

## Frontend organization

- `frontend/src/App.jsx` declares public, candidate, and recruiter-facing routes.
- `frontend/src/context/AppContext.jsx` maintains shared session/application state.
- `frontend/src/components/` contains reusable UI and feature areas (auth, recruiter admin, coach, notifications).
- `frontend/src/pages/` contains route-level pages.
- `frontend/src/utils/constant.js` builds API base URLs from `VITE_API_URL`; coach requests are collected in `frontend/src/utils/coachApi.js`.
- `frontend/vercel.json` rewrites paths to `index.html` so React Router routes work on refresh.

## Main data entities

| Entity | Purpose and key relationships |
| --- | --- |
| User | Candidate or recruiter account; profile stores skills, resume metadata, recommendations, verified skills, projects, education, experience, achievements, and certificates. |
| Company | Recruiter-owned company profile. |
| Job | Job listing associated with a company/recruiter; includes requirements, position count, expiry and open/closed state. |
| Application | Connects a job and candidate; has a lifecycle status. A unique `(job, applicant)` index permits one application per candidate/job. |
| Plan | Candidate learning plan, optionally associated with a job; contains ordered skill weeks, unlock/pass state, and portfolio ideas. |
| Notification | User-targeted in-app event with read state. |

Model definitions live in `backend/models/`. The `Job` schema is in `backend/models/Job.js` (the lowercase `job.model.js` re-exports it).

## Candidate coaching workflow

1. Skill requirements are normalized and compared with the candidate's profile and quiz-demonstrated skills.
2. A goal or job fit analysis identifies gaps. A plan contains up to eight ordered weekly skill units.
3. The first week is unlocked. Passing that week's quiz with 70% or above unlocks the next unit and records the demonstrated skill.
4. Recruiter applicant views can use skill fit and verified skills as signals alongside the application and profile.

If `GROQ_API_KEY` is configured, AI calls use Groq's OpenAI-compatible chat completions API. The application falls back to built-in goal templates, plan templates, self-assessment quizzes, and rule-based resume analysis when AI is unavailable. The key remains on the backend.

## External services

- **MongoDB:** accounts, companies, jobs, applications, plans, and notifications.
- **Cloudinary:** profile images and candidate resume files.
- **Groq (optional):** goal analysis, generated plans/quizzes, and resume analysis.
- **Hacker News:** source for the technology news feed; results are cached by the backend.

## Useful entry points

- API startup and middleware: `backend/index.js`
- Route definitions: `backend/routes/`
- Controllers: `backend/controllers/`
- Schema definitions: `backend/models/`
- Coach matching and AI fallback logic: `backend/controllers/coach.controller.js`, `backend/utils/skills.js`, and `backend/utils/ai.js`
- Frontend route map: `frontend/src/App.jsx`


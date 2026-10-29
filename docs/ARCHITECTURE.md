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

### Job-to-application workflow

1. Recruiters create a company profile and associate job listings with a company they own.
2. Public job searches return listings newest first, with pagination and keyword matching across job content and company name. The public response excludes application identifiers.
3. A candidate can apply while the listing is open and before its deadline. The database's unique `(job, applicant)` index prevents a second application for the same listing, including concurrent submissions.
4. Recruiters can view applicants for their own listings. Applicant responses include a skill-fit result based on the job requirements and the candidate's listed or demonstrated skills.
5. Recruiters update application status. The candidate receives an in-app notification when the status changes. Acceptance counts against the position limit; the listing closes when the limit is reached.

### Data ownership and relationships

- A recruiter owns company profiles and job listings. Job ownership is recorded separately from its company association.
- A candidate owns their profile, applications, learning plans, and notifications.
- An application references both one job and one candidate. The job also keeps application references for recruiter-facing listing views.
- A learning plan belongs to a candidate and may optionally reference a job. Each plan stores the role, required and missing skills, plan source, ordered weeks, progress, and portfolio ideas.
- A notification belongs to one account and stores its type, display text, optional in-app link, read state, and timestamps.

## Business rules and data integrity

- Email addresses are normalized to lowercase on account creation and profile update. Passwords must contain at least eight characters and are stored as bcrypt hashes.
- An application is allowed only for a candidate account and an open job whose deadline has not passed.
- The compound unique application index prevents duplicate applications. Historical duplicate records can block index creation during deployment and must be resolved before the index can be created.
- Recruiters may manage only companies and jobs that they own. Candidate coaching plans and projects are scoped to the authenticated candidate.
- Application status values are constrained by the schema. A listing cannot accept more candidates than its `position` count.
- Coach skill matching considers both profile-listed skills and demonstrated skills. Quiz verification is separate from self-assessment.

## External calls and fallback behavior

AI calls are made server-side and use a request timeout. The API treats an unavailable or invalid AI response as a signal to use a local fallback for supported features. This keeps core career-coaching functionality available without exposing provider credentials in the frontend.

Technology news comes from Hacker News stories queried through Algolia. The API filters for recent stories with engagement and caches results to avoid repeated external requests. News and AI features require outbound network access from the API host.

## Security boundaries

- JWTs are stored in HTTP-only cookies so frontend JavaScript cannot read the token directly.
- Production cookies use `Secure` and `SameSite=None` for cross-origin frontend/API deployments; HTTPS is required.
- Credentialed CORS uses an explicit origin allowlist. `FRONTEND_URL` and `FRONTEND_URLS` must be configured to match the deployed frontend origins.
- Recruiter role checks and ownership checks are enforced by backend middleware/controllers; hiding a frontend route is not the authorization boundary.
- Public job responses exclude application identifiers. Resume download requests validate the upstream Cloudinary host/account before fetching the file.
- Rate limits apply to the API globally, to credential endpoints, and to AI-backed coach routes.

## Runtime behavior and limitations

The process connects to MongoDB before accepting requests. The `/health` endpoint indicates that the API process responds, but it is not a live database readiness probe. Expired-job cleanup runs on startup and once per minute in each running process. If multiple API instances run concurrently, each instance runs this interval.

Uploaded resumes are stored as Cloudinary raw assets. The current application does not configure private asset delivery, so operators should review account-level access settings and treat resume URLs as sensitive. Quiz session state is held in process memory; active quiz sessions are not shared across API instances or preserved across process restarts.

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


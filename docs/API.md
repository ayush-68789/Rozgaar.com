# API reference

The API is served from the backend origin. All application routes are prefixed with `/api/v1`; the health check is `GET /health`.

## Conventions

- Send and receive JSON unless the endpoint accepts file uploads.
- Authenticated routes use the `token` HTTP-only cookie set by login or registration. Browser clients must send credentials (`withCredentials: true`).
- Recruiter routes additionally require the recruiter role. Coach endpoints require a candidate (`student`) account.
- Successful responses generally include `success: true`; errors generally include `success: false` and a `message`. Exact response fields depend on the endpoint.
- Multipart profile uploads use fields `file` (profile image) and `resume` (PDF, DOC, or DOCX). Upload behavior is defined by the profile controller.

## Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Returns `{ "status": "ok" }` when the process is responding. It does not test MongoDB connectivity after startup. |

## Accounts and profiles — `/api/v1/user`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create a `student` or `recruiter` account. Multipart form supports profile image `file`; candidates may also supply `resume`. Requires `fullname`, `email`, `phoneNumber`, `password` (minimum 8 characters), and `role`. Sets session cookie. |
| POST | `/login` | Public | Login with `email`, `password`, and `role`. Sets session cookie. |
| GET | `/me` | Signed in | Return the current account/profile. |
| GET | `/logout` | Public | Clear the session cookie. |
| POST | `/profile/update` | Signed in | Update profile fields (`fullname`, `email`, `phoneNumber`, `bio`, comma-separated `skills`) and optional `file`/`resume` multipart uploads. |
| PUT | `/profile/sections/:section` | Signed in | Replace `records` for `projects`, `education`, `experience`, `achievements`, or `certificates`. Submit an array of up to 20 records. |
| GET | `/resume/download?url=...&filename=...` | Signed in | Download a resume from the configured Cloudinary account. The URL is validated against that Cloudinary host/account. |

## Companies — `/api/v1/company`

All routes require a signed-in recruiter.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/register` | Create a company for the recruiter; body includes `companyName`. |
| GET | `/get` | List companies owned by the recruiter. |
| GET | `/get/:id` | Read one owned company. |
| PUT | `/update/:id` | Update an owned company; supports multipart logo upload (`file`). |
| DELETE | `/delete/:id` | Delete an owned company. |

## Jobs — `/api/v1/job`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/get` | Public | List jobs. Supports `page` and `limit` pagination query parameters. |
| GET | `/get/:id` | Public; optional session | Read job details. A valid signed-in session may affect user-specific fields; the public response does not expose the applications list. |
| POST | `/post` | Recruiter | Create a job listing. |
| GET | `/getadminjobs` | Recruiter | List jobs managed by the recruiter. |
| PATCH | `/update/:id` | Recruiter | Update a managed job. |
| PATCH | `/toggle/:id` | Recruiter | Toggle a managed listing's open/closed state. |
| DELETE | `/delete/:id` | Recruiter | Delete a managed listing. |

Job creation and updates use the fields accepted by the job controller/model, including title, description, requirements, location, salary, experience level, company, position count, and employment type. Consult `backend/models/Job.js` for schema details.

## Applications — `/api/v1/application`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/apply/:id` | Candidate signed in | Apply to job `:id`. Duplicate applications are rejected and prevented by a unique database index. |
| GET | `/get` | Signed in | List the current candidate's applications. |
| GET | `/:id/applicants` | Recruiter | List applicants for a managed job. |
| POST | `/shortlist/:id` | Recruiter | Run the applicant shortlisting action for job `:id`. |
| POST | `/status/:id/update` | Recruiter | Update an application's status. |
| DELETE | `/delete/:id` | Signed in | Delete an application owned by the current user or accessible under controller rules. |

Application statuses in the schema are `pending`, `shortlisted`, `interview`, `offered`, `accepted`, and `rejected`.

## Career coach — `/api/v1/coach`

All endpoints require a signed-in candidate account. AI-backed endpoints share a limit of 40 requests per hour per client.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/overview` | Candidate coach overview and progress. |
| GET | `/recommendations` | Personalized job recommendations. |
| GET | `/fit/:jobId` | Skill-fit analysis for a job. |
| POST | `/goal` | Analyze a career goal; body: `{ "goal": "..." }`. |
| POST | `/plan/job/:jobId` | Create or retrieve a learning plan for a job; optional body `{ "refresh": true }` regenerates it. |
| GET | `/plans` | List the candidate's plans. |
| GET | `/plan/:id` | Read a plan. |
| DELETE | `/plan/:id` | Delete a plan. |
| POST | `/plan/:id/week/:week/quiz` | Start a weekly quiz. Quiz answers are not included in the public plan. |
| POST | `/plan/:id/week/:week/submit` | Submit `{ "quizToken": "...", "answers": [...] }` for grading. |
| POST | `/resume/analyze` | Analyze the saved resume; optional body `{ "jobId": "..." }` compares it with a job. |
| POST | `/skills/add` | Add self-assessed skills; body includes `skills`. |
| POST | `/projects` | Add a portfolio project. |
| DELETE | `/projects/:projectId` | Delete a portfolio project. |
| GET | `/news` | Read technology news; optional comma-separated `topics` query parameter. |

Weekly quizzes require a score of at least 70% to pass and unlock the next week. Without Groq configuration, the app uses plan templates and self-assessment quiz fallbacks; fallback quiz results are not represented as verified skills.

## Notifications — `/api/v1/notification`

All routes require a signed-in account.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | List notifications for the current user. |
| POST | `/read-all` | Mark all notifications read. |
| POST | `/:id/read` | Mark one notification read. |

## Errors and limits

The API returns JSON for unmatched routes and server errors. Credential endpoints are limited to 20 requests per 15 minutes; `/api/` has a global limit of 600 requests per 15 minutes. Limits use standard rate-limit response headers.


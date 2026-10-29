# API reference

The API is served from the backend origin. Application endpoints use the `/api/v1` prefix; the health endpoint is `GET /health`.

## Conventions

- Requests and responses use JSON unless an endpoint accepts file uploads.
- Authentication uses the `token` HTTP-only cookie issued at registration or login. Browser clients must include credentials (`withCredentials: true`).
- Recruiter endpoints require an authenticated recruiter account. Career-coach endpoints require an authenticated candidate account (`student` in the data model).
- Responses generally include a `success` boolean. Error responses also include a human-readable `message`; endpoint-specific fields are documented below.
- Profile uploads use multipart form fields `file` (profile image) and `resume` (PDF, DOC, or DOCX). Refer to the profile controller for accepted fields and validation.

## Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Returns `{ "status": "ok" }` when the API process is responding. It does not perform a live MongoDB connectivity check. |

## Accounts and profiles — `/api/v1/user`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create a `student` or `recruiter` account. Requires `fullname`, `email`, `phoneNumber`, `password` (at least eight characters), and `role`. Multipart requests may include `file` for a profile image; candidate accounts may also include `resume`. Sets the session cookie. |
| POST | `/login` | Public | Authenticate with `email`, `password`, and `role`. Sets the session cookie. |
| GET | `/me` | Authenticated | Return the current account and profile. |
| GET | `/logout` | Public | Clear the session cookie. |
| POST | `/profile/update` | Authenticated | Update profile fields (`fullname`, `email`, `phoneNumber`, `bio`, and comma-separated `skills`) and optionally upload `file` and/or `resume` as multipart fields. |
| PUT | `/profile/sections/:section` | Authenticated | Replace the `records` array for `projects`, `education`, `experience`, `achievements`, or `certificates`. Accepts up to 20 records. |
| GET | `/resume/download?url=...&filename=...` | Authenticated | Download a resume from the configured Cloudinary account. The supplied URL is validated against the configured Cloudinary host and account. |

## Companies — `/api/v1/company`

All endpoints require an authenticated recruiter.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/register` | Create a company owned by the recruiter. Request body includes `companyName`. |
| GET | `/get` | List companies owned by the recruiter. |
| GET | `/get/:id` | Retrieve one company owned by the recruiter. |
| PUT | `/update/:id` | Update an owned company; supports a multipart logo upload in `file`. |
| DELETE | `/delete/:id` | Delete an owned company. |

## Jobs — `/api/v1/job`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/get` | Public | List jobs. Supports the `page` and `limit` pagination query parameters. |
| GET | `/get/:id` | Public; optional authentication | Retrieve job details. The public response does not expose the applications list. |
| POST | `/post` | Recruiter | Create a job listing. |
| GET | `/getadminjobs` | Recruiter | List jobs managed by the authenticated recruiter. |
| PATCH | `/update/:id` | Recruiter | Update a job managed by the authenticated recruiter. |
| PATCH | `/toggle/:id` | Recruiter | Change a managed listing's open/closed state. |
| DELETE | `/delete/:id` | Recruiter | Delete a managed listing. |

Job creation and updates use the fields accepted by the job controller and model, including title, description, requirements, location, salary, experience level, company, position count, and employment type. See `backend/models/Job.js` for schema details.

## Applications — `/api/v1/application`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/apply/:id` | Authenticated candidate | Apply to job `:id`. Duplicate applications are rejected and prevented by a unique database index. |
| GET | `/get` | Authenticated | Retrieve applications associated with the current account. |
| GET | `/:id/applicants` | Recruiter | List applicants for a job managed by the recruiter. |
| POST | `/shortlist/:id` | Recruiter | Run applicant shortlisting for job `:id`. |
| POST | `/status/:id/update` | Recruiter | Update an application's status. |
| DELETE | `/delete/:id` | Authenticated | Delete an application, subject to the controller's ownership checks. |

Application statuses in the schema are `pending`, `shortlisted`, `interview`, `offered`, `accepted`, and `rejected`.

## Career coach — `/api/v1/coach`

All endpoints require an authenticated candidate account. AI-backed endpoints share a limit of 40 requests per hour per client.

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

Weekly quizzes require a score of at least 70% to pass and unlock the next week. Without Groq configuration, the API uses plan templates and self-assessment quiz fallbacks. Fallback quiz results are not recorded as verified skills.

## Notifications — `/api/v1/notification`

All endpoints require authentication.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | List notifications for the current user. |
| POST | `/read-all` | Mark all notifications read. |
| POST | `/:id/read` | Mark one notification read. |

## Errors and limits

The API returns JSON for unmatched routes and server errors. Login and registration endpoints are limited to 20 requests per client per 15 minutes. The `/api/` namespace has a global limit of 600 requests per client per 15 minutes. Rate-limit responses include standard rate-limit headers.


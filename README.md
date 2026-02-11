# Health-Lock

Health-Lock is a secure QR-based medical record sharing platform.

It has two user roles:
- `Patient`: uploads a PDF medical report and generates a time-limited QR link.
- `Doctor`: scans the QR (camera or image) to view the report.

The system is built with:
- `Frontend`: React + Vite
- `Backend`: Node.js + Express
- `Database`: MongoDB (Mongoose)

---

## 1. Problem This Project Solves

Medical reports are often shared over insecure channels. Health-Lock enables:
- controlled report sharing,
- short-lived access tokens,
- audit logs of who accessed a record,
- optional email notifications for key events.

---

## 2. High-Level Architecture

1. Patient uploads PDF from dashboard.
2. Backend stores report in MongoDB and creates a short-lived JWT (`record:read`, 10 min).
3. Backend creates QR code containing doctor access URL.
4. Doctor scans QR and requests `/api/records/:id?token=...`.
5. Backend validates token scope + record ID match.
6. Backend returns report + patient metadata and stores an access log.
7. Patient can view access history from dashboard.

---

## 3. Project Structure

```text
Health-Lock/
|- backend/
|  |- app.js                       # Express app, security middleware, route mounting
|  |- server.js                    # DB connect + server start
|  |- config/
|  |  |- db.js                     # MongoDB connection
|  |  `- logger.js                 # Winston logger
|  |- controllers/                 # Request handlers (auth, patient, records, logs)
|  |- services/                    # Business/data logic + notifications
|  |- models/                      # Mongoose schemas
|  |- routes/                      # API route maps
|  |- middleware/                  # auth checks, request logger, error handler
|  |- utils/                       # token, password hashing, qrcode helpers
|  `- public_legacy/               # Older static prototype pages
|- frontend/
|  |- src/
|  |  |- pages/                    # Home, Signup, Signin, PatientDashboard, DoctorScanner
|  |  |- components/               # UI helpers (ProfileModal, loaders, background)
|  |  |- lib/api.js                # API wrapper + auth/profile helpers
|  |  |- App.jsx                   # Router
|  |  `- main.jsx                  # React entry
|  |- index.html                   # Includes Html5Qrcode script
|  `- vite.config.js               # Dev server + API proxy
|- assets/                         # Project assets
`- run-all.bat                     # Starts backend + frontend
```

---

## 4. Backend Flow (Simple)

### 4.1 Server boot
- `backend/server.js`
  - loads environment,
  - connects to MongoDB,
  - starts Express server.

### 4.2 App configuration
- `backend/app.js`
  - applies `helmet`, CORS, JSON parser, rate limiters,
  - parses cookies manually,
  - reads `auth_token` cookie and populates `req.user`,
  - protects most `/api/*` routes except auth and QR record endpoint,
  - mounts API router and error handlers.

### 4.3 Main API modules
- `controllers/auth.controller.js`
  - signup/signin/session/logout,
  - profile view/update,
  - sets/clears auth cookie.
- `controllers/patient.controller.js`
  - upload report,
  - validate PDF type/size,
  - generate QR access URL,
  - list records,
  - regenerate QR for old record.
- `controllers/records.controller.js`
  - validates record token,
  - fetches record,
  - logs access,
  - returns report data to doctor.
- `controllers/logs.controller.js`
  - returns patient access logs.

### 4.4 Service layer
- `services/auth.service.js`: validation, signup/signin, profile updates, password checks.
- `services/patient.service.js`: create/read patient records.
- `services/records.service.js`: fetch record + patient.
- `services/log.service.js`: write/read access logs.
- `services/notification.js`: email notifications (signup/login/QR generated/QR accessed).

---

## 5. Frontend Flow (Simple)

### 5.1 Routing
- `frontend/src/App.jsx`
  - `/` home
  - `/signup` signup
  - `/signin` signin
  - `/patient` patient dashboard
  - `/doctor` doctor scanner

### 5.2 Auth UX
- `Signup.jsx` and `Signin.jsx`
  - submit role-based auth forms,
  - backend sets `auth_token` cookie,
  - user redirected based on role.

### 5.3 Patient dashboard
- `PatientDashboard.jsx`
  - upload PDF report,
  - receive QR image + link,
  - list uploaded records,
  - regenerate QR,
  - view access logs,
  - open profile modal and update profile/password.

### 5.4 Doctor dashboard
- `DoctorScanner.jsx`
  - scans QR using `html5-qrcode` (camera or file),
  - extracts `id` and `token` from URL,
  - fetches secure record,
  - shows patient details and embedded PDF report.

### 5.5 Shared API helpers
- `frontend/src/lib/api.js`
  - central `fetch` wrapper with credentials,
  - session/profile/logout helper functions.

---

## 6. Database Schema (MongoDB)

### 6.1 Collections and fields

#### `patients`
- `_id`
- `name` (required)
- `email` (required, unique, indexed)
- `phone`
- `passwordHash`
- `passwordSalt`
- `passwordIterations`
- `passwordKeylen`
- `passwordDigest`
- `createdAt`, `updatedAt`

#### `doctors`
- `_id`
- `name` (required)
- `email` (required, unique)
- `specialization`
- `passwordHash`
- `passwordSalt`
- `passwordIterations`
- `passwordKeylen`
- `passwordDigest`
- `createdAt`, `updatedAt`

#### `records`
- `_id`
- `patient` (ObjectId -> `patients._id`, required)
- `medicalData.file` (base64 PDF data URL)
- `medicalData.fileName`
- `medicalData.fileType`
- `accessUrl` (last generated doctor URL)
- `status` (`active` or `archived`)
- `createdAt`, `updatedAt`

#### `accesslogs`
- `_id`
- `patient` (ObjectId -> `patients._id`, required)
- `record` (ObjectId -> `records._id`, required)
- `doctor` (ObjectId -> `doctors._id`, optional)
- `action` (`RECORD_VIEWED`)
- `meta` (e.g. `{ via: "qr" }`)
- `ip`
- `userAgent`
- `createdAt`, `updatedAt`

### 6.2 ER overview

```text
Patient (1) ----< Record (many)
Patient (1) ----< AccessLog (many)
Doctor  (1) ----< AccessLog (many, optional)
Record  (1) ----< AccessLog (many)
```

---

## 7. Important API Endpoints and Their Uses

All endpoints are prefixed with `/api`.

### 7.1 Authentication APIs

#### `POST /api/auth/signup`
- **Used by:** Signup page (`frontend/src/pages/Signup.jsx`)
- **Purpose:** Create a new `patient` or `doctor` account.
- **Body (important):** `role`, `name`, `email`, `password`, and either `phone` (patient) or `specialization` (doctor).
- **What it does:** Validates role and fields, hashes password, stores user, sets `auth_token` cookie.

#### `POST /api/auth/signin`
- **Used by:** Signin page (`frontend/src/pages/Signin.jsx`)
- **Purpose:** Log in an existing user.
- **Body (important):** `role`, `email`, `password`, `rememberMe`.
- **What it does:** Validates credentials, sets `auth_token` cookie, returns role-based redirect info.

#### `GET /api/auth/session`
- **Used by:** route guards in signup/signin/dashboard pages
- **Purpose:** Check if user is already logged in.
- **Auth:** cookie-based (`auth_token`).
- **What it returns:** `userId` and `role` if session is valid.

#### `GET /api/auth/me`
- **Used by:** `ProfileModal.jsx`
- **Purpose:** Fetch current user profile details.
- **Auth:** required.

#### `PUT /api/auth/me`
- **Used by:** `ProfileModal.jsx`
- **Purpose:** Update profile info and optionally change password.
- **Auth:** required.
- **Body (important):** `name`, `email`, and role-specific fields; optional `currentPassword` + `newPassword`.

#### `POST /api/auth/logout`
- **Used by:** dashboard logout buttons
- **Purpose:** Clear auth cookie and end session.

### 7.2 Patient Record APIs

#### `POST /api/patient/records`
- **Used by:** upload form in `PatientDashboard.jsx`
- **Purpose:** Upload patient PDF report and generate secure QR access.
- **Auth/Role:** required, `patient` only.
- **Body (important):**
  - `medicalData.file` (base64 PDF data URL)
  - `medicalData.fileName`
  - `medicalData.fileType` (`application/pdf`)
  - optional `doctorEmail`
- **What it does:** Validates PDF and size, stores record, creates 10-min record token, builds doctor URL, generates QR image, returns QR + link.

#### `GET /api/patient/records`
- **Used by:** “See Uploads” tab in `PatientDashboard.jsx`
- **Purpose:** List all reports uploaded by current patient.
- **Auth/Role:** required, `patient` only.

#### `POST /api/patient/records/:id/qr`
- **Used by:** “Generate QR” action for previous uploads
- **Purpose:** Regenerate a fresh QR/link for an existing record.
- **Auth/Role:** required, `patient` only.

### 7.3 Doctor Access API

#### `GET /api/records/:id?token=...`
- **Used by:** `DoctorScanner.jsx` after QR scan
- **Purpose:** Securely fetch one medical record using short-lived QR token.
- **Auth:** public route but token is mandatory and validated.
- **What it does:**
  - verifies token scope (`record:read`) and token subject matches `:id`
  - loads record + patient details
  - writes access log entry
  - returns report content + patient metadata

### 7.4 Audit Log API

#### `GET /api/logs/me`
- **Used by:** “Record Access History” panel in `PatientDashboard.jsx`
- **Purpose:** Show patient who accessed reports and when.
- **Auth/Role:** required, `patient` only.
- **Returns:** log entries with record, optional doctor, time, IP, user-agent.

### 7.5 Why These APIs Are Important

- They cover the complete trust flow of the project:
  1. account creation/login,
  2. secure report upload,
  3. QR-based controlled access,
  4. transparency through audit logs.
- These are the core endpoints mentors should test during demo/evaluation.
---

## 8. Security Features

- JWT for authentication and QR record access.
- Separate token scope for record reading (`record:read`).
- Record access token expiry (`10m`).
- HTTP-only auth cookie (`auth_token`).
- Password hashing with PBKDF2 (`sha512`, salted).
- Helmet security headers.
- Rate limits for auth and record routes.
- Role checks for patient/doctor endpoints.
- Access logs with IP/user-agent metadata.

---

## 9. Environment Variables

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/health_lock
JWT_SECRET=your_strong_secret
NODE_ENV=development

FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
MAIL_FROM=Health-Lock <no-reply@health-lock.local>
```

Optional frontend env (`frontend/.env`):

```env
VITE_API_BASE=http://localhost:5000
```

---

## 10. Run the Project

### Option A: one command (Windows)
```bat
run-all.bat
```

### Option B: manually

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## 11. Deploy on Render

This repo includes `render.yaml` for one-click Blueprint deploy:
- `health-lock-api` (Node web service from `backend/`)
- `health-lock-web` (Static site from `frontend/`)

### 11.1 Deploy steps

1. Push this repo to GitHub.
2. In Render, click `New` -> `Blueprint` and select this repo.
3. Render will detect `render.yaml` and create both services.
4. After the first deploy, copy service URLs:
   - Backend URL: `https://<your-api>.onrender.com`
   - Frontend URL: `https://<your-web>.onrender.com`
5. Set environment variables:
   - On `health-lock-api`:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `FRONTEND_ORIGIN` = your frontend URL (for example `https://<your-web>.onrender.com`)
     - `FRONTEND_BASE_URL` = your frontend URL
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (optional but recommended)
   - On `health-lock-web`:
     - `VITE_API_BASE` = your backend URL (for example `https://<your-api>.onrender.com`)
6. Redeploy both services after setting env vars.

### 11.2 Notes for Render

- Backend health endpoint is available at `/api/health`.
- React SPA routing fallback is configured via:
  - `render.yaml` rewrite rule, and
  - `frontend/public/_redirects`.
- Backend cookie auth is configured for cross-site production usage (`SameSite=None; Secure`), which is required when frontend and backend are on different Render domains.

---

## 12. Mentor Quick Walkthrough

1. Sign up as a `patient`.
2. Upload a PDF from Patient Dashboard and generate QR.
3. Copy the generated doctor link (or scan QR from Doctor Dashboard).
4. Sign in as `doctor` and access that link.
5. Observe report is shown.
6. Return to patient dashboard and check `Record Access History`.

This demonstrates the full trust flow: upload -> tokenized QR -> doctor access -> audit trail.

---

## 13. Notes and Current Limitations

- Reports are stored as base64 in MongoDB (`medicalData.file`). This is simple but can grow DB size quickly at scale.
- Access URL currently stored on record and updated on each new QR generation.
- `backend/public_legacy/` contains old static pages and is not part of the current React app runtime.
- Email notifications require valid SMTP settings; otherwise they are safely skipped.

---

## 14. Key Files For Review

- `backend/app.js`
- `backend/controllers/patient.controller.js`
- `backend/controllers/records.controller.js`
- `backend/services/auth.service.js`
- `backend/models/record.model.js`
- `backend/models/log.model.js`
- `frontend/src/pages/PatientDashboard.jsx`
- `frontend/src/pages/DoctorScanner.jsx`
- `frontend/src/lib/api.js`

These files cover most of the architecture, security flow, and core project logic.

---

## 15. Significance of Important Files

### 15.1 Backend entry and configuration

- `backend/server.js`
  - Application bootstrap file: loads env, connects database, and starts HTTP server.
- `backend/app.js`
  - Central Express composition file: security middleware, cookie/user context setup, rate limits, route mounting, and global error pipeline.
- `backend/config/db.js`
  - Single source of truth for MongoDB connection lifecycle.
- `backend/config/logger.js`
  - Standardized logging setup used across middleware and services.

### 15.2 Routing layer

- `backend/routes/auth.routes.js`
  - Defines account/session/profile endpoints and binds them to auth controller actions.
- `backend/routes/patient.routes.js`
  - Defines patient-only record upload/list/regenerate-QR flows.
- `backend/routes/records.routes.js`
  - Defines doctor QR access endpoint for secure record retrieval.
- `backend/routes/logs.routes.js`
  - Defines patient audit-log endpoint (`/api/logs/me`).

### 15.3 Controller layer

- `backend/controllers/auth.controller.js`
  - Handles signup/signin/session/logout and profile read/update response contracts.
- `backend/controllers/patient.controller.js`
  - Orchestrates patient upload pipeline, QR generation, and patient record listing.
- `backend/controllers/records.controller.js`
  - Verifies QR token scope/subject, fetches record, logs access, and returns doctor-view payload.
- `backend/controllers/logs.controller.js`
  - Returns record access history for logged-in patients.

### 15.4 Service layer (business logic + persistence orchestration)

- `backend/services/auth.service.js`
  - Core user validation, registration/login credential checks, and profile mutation logic.
- `backend/services/patient.service.js`
  - Record creation/query logic scoped to patient workflows.
- `backend/services/records.service.js`
  - Record retrieval operations used by doctor access flow.
- `backend/services/log.service.js`
  - Access-log write/read operations for auditing.
- `backend/services/notification.js`
  - Outbound email notification workflows (signup/login/QR events).

### 15.5 Data models

- `backend/models/patient.model.js`
  - Patient identity and credential storage schema.
- `backend/models/doctor.model.js`
  - Doctor identity/specialization and credential storage schema.
- `backend/models/record.model.js`
  - Medical record storage schema including file payload and QR access URL.
- `backend/models/log.model.js`
  - Immutable access audit schema for traceability.

### 15.6 Middleware and utilities

- `backend/middleware/auth.middleware.js`
  - Reusable auth/role enforcement helpers and doctor context attachment.
- `backend/middleware/requestLogger.js`
  - Per-request logging hook for observability.
- `backend/middleware/errorHandler.js`
  - Final error normalization and API-safe error responses.
- `backend/middleware/index.js`
  - Middleware barrel for shared guards/validators (patient guard + upload payload checks).
- `backend/utils/token.js`
  - JWT creation/verification utilities for auth and short-lived record access.
- `backend/utils/password.js`
  - Password hashing and verification (PBKDF2-based).
- `backend/utils/qrcode.js`
  - QR image generation from secure doctor access URLs.
- `backend/utils/AppError.js`
  - Structured application error type for consistent status/code propagation.
- `backend/utils/wrapAsync.js`
  - Async controller wrapper to route rejected promises into the global error handler.

### 15.7 Frontend files that define backend contract usage

- `frontend/src/lib/api.js`
  - Shared API caller; defines credentials behavior and expected response handling patterns.
- `frontend/src/pages/Signup.jsx`
  - Consumes `/api/auth/signup` contract.
- `frontend/src/pages/Signin.jsx`
  - Consumes `/api/auth/signin` and session guard contract.
- `frontend/src/pages/PatientDashboard.jsx`
  - Consumes patient upload/list/QR/log/profile contracts.
- `frontend/src/pages/DoctorScanner.jsx`
  - Consumes `/api/records/:id?token=...` secure retrieval contract.


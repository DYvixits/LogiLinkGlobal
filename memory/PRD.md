# PRD — LOGILINK GLOBAL (Plateforme logistique Cameroun ↔ Europe)

## Original Problem Statement
Web-based logistics platform for sending packages between Cameroon and Europe (via Italy).
- Fixed schedules: Europe → Cameroon (Fridays), Cameroon → Europe (Saturdays).
- No client sign-up. Users fill a form, get a printable PDF/QR ticket, and track packages from the homepage.
- Operator Backoffice (login required): manage packages, update statuses (Received, Shipped, Arrived, Delivered, Incident), assign departure dates, publish schedules, manage users.
- UI must be extremely simple, mobile-first, "terrain" oriented (no startup jargon).
- Fixed Italy hub address hardcoded in the send form: **Patrice Simo, Via Roma 35, 26866 Lodi, Italy, +39 3287091255**.

## User preferences
- **Language: French (primary).** Platform is bilingual FR/EN with a header toggle.
- Only 2 routes exist: EU→CM and CM→EU. Do NOT add other countries.

## Architecture
- Frontend: React + Shadcn UI + TailwindCSS. i18n via React Context (`contexts/LanguageContext.js` + `translations.js`).
- Backend: FastAPI + MongoDB (Motor), JWT auth (PyJWT, passlib/bcrypt).
- Key files: `frontend/src/pages/{Home,Send,Tracking,Login,Backoffice}.jsx`, `components/ui/Header.jsx`, `backend/server.py`.

## Key API Endpoints
- `POST /api/auth/login`
- `POST /api/packages/` (public — send form)
- `GET /api/packages/{tracking_number}` (public — tracking)
- `GET /api/packages/` (protected — backoffice)
- `PUT /api/packages/{tracking_number}/status` (protected)
- `POST /api/users/` (protected — admin only)

## DB Schema
- `packages`: { tracking_number, direction, sender, receiver, status, history, type, weight, departure_date, created_at, estimated_arrival }
- `users`: { username, password_hash, role, created_at }

## Implemented (as of 2026-02 / latest fork)
- Home (tracking input), Send (form w/ hardcoded Italy hub), Tracking pages — no auth.
- Operator backoffice: KPI dashboard, parcel management table, status lifecycle, user management (Admin/Operator/Supervisor RBAC).
- JWT auth + seeded admin (`admin`/`admin123`) and operator (`operateur`/`op123`).
- **Bilingual FR/EN toggle — COMPLETE & TESTED (iteration_9.json, 95%→100% after fixes).** Default FR, persists in localStorage. Italy hub address verified intact in both languages/directions. Fixed remaining i18n gaps: backoffice table labels (Dépôt/Arrivée) and login welcome/error toasts now use `t()`.

## Roadmap / Backlog
- **P1**: Downloadable/printable PDF ticket with QR code on package creation (libs `qrcode`, `reportlab` installed; logic needs build/verification).
- **P2**: Real SMS/Email notifications (currently MOCKED/simulated on status update).

## Mocked
- SMS and Email notifications on status update are simulated (not real integrations).

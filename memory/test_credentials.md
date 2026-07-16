# Test Credentials — LOGILINK GLOBAL

## Backoffice login (`/login`)

| Role       | Username     | Password   | Agency    | Visibility |
|------------|--------------|------------|-----------|------------|
| Admin      | `admin`      | `admin123` | (none)    | All agencies, all modules |
| Operator   | `operateur`  | `op123`    | AG-LODI   | Parcels touching AG-LODI (hub → sees all) |
| Supervisor | `superviseur`| `super123` | AG-DOUALA | Only parcels touching AG-DOUALA |

## Agencies (seeded)
AG-LODI (Italie), AG-PARIS (France), AG-DOUALA (Cameroun), AG-YAOUNDE (Cameroun)

## E-commerce API
- Create key in backoffice → Intégrations. Header: `X-API-Key: sk_live_...`
- Endpoint: `POST {BACKEND_URL}/api/integrations/shipments`

## Notes
- Auth = JWT (custom). Token in localStorage `token`, role `role`, name `user_name`.
- Public pages (Home `/`, Send `/send`, Tracking `/track`) need NO login.
- Default UI language French. Toggle = globe button (data-testid="language-toggle-button").
- Notifications SMS/Email/WhatsApp are SIMULATED (mocked) — Phase 3 pending.

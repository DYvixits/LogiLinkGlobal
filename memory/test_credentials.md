# Test Credentials — LOGILINK GLOBAL

## Backoffice (Operator / Admin login)
Login page: `/login`

| Role     | Username   | Password  |
|----------|------------|-----------|
| Admin    | `admin`    | `admin123`|
| Operator | `operateur`| `op123`   |

## Notes
- Auth is JWT-based (custom). Token stored in localStorage under `token`, role under `role`, name under `user_name`.
- Public pages (Home `/`, Send `/send`, Tracking `/track`) require NO login.
- Default UI language is French (FR). Toggle via globe button in header (data-testid="language-toggle-button"). Persisted in localStorage key `lang`.

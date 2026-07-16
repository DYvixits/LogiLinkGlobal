# PRD — LOGILINK GLOBAL (Plateforme logistique premium Cameroun ↔ Europe)

## Vision
Transformer LOGILINK GLOBAL en logiciel SaaS logistique **premium** (niveau outils transitaires internationaux), référence en Afrique centrale. Ne PAS repartir de zéro : conserver architecture, routes, identité (navy #0F172A / orange #EA580C / blanc / gris). Améliorer progressivement par phases.

## Contraintes
- **Langue : Français primaire**, bilingue FR/EN (toggle header, localStorage).
- **Base de données : MongoDB uniquement** (contrainte environnement — PostgreSQL impossible ici).
- Seulement 2 routes : EU→CM (départ vendredi) et CM→EU (départ samedi).
- Adresse hub Italie codée en dur dans le formulaire d'envoi : **Simo Patrice, Via Roma 35, 26866 Lodi, Italie, +39 3287091255**.
- Notifications SMS/Email/WhatsApp : **SIMULÉES (MOCKED)** pour l'instant (choix utilisateur).

## Architecture
- Frontend React 19 + TailwindCSS + Shadcn UI + Recharts + lucide-react + sonner. i18n via `contexts/LanguageContext.js` + `translations.js`.
- Backend FastAPI + MongoDB (Motor), JWT (python-jose) + passlib bcrypt, RBAC.
- Fichiers clés front : `pages/{Home,Send,Tracking,Login,Backoffice}.jsx`, `components/{Timeline,StatusBadge}.jsx`, `lib/status.js`, `components/ui/Header.jsx`.
- Backend : `backend/server.py` (routes, seed, PDF, auth, stats).

## Sécurité (Phase 1)
- JWT_SECRET dans `.env` (plus de secret codé en dur).
- `require_roles(...)` : routes protégées (liste colis, stats, users, audit). Publiques : POST /parcels (formulaire client), GET /parcels/{id} (suivi), PDF.
- Journal d'audit (`audit_logs`) sur création user / update colis / update statut.
- Interceptor axios frontend attache le token automatiquement.

## Statuts (17) — workflow + timeline horodatée
CREATED, REGISTERED, RECEIVED_AT_DEPOT, CONTROLLED, WEIGHED, PACKED, INVOICED, PAID, LOADED, IN_TRANSIT, IN_CUSTOMS, ARRIVED, AVAILABLE, DELIVERED + exceptions CANCELLED, LOST, DAMAGED. Historique = {status, timestamp, author, comment}.

## API principales
- POST /api/auth/login · GET /api/auth/me
- POST /api/parcels (public) · GET /api/parcels/{id} (public) · GET /api/parcels/{id}/pdf (public, QR + code-barres Code128)
- GET /api/parcels (protégé) · PATCH /api/parcels/{id} · PATCH /api/parcels/{id}/status (protégés + historique)
- GET /api/stats (protégé, KPIs riches) · GET /api/users · POST /api/users (admin) · GET /api/audit (admin)
- GET /api/schedule · POST /api/notify/simulate (mocked)

## Modèle colis enrichi
tracking_id, barcode, direction, sender/receiver (name/phone/city/address/country/email), content_description, nature, weight_kg, volume_m3, dimensions{l,w,h}, declared_value, fragile, insured, final_price, amount_paid, operator, agency_origin/destination, status, history[], created_at, estimated_arrival.

## ✅ Phase 1 — COMPLÈTE & TESTÉE (juin 2026, iteration_10.json : backend 25/25, frontend 100%)
- Refonte design premium (Stripe/Linear) : radius 0.75rem, ombres douces, micro-animations, hover states, skeleton/loaders, footer riche.
- Landing marketing : hero, board départs, stats, cartes envoi, comment ça marche, pourquoi nous, témoignages, agences, FAQ, CTA, footer.
- Suivi public avec timeline verticale horodatée + StatusBadge.
- Formulaire d'envoi restylé (hub Italie intact) + ticket PDF (QR + code-barres).
- Backoffice : sidebar + Dashboard (12 KPIs + 3 graphiques Recharts), gestion colis (recherche instantanée, filtres date/statut, actions groupées, drawer détail + timeline + changement statut), utilisateurs (10 rôles), journal d'audit.
- Sécurité RBAC + audit. Bilingue FR/EN complet (clés status_*, dashboard, landing).

## Roadmap restante
- **Phase 2 (P1)** : Module Clients dédié (historique, stats par client), Facturation complète (factures/reçus PDF, tarifs auto, remises, taxes, paiements), Agences multi-sites, rôles fins avancés.
- **Phase 3 (P2)** : Rapports journaliers/mensuels/annuels + export Excel/PDF ; notifications réelles Email/SMS/WhatsApp (Twilio + Resend) ; 2FA.

## Comptes de test
admin/admin123 · operateur/op123 · superviseur/super123 (voir test_credentials.md)

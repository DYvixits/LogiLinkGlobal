# PRD — LOGILINK GLOBAL (Plateforme logistique premium Cameroun ↔ Europe)

## Vision
Logiciel SaaS logistique **premium** (niveau transitaires internationaux), référence en Afrique centrale. Conserver architecture/routes/identité (navy #0F172A / orange #EA580C / blanc / gris). Évolution par phases, sans rien casser.

## Contraintes
- **Langue : Français primaire**, bilingue FR/EN (toggle header, localStorage).
- **MongoDB uniquement** (PostgreSQL impossible dans l'environnement).
- 2 routes : EU→CM (vendredi) et CM→EU (samedi).
- Hub Italie codé en dur dans le formulaire : **Simo Patrice, Via Roma 35, 26866 Lodi, Italie, +39 3287091255**.
- Notifications SMS/Email/WhatsApp : **SIMULÉES (MOCKED)** — Phase 3.

## Architecture
- Front : React 19 + Tailwind + Shadcn + Recharts + lucide-react + sonner. i18n `contexts/LanguageContext.js` + `translations.js`.
- Back : FastAPI + MongoDB (Motor), JWT (python-jose) + passlib bcrypt, RBAC + audit.
- Front clés : `pages/{Home,Send,Tracking,Login,Backoffice,Legal}.jsx`, `components/backoffice/{Clients,Invoices,Agencies,Settings,Integrations}View.jsx`, `components/{Timeline,StatusBadge}.jsx`, `components/ui/{Header,Footer}.jsx`, `lib/{status,legal}.js`.
- Back : `backend/server.py`.
- Branding : `public/logo.png` (LG) + `public/favicon.png` intégrés (header, footer, login, sidebar).

## Comptes de test
admin/admin123 (voit tout) · operateur/op123 (AG-LODI) · superviseur/super123 (AG-DOUALA). Voir `test_credentials.md`.

## API principales
- Auth : POST /api/auth/login, GET /api/auth/me
- Colis : POST /api/parcels (public), GET /api/parcels/{id} (public), GET /api/parcels/{id}/pdf (public, QR+Code128), GET /api/parcels (protégé, scope agence), PATCH /api/parcels/{id}, PATCH /api/parcels/{id}/status
- Stats : GET /api/stats (protégé, scope agence)
- Users : GET/POST /api/users (admin) · Audit : GET /api/audit (admin)
- Agences : GET/POST/DELETE /api/agencies · Settings : GET/PUT /api/settings
- Clients : GET /api/clients, GET /api/clients/{phone}
- Factures : GET/POST /api/invoices, PATCH /api/invoices/{num}/pay, GET /api/invoices/{num}/pdf
- E-commerce : GET/POST/DELETE /api/integrations/keys, POST /api/integrations/shipments (header X-API-Key)
- GET /api/schedule · POST /api/notify/simulate (MOCKED)

## ✅ Phase 1 — COMPLÈTE & TESTÉE (iteration_10 : back 25/25, front 100%)
Refonte premium, landing marketing, suivi timeline horodatée, formulaire + ticket PDF (QR+code-barres), backoffice (Dashboard 12 KPIs + 3 graphiques Recharts, gestion colis recherche/filtres/bulk/drawer, users, audit), sécurité RBAC + JWT_SECRET env, bilingue.

## ✅ Phase 2 — COMPLÈTE & TESTÉE (iteration_11 : back 36/36, front 100%)
- **Module Clients** : dérivé des colis (nb colis, total dépensé, poids), détail avec historique.
- **Facturation** : tarif auto au poids (grille configurable) + remise + TVA, facture PDF, encaissement (paiement partiel/total), statut lié au colis (INVOICED/PAID).
- **Agences multi-sites** : 4 agences seedées, CRUD, **scope de visibilité** (admin/directeur = tout ; autres rôles = leur agence).
- **Paramètres** : grille de prix EU/CM + TVA + devise.
- **Intégrations e-commerce** : webhook générique `POST /api/integrations/shipments` sécurisé par clé API (X-API-Key), gestion des clés + doc dans le backoffice.
- **Responsive** : mobile-first, breakpoints, menus/nav adaptatifs.

## ✅ Branding & Légal (Juin 2026)
- Logo LG intégré partout + favicon.
- Footer réutilisable avec liens **CGV, CGU, Mentions légales, Politique de confidentialité** (pages `/cgv`, `/cgu`, `/mentions-legales`, `/confidentialite`, bilingues) + crédits **DYVIX IT Solutions** (dyvixitsolutions.com) et **BusinessPro Operator** (businesspro-operator.com).

## Roadmap restante
- **Phase 3 (P2)** : Notifications réelles **WhatsApp + Email** (nécessite clés Twilio + Resend) ; rapports journaliers/mensuels/annuels + export Excel/PDF ; double authentification (2FA) ; connecteurs e-commerce natifs (Shopify/WooCommerce) au-dessus du webhook générique.
- Sécurité : envisager auth sur le PDF de facture (PII) ; validation des montants/paramètres.
- Refactor : découper `server.py` (851 lignes) en routers/services avant Phase 3.

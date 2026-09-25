# SpoilerAlert Platform — Staging Release Pre-Flight ToDo Checklist

> **Target Release Window**: Q3 2026 / Staging Deployment  
> **Repository**: `SpoilerAlert`  
> **Document Purpose**: Comprehensive audit of incomplete features, mock/stub implementations, missing backend persistence, and environment setup required prior to staging deployment.

---

## Executive Summary

The SpoilerAlert Surplus Inventory & Liquidation Automation Platform has achieved full core architectural separation, modern Stitch UI harmonization, stage-gate escalation models, and full-screen execution audit inspection. 

Before deploying to the **Staging Environment**, several UI placeholders, mock data fallbacks, background daemon services, and backend cloud persistence endpoints must be completed or configured with staging guardrails.

---

## Priority Classification Key
- 🔴 **P0 — Staging Blocker**: Critical functionality, security, or infrastructure requirement that prevents staging testing.
- 🟡 **P1 — High Priority (Core Feature Completion)**: Placeholder or mock logic that limits feature testing in staging.
- 🟢 **P2 — Pre-Production Polish**: Non-blocking UX refinements or post-staging roadmap enhancements.

---

## 1. UI Feature Placeholders & "Coming Soon" Surfaces

| ID | Domain | Feature / Component | Current Status | Required Staging Action | Priority | Location |
|:---|:---|:---|:---|:---|:---:|:---|
| **UI-01** | Inventory | Inventory Performance Analytics Suite | Displays "Coming Soon" badge with static preview SVG charts. | Bind charts to live Redux/Backend inventory analytics telemetry or conditionally hide behind staging feature flag (`VITE_ENABLE_ANALYTICS_PREVIEW`). | 🟡 P1 | [InventoryChartsDashboard.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/domain/inventory/InventoryChartsDashboard.tsx#L24) |
| **UI-02** | Insights | Cold Chain & Compliance Card | Rendered with "Coming Soon" badge and disabled (`opacity-60`) metrics (`100% SLA`, `FSMA 204 Audit`). | Connect metric card to live `ColdChainLogger` and FSMA audit backend state. | 🟡 P1 | [CrossPlatformOperationsPanel.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/domain/insights/CrossPlatformOperationsPanel.tsx#L193) |
| **UI-03** | Ingestion | External Connectors (`Zapier Webhooks`) | Displays static connector card; configuration popover drawer is missing. | Implement webhook endpoint configuration modal generating unique supplier webhook ingress URLs (`/api/v1/ingestion/zapier`). | 🟡 P1 | [IngestionHubConnectors.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/domain/ingestion/IngestionHubConnectors.tsx) |
| **UI-04** | Ingestion | Google Sheets Ingestion Sync | Triggers modal preview with client-side mock spreadsheet hydration. | Wire Google OAuth service account flow for automated background Google Sheets polling. | 🟡 P1 | [IngestionHubConnectors.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/domain/ingestion/IngestionHubConnectors.tsx) |
| **UI-05** | Ingestion | Python OCR Document Scanner | Calls sidecar endpoint; fallback mock used if sidecar unreachable. | Verify Python OCR sidecar service (`sidecar/main.py`) deployment container equipped with OpenCV/Tesseract. | 🔴 P0 | [main.py](file:///Users/debashisroy/Documents/SpoilerAlert/sidecar/main.py#L375) |

---

## 2. Backend Persistence & Background Services

| ID | Domain | Feature / Endpoint | Current Status | Required Staging Action | Priority | Location |
|:---|:---|:---|:---|:---|:---:|:---|
| **BE-01** | Workflow | Scheduled Background Campaign Executor | Campaigns execute via manual "Run Now". Background scheduler not running continuously. | Ensure `Agenda` worker process (`agendaService.ts`) is started as a persistent background daemon in process supervisor (PM2 / Docker). | 🔴 P0 | [agendaService.ts](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/agendaService.ts) |
| **BE-02** | Email | Google OAuth Token Refresh Daemon | Access tokens expire every 60 mins. | Implement automatic background OAuth refresh token execution prior to automated workflow campaign dispatch. | 🔴 P0 | [oauthMailbox.ts](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/oauthMailbox.ts) |
| **BE-03** | Logistics | Cloud File Storage (S3 / LocalStack) | Multer uploads to local disk directory `uploads/` (`// TODO: Move multer to config`). | Refactored Multer storage engine to stream files to AWS S3 or LocalStack S3 bucket for multi-instance staging. | 🔴 P0 | [api.ts](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/api.ts#L52) |
| **BE-04** | Settlement | Payment Gateway Integration | `POST /api/deals/:dealId/confirm-payment` uses simulated payment trigger. | Integrate sandbox payment gateway webhooks (Stripe / Plaid / Wire receipt upload verification). | 🟡 P1 | [dealController.ts](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/controllers/dealController.ts) |
| **BE-05** | Logistics | Dock Appointment & Cold Chain Persistence | Appointment booking & temp logs managed in local UI component state. | Create MongoDB schemas and API endpoints (`/api/logistics/dock-appointments` & `/api/logistics/cold-chain`). | 🟡 P1 | [DockAppointmentModal.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/logistics/DockAppointmentModal.tsx) |
| **BE-06** | Email | Template Gallery Database Pre-Seeding | Gallery falls back to hardcoded client presets when API returns empty array. | Create database seed script (`npm run seed:templates`) to populate baseline B2B templates in MongoDB upon initial boot. | 🟢 P2 | [TemplateGallery.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/EmailBuilder/TemplateGallery.tsx) |

---

## 3. Security, Authentication & Public Buyer Portal

| ID | Domain | Feature | Current Status | Required Staging Action | Priority | Location |
|:---|:---|:---|:---|:---|:---:|:---|
| **SEC-01** | Auth | Dev Mock Auth Switch | `firebaseAuthService.ts` contains dev mock session fallback. | Ensure `VITE_USE_DEV_MOCK_AUTH=false` is set in staging environment variables so real Firebase/JWT auth is enforced. | 🔴 P0 | [firebaseAuthService.ts](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/services/firebaseAuthService.ts#L48) |
| **SEC-02** | Auth | Buyer Marketplace OTP Dispatch | OTP verification uses Nodemailer/SMTP; falls back to console in dev mode. | Provision staging SendGrid / AWS SES SMTP credentials for real OTP email dispatch to secondary buyers. | 🔴 P0 | [emailService.ts](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/emailService.ts) |
| **SEC-03** | Portal | Standalone Marketplace Ingress | Configured in `deployment/nginx/standalone-marketplace.conf` & backend CORS. | Nginx / Cloudflare domain routing (`marketplace.inventoryflowing.com` -> `/marketplace`) & CORS headers verified. | ✅ Done | [StandaloneMarketplacePortal.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/views/marketplace/StandaloneMarketplacePortal.tsx) |

---

## 4. Staging Release Verification Checklist

### Pre-Deployment Verification
- [ ] **Build Check**: Run `npm run build` in both `frontend` and `backend` to ensure zero TypeScript or bundling errors.
- [ ] **Test Suite Run**: Execute `npm test` in `frontend` (813+ unit/component tests) and `backend` (Jest API suite).
- [ ] **Environment Audit**: Verify all required environment variables in staging `.env`:
  - `JWT_SECRET`
  - `MONGODB_URI`
  - `REDIS_URL`
  - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
  - `AWS_S3_BUCKET` & AWS credentials
  - `SIDE_CAR_URL` (`http://sidecar:8000`)
- [ ] **Database Migration / Seed**: Run `npm run seed:templates` and ensure indexes on `MarketplaceListing`, `Offer`, `Award`, `AutomationRun`.

### Post-Deployment Smoke Tests
1. **Public Marketplace**: Access `https://staging.marketplace.inventoryflowing.com`, browse listings, trigger OTP verification, and place buyer bid.
2. **Ingestion Hub**: Upload sample Danone spreadsheet via CSV upload modal, verify progressive inspection drawer details.
3. **Workflow Studio**: Create stage-gate campaign, test TipTap token insertion, trigger manual run, and inspect in Full-Screen Execution Audit Inspector.
4. **Deal Settlement**: Open tokenized `/deal/:dealId` link, complete simulated payment, draw signature on HTML5 canvas, and verify backend PDF generation (`GET /api/deals/:dealId/pdf`).
5. **Emails Hub**: Connect Google OAuth Mailbox, verify thread synchronization and outbound reply via Google OAuth API.

---

## Summary of Action Items

```
┌─────────────────────────────────────────────────────────┐
│ Staging Release Action Items Breakdown                   │
├──────────────────────────────────┬──────────────────────┤
│ 🔴 P0 — Staging Blockers         │ 6 Tasks              │
│ 🟡 P1 — High Priority Completes  │ 6 Tasks              │
│ 🟢 P2 — Pre-Production Polish    │ 1 Task               │
├──────────────────────────────────┼──────────────────────┤
│ Total Tracked Items              │ 13 Actionable Items  │
└──────────────────────────────────┴──────────────────────┘
```

*This ToDo document should be referenced by the release engineering team prior to staging sign-off.*

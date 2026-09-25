# 10: Deal Settlement — Payment Gateway Sandbox Integration (BE-04)

**What to build:** Replace simulated payment confirmation logic with sandbox payment gateway integrations (Stripe / Plaid / Wire receipt verification) in `dealController.ts`.

**Blocked by:** 02: Auth & Security — Staging Real Auth Enforcement & OTP Email Dispatch (SEC-01, SEC-02)

**Status:** ready-for-agent

- [ ] Implement payment gateway sandbox webhooks in `POST /api/deals/:dealId/confirm-payment`.
- [ ] Support wire receipt upload and instant verification in deal settlement flow.
- [ ] Verify tokenized deal settlement, payment confirmation, signature capture, and PDF generation (`GET /api/deals/:dealId/pdf`).

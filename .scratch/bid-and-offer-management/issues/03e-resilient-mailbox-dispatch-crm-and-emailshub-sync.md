# 03E — Resilient Google OAuth Mailbox Dispatch, Lot CRM Activity & Emails Hub Sync

**What to build:** 
Wire the complete outbound counter negotiation email dispatch and synchronization lifecycle. Compile the TipTap email HTML using Handlebars token replacement and Juice CSS inlining, and dispatch through the supplier's authenticated Google OAuth Mailbox (with SMTP fallback). Automatically create a corresponding Lot CRM Activity entry (`type: 'Email'`) on the lot's timeline and synchronize the message into the Emails Hub thread workspace via `syncEmailToThread`. Implement Resilient Counter Dispatch: if mail transport encounters a failure (missing or expired OAuth tokens, unconfigured SMTP), the counter state transition and database records still commit cleanly, returning delivery telemetry so the UI presents an informative warning toast rather than failing the transaction.

**Blocked by:** 03D — Counter Negotiation Email Preset & Live-Evaluating Token Badge Sync

**Status:** completed

- [x] Backend compiles outbound email HTML using `compileTemplate` (Handlebars substitution + Juice CSS inlining) and resolves all negotiation tokens against the offer and lot context.
- [x] Outbound email is dispatched to the buyer via `SupplierOAuthMailbox` (Google OAuth 2.0) with automatic fallback to verified SMTP or platform default transporter.
- [x] Automatically generates an `Activity` record (`type: 'Email'`) in the Lot CRM timeline with counter terms and link to the offer.
- [x] Automatically synchronizes the sent email into the Emails Hub thread via `syncEmailToThread`, attaching it to the buyer's existing email thread.
- [x] Implements Resilient Counter Dispatch: if email transport fails, the offer update and CRM/thread records still commit, and the API response returns `{ success: true, emailDispatch: { dispatched: false, warning: ... } }`.
- [x] Inspector UI displays a success toast when email delivers, or a warning toast with delivery telemetry details if mail transport was disconnected.
- [x] Includes automated backend integration tests verifying template compilation, mail dispatch, Activity creation, Emails Hub sync, and resilient error recovery.

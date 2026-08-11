## What to build

Implement the Centralized Platform Settings UI section and backend Supplier SMTP configuration engine. Suppliers can manage their credentials and supply custom Nodemailer SMTP server parameters (host, port, SSL/TLS, username, password encrypted at rest, and sender identity) or fall back to system defaults, with a real-time connection verification test button.

## Acceptance criteria

- [ ] Centralized Settings section added to main navigation UI featuring Supplier Login credentials and SMTP Configuration tabs.
- [ ] Backend `SupplierSmtpConfig` model stores SMTP parameters with AES-256 encrypted passwords at rest.
- [ ] API endpoints `GET /api/settings/smtp`, `POST /api/settings/smtp`, and `POST /api/settings/smtp/test` implemented.
- [ ] Test Connection button executes a Nodemailer transport check and returns immediate success/failure feedback in the UI.

## Blocked by

None - can start immediately.

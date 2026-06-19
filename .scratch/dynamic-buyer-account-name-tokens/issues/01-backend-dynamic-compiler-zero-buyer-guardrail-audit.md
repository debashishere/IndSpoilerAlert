# 01 — Backend Dynamic Compiler, Zero-Buyer Guardrail & Recipient Audit Log

**What to build:** Backend email compiler and execution engine support for dynamic per-recipient `{{buyer_name}}` resolution using each recipient's registered company name, strict runtime execution halting (`status: 'error'`) with logged string error reason if 0 target buyers are found, and detailed per-recipient dispatch audit logging.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Compiling email templates with `{{buyer_name}}` dynamically substitutes `buyer.companyName` (or `buyer.name`) for each individual recipient.
- [x] If a workflow stage resolves to 0 buyers at runtime execution, execution halts, transitions status to `'error'`, and records a string error reason in execution audit history.
- [x] Execution logs record individual recipient dispatch objects `{ recipientEmail, buyerId, compiledBuyerName, dispatchedAt, status }`.


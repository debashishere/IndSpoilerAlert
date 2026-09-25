# 03: Workflow & Email Daemons — Persistent Agenda Scheduler & OAuth Refresh Daemon (BE-01, BE-02)

**What to build:** Ensure background campaign execution runs continuously via a persistent Agenda worker process and automatically refresh expiring Google OAuth tokens before dispatching workflow campaigns.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Configure `agendaService.ts` as a persistent background daemon in process supervisor / Docker container.
- [x] Implement automated background token refresh logic in `oauthMailbox.ts` prior to scheduled campaign dispatch.
- [x] Verify automated scheduled campaign execution and token persistence without manual "Run Now" triggers.

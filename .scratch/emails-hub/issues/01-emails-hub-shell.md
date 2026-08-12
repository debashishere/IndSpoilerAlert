# 01 — Rename "Inbox" nav tab to "Emails" + introduce Emails Hub shell

**What to build:** The sidebar nav tab currently labelled "Inbox" should be renamed to "Emails" (with a Mail icon). A new `EmailsHubView` shell replaces the direct `EmailCommunicationsView` render — it hosts two sub-tabs: **Inbox** and **Templates**. The Inbox sub-tab renders the existing supplier–buyer thread view exactly as before. The Templates sub-tab shows a placeholder ("Template Builder coming soon" or similar). `App.tsx` routes `activeTab === 'inbox'` to `EmailsHubView`. The domain glossary (`CONTEXT.md`) is updated with: Emails Hub, Inbox Sub-Tab, Template Gallery, Template Editor, Email Template.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] Nav sidebar label reads "Emails" and icon is `Mail` (not `Inbox`)
- [x] `EmailsHubView` exists as the top-level view for `activeTab === 'inbox'`
- [x] Emails Hub has two visible sub-tabs: **Inbox** | **Templates**
- [x] Inbox sub-tab renders the full existing `EmailCommunicationsView` with no regressions
- [x] Templates sub-tab renders a non-crashing placeholder
- [x] `CONTEXT.md` updated with the 5 new domain terms from the grilling session


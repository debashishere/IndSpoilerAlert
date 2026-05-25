# Enforce OAuth Mailbox Integration for Campaigns

We decided to completely remove manual SMTP configuration and require suppliers to authenticate a corporate email account (e.g., Google Workspace, Microsoft 365) via an OAuth Mailbox Integration (like Nylas) before they can launch liquidation campaigns. 

**Why:** The manual SMTP configuration model is highly technical, brittle, and introduces unnecessary complexity to the onboarding UX and database schema. By enforcing OAuth, we guarantee seamless bid communications and eliminate the need for a complex fallback UI. The Platform Default Mailer (e.g., SendGrid) will be strictly reserved for system-level notifications (like password resets) and will never be used to spoof supplier campaign dispatches.

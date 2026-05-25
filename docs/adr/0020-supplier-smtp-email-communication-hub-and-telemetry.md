# 20. Supplier SMTP Integration, Central Email Communication Hub & Telemetry Architecture

Date: 2026-07-25

## Status
Accepted

## Context
The platform required a robust email strategy allowing Suppliers to connect their custom Nodemailer SMTP servers, send dynamic B2B offer sheets with live bid data, expiration countdown timers, and friction-free "Bid Now" actions, track email open telemetry, and manage threaded buyer communications from a central workspace.

## Decision
1. **Per-Supplier Custom SMTP Integration**: Support per-supplier custom SMTP configuration (Host, Port, SSL/TLS, Credentials encrypted at rest with AES-256) with automatic fallback to platform default Nodemailer SMTP when not configured.
2. **Centralized Platform Settings UI**: Establish a central "Settings" module in the top navigation bar housing Supplier Authentication/Login, custom SMTP parameters, and connection verification testing.
3. **Email Communication Hub**: Implement a dedicated "Email Communications" section featuring a split-pane Thread Inbox (listing-scoped conversation threads, buyer replies, open count badges, live bid updates, and inline reply composer) and Dispatched Email Telemetry logs.
4. **Dynamic Server-Rendered Email Assets**: Deploy server routes (`/api/email-assets/timer.svg` and `/api/email-assets/bid-badge.svg`) generating real-time SVG images for email templates without relying on client-side JavaScript.
5. **Buyer Quick-Bid Token & Modal**: Provide signed single-use JWT links in emails allowing buyers to open a streamlined Quick-Bid modal and submit/update bids instantly without requiring full portal re-authentication.
6. **Email Open Telemetry Pixel**: Embed a 1x1 transparent image endpoint (`/api/tracking/pixel.png`) to log initial open timestamp, last open timestamp, and cumulative open counts per dispatch.

## Consequences
- **Positive**: Provides enterprise suppliers full control over their email domain identity while maintaining automated fallback.
- **Positive**: Enables interactive, real-time bid visibility and friction-free buyer bidding directly from offer sheet emails.
- **Positive**: Consolidates all buyer email negotiations, open tracking metrics, and SMTP configuration into clear, modern UI components.
- **Negative**: Requires maintaining secure key management for encrypted SMTP credentials and handling image loading proxies across diverse email clients.

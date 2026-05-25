# 16. Saved Campaigns Management & React Email 6.0 Builder Engine Architecture

Date: 2026-07-23

## Status
Accepted

## Context
The Workflow module previously combined campaign creation and execution history without a dedicated, central workspace for managing persisted campaign strategies. Furthermore, email template configuration relied on basic text fields rather than a code-first, component-based offer sheet generator capable of handling dynamic inventory data tokens (`{{inventory_table}}`).

## Decision
1. **Saved Campaigns Workspace**: Introduce a default "Saved Campaigns" tab within `WorkflowsView.tsx` featuring a tabular list of all persisted campaign strategies, displaying status (`Draft`, `Active`, `Stopped`, `Completed`), `CreatedAt`, `CreatedBy`, matched inventory scope, and a 3-dots action menu (`Edit`, `Activate`, `Stop`, `Delete`).
2. **React Email 6.0 Builder Engine**: Adopt a code-first, component-based email template authoring engine integrated into the `LiquidationAutomationStudio`. It uses structured block definitions (Header, Text, Inventory Table, CTA, Logistics) and design tokens, supporting real-time desktop/mobile device preview and dynamic context injection.
3. **Persisted Lifecycle API**: Extend `LiquidationAutomation` MongoDB schema and Express controller endpoints (`GET`, `POST`, `PUT`, `PATCH /status`, `DELETE`) to maintain campaign state transitions and email block structures across sessions.

## Consequences
- **Positive**: Sales managers can draft, iterate, and persist campaign strategies without immediately launching them.
- **Positive**: Dynamic B2B offer emails generated from React Email 6.0 design tokens align with modern design standards and ensure high conversion across desktop/mobile email clients.
- **Negative**: Requires maintaining email block rendering logic and template synchronization across frontend state and backend schemas.

# IndSpoiler Alert Documentation Hub

Welcome to the IndSpoiler Alert surplus inventory platform documentation. This directory serves as a central registry for all specifications, architectural design records, and product concepts.

## Core Documentation

- **[Domain Context](CONTEXT.md)**: Glossary of terms (Surplus, Yield Optimization, Ingestion Engine, RSL, etc.) and core definitions.
- **[Product Concepts & Features](concepts.md)**: Implementation designs for features like the Ingestion Normalizer, Dynamic Discount Engine, and Smart Buyer Matching.
- **[Extending the Platform](extending.md)**: Diagrams and workflow steps for Ingestion, Sales, Donations, and Recycling.
- **[Product Requirements Document (PRD)](PRD.md)**: Full PRD specifying the system goals, workflows, and tracer bullet phases.


## Architectural Decision Records (ADRs)

All major architectural designs are documented under [docs/adr/](adr/):

- **[ADR 0001: Node/Express & Python FastAPI Sidecar](adr/0001-node-express-python-sidecar.md)**: Choosing Node.js for high-concurrency API orchestration and Python for heavy mathematical optimization/data parsing.
- **[ADR 0002: Hybrid Data Ingestion Pipeline](adr/0002-hybrid-data-ingestion-pipeline.md)**: Details on the file ingestion and fuzzy/AI column mapping engine.
- **[ADR 0003: MongoDB for Data Storage](adr/0003-mongodb-for-data-storage.md)**: Moving to a flexible document store to support arbitrary schema variations from supplier spreadsheets.
- **[ADR 0004: Simulation Framework for Bids & Donations](adr/0004-simulation-framework-bids-donations.md)**: Standardizing simulated buyer actions, bids negotiation chains, and food bank dispatch.
- **[ADR 0005: Distressed Inventory Orchestration Domain Model](adr/0005-distressed-inventory-orchestration-domain-model.md)**: Domain models mapping ProductMaster, InventoryLot, DistributionCenter, and the yield optimizations.
- **[ADR 0006: Buyer Email Identification & Auto-Registration](adr/0006-buyer-email-identification-auto-registration.md)**: Implementing frictionless bidding where new buyers are auto-registered upon placing their first bid.
- **[ADR 0024: Deferring Dynamic Donation UI Section](adr/0024-defer-dynamic-donation-section-in-workflow-builder.md)**: Deferring and hiding Section 5 (Dynamic Donation & Multi-Entity Diversion) in the Workflow Builder UI for base release.
- **[ADR 0025: Deferring Distressed Analytics and Freight Logistics Sections](adr/0025-defer-distressed-analytics-and-freight-logistics-for-base-release.md)**: Deferring Distressed Analytics and Freight Logistics UI navigation sections for base version release via feature flags.
- **[ADR 0026: Separation of Buyer Marketplace and Inventory Platform](adr/0026-separation-of-buyer-marketplace-and-inventory-platform.md)**: Decoupling public-facing buyer marketplace portal from internal supplier inventory platform.
- **[ADR 0027: Rename Product to InventoryFlowing](adr/0027-rename-product-to-inventoryflowing.md)**: Product branding update for InventoryFlowing.
- **[ADR 0028: Relocate Inventory & Buyer Data Lists to Ingestion Pipeline & Transition Inventory Tab to Charts](adr/0028-relocate-inventory-and-buyer-lists-to-ingestion-pipeline-and-transition-inventory-tab-to-charts.md)**: Moving raw inventory and buyer data lists to Ingestion Pipeline and replacing Inventory tab table with visual placeholder charts marked Coming Soon.
- **[ADR 0029: Unified TipTap Email Builder Engine & Progressive Stepper](adr/0029-unified-tiptap-email-builder-and-progressive-stepper.md)**: Unified rich WYSIWYG email builder engine, legacy client XHTML transformer pipeline, and 3-step progressive stepper accordion.
- **[ADR 0030: Light Theme Support & Top-Right Moon Icon Theme Switcher System](adr/0030-light-theme-support-and-top-right-moon-icon-theme-switcher.md)**: High-contrast light mode design system, centralized React theme context with localStorage persistence, and floating top-right moon/sun icon theme switcher.
- **[ADR 0031: Premium ColorHunt Palette Theme Integration](adr/0031-colorhunt-palette-e3f2fd-90caf9-2196f3-0d47a1-theme-integration.md)**: Standardizing UI visual identity to ColorHunt palette (#E3F2FD, #90CAF9, #2196F3, #0D47A1) across light/dark design tokens and semantic surfaces.




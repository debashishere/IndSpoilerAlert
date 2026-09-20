IndSpoiler Alert Enterprise Design System Specification
This comprehensive design system reference documents the visual identity, tokens, component patterns, and atomic elements extracted from the IndSpoiler Alert (Enterprise Liquidation OS) application to ensure complete coherence when building new sections or workflows.

1. Color Architecture & Palette Tokens
Primary Brand & Actions
Brand Navy / Primary Blue: #0f4cc9 (Default CTA, active navigation pill, brand mark)
Brand Hover: #1a42a0 | Brand Active: #103b8f
Brand Soft / Muted Blue: #eef4ff / #e0ecfe (Icon container fills, badge backgrounds)
Brand Border / Ring: rgba(15, 76, 201, 0.15)
Semantic & Status Tokens
Success / Verified / Compliant:
Background: #ecfdf5
Text / Border: #047857 / #059669
Solid Pill Accent: #10b981
Warning / Settled / Counter-Action:
Background: #fffbeb / #fef3c7
Text / Border: #b45309 / #d97706
Dot: #f59e0b
Critical / Immediate Risk (<14d RSL / Expired):
Background: #fef2f2
Text / Border: #b91c1c
Solid Action: #dc2626 / #ef4444
Information / Telemetry / Batch:
Background: #f0f9ff
Text: #0369a1
Neutrals & Surfaces
Canvas Base Background: #f8fafc with subtle linear/mesh grid lines (rgba(148, 163, 184, 0.12))
Card & Modal Surface: #ffffff (Pure white)
Sub-card / Input Surface: #f8fafc / #f1f5f9
Border Default: #e2e8f0 (Borders, divider rules)
Border Subtle: #f1f5f9
Border Focus: #2563eb with box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)
Typography Colors
Headings & Primary Text: #0f172a (Slate 900)
Secondary / Subtitles: #475569 (Slate 600)
Muted / Technical Labels: #64748b (Slate 500)
Micro Metadata & Disabled: #94a3b8 (Slate 400)
2. Typography & Hierarchy
Hierarchy	Font Family	Size / Leading	Weight	Tracking & Case	Usage
Page Title (H1)	Editorial Serif (Newsreader / Merriweather / Playfair)	28px – 32px / 1.2	Bold (700) / Semi-bold (600)	Normal (-0.01em)	Primary page headers ("Surplus Ingestion Pipeline", "Pure Leaf Premium Surplus Item #3")
Section Title (H2)	Sans-Serif (Geist / Inter)	18px – 20px / 1.3	Semi-bold (600)	Snug (-0.01em)	Card and modular cluster headings ("Ingestion Hub & Connectors", "Buyer Network")
Sub-Header / Card H3	Sans-Serif	15px – 16px / 1.4	Semi-bold (600)	Normal	Item card headers, connector card titles ("Zapier Webhooks", "Unit Offer")
Body (Regular)	Sans-Serif	13px – 14px / 1.5	Regular (400) / Medium (500)	Normal	Descriptions, paragraph details, table content, tooltips
Monospace / Metric Value	Monospace (JetBrains Mono / IBM Plex Mono)	20px – 24px / 1.1	Bold (700)	Tight (-0.02em)	Metric indicators ($1,842,900, 18 Lots, 94.8%, $15.00/case)
Micro Monospace / SKU	Monospace	11px – 12px / 1.3	Medium (500)	Uppercase (+0.04em)	Reference IDs, SKUs (LOT-2026-003, ID: BYR-ALB-001, timestamps)
Overline / Field Label	Sans-Serif	10px – 11px / 1.2	Semi-bold (600)	Uppercase (+0.06em)	Table column headers, field metadata tags ("ACTIVE PORTFOLIO VALUE", "BUYER TIER")
3. Layout, Elevation & Spacing Grid
Base Spacing Unit: 4px (4, 8, 12, 16, 20, 24, 32, 40px)
Card Corner Radius:
Outer Containers & KPI Cards: rounded-2xl (16px) or rounded-xl (12px)
Buttons & Dropdowns: rounded-lg (8px) or rounded-full (9999px for navigation pills & status badges)
Modals & Sheets: rounded-3xl (24px)
Elevation / Shadows:
Cards: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)
Elevated Popovers / Drawers: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)
Active Pills: Inner highlight inset 0 1px 0 rgba(255, 255, 255, 0.15)
4. UI Component Patterns
Global Header & Navigation
Floating Island Shell: White rounded container with fine border (border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs).
Logo Lockup: Solid blue square icon badge (rounded-xl bg-[#0f4cc9]) with white lightning bolt glyph + Bold Sans brand wordmark with uppercase subtitle (ENTERPRISE LIQUIDATION OS).
Segmented Nav Pill Bar: Embedded oval pill (bg-slate-100/80 p-1 rounded-full). Active tab gets solid blue (bg-[#0f4cc9] text-white font-medium shadow-xs px-4 py-1.5 rounded-full), inactive tabs get subtle hover states (text-slate-600 hover:text-slate-900 px-3.5 py-1.5).
User Agent Capsule: Profile avatar pill with initials (DH / DR), user handle, and verified agent status indicator dot (bg-emerald-500 w-2 h-2 rounded-full).
Action Buttons
Primary CTA: Solid blue bg-[#0f4cc9] hover:bg-[#1a42a0] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-xs.
Secondary / Outline: White surface bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg.
Destructive / Urgent Action: Solid crimson bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-3 py-1.5 rounded-md.
Ghost Action / Expand: text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100.
Form Controls & Inputs
Search Bar: Input with nested magnifying glass icon, bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600.
Select Dropdown: Native / Custom select with right-aligned chevron icon, muted uppercase label above the input.
Toggle / Segmented Control: 3-way or 2-way tab pill with pill slider highlighting active state with numerical count badges ([ Inventory Pipeline: 100 ] [ Sales Pipeline: 92 ] [ Buyer Pipeline: 50 ]).
Badges, Pills & Indicators
Verified Badge: bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.
Tier Pill: bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full.
Critical Expiry Pill: bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider.
Sync / Telemetry Indicator: Pulsing or solid indicator dot (w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5).
Data Tables & Inspection Rows
Header Row: Uppercase tracking-wider slate metadata labels (text-[10px] font-semibold tracking-wider text-slate-500 py-3 px-4 border-b border-slate-200).
Data Rows: Alternating hover highlight (hover:bg-slate-50/75 transition-colors border-b border-slate-100).
Expandable Rows: Dedicated chevron column for sliding open inline inspectors (bids, audit logs, COA certificates).
How to Use This in New Sections
Pass the registered design system [Design_System] when generating or editing any new section to automatically inherit these colors, fonts, token mappings, and layout aesthetics.
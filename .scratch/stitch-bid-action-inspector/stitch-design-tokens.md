# Stitch Design Tokens & Hierarchy Reference

- **Project URL**: `https://stitch.withgoogle.com/projects/8026610550472801794`
- **Screen ID**: `39f8fd77c0f24f98953898f4756f30b0`
- **Title**: `Bid Action Inspector - Communication & Data Hierarchy`
- **Reference HTML**: [stitch-design-reference.html](./stitch-design-reference.html)

## Visual Architecture & Tokens

### Palette
- **Canvas / Outer Backdrop**: `bg-slate-100/90` with ambient backdrop glass cards.
- **Modal Container**: `max-w-[1100px] bg-white rounded-2xl shadow-xl border border-slate-200`
- **Header**:
  - Lot # Tag: `font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200`
  - SKU Tag: `font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200`
  - Status Badge: `bg-amber-50 text-amber-800 border border-amber-200` (or emerald for accepted, rose for declined)
  - Title: `text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight`
- **Stat Cards (4-column grid)**:
  - Buyer Organization: Verified badge, company name, email.
  - Unit Offer: Emerald `$XX.XX /case`, Settled badge if negotiated, initial bid reference.
  - Volume Requested: Cases count, `% Lot` badge, full clearing status.
  - Gross Recovery: Bold total dollar amount, net clearing after 3% fee.
- **Navigation Tabs**:
  - `Accept Offer`: Emerald theme (`border-emerald-500 text-emerald-600 bg-emerald-50/40`)
  - `Negotiate`: Amber theme (`border-amber-500 text-amber-600 bg-amber-50/40`)
  - `Decline`: Rose theme (`border-rose-500 text-rose-600 bg-rose-50/40`)
  - `Timeline`: Blue theme (`border-blue-600 text-blue-600 bg-blue-50/40`)
- **Communication Section**:
  - Channel selector pills: `Email`, `In-App`, `SMS`
  - Accordion header: word count, dynamic token count pills
  - TipTap rich text body with token chips
- **Preview Email Modal**:
  - Clean client-facing email preview with all dynamic tokens substituted with live values.

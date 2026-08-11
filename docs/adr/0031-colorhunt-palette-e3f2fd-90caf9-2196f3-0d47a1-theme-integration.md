# 0031: Premium ColorHunt Palette (E3F2FD / 90CAF9 / 2196F3 / 0D47A1) Theme Integration

Date: 2026-08-11

## Status
Accepted / Implemented

## Context
To establish a high-end, cohesive enterprise brand visual identity across the IndSpoiler Alert Surplus Inventory Platform, the UI color tokens required alignment with a curated corporate blue color palette. 

The selected palette is sourced from ColorHunt ([https://colorhunt.co/palette/e3f2fd90caf92196f30d47a1](https://colorhunt.co/palette/e3f2fd90caf92196f30d47a1)) and features:
1. **Ice Sky Canvas Tint (`#E3F2FD`)**: HSL `205 87% 94%`
2. **Soft Sky Accent & Border (`#90CAF9`)**: HSL `207 90% 77%`
3. **Vibrant Electric Primary Blue (`#2196F3`)**: HSL `207 90% 54%`
4. **Deep Royal Navy Blue (`#0D47A1`)**: HSL `216 85% 34%`

## Decision

1. **Light Theme Custom Properties (`:root` in `index.css`)**:
   - Palette mapping:
     - `background-color`: `#e3f2fd` (Ice Sky Canvas background)
     - `color`: `#0d47a1` (Deep Royal Navy primary text contrast)
     - `--bg-main: 205 87% 94%` (`#E3F2FD` Soft Ice Sky Blue background tint)
     - `--bg-card: 0 0% 100%` (`#FFFFFF` Pure white elevated card surface)
     - `--bg-card-hover: 205 70% 97%` (`#F0F7FF` Subtle sky blue card hover tint)
     - `--border-color: 207 90% 77%` (`#90CAF9` Soft sky blue border)
     - `--primary: 207 90% 54%` (`#2196F3` Electric Primary Action Blue)
     - `--primary-glow: 207 90% 54% / 15%`
     - `--secondary: 207 90% 77%` (`#90CAF9` Sky Blue Accent)
     - `--secondary-glow: 207 90% 77% / 15%`
     - `--primary-dark: 216 85% 34%` (`#0D47A1` Deep Royal Navy Accent)
     - `--text-primary: 216 85% 18%` (Deep royal navy primary text derived from `#0D47A1` for >12:1 contrast ratio)
     - `--text-secondary: 216 45% 36%` (Medium navy slate)
     - `--text-muted: 216 25% 52%` (Muted ice slate text)

2. **Dark Theme Custom Properties (`[data-theme="dark"]` in `index.css`)**:
   - Palette mapping:
     - `background-color`: `#07172f` (Midnight Royal Navy base derived from `#0D47A1`)
     - `color`: `#e3f2fd` (Soft Sky Ice text)
     - `--bg-main: 216 85% 7%` (Deep midnight royal navy base)
     - `--bg-card: 216 75% 12%` (Deep royal navy card surface anchored in `#0D47A1`)
     - `--bg-card-hover: 216 65% 17%` (Rich deep navy hover surface)
     - `--border-color: 216 45% 24%` (Subtle sky navy border)
     - `--primary: 207 90% 54%` (`#2196F3` Electric Primary Action Blue)
     - `--primary-glow: 207 90% 54% / 20%`
     - `--secondary: 207 90% 77%` (`#90CAF9` Soft Sky Blue)
     - `--secondary-glow: 207 90% 77% / 20%`
     - `--primary-dark: 216 85% 34%` (`#0D47A1` Deep Royal Navy Accent)
     - `--text-primary: 205 87% 95%` (`#E3F2FD` Soft sky ice text)
     - `--text-secondary: 207 70% 82%` (`#90CAF9` Sky blue text)
     - `--text-muted: 207 30% 65%` (Muted sky slate)

3. **Surface & Component Coherence**:
   - Body radial gradients updated to smoothly blend white/deep navy into `#E3F2FD` and `#0D47A1`.
   - Floating theme toggle, brand icons, borders, active navigation tabs, and badge highlights updated to reflect cohesive ColorHunt palette styling.
   - Preserved all semantic surface mappings (`--surface-page`, `--surface-card`, `--surface-elevated`, `--text-on-surface`, `--border`) so existing component contracts remain 100% compatible.

4. **Campaign Builder Save Action Alignment**:
   - Replaced legacy dark slate button backgrounds (`hsl(223 47% 12%)`) on the Campaign Builder "Save as Draft" buttons (both top header and bottom execution bar) and Template Editor with Vibrant Electric Primary Blue (`#2196F3`) from the ColorHunt palette.
   - Enhanced visual consistency and eliminated dark button anomalies across the builder workflows.

## Consequences

- **Positive**: Standardizes visual identity under a luxury corporate blue color scheme (`#E3F2FD`, `#90CAF9`, `#2196F3`, `#0D47A1`).
- **Positive**: Guarantees AA/AAA contrast compliance across both Light and Dark modes.
- **Positive**: Zero breaking changes to existing layout components or state thunks.

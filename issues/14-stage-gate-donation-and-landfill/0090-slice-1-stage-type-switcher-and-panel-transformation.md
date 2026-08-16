# 0090 — Slice 1: Stage Type Switcher & Polymorphic Stage Panel Transformation

**What to build:**
In the Liquidation Automation Studio under Section 3 (*"3. Stage-Gate Escalation Timeline"*), replace the static token badge on each stage card header with an interactive segmented pill switcher (`[ 🏷️ Liquidation | 🎁 Donate | 🗑️ Landfill ]`). Toggling the switcher updates the stage's `stageType` and dynamically transforms the expanded configuration panel and collapsed summary chips:
- For **Liquidation**: Displays Pricing Rules (Discount % / Floor Price / AI Yield) and Response Window.
- For **Donation**: Hides pricing controls; displays **Offer Expiration Window** (Days / Hours / Minutes).
- For **Landfill**: Hides pricing controls; displays **Disposal & Removal Deadline** calendar date input (`disposalDeadline: string`).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Add `stageType?: 'liquidation' | 'donation' | 'landfill'` and `disposalDeadline?: string` to `Stage` and `StageGate` TypeScript interfaces across frontend and backend.
- [x] Replace the static `buyer-name-token-binding-indicator` badge in the stage card header with an interactive `[ 🏷️ Liquidation | 🎁 Donate | 🗑️ Landfill ]` segmented pill switcher with distinct active styling.
- [x] Dynamically transform the expanded stage panel based on `stage.stageType`:
  - When `'donation'`, replace "Pricing & Timing" with an "Offer Expiration Window" timing block with Days/Hours/Mins unit selector.
  - When `'landfill'`, replace "Pricing & Timing" with a "Disposal & Removal Deadline" block with a Date input and disposal instructions.
  - When `'liquidation'`, render standard Pricing & Timing rules.
- [x] Update collapsed summary chips: show "Donation Transfer (Complimentary)" or "Disposal Deadline: {date}" in place of discount chips when appropriate.
- [x] Unit tests verifying stage type toggling, UI panel transformations, and state updates.

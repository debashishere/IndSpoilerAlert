# 0093 — Slice 4: Stage-Type Validation Guardrails & Persistence Verification

**What to build:**
Implement type-aware validation routines across the Liquidation Automation Studio prior to campaign creation or saving. Ensure each stage conforms to its operational guardrails:
- **Liquidation**: Requires $\ge 1$ targeted buyer, valid discount value (if fixed/floor), and response window $> 0$.
- **Donation**: Requires $\ge 1$ targeted non-profit/charity partner, $\ge 1$ allocated inventory lot, and response window $> 0$ (bypassing commercial discount validation).
- **Landfill**: Requires $\ge 1$ disposal contact/partner, $\ge 1$ allocated inventory lot, and a valid future disposal deadline date.
Include end-to-end integration and UI tests covering full workflow lifecycles (creation, editing, stage toggles, saving, and execution).

**Blocked by:** `0092 — Slice 3: Context-Aware Stage Email Presets & Dynamic Token Interpolation`

**Status:** done

- [x] Update `validateCampaignForLaunch` / `handleSaveCampaign` logic in `LiquidationAutomationStudio.tsx` to apply type-specific validation rules per stage.
- [x] Display clear, user-friendly error banners when validation fails (e.g. "Donation Stage 3 requires at least 1 targeted partner and 1 allocated inventory lot").
- [x] Ensure Redux workflow slices and MongoDB `LiquidationAutomation` models properly store, validate, and retrieve multi-stage polymorphic workflows.
- [x] Write end-to-end test suite in `frontend/src/test/` covering polymorphic stage-gate timeline execution, lot allocation splits, and validation error states.

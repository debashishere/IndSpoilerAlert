# 03 — Workflow Studio Centralized Template Attachment & Live Device Viewport

**What to build:** Decouples email editing from the Workflow Studio (`LiquidationAutomationStudio.tsx`). Replaces inline HTML builders with an **Attach Centralized Email Template** dropdown selector linked to central templates by `templateId`, accompanied by a real-time Desktop/Mobile device viewport preview rendering matched workflow inventory lots.

**Blocked by:** 02 — Centralized Email Template API & System Seed Defaults

**Status:** ready-for-agent

- [ ] Inline HTML email builder is removed from Section 4 of `LiquidationAutomationStudio.tsx`.
- [ ] Section 4 features an `Attach Centralized Email Template` selector dropdown listing system defaults and supplier custom central templates.
- [ ] Section 4 renders a `LiveDevicePreview` component with Desktop/Mobile viewport toggles that dynamically populates the attached template using current workflow matched inventory lots.

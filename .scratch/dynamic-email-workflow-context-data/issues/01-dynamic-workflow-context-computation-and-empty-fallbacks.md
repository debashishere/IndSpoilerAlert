# 01 — Dynamic Workflow Context Computation & Empty Fallback Placeholders

**What to build:** Dynamically compute email context data from actual workflow selections (matched lots, target buyers, stage discount, duration) instead of defaulting to static hardcoded strings. When 0 matched lots or 0 buyers are active, display explicit placeholder indicators (`[No Inventory Selected]`, `[No Buyer Selected]`) in both the Summary Context Cards and Live Device Preview.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Email Builder dynamic context defaults to explicit empty placeholders when 0 matched lots or 0 target buyers are active in the workflow.
- [x] When inventory/buyers/stages are present in the workflow, dynamic context auto-fills from live selections instead of hardcoded sample strings.
- [x] Dynamic context updates properly when switching between workflow templates.
- [x] Automated tests verify initial placeholder display and live workflow data resolution.

# 02 — Progressive 3-Step Email Template Stepper

**What to build:** Redesign Section 4 of the Workflow Studio into a progressive 3-step accordion stepper with strict step unlocking: Step 1 (Template Select) -> Step 2 (Subject Line) -> Step 3 (Dynamic Context & Live Device Renderer). Hide the manual "Insert Dynamic Merge Tags" chips section since buyer and inventory tokens are auto-bound from upstream stages.

**Blocked by:** 01 — Full-Width Studio Canvas & Bottom Live Impact Banner

**Status:** completed

- [x] Implement Step 1 (Choose Email Template) with dropdown picker and `[Next: Configure Subject Line →]` button.
- [x] Implement Step 2 (Email Subject Line) with subject text input, internal auto-managed tags indicator, and `[Next: Preview & Overrides →]` button.
- [x] Implement Step 3 (Dynamic Data Context & Live Device Renderer) with override fields and responsive Desktop & Mobile `LiveDevicePreview`.
- [x] Provide quick-nav header step pills with `✓ Completed` green badges to allow jumping back to edit completed steps.
- [x] Hide manual "Insert Dynamic Merge Tags" chips block.

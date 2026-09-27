# 0126: Slice 1 - Minimalist InsightCard with Controlled Exclusive Info Disclosure

## Parent
[0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/21-insight-telemetry-migration-and-exclusive-disclosure/0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md)

## What to build
Refactor `InsightCard` to remove decorative category icons from the right side of the card, retaining exclusively the interactive `"i"` information button adjacent to the title. Upgrade the informational disclosure popover to support controlled exclusivity (`isOpen`, `onToggle`, outside-click dismissal) so parent dashboards can coordinate single-active card expansion across metric groups, while maintaining backward-compatible self-contained state fallback when uncontrolled.

## Acceptance criteria
- [x] All decorative right-hand icon wrappers (`w-10 h-10` icon containers) are removed from `InsightCard`, producing a clean, modern minimalist metric display.
- [x] The interactive `"i"` (Info) button is preserved next to the title and cleanly opens/closes the info description popover.
- [x] `InsightCard` accepts optional `isExpanded` and `onToggle` props for parent-driven single-active disclosure, with backward-compatible local state fallback when omitted.
- [x] An outside click listener dismisses the active info popover when the user clicks elsewhere on the page, and the `"X"` close button dismisses it directly.
- [x] Comprehensive unit tests verify icon elimination, controlled toggle coordination, and outside-click dismissal.

## Blocked by
- None (can start immediately).

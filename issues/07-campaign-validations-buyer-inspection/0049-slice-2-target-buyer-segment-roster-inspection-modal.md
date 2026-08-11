# Issue 0049: Target Buyer Segment Roster Inspection Modal

## What to build

Provide an Eye button beside the Target Buyer Segment selector in stage audience cards within the Liquidation Automation Studio. Clicking the Eye button opens an interactive Buyer Segment Roster Inspection modal that displays all registered buyers matching the selected segment tag (e.g., Tier 1 - Primary Retailers), including their Name/Company, Email Address, and Registration Date (`createDate`), with real-time text searching.

## Acceptance criteria

- [ ] Eye icon button is rendered adjacent to the Target Buyer Segment `<select>` element in stage audience config cards.
- [ ] Clicking the Eye button opens a modal listing all buyers matching that target segment.
- [ ] The modal table displays columns for Buyer Name/Company, Email Address, and Registration Date (`createDate`).
- [ ] An inline search input filters segment roster buyers by name or email.
- [ ] Automated UI tests verify opening, searching, and inspecting segment roster data.

## Blocked by

None - can start immediately

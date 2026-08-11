# Issue #63: Slice 4 - Mobile & Tablet Responsive Compact View & Touch Optimization

## What to build

Adapt execution cards across both Active Evaluations and Run History for optimal rendering on Mobile and Tablet viewports (`@media (max-width: 768px)`). Ensure compact collapsed card headers, vertical stage timeline steps, touch-friendly action buttons, and responsive metric stacks.

## Acceptance criteria

- [ ] On viewports `< 768px`, execution cards render in a compact collapsed mode by default showing a clean 1-line summary header.
- [ ] 4-card metric grids dynamically reformat into responsive 2x2 or 1-column stacks without horizontal clipping.
- [ ] Horizontal stage steppers adapt into a vertical timeline on small screens.
- [ ] Action buttons (`View Bids`, `Details`, `Force Expire`) expand to touch-friendly full-width targets with adequate tap spacing (`min-height: 44px`).
- [ ] Verified across mobile, tablet, and desktop viewports with zero horizontal overflow.

## Blocked by

- Issue #62

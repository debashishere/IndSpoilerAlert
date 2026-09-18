# 05: Dedicated Timeline Audit Tab with Category Filters, Search & Event Stream

**What to build:** 
The dedicated 4th tab ("Timeline") specified in the Stitch design. From the user's perspective, this provides a comprehensive, centralized audit log and activity stream of the entire offer lifecycle:
1. **Filter & Search Controls**: Top filter dropdown allowing filtering by event category (`All Events`, `Negotiations`, `System Notes`, `Status Transitions`) and a real-time search input matching event titles, descriptions, and actors.
2. **Chronological Activity Feed**: Visual vertical timeline with node dots colored by event type (amber for negotiations, emerald for status/awards, blue for system notes) and cards displaying event title, timestamps, actors, transaction reference IDs, and formatted descriptions.
3. **Multi-Source Event Aggregation**: Integrates lot publication details, automated escrow pre-authorization checks, buyer bids, supplier counter proposals, and settlement awards into one coherent audit trail.

**Blocked by:** 02: Accept Offer Work Surface with DC Logistics & Multi-Channel Communication Card, 03: Negotiate Work Surface with Live Counter Parameters, In-Situ Continuity & Delta Metrics, 04: Decline Offer Work Surface with Mandatory Codes, Audit Memo & Rejection Dispatch

**Status:** ready-for-agent

- [ ] Navigation bar displays dedicated "Timeline" tab with history icon and counter badge.
- [ ] Filter dropdown filters timeline feed by `all`, `negotiations`, `system`, and `status`.
- [ ] Search input performs live case-insensitive filtering on event text and actor names.
- [ ] Vertical chronological activity feed displays timeline items with category badges, actors, and reference IDs.
- [ ] Events accurately reflect lot listing, buyer bids, supplier counter terms, and settlement state.

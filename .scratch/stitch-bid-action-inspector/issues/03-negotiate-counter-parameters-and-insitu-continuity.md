# 03: Negotiate Work Surface with Live Counter Parameters, In-Situ Continuity & Delta Metrics

**What to build:** 
The Stitch Negotiate tab work surface allowing suppliers to formulate and counter-propose revised commercial terms without abrupt modal dismissal:
1. **Counter-Offer Parameters Card**: Real-time counter unit price input with live margin uplift indicator (`+X.X% Uplift`), counter volume allocation input, 48-hour holding window badge, and reserve floor validation.
2. **In-Situ Negotiation Continuity**: Embedded chronological message stream displaying prior buyer bids and supplier proposals with timestamps, actor tags, and one-click "Accept This Bid" direct conversion.
3. **Multi-Channel Communication Card**: Channel selector pills (`Email`, `In-App`, `SMS`), TipTap counter message editor with live-evaluating token sync.
4. **Dynamic Summary & Dispatch Bar**: Real-time counter value calculation, delta gross recovery comparison against buyer bid, and Dispatch Counter-Offer trigger.

**Blocked by:** 01: Stitch Header, 4-Column Commercial Stat Cards & Test Baseline

**Status:** completed

- [x] Counter parameters card renders counter price, volume, holding window, and reserve floor match.
- [x] Live margin uplift pill recalculates instantly upon modifying price or volume.
- [x] Live delta indicators show unit price variance and gross recovery variance against the baseline offer.
- [x] In-situ proposal thread displays message history and allows one-click acceptance of latest buyer proposal.
- [x] TipTap counter preset hydrates dynamic tokens (`counter_price`, `counter_quantity`, `buyer_name`) without losing custom text.
- [x] Counter dispatch retains modal session, updates status badge to Countered, appends proposal to thread, and emits toast feedback.

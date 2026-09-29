# 01: Backend Server-Side Entity Aggregation & Cache Pipeline

**What to build:** An enhanced analytics aggregation pipeline in `GET /api/analytics/sales` that calculates real closeout performance rankings for top buyers and top distribution centers, complete with embedded child transaction histories (dates, lot numbers, SKUs, case quantities, unit pricing, realized values, and recovery rates) scoped to active timeframe, category, and facility filters, with Redis caching and zero synthetic mock fallbacks.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] MongoDB aggregation pipeline groups sales by buyer, calculating total spent, total case volume, overall revenue share percentage, and an array of recent itemized transactions.
- [x] MongoDB aggregation pipeline groups sales by warehouse/DC, calculating cleared revenue, cases cleared, COGS recovery percentage, and an array of recent itemized transactions.
- [x] Server-side aggregation respects active `timeframe` (`7d`, `30d`, `90d`, `ytd`), `category`, `warehouse`, and `supplierId` query parameters.
- [x] Computed leaderboards and transaction arrays are cached in Redis under the sales analytics cache key with 5-minute TTL.
- [x] Authentic zero-state arrays (`[]`) are returned when no sales match filters, without synthetic demo fallbacks.
- [x] Backend unit/integration tests verify accurate calculations, filter adherence, and cache hydration.


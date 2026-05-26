# 0027: Product Rebranding to InventoryFlowing

## Context
The platform was initially titled "Spoiler Alert Inventory Platform". However, the brand name "Spoiler Alert" is a registered entity name in the food waste and inventory liquidation industry. 

To establish an independent, distinct product identity focused on seamless automated liquidation of short-dated CPG goods, dynamic yield optimization, and frictionless buyer marketplaces, the product requires a complete rename.

## Decision
1. **New Primary Product Name**: **InventoryFlowing** (with short SaaS variant **InventoryFlow** where space is constrained).
2. **Domain & Brand Identity Updates**:
   - Update canonical domain context in `docs/CONTEXT.md` to reference **InventoryFlowing Platform**.
   - Update application headers, UI sidebar branding (`Sidebar.tsx`), tour components (`InteractiveTour.tsx`), and automated email dispatch footers to display **InventoryFlowing**.
   - Target domain routing references shift from `spoileralert.com` to `inventoryflowing.com` (`app.inventoryflowing.com` for supplier platform, `marketplace.inventoryflowing.com` for buyer marketplace).

## Consequences
- **Brand Independence**: Eliminates trademark collision risks with third-party entities.
- **Product Positioning**: Better emphasizes the fluid, continuous movement ("flowing") of near-expiration surplus stock through automated stage-gate workflows into secondary markets.

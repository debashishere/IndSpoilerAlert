import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { TelemetryMetrics } from '../types/ingestion.types';

export const useIngestionTelemetry = (): {
  metrics: TelemetryMetrics;
  counts: {
    inventory: number;
    sales: number;
    buyers: number;
  };
} => {
  const inventoryList = useAppSelector((state) => state.inventory.inventoryList);
  const salesRecords = useAppSelector((state) => state.ingestion.salesRecords);
  const buyers = useAppSelector((state) => state.core.buyers);

  const metrics = useMemo<TelemetryMetrics>(() => {
    // 1. Portfolio Value
    let portfolioValue = '$0';
    const portfolioSubtext = INGESTION_CONSTANTS.FALLBACK_TELEMETRY.PORTFOLIO_SUBTEXT;

    if (inventoryList && inventoryList.length > 0) {
      const totalVal = inventoryList.reduce((sum, lot) => {
        const qty = Number(lot.quantityCases ?? lot.availableQty ?? 0);
        const unitPrice = Number(lot.standardSellPrice ?? lot.originalPrice ?? lot.price ?? lot.costPerCase ?? 0);
        return sum + (qty * unitPrice);
      }, 0);

      portfolioValue = `$${Math.round(totalVal).toLocaleString()}`;
    }

    // 2. Critical RSL (<14 Days)
    let criticalRsl = '0 Lots';
    const criticalRslSubtext = INGESTION_CONSTANTS.FALLBACK_TELEMETRY.CRITICAL_RSL_SUBTEXT;

    if (inventoryList && inventoryList.length > 0) {
      const now = new Date();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const criticalCount = inventoryList.filter((lot) => {
        if (lot.status === 'critical' || lot.status === 'expired') return true;
        if (lot.expirationDate) {
          const expTime = new Date(lot.expirationDate).getTime();
          if (!isNaN(expTime)) {
            return expTime - now.getTime() <= fourteenDaysMs;
          }
        }
        return false;
      }).length;

      criticalRsl = `${criticalCount} ${criticalCount === 1 ? 'Lot' : 'Lots'}`;
    }

    // 3. Liquidation Velocity
    let liquidationVelocity = '0%';
    const liquidationVelocitySubtext = INGESTION_CONSTANTS.FALLBACK_TELEMETRY.LIQUIDATION_VELOCITY_SUBTEXT;

    if (salesRecords && salesRecords.length > 0 && inventoryList && inventoryList.length > 0) {
      const soldUnits = salesRecords.reduce((acc, rec) => acc + (Number(rec.quantity) || 0), 0);
      const inventoryUnits = inventoryList.reduce((acc, lot) => acc + (Number(lot.quantityCases ?? lot.availableQty) || 0), 0);
      const totalUnits = soldUnits + inventoryUnits;
      if (totalUnits > 0 && soldUnits > 0) {
        liquidationVelocity = `${((soldUnits / totalUnits) * 100).toFixed(1)}%`;
      }
    }

    // 4. Matched Buyer Network
    let matchedBuyers = '0 Verified';
    const matchedBuyersSubtext = INGESTION_CONSTANTS.FALLBACK_TELEMETRY.BUYER_NETWORK_SUBTEXT;

    if (buyers && buyers.length > 0) {
      const activeCount = buyers.filter((b) => b.isActive !== false).length;
      matchedBuyers = `${activeCount} Verified`;
    }

    return {
      portfolioValue,
      portfolioSubtext,
      criticalRsl,
      criticalRslSubtext,
      liquidationVelocity,
      liquidationVelocitySubtext,
      matchedBuyers,
      matchedBuyersSubtext,
    };
  }, [inventoryList, salesRecords, buyers]);

  const counts = useMemo(() => {
    return {
      inventory: (inventoryList && Array.isArray(inventoryList)) ? inventoryList.length : 0,
      sales: (salesRecords && Array.isArray(salesRecords)) ? salesRecords.length : 0,
      buyers: (buyers && Array.isArray(buyers)) ? buyers.length : 0,
    };
  }, [inventoryList, salesRecords, buyers]);

  return { metrics, counts };
};

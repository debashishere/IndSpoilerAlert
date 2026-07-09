import mongoose, { Model } from 'mongoose';
import Supplier from '../models/Supplier';
import Buyer from '../models/Buyer';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import LiquidationCycle from '../models/LiquidationCycle';
import InventoryLot from '../models/InventoryLot';
import Sale from '../models/Sale';
import InventoryRisk from '../models/InventoryRisk';
import Opportunity from '../models/Opportunity';
import PricingRecommendation from '../models/PricingRecommendation';
import MarketplaceListing from '../models/MarketplaceListing';
import Offer from '../models/Offer';
import Award from '../models/Award';
import Shipment from '../models/Shipment';
import Donation from '../models/Donation';
import Disposal from '../models/Disposal';
import DocumentImport from '../models/DocumentImport';
import SupplierTemplate from '../models/SupplierTemplate';
import LiquidationAutomation from '../models/LiquidationAutomation';
import AutomationRun from '../models/AutomationRun';
import Activity from '../models/Activity';
import EmailThread from '../models/EmailThread';
import EmailDispatchLog from '../models/EmailDispatchLog';
import QuickBidToken from '../models/QuickBidToken';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import ComplianceDocument from '../models/ComplianceDocument';

export async function purgePlatformDataExceptBuyers() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spoiler-alert';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('--- Starting Purge of Platform Data (Preserving Buyer List) ---');
  
  const buyerCountBefore = await Buyer.countDocuments();
  console.log(`Buyer collection count before purge: ${buyerCountBefore}`);

  const purgeResults: Record<string, number> = {};

  const collectionsToPurge: { name: string; model: Model<any> }[] = [
    { name: 'Supplier', model: Supplier as any },
    { name: 'DistributionCenter', model: DistributionCenter as any },
    { name: 'ProductMaster', model: ProductMaster as any },
    { name: 'LiquidationCycle', model: LiquidationCycle as any },
    { name: 'InventoryLot', model: InventoryLot as any },
    { name: 'Sale', model: Sale as any },
    { name: 'InventoryRisk', model: InventoryRisk as any },
    { name: 'Opportunity', model: Opportunity as any },
    { name: 'PricingRecommendation', model: PricingRecommendation as any },
    { name: 'MarketplaceListing', model: MarketplaceListing as any },
    { name: 'Offer', model: Offer as any },
    { name: 'Award', model: Award as any },
    { name: 'Shipment', model: Shipment as any },
    { name: 'Donation', model: Donation as any },
    { name: 'Disposal', model: Disposal as any },
    { name: 'DocumentImport', model: DocumentImport as any },
    { name: 'SupplierTemplate', model: SupplierTemplate as any },
    { name: 'LiquidationAutomation', model: LiquidationAutomation as any },
    { name: 'AutomationRun', model: AutomationRun as any },
    { name: 'Activity', model: Activity as any },
    { name: 'EmailThread', model: EmailThread as any },
    { name: 'EmailDispatchLog', model: EmailDispatchLog as any },
    { name: 'QuickBidToken', model: QuickBidToken as any },
    { name: 'SupplierOAuthMailbox', model: SupplierOAuthMailbox as any },
    { name: 'SupplierSmtpConfig', model: SupplierSmtpConfig as any },
    { name: 'ComplianceDocument', model: ComplianceDocument as any }
  ];

  for (const { name, model } of collectionsToPurge) {
    const res = await model.deleteMany({});
    purgeResults[name] = res.deletedCount || 0;
    console.log(`Purged ${name}: ${res.deletedCount || 0} records deleted.`);
  }

  const buyerCountAfter = await Buyer.countDocuments();
  console.log(`Buyer collection count after purge: ${buyerCountAfter} (Preserved)`);
  console.log('--- Platform Purge Completed Successfully ---');

  return {
    buyerCountPreserved: buyerCountAfter,
    purgedSummary: purgeResults
  };
}

if (require.main === module) {
  purgePlatformDataExceptBuyers()
    .then((result) => {
      console.log('Purge execution output:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error executing purge:', err);
      process.exit(1);
    });
}

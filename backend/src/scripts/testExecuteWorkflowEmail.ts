import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import Buyer from '../models/Buyer';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import { createAutomationRun } from '../services/agendaService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runTest() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  try {
    // 1. Check for stored SMTP config
    const smtpConfigs = await SupplierSmtpConfig.find({});
    console.log(`Found ${smtpConfigs.length} saved SupplierSmtpConfig record(s):`);
    smtpConfigs.forEach(cfg => {
      console.log(` - Supplier: ${cfg.supplierId}, Host: ${cfg.host}:${cfg.port}, User: ${cfg.user}, Verified: ${cfg.isVerified}`);
    });

    // 2. Fetch or create a test workflow targeting debashishere007@gmail.com
    let automation = await LiquidationAutomation.findOne({ name: 'Real Gmail Test Workflow' });

    if (!automation) {
      console.log('Creating a test workflow targeting debashishere007@gmail.com...');
      automation = await LiquidationAutomation.create({
        name: 'Real Gmail Test Workflow',
        supplierId: new mongoose.Types.ObjectId(),
        isActive: true,
        templateName: 'Short Shelf Life clearance',
        stages: [
          {
            stageName: 'Stage 1: Direct Clearance Offer',
            waitHours: 24,
            buyerMode: 'custom',
            customBuyers: [{ id: new mongoose.Types.ObjectId().toString(), name: 'Debashis Test Buyer', email: 'debashishere007@gmail.com' }]
          }
        ]
      });
    }

    console.log(`\nExecuting Saved Workflow: "${automation.name}" (ID: ${automation._id})`);

    // 3. Find or create a sample active inventory lot
    let lots = await InventoryLot.find({ status: 'active' }).limit(3);
    if (lots.length === 0) {
      console.log('No active inventory lots found, creating a dummy active lot for workflow snapshot...');
      const dummyLot = await InventoryLot.create({
        supplierId: automation.supplierId || 'default',
        lotNumber: `LOT-TEST-${Date.now().toString().slice(-4)}`,
        description: 'Test Organic Granola Bar Clearance',
        quantityCases: 150,
        availableQty: 150,
        status: 'active',
        remainingShelfLife: 15
      });
      lots = [dummyLot];
    }

    console.log(`Matched ${lots.length} active inventory lot(s) for workflow execution.`);

    // 4. Trigger the workflow execution run immediately
    console.log('\n--- Triggering Workflow Execution Run ---');
    const run = await createAutomationRun(automation, lots, 'manual');

    console.log('\n--- Execution Run Result ---');
    console.log(`Run Status: ${run?.status}`);
    console.log(`Target Buyers: ${run?.buyerEmails?.join(', ')}`);
    console.log(`Evaluated Buyers Count: ${run?.evaluatedBuyerIds?.length}`);
    console.log(`Affected Lots Count: ${run?.affectedInventoryLots?.length}`);
    console.log('\n✅ Workflow executed successfully. Check output logs above for Nodemailer dispatch message ID!');

  } catch (err: any) {
    console.error('❌ Error executing workflow test:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();

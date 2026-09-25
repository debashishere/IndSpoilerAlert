import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';

async function purgeAllIngestionsAndBids() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db!;
  const collectionsToClear = [
    'documentimports',
    'offers',
    'sales',
    'buyers',
    'inventorylots',
    'marketplacelistings',
    'awards',
    'shipments',
    'donations',
    'disposals',
    'liquidationautomations',
    'automationruns',
    'activities',
    'emailthreads',
    'emaildispatchlogs',
    'quickbidtokens',
    'liquidationcycles',
    'opportunities',
    'inventoryrisks',
    'pricingrecommendations',
    'buyerlists'
  ];

  const purgeSummary: Record<string, number> = {};

  for (const colName of collectionsToClear) {
    try {
      const col = db.collection(colName);
      const res = await col.deleteMany({});
      purgeSummary[colName] = res.deletedCount || 0;
      console.log(`✔ Cleared collection '${colName}': ${res.deletedCount || 0} records deleted.`);
    } catch (err: any) {
      console.error(`❌ Error clearing collection '${colName}':`, err.message);
    }
  }

  // Check if Redis is accessible and flush cache
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`Connecting to Redis at ${redisUrl}...`);
    const redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    await redisClient.flushAll();
    console.log('✔ Redis cache flushed successfully.');
    await redisClient.disconnect();
  } catch (err: any) {
    console.log('Redis flush skipped or failed:', err.message);
  }

  console.log('\n=== COMPLETE INGESTION & BIDS PURGE SUMMARY ===');
  console.log(JSON.stringify(purgeSummary, null, 2));

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. All Ingestion lists, Bids, Sales, Buyers, and Inventory cleared successfully.');
}

purgeAllIngestionsAndBids().catch(err => {
  console.error('Fatal error during purge:', err);
  process.exit(1);
});

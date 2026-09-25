import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';
const TARGET_EMAIL = 'debashishere007@gmail.com';
const EMAIL_REGEX = /debashishere007/i;

async function deleteUserData() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed.');
  }

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in database.`);

  const deletionSummary: Record<string, number> = {};

  // 1. First, find Buyers matching debashishere007
  const buyersCollection = db.collection('buyers');
  const matchingBuyers = await buyersCollection.find({
    $or: [
      { email: EMAIL_REGEX },
      { contactEmail: EMAIL_REGEX }
    ]
  }).toArray();

  const buyerIds = matchingBuyers.map(b => b._id);
  const buyerEmails = matchingBuyers.map(b => b.email).filter(Boolean);

  console.log(`Found ${matchingBuyers.length} matching Buyers for email ${TARGET_EMAIL}:`);
  matchingBuyers.forEach(b => console.log(` - Buyer ID: ${b._id}, Name: ${b.companyName || b.name}, Email: ${b.email}`));

  // 2. Iterate through all collections and delete records associated with target email or buyer IDs
  for (const colInfo of collections) {
    const colName = colInfo.name;
    const col = db.collection(colName);

    let query: any = {
      $or: [
        { email: EMAIL_REGEX },
        { buyerEmail: EMAIL_REGEX },
        { contactEmail: EMAIL_REGEX },
        { userEmail: EMAIL_REGEX },
        { recipient: EMAIL_REGEX },
        { to: EMAIL_REGEX },
        { from: EMAIL_REGEX },
        { senderEmail: EMAIL_REGEX },
        { 'metadata.email': EMAIL_REGEX }
      ]
    };

    if (buyerIds.length > 0) {
      query.$or.push({ buyerId: { $in: buyerIds } });
      query.$or.push({ buyer: { $in: buyerIds } });
    }

    if (buyerEmails.length > 0) {
      query.$or.push({ buyerEmail: { $in: buyerEmails } });
      query.$or.push({ buyerCompany: { $in: matchingBuyers.map(b => b.companyName).filter(Boolean) } });
    }

    // Specific logic per collection if needed
    if (colName === 'inventorylots' || colName === 'inventory_lots') {
      // Find lots referenced by deleted sales or offers for this buyer
      query.$or.push({ 'metadata.ingestedByEmail': EMAIL_REGEX });
    }

    try {
      const deleteResult = await col.deleteMany(query);
      if (deleteResult.deletedCount > 0) {
        deletionSummary[colName] = deleteResult.deletedCount;
        console.log(`✔ Collection '${colName}': Deleted ${deleteResult.deletedCount} matching records.`);
      }
    } catch (err: any) {
      console.error(`❌ Error deleting from collection '${colName}':`, err.message);
    }
  }

  // Also explicit check for Supplier / OAuth / Smtp if associated with debashishere007
  const suppliersCol = db.collection('suppliers');
  const targetSuppliers = await suppliersCol.find({
    $or: [
      { email: EMAIL_REGEX },
      { contactEmail: EMAIL_REGEX }
    ]
  }).toArray();

  if (targetSuppliers.length > 0) {
    const supplierIds = targetSuppliers.map(s => s._id);
    console.log(`Found ${targetSuppliers.length} Suppliers with email matching ${TARGET_EMAIL}.`);
    
    // Purge associated lots, sales, offers, activity for these suppliers if any
    for (const colInfo of collections) {
      const colName = colInfo.name;
      const col = db.collection(colName);
      try {
        const res = await col.deleteMany({ supplierId: { $in: supplierIds } });
        if (res.deletedCount > 0) {
          deletionSummary[`${colName} (supplier link)`] = (deletionSummary[`${colName} (supplier link)`] || 0) + res.deletedCount;
        }
      } catch (err) {}
    }

    const deleteSuppliersRes = await suppliersCol.deleteMany({ _id: { $in: supplierIds } });
    deletionSummary['suppliers'] = (deletionSummary['suppliers'] || 0) + deleteSuppliersRes.deletedCount;
  }

  console.log('\n--- DATA PURGE SUMMARY ---');
  console.log(JSON.stringify(deletionSummary, null, 2));

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Purge completed successfully.');
}

deleteUserData().catch(err => {
  console.error('Fatal error running deleteUserData script:', err);
  process.exit(1);
});

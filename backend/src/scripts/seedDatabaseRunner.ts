import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from '../utils/seeder';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';

async function runSeed() {
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Force-cleaning and seeding demo dataset...');
  await seedDatabase(true);
  console.log('Seeding completed successfully.');
  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Error running seed script:', err);
  process.exit(1);
});

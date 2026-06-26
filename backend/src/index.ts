import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api';

// Utils
import { seedDatabase } from './utils/seeder';
import { startAgenda } from './services/agendaService';

// Ensure .env is loaded from backend directory and working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.set('etag', false);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spoiler-alert';
mongoose.connect(mongoUri)
  .then(async () => {
    await startAgenda();
    if (process.env.NODE_ENV !== 'test') {
      console.log('Successfully connected to MongoDB.');
      const seedEnvRaw = process.env.SEED_DATA ?? process.env.seedData;
      const seedEnv = seedEnvRaw ? seedEnvRaw.trim().toLowerCase() : 'false';
      const isForce = seedEnv === 'true' || seedEnv === '1' || seedEnv === 'yes' || seedEnv === 'force';
      const isAuto = seedEnv === 'auto';

      if (isForce) {
        console.log(`SEED_DATA="${seedEnvRaw}" is enabled. Force-cleaning and seeding database...`);
        await seedDatabase(true);
      } else if (isAuto) {
        console.log('SEED_DATA="auto" enabled. Seeding database...');
        await seedDatabase(false);
      } else {
        console.log(`Skipping database seeding (SEED_DATA="${seedEnvRaw ?? 'false'}"). Data seeding is disabled.`);
      }
    }
  })
  .catch(err => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error connecting to MongoDB:', err);
    }
  });

// API Routes
app.get('/sidecar/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Sidecar proxy is healthy' });
});
app.use('/api', apiRouter);


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
  });
}

export default app;

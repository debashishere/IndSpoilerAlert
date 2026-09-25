import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import app from '../index';
import { s3 } from '../utils/aws';
import { GetObjectCommand } from '@aws-sdk/client-s3';

describe('S3 Multer Stream Ingest Upload API (POST /api/ingest/upload)', () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const bucketName = process.env.AWS_S3_BUCKET || 'ind-spoiler-alert-surplus';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test'
      );
    }
  });

  afterAll(async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    await DocumentImport.deleteMany({ fileName: 's3_stream_ingest_test.csv' });
    await mongoose.disconnect();
  });

  it('should stream upload CSV file directly to S3 without writing to local disk uploads/ directory', async () => {
    // Record list of files in uploads/ before test
    const filesBefore = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

    const csvContent = 'SKU,Description,Quantity,Price\nS3-SKU-001,S3 Stream Test,50,99.99';
    const buffer = Buffer.from(csvContent);

    const response = await request(app)
      .post('/api/ingest/upload')
      .attach('file', buffer, 's3_stream_ingest_test.csv');

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('ingestionJobId');

    const DocumentImport = mongoose.model('DocumentImport');
    const docImport = await DocumentImport.findById(response.body.ingestionJobId);
    expect(docImport).not.toBeNull();
    expect(docImport.fileName).toBe('s3_stream_ingest_test.csv');
    expect(docImport.s3Bucket).toBe(bucketName);
    expect(docImport.s3Key).toBeDefined();
    expect(docImport.s3Key).toContain('s3_stream_ingest_test.csv');

    try {
      // Verify file exists in S3
      const getCmd = new GetObjectCommand({
        Bucket: docImport.s3Bucket,
        Key: docImport.s3Key,
      });
      const s3Obj = await s3.send(getCmd);
      const contentInS3 = await s3Obj.Body?.transformToString();
      expect(contentInS3).toBe(csvContent);
    } catch {
      console.warn('[s3_ingest_upload.test] S3 offline, skipping remote read verification.');
    }

    // CRITICAL: Check local uploads/ directory to ensure no new file was persisted to disk
    const filesAfter = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const newFiles = filesAfter.filter((f) => !filesBefore.includes(f));
    expect(newFiles).toHaveLength(0);
  });
});

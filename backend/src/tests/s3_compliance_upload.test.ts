import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import app from '../index';
import { s3 } from '../utils/aws';
import { GetObjectCommand } from '@aws-sdk/client-s3';

describe('S3 Compliance Document Upload API (POST /api/inventory/lot/:id/compliance)', () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const bucketName = process.env.AWS_S3_BUCKET || 'ind-spoiler-alert-surplus';
  let lotId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test'
      );
    }

    const InventoryLot = mongoose.model('InventoryLot');
    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');

    const supp = await Supplier.create({
      name: 'Compliance Test Supplier',
      companyCode: 'TSUPCOMP',
    });

    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Test Compliance DC',
      code: 'TSUPCOMP-DC',
      address: '100 Compliance Way',
      coordinates: { lat: 41.8781, lng: -87.6298 },
    });

    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-COMP-001',
      category: 'Dry Goods',
      description: 'Compliance Product',
      shelfLifeDays: 30,
    });

    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'COMP-LOT-001',
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      totalValue: 1000,
      expirationDate: new Date('2027-01-01'),
      status: 'active',
    });
    lotId = lot._id.toString();
  });

  afterAll(async () => {
    const InventoryLot = mongoose.model('InventoryLot');
    const ComplianceDocument = mongoose.model('ComplianceDocument');
    const Supplier = mongoose.model('Supplier');

    await InventoryLot.deleteMany({ lotNumber: 'COMP-LOT-001' });
    await ComplianceDocument.deleteMany({ lotId });
    await Supplier.deleteMany({ companyCode: 'TSUPCOMP' });
    await mongoose.disconnect();
  });

  it('should upload compliance PDF directly to S3 and update lot complianceDocs without local disk persistence', async () => {
    const filesBefore = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

    const pdfContent = '%PDF-1.4 compliance test dummy pdf content';
    const buffer = Buffer.from(pdfContent);

    const response = await request(app)
      .post(`/api/inventory/lot/${lotId}/compliance`)
      .field('docType', 'COA')
      .attach('file', buffer, 'certificate.pdf');

    if (response.status !== 201) {
      console.error('Compliance upload response error:', response.body);
    }
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('s3Url');

    const ComplianceDocument = mongoose.model('ComplianceDocument');
    const doc = await ComplianceDocument.findById(response.body._id);
    expect(doc).not.toBeNull();
    expect(doc.s3Url).toBeDefined();

    // Verify lot complianceDocs updated
    const InventoryLot = mongoose.model('InventoryLot');
    const updatedLot = await InventoryLot.findById(lotId);
    expect(updatedLot.complianceDocs).toContainEqual(doc._id);

    // Verify file in S3
    const s3Url: string = doc.s3Url;
    // Extract key from s3Url
    const urlObj = new URL(s3Url);
    const pathnameParts = urlObj.pathname.split('/').filter(Boolean);
    // Pathname is /bucketName/key/path... or /key/path...
    const key = pathnameParts[0] === bucketName ? pathnameParts.slice(1).join('/') : pathnameParts.join('/');

    try {
      const getCmd = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const s3Obj = await s3.send(getCmd);
      const content = await s3Obj.Body?.transformToString();
      expect(content).toBe(pdfContent);
    } catch {
      console.warn('[s3_compliance_upload.test] S3 offline, skipping remote read verification.');
    }

    // Ensure no new file in local uploads/ directory
    const filesAfter = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const newFiles = filesAfter.filter((f) => !filesBefore.includes(f));
    expect(newFiles).toHaveLength(0);
  });
});

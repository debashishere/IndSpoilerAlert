import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { compileTemplate, compileSubject, generateSampleInventoryTable } from '../services/emailTemplateService';
import { sendCampaignEmail } from '../services/emailService';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';

import nodemailer from 'nodemailer';

describe('Slice 2: Handlebars Compiler & Juice CSS Inliner Engine', () => {
  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-campaign-msg-id',
          response: '250 OK'
        })
      } as any;
    });

    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spoileralert_test', { serverSelectionTimeoutMS: 1000 });
      } catch (err) {}
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await SupplierOAuthMailbox.deleteMany({ supplierId: 'test-compiler-supplier' });
        await mongoose.disconnect();
      } catch (e) {}
    }
  });



  describe('Handlebars Compilation & Token Substitution', () => {
    it('should interpolate standard variables in HTML templates', () => {
      const template = '<p>Hello {{buyer_name}}, welcome to {{supplier_name}}!</p>';
      const context = { buyer_name: 'Apex Supermarkets', supplier_name: 'Unilever Logistics' };

      const compiled = compileTemplate(template, context);
      expect(compiled).toContain('Hello Apex Supermarkets, welcome to Unilever Logistics!');
    });

    it('should compile subject line templates correctly', () => {
      const subjectTpl = 'Distressed Inventory Offer for {{buyer_name}} - {{lot_title}}';
      const context = { buyer_name: 'FreshMart', lot_title: 'Dairy Lot #402' };

      const compiled = compileSubject(subjectTpl, context);
      expect(compiled).toBe('Distressed Inventory Offer for FreshMart - Dairy Lot #402');
    });

    it('should render {{inventory_table}} as unescaped HTML table from context or default sample', () => {
      const template = '<div><h3>Offer Details</h3>{{inventory_table}}</div>';
      const context = {
        buyer_name: 'Metro Foods',
        inventory_table: [
          { sku: 'SKU-100', description: 'Organic Milk 1L', cases: 100, expiryDays: 5 },
          { sku: 'SKU-200', description: 'Cheddar Cheese 200g', cases: 50, expiryDays: 12 }
        ]
      };

      const compiled = compileTemplate(template, context);
      expect(compiled).toContain('<table');
      expect(compiled).toContain('SKU-100');
      expect(compiled).toContain('Organic Milk 1L');
      expect(compiled).toContain('Cheddar Cheese 200g');
    });

    it('should correctly handle {{quick_bid_link}} in template hyperlinks', () => {
      const template = '<a href="{{quick_bid_link}}">Submit Bid Now</a>';
      const context = { quick_bid_link: 'https://spoileralert.com/bid?token=signed_jwt_token_123' };

      const compiled = compileTemplate(template, context);
      expect(compiled).toContain('href="https://spoileralert.com/bid?token=signed_jwt_token_123"');
    });
  });

  describe('Juice CSS Inlining Engine for Outlook/Gmail Compatibility', () => {
    it('should inline CSS styles from <style> tags directly into HTML element style attributes', () => {
      const rawHtml = `
        <html>
          <head>
            <style>
              .header { color: #4f46e5; font-size: 24px; font-weight: bold; }
              .btn { background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1 class="header">Clearance Sale</h1>
            <a class="btn" href="{{quick_bid_link}}">Bid</a>
          </body>
        </html>
      `;
      const context = { quick_bid_link: 'https://spoileralert.com/bid' };

      const compiled = compileTemplate(rawHtml, context);
      
      // Verify style attributes are inlined onto the tags
      expect(compiled).toContain('color: #4f46e5');
      expect(compiled).toContain('font-size: 24px');
      expect(compiled).toContain('background-color: #10b981');
      expect(compiled).toContain('style=');
    });

    it('should preserve MSO conditional comments for Outlook rendering compatibility', () => {
      const outlookHtml = `
        <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://spoileralert.com/bid" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#4f46e5">
            <w:anchorlock/>
            <center>
          </v:roundrect>
        <![endif]-->
        <p>Outlook compatible email</p>
      `;

      const compiled = compileTemplate(outlookHtml, {});
      expect(compiled).toContain('<!--[if mso]>');
      expect(compiled).toContain('v:roundrect');
    });
  });

  describe('Integration with sendCampaignEmail', () => {
    it('should compile template HTML and subject before dispatching campaign email', async () => {
      const supplierId = 'test-compiler-supplier';
      await SupplierOAuthMailbox.create({
        supplierId,
        userEmail: 'supplier@test.com',
        status: 'connected',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const templateHtml = '<style>.title { color: blue; }</style><h2 class="title">Hello {{buyer_name}}</h2>{{inventory_table}}';
      const subject = 'Offer for {{buyer_name}}';
      const context = { buyer_name: 'Target Buyer Inc' };

      const res = await sendCampaignEmail(supplierId, 'buyer@test.com', subject, templateHtml, context);
      expect(res.success).toBe(true);
    });
  });

  describe('REST API POST /api/email-templates/compile', () => {
    it('should compile template HTML and return inlined HTML via API', async () => {
      const response = await request(app)
        .post('/api/email-templates/compile')
        .send({
          subject: 'Special Offer for {{buyer_name}}',
          bodyHtml: '<style>h1 { color: purple; }</style><h1>Offer: {{lot_title}}</h1><p>Hi {{buyer_name}}</p>',
          context: {
            buyer_name: 'Metro Groceries',
            lot_title: 'Frozen Seafood Pack Lot #101'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.compiledSubject).toBe('Special Offer for Metro Groceries');
      expect(response.body.compiledHtml).toContain('color: purple');
      expect(response.body.compiledHtml).toContain('Metro Groceries');
      expect(response.body.compiledHtml).toContain('Frozen Seafood Pack Lot #101');
    });

    it('should handle default sample context when context is omitted in compile API', async () => {
      const response = await request(app)
        .post('/api/email-templates/compile')
        .send({
          subject: 'Liquidation: {{lot_title}}',
          bodyHtml: '<div>Hello {{buyer_name}}, {{inventory_table}}</div>'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.compiledHtml).toContain('<table');
    });

    it('Issue 02 - Criterion 2: should transform data-token="header" UI pill into responsive campaign header HTML block', () => {
      const template = '<div data-token="header" contenteditable="false">🏷️ Dynamic Header Component ℹ️</div><p>Body</p>';
      const context = { header: '<div class="custom-header">Clearance Header</div>' };

      const compiled = compileTemplate(template, context);
      expect(compiled).toContain('Clearance Header');
      expect(compiled).not.toContain('Dynamic Header Component');
    });

    it('Issue 02 - Criterion 2 (fallback): should render default header banner if context.header is omitted', () => {
      const template = '<div data-token="header" contenteditable="false">🏷️ Dynamic Header Component ℹ️</div><p>Body</p>';
      const compiled = compileTemplate(template, { supplier_name: 'Unilever' });
      expect(compiled).toContain('Clearance Opportunity | Unilever');
    });

    it('Issue 02 - Criterion 3: GET /api/email-templates?supplierId=... returns default platform templates when no custom templates exist', async () => {
      const response = await request(app)
        .get('/api/email-templates?supplierId=sup-fresh-999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeDefined();
      expect(response.body.templates.length).toBeGreaterThanOrEqual(3);
      expect(response.body.templates.some((t: any) => t.templateId === 'default')).toBe(true);
      expect(response.body.templates.some((t: any) => t.templateId === 'short-dated-auction')).toBe(true);
      expect(response.body.templates.some((t: any) => t.templateId === 'direct-donation-notice')).toBe(true);
    });

    it('Ticket 01 - Criterion 1: should extract buyer_name from context.buyer object (companyName or name)', () => {
      const template = '<p>Hello {{buyer_name}}, special offer for you!</p>';
      const context = { buyer: { companyName: 'Apex Wholesale', email: 'buyer@apex.com' } };

      const compiled = compileTemplate(template, context as any);
      expect(compiled).toContain('Hello Apex Wholesale, special offer for you!');
    });

    it('Ticket 01 - Criterion 1: should transform data-token="buyer_name" UI pill element into compiled buyer name', () => {
      const template = '<p>Dear <span class="dynamic-token-pill" data-token="buyer_name" contenteditable="false">Buyer Account Name ℹ️</span></p>';
      const context = { buyer: { name: 'FreshMart Supermarkets' } };

      const compiled = compileTemplate(template, context as any);
      expect(compiled).toContain('Dear FreshMart Supermarkets');
      expect(compiled).not.toContain('data-token="buyer_name"');
    });
  });
});


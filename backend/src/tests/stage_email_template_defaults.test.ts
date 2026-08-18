import { PLATFORM_TEMPLATE_MAP, DEFAULT_PLATFORM_TEMPLATES } from '../controllers/emailTemplateController';
import { compileTemplate, compileSubject } from '../services/emailTemplateService';
import { resolveStageBuyers } from '../services/stageResolver';

describe('Stage Email Templates & Fallback Routing Unit Tests', () => {
  describe('Platform Template Map & Defaults', () => {
    it('provides canonical templates for default, short-dated-auction, direct-donation-notice, and disposal-removal-notice', () => {
      expect(PLATFORM_TEMPLATE_MAP['default']).toBeDefined();
      expect(PLATFORM_TEMPLATE_MAP['short-dated-auction']).toBeDefined();
      expect(PLATFORM_TEMPLATE_MAP['direct-donation-notice']).toBeDefined();
      expect(PLATFORM_TEMPLATE_MAP['disposal-removal-notice']).toBeDefined();

      expect(PLATFORM_TEMPLATE_MAP['direct-donation-notice'].subject).toContain('Donation Transfer Offer');
      expect(PLATFORM_TEMPLATE_MAP['direct-donation-notice'].bodyHtml).toContain('🌱 Community Surplus Donation');

      expect(PLATFORM_TEMPLATE_MAP['disposal-removal-notice'].subject).toContain('Disposal & Removal Authorization Notice');
      expect(PLATFORM_TEMPLATE_MAP['disposal-removal-notice'].bodyHtml).toContain('Scheduled Disposal & Removal Authorization');
    });

    it('compiles donation notice template with context tokens properly', () => {
      const donationTpl = PLATFORM_TEMPLATE_MAP['direct-donation-notice'];
      const context = {
        buyer_name: 'Food For All Hub',
        supplier_name: 'Fresh Dairy Corp',
        lot_title: 'Surplus Milk Lot #101'
      };

      const compiledSub = compileSubject(donationTpl.subject, context);
      const compiledBody = compileTemplate(donationTpl.bodyHtml, context);

      expect(compiledSub).toBe('Surplus Inventory Donation Transfer Offer: Surplus Milk Lot #101');
      expect(compiledBody).toContain('Dear <strong>Food For All Hub</strong> partner');
      expect(compiledBody).toContain('🌱 Community Surplus Donation | Fresh Dairy Corp');
    });

    it('compiles disposal notice template with context tokens properly', () => {
      const disposalTpl = PLATFORM_TEMPLATE_MAP['disposal-removal-notice'];
      const context = {
        buyer_name: 'BioCycle Logistics',
        supplier_name: 'Fresh Dairy Corp',
        lot_title: 'Expired Produce Lot #202',
        disposal_deadline: 'Oct 25, 2026'
      };

      const compiledSub = compileSubject(disposalTpl.subject, context);
      const compiledBody = compileTemplate(disposalTpl.bodyHtml, context);

      expect(compiledSub).toBe('Disposal & Removal Authorization Notice: Expired Produce Lot #202');
      expect(compiledBody).toContain('Dear <strong>BioCycle Logistics</strong> facility operator');
      expect(compiledBody).toContain('Oct 25, 2026');
    });
  });

  describe('resolveStageBuyers with Donation Entities', () => {
    it('resolves donation entities from donationConfig when stage is donation', async () => {
      const stage = {
        stageNumber: 3,
        stageType: 'donation',
        name: 'Food Bank Donation Stage'
      };

      const automationContext = {
        supplierId: 'sup-123',
        donationConfig: {
          donatingEntities: [
            { id: 'ent-1', name: 'Feeding America SF', email: 'sf@feedingamerica.org' },
            { id: 'ent-2', name: 'Second Harvest', email: 'info@shfb.org' }
          ]
        }
      };

      const result = await resolveStageBuyers(stage, automationContext);

      expect(result.buyerEmails).toContain('sf@feedingamerica.org');
      expect(result.buyerEmails).toContain('info@shfb.org');
      expect(result.resolvedBuyerMap.get('sf@feedingamerica.org')).toEqual({
        _id: 'ent-1',
        companyName: 'Feeding America SF',
        name: 'Feeding America SF',
        email: 'sf@feedingamerica.org'
      });
    });

    it('retains customBuyers on donation stage if specified', async () => {
      const stage = {
        stageNumber: 3,
        stageType: 'donation',
        buyerMode: 'custom',
        customBuyers: [
          { id: 'cust-1', name: 'Direct Charity', email: 'charity@direct.org' }
        ]
      };

      const automationContext = {
        supplierId: 'sup-123',
        donationConfig: {
          donatingEntities: [
            { id: 'ent-1', name: 'Feeding America SF', email: 'sf@feedingamerica.org' }
          ]
        }
      };

      const result = await resolveStageBuyers(stage, automationContext);

      expect(result.buyerEmails).toContain('charity@direct.org');
      expect(result.buyerEmails).toContain('sf@feedingamerica.org');
    });
  });
});

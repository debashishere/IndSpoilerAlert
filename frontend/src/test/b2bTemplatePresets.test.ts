import { describe, it, expect } from 'vitest';
import { B2B_TEMPLATE_PRESETS, getB2BPresetById, getAllB2BPresets } from '../utils/b2bTemplatePresets';

describe('b2bTemplatePresets', () => {
  it('defines 4 standard B2B email layout presets', () => {
    const presets = getAllB2BPresets();
    expect(presets).toHaveLength(4);

    const ids = presets.map((p) => p.templateId);
    expect(ids).toContain('b2b-inventory-offer-sheet');
    expect(ids).toContain('short-dated-flash-sale');
    expect(ids).toContain('bulk-clearance-announcement');
    expect(ids).toContain('blank-slate');
  });

  it('provides structured preset metadata and default subject lines', () => {
    const offerSheet = getB2BPresetById('b2b-inventory-offer-sheet');
    expect(offerSheet).toBeDefined();
    expect(offerSheet?.name).toBe('B2B Inventory Offer Sheet');
    expect(offerSheet?.category).toBe('clearance');
    expect(offerSheet?.subject).toContain('{{lot_title}}');
    expect(offerSheet?.availableTokens).toContain('inventory_table');
  });

  it('incorporates standard dynamic tokens in template body HTML', () => {
    const flashSale = getB2BPresetById('short-dated-flash-sale');
    expect(flashSale?.bodyHtml).toContain('{{buyer_name}}');
    expect(flashSale?.bodyHtml).toContain('{{lot_title}}');
    expect(flashSale?.bodyHtml).toContain('{{inventory_table}}');
    expect(flashSale?.bodyHtml).toContain('{{quick_bid_link}}');
  });

  it('supports blank slate preset with empty or minimal starter content', () => {
    const blank = getB2BPresetById('blank-slate');
    expect(blank).toBeDefined();
    expect(blank?.name).toBe('Blank Slate');
    expect(blank?.category).toBe('general');
    expect(blank?.bodyHtml).toBe('<p></p>');
  });
});

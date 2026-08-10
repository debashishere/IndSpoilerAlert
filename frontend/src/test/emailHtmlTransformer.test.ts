import { describe, it, expect } from 'vitest';
import { transformEmailHtml } from '../utils/emailHtmlTransformer';

describe('emailHtmlTransformer', () => {
  it('flattens figure and figcaption tags into email-safe styled containers', () => {
    const inputHtml = '<figure><img src="hero.jpg" /><figcaption>Clearance items</figcaption></figure>';
    const output = transformEmailHtml(inputHtml);

    expect(output).not.toContain('<figure>');
    expect(output).not.toContain('<figcaption>');
    expect(output).toContain('<div style=');
    expect(output).toContain('text-align: center');
    expect(output).toContain('<p style=');
    expect(output).toContain('Clearance items</p>');
  });

  it('adds legacy table attributes and inline styles to table, th, and td elements', () => {
    const inputHtml = '<table><thead><tr><th>SKU</th></tr></thead><tbody><tr><td>SKU-001</td></tr></tbody></table>';
    const output = transformEmailHtml(inputHtml);

    expect(output).toContain('cellpadding="0"');
    expect(output).toContain('cellspacing="0"');
    expect(output).toContain('border="0"');
    expect(output).toContain('<th style=');
    expect(output).toContain('<td style=');
  });

  it('replaces {{inventory_table}} placeholder tokens with provided table HTML', () => {
    const inputHtml = '<h2>Catalog</h2><div>{{inventory_table}}</div>';
    const sampleTable = '<table id="rendered-inventory"><tr><td>Item 1</td></tr></table>';
    const output = transformEmailHtml(inputHtml, { inventoryTableHtml: sampleTable });

    expect(output).toContain(sampleTable);
    expect(output).not.toContain('{{inventory_table}}');
  });

  it('inlines font and margin styles for headings (h1, h2, h3)', () => {
    const inputHtml = '<h1>Flash Sale</h1><h2>Subhead</h2><h3>Details</h3>';
    const output = transformEmailHtml(inputHtml);

    expect(output).toContain('<h1 style=');
    expect(output).toContain('<h2 style=');
    expect(output).toContain('<h3 style=');
    expect(output).toContain('font-size: 24px');
  });
});

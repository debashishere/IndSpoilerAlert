import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('0031 — ColorHunt Palette (E3F2FD / 90CAF9 / 2196F3 / 0D47A1) Integration', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('defines ColorHunt Light Mode tokens in :root block', () => {
    const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const rootBlock = rootMatch![1];

    // Canvas background tint: #E3F2FD -> HSL 205 87% 94%
    expect(rootBlock).toContain('--bg-main: 205 87% 94%');
    // Soft Sky Blue border & secondary accent: #90CAF9 -> HSL 207 90% 77%
    expect(rootBlock).toContain('--border-color: 207 90% 77%');
    expect(rootBlock).toContain('--secondary: 207 90% 77%');
    // Electric Primary Blue: #2196F3 -> HSL 207 90% 54%
    expect(rootBlock).toContain('--primary: 207 90% 54%');
    // Deep Royal Navy Accent: #0D47A1 -> HSL 216 85% 34%
    expect(rootBlock).toContain('--primary-dark: 216 85% 34%');
  });

  it('defines ColorHunt Dark Mode tokens in [data-theme="dark"] block', () => {
    const darkMatch = cssContent.match(/\[data-theme="dark"\][^{]*\{([^}]+)\}/);
    expect(darkMatch).not.toBeNull();
    const darkBlock = darkMatch![1];

    // Midnight Royal Navy base anchored in #0D47A1
    expect(darkBlock).toContain('--bg-main: 216 85% 7%');
    expect(darkBlock).toContain('--bg-card: 216 75% 12%');
    // Electric Primary Blue: #2196F3 -> HSL 207 90% 54%
    expect(darkBlock).toContain('--primary: 207 90% 54%');
    // Sky Blue accent: #90CAF9 -> HSL 207 90% 77%
    expect(darkBlock).toContain('--secondary: 207 90% 77%');
    // Sky Ice Text: #E3F2FD -> HSL 205 87% 95%
    expect(darkBlock).toContain('--text-primary: 205 87% 95%');
  });

  it('binds semantic surface tokens to custom properties in both themes', () => {
    expect(cssContent).toContain('--surface-page: hsl(var(--bg-main))');
    expect(cssContent).toContain('--surface-card: hsl(var(--bg-card))');
    expect(cssContent).toContain('--text-on-surface: hsl(var(--text-primary))');
    expect(cssContent).toContain('--border: hsl(var(--border-color))');
  });
});

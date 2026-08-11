import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('01 — Semantic Token Layer Refactor (CSS Foundation)', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  describe('Slice 1: Default :root contains Light Palette and Semantic Tokens', () => {
    it('defines light palette variables as default in :root', () => {
      const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
      expect(rootMatch).not.toBeNull();
      const rootBlock = rootMatch![1];

      expect(rootBlock).toContain('color-scheme: light');
      expect(rootBlock).toContain('--bg-main: 210 40% 98%');
      expect(rootBlock).toContain('--bg-card: 0 0% 100%');
      expect(rootBlock).toContain('--text-primary: 222 47% 11%');

      // Must NOT contain old dark values in :root
      expect(rootBlock).not.toContain('--bg-main: 222 47% 7%');
    });

    it('defines new semantic surface tokens in :root for light mode', () => {
      const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
      expect(rootMatch).not.toBeNull();
      const rootBlock = rootMatch![1];

      expect(rootBlock).toContain('--surface-page: hsl(var(--bg-main))');
      expect(rootBlock).toContain('--surface-card: hsl(var(--bg-card))');
      expect(rootBlock).toContain('--surface-elevated: hsl(var(--bg-card-hover))');
      expect(rootBlock).toContain('--text-on-surface: hsl(var(--text-primary))');
      expect(rootBlock).toContain('--border: hsl(var(--border-color))');
    });
  });

  describe('Slice 2: [data-theme="dark"] contains Dark Palette and Semantic Tokens', () => {
    it('defines dark palette values and dark semantic surface tokens in [data-theme="dark"]', () => {
      const darkMatch = cssContent.match(/\[data-theme="dark"\][^{]*\{([^}]+)\}/);
      expect(darkMatch).not.toBeNull();
      const darkBlock = darkMatch![1];

      expect(darkBlock).toContain('color-scheme: dark');
      expect(darkBlock).toContain('--bg-main: 222 47% 7%');
      expect(darkBlock).toContain('--bg-card: 223 47% 11%');
      expect(darkBlock).toContain('--text-primary: 210 40% 98%');

      // Semantic tokens in dark theme
      expect(darkBlock).toContain('--surface-page: hsl(var(--bg-main))');
      expect(darkBlock).toContain('--surface-card: hsl(var(--bg-card))');
      expect(darkBlock).toContain('--surface-elevated: hsl(var(--bg-card-hover))');
      expect(darkBlock).toContain('--text-on-surface: hsl(var(--text-primary))');
      expect(darkBlock).toContain('--border: hsl(var(--border-color))');
    });

    it('sets dark body background gradient on [data-theme="dark"] body', () => {
      expect(cssContent).toContain('[data-theme="dark"] body');
    });
  });

  describe('Slice 3: Removal of Blunt !important Utility Overrides', () => {
    it('removes blunt !important utility override blocks under [data-theme="light"]', () => {
      expect(cssContent).not.toContain('[data-theme="light"] .bg-slate-950');
      expect(cssContent).not.toContain('[data-theme="light"] .border-slate-800');
      expect(cssContent).not.toContain('background-color: #ffffff !important;');
    });
  });

  describe('Slice 4: DOM Computed Custom Properties Integration', () => {
    it('applies styles and sets theme custom properties in DOM', () => {
      const styleEl = document.createElement('style');
      styleEl.innerHTML = cssContent;
      document.head.appendChild(styleEl);

      const testEl = document.createElement('div');
      document.body.appendChild(testEl);

      // Default (no data-theme)
      const defaultBgMain = getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim();
      expect(defaultBgMain).toBe('210 40% 98%');

      // Dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      const darkBgMain = getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim();
      expect(darkBgMain).toBe('222 47% 7%');

      // Clean up
      document.documentElement.removeAttribute('data-theme');
      document.head.removeChild(styleEl);
      document.body.removeChild(testEl);
    });
  });
});

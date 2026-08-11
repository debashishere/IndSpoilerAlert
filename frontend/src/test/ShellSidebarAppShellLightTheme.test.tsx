import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab, setSidebarExpanded, setHealthStatus } from '../store/slices/coreSlice';
import fs from 'fs';
import path from 'path';

describe('03 — Shell: Sidebar + AppShell Light Theme', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  describe('CSS Token Rules for Sidebar & AppShell', () => {
    it('ensures brand-name gradient does not use hardcoded white (#ffffff)', () => {
      const brandNameMatch = cssContent.match(/\.brand-name\s*\{([^}]+)\}/);
      expect(brandNameMatch).not.toBeNull();
      const brandNameBlock = brandNameMatch![1];

      // Must not have hardcoded #ffffff gradient
      expect(brandNameBlock).not.toContain('#ffffff');
      // Should use semantic text color tokens
      expect(brandNameBlock).toContain('hsl(var(--text-primary))');
    });

    it('ensures .sidebar background and border use semantic tokens without hardcoded dark colors', () => {
      const sidebarMatch = cssContent.match(/\.sidebar\s*\{([^}]+)\}/);
      expect(sidebarMatch).not.toBeNull();
      const sidebarBlock = sidebarMatch![1];

      expect(sidebarBlock).toContain('background-color: hsl(var(--bg-card))');
      expect(sidebarBlock).toContain('border-right: 1px solid hsl(var(--border-color))');

      expect(sidebarBlock).not.toContain('#0f172a');
      expect(sidebarBlock).not.toContain('#1e293b');
      expect(sidebarBlock).not.toContain('#000000');
    });

    it('ensures .nav-link hover and active states use semantic background and text colors', () => {
      const navLinkMatch = cssContent.match(/\.nav-link:hover,\s*\.nav-link\.active\s*\{([^}]+)\}/);
      expect(navLinkMatch).not.toBeNull();
      const navLinkBlock = navLinkMatch![1];

      expect(navLinkBlock).toContain('hsl(var(--bg-card-hover))');
      expect(navLinkBlock).toContain('hsl(var(--text-primary))');
    });
  });

  describe('Sidebar Component Integration in Light Theme', () => {
    beforeEach(() => {
      store.dispatch(setActiveTab('ingestion'));
      store.dispatch(setSidebarExpanded(true));
      store.dispatch(setHealthStatus({ backendHealthy: true, sidecarHealthy: true }));
      document.documentElement.setAttribute('data-theme', 'light');
    });

    it('renders Sidebar with legible brand, active nav state, and health status indicators in light mode', async () => {
      const { Sidebar } = await import('../components/shell/Sidebar');

      const { container } = render(
        <Provider store={store}>
          <Sidebar />
        </Provider>
      );

      const sidebar = container.querySelector('aside.sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar?.classList.contains('collapsed')).toBe(false);

      const brandName = container.querySelector('.brand-name');
      expect(brandName).toBeInTheDocument();
      expect(brandName?.textContent).toBe('InventoryFlowing');

      // Check active tab element
      const activeTabEl = container.querySelector('.nav-link.active');
      expect(activeTabEl).toBeInTheDocument();
      expect(activeTabEl?.textContent).toContain('Ingestion Engine');

      // Health status indicators
      expect(screen.getByText('MongoDB: Connected')).toBeInTheDocument();
      expect(screen.getByText('FastAPI: Online')).toBeInTheDocument();
    });

    it('renders collapsed sidebar correctly in light mode', async () => {
      store.dispatch(setSidebarExpanded(false));
      const { Sidebar } = await import('../components/shell/Sidebar');

      const { container } = render(
        <Provider store={store}>
          <Sidebar />
        </Provider>
      );

      const sidebar = container.querySelector('aside.sidebar');
      expect(sidebar?.classList.contains('collapsed')).toBe(true);
    });
  });
});

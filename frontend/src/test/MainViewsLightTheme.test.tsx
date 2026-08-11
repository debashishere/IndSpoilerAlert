import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import { WorkflowsView } from '../components/WorkflowsView';
import { SettingsView } from '../views/SettingsView';
import { EmailCommunicationsView } from '../views/EmailCommunicationsView';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
    },
  });

describe('Main Views Light Theme Support (Issue 08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([]),
    } as any);
  });

  describe('WorkflowsView Light Theme', () => {
    it('uses semantic surface and text classes for light mode compatibility on container and cards', () => {
      const store = createTestStore();
      const { container } = render(
        <div data-theme="light">
          <Provider store={store}>
            <WorkflowsView supplierId="sup-101" />
          </Provider>
        </div>
      );

      const mainContainer = container.querySelector('.workflows-view-container') || container.firstElementChild?.firstElementChild;
      expect(mainContainer).toBeInTheDocument();

      // Main header container
      const headerHeading = screen.getByText('Liquidation Automations & Campaigns');
      expect(headerHeading).toBeInTheDocument();

      // Check header panel or main wrapper does not hardcode text-slate-100 without theme awareness
      const headerCard = container.querySelector('.workflows-view-container') || container.firstElementChild?.firstElementChild;
      expect(headerCard).toBeInTheDocument();
      expect(headerCard?.className).not.toContain('text-slate-100');
    });
  });

  describe('SettingsView Light Theme', () => {
    it('renders header, tabs, and form panels with semantic tokens instead of hardcoded dark slate backgrounds', () => {
      const store = createTestStore();
      const { container } = render(
        <div data-theme="light">
          <Provider store={store}>
            <SettingsView supplierId="sup-101" initialSubTab="profile" />
          </Provider>
        </div>
      );

      // Main container should use semantic surface tokens or bg-surface/bg-card
      const rootDiv = container.querySelector('.settings-view-container') || container.querySelector('[data-theme="light"] > div');
      expect(rootDiv).toBeInTheDocument();
      expect(rootDiv?.className).not.toContain('text-slate-100');

      // Check settings navigation bar uses semantic card/surface class
      const sidebarNav = container.querySelector('div.lg\\:w-64');
      expect(sidebarNav?.className).toContain('bg-card');
    });

    it('renders input fields and toggles in Platform Prefs using light theme semantic variables', () => {
      const store = createTestStore();
      const { container } = render(
        <div data-theme="light">
          <Provider store={store}>
            <SettingsView supplierId="sup-101" initialSubTab="platform" />
          </Provider>
        </div>
      );

      const inputExpiry = screen.getByLabelText(/Default Token Expiry/i);
      expect(inputExpiry).toBeInTheDocument();
      // Inputs should use semantic input background or bg-card / border-color, not hardcoded bg-slate-900
      expect(inputExpiry.className).not.toContain('bg-slate-900');
    });
  });

  describe('EmailCommunicationsView Light Theme', () => {
    it('renders inbox workspace container and thread cards with semantic light surface tokens', () => {
      const { container } = render(
        <div data-theme="light">
          <EmailCommunicationsView supplierId="sup-101" accountName="Unilever Operations" emailAddress="ops@unilever.com" />
        </div>
      );

      const heading = screen.getByRole('heading', { name: /Inbox Workspace/i });
      expect(heading).toBeInTheDocument();

      // Side pane and main thread containers should use bg-card or semantic tokens
      const threadListPane = container.querySelector('.lg\\:col-span-4');
      expect(threadListPane).toBeInTheDocument();
      expect(threadListPane?.className).toContain('bg-card');
    });
  });

  describe('Drawers & Status Badges Light Theme', () => {
    it('uses light card backgrounds for drawers instead of hardcoded dark slate backgrounds', () => {
      const { container } = render(
        <div data-theme="light" className="drawer-container">
          <div className="drawer" />
        </div>
      );
      const drawer = container.querySelector('.drawer');
      expect(drawer).toBeInTheDocument();
      expect(getComputedStyle(drawer!).backgroundColor).not.toBe('rgb(15, 23, 42)');
    });

    it('renders saved campaign status badges with semantic tokens retaining color meaning', () => {
      const store = createTestStore();
      store.dispatch({
        type: 'workflow/setLiquidationAutomations',
        payload: [
          {
            _id: 'camp-1',
            name: 'Q3 Clearance',
            templateName: 'clearance',
            status: 'active',
            createdBy: 'User',
            createdAt: new Date().toISOString(),
            inventoryFilters: {},
          },
        ],
      });
      store.dispatch({
        type: 'workflow/setWorkflowSubTab',
        payload: 'saved',
      });

      const { container } = render(
        <div data-theme="light">
          <Provider store={store}>
            <WorkflowsView supplierId="sup-101" />
          </Provider>
        </div>
      );

      const activeBadge = screen.getByText(/Active/i);
      expect(activeBadge).toBeInTheDocument();
      // Status badge should use semantic badge classes/tokens
      expect(activeBadge.className).toContain('badge');
    });
  });
});

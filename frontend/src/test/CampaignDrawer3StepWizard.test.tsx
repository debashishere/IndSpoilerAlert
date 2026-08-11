import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from '../store/slices/workflowSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import coreReducer from '../store/slices/coreSlice';
import { CampaignDrawer } from '../components/domain/workflows/CampaignDrawer';

const createStore = (wizardStep = 1) =>
  configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
      inventory: inventoryReducer,
    },
    preloadedState: {
      workflow: {
        showCampaignDrawer: true,
        campaignWizardStep: wizardStep,
        editingCampaignId: null,
        liquidationCycles: [],
        liquidationAutomations: [],
        automationRuns: [],
        loading: false,
        error: null,
        workflowSubTab: 'builder',
        runsFilter: 'all',
        selectedAutomationTemplate: '',
        stageGates: [],
        categoryFilter: '',
        maxRslFilter: 0.20,
        minCasesFilter: 10,
        explicitLotIds: [],
        excludedLotIds: [],
        selectorMode: 'automatic',
        showPreFlightModal: false,
        previewHtml: null,
        previewLoading: false,
        selectedCycleId: null,
        selectedRunDetails: null,
        showRunDetailsModal: false,
      },
    } as any,
  });

describe('CampaignDrawer — 3-step wizard (issue #01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Seam A ────────────────────────────────────────────────────────────────
  it('A: renders exactly 3 step tabs — Campaign, Strategy, Rules & Filters', () => {
    render(
      <Provider store={createStore(1)}>
        <CampaignDrawer supplierId="sup-1" />
      </Provider>,
    );

    expect(screen.getByText(/📅 Campaign/i)).toBeInTheDocument();
    expect(screen.getByText(/🤖 Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/📦 Rules & Filters/i)).toBeInTheDocument();
    expect(screen.queryByText(/Email Notification/i)).not.toBeInTheDocument();
  });

  // ── Seam B ────────────────────────────────────────────────────────────────
  it('B: on step 3 the primary footer button reads "Save Campaign & Strategy", not "Next Step"', () => {
    render(
      <Provider store={createStore(3)}>
        <CampaignDrawer supplierId="sup-1" />
      </Provider>,
    );

    expect(
      screen.getByRole('button', { name: /Save Campaign & Strategy/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Next Step/i }),
    ).not.toBeInTheDocument();
  });

  // ── Seam C ────────────────────────────────────────────────────────────────
  it('C: Back button is absent on step 1, and present on step 3', () => {
    const { unmount } = render(
      <Provider store={createStore(1)}>
        <CampaignDrawer supplierId="sup-1" />
      </Provider>,
    );
    expect(screen.queryByRole('button', { name: /^Back$/i })).not.toBeInTheDocument();
    unmount();

    render(
      <Provider store={createStore(3)}>
        <CampaignDrawer supplierId="sup-1" />
      </Provider>,
    );
    expect(screen.getByRole('button', { name: /^Back$/i })).toBeInTheDocument();
  });

  // ── Seam D ────────────────────────────────────────────────────────────────
  it('D: "Email Notification" text does not appear anywhere in the drawer', () => {
    render(
      <Provider store={createStore(1)}>
        <CampaignDrawer supplierId="sup-1" />
      </Provider>,
    );
    expect(screen.queryByText(/Email Notification/i)).not.toBeInTheDocument();
  });
});

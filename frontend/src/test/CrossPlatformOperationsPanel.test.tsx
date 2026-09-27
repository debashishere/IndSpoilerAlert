import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import workflowReducer from '../store/slices/workflowSlice';
import { InventoryListView } from '../views/InventoryListView';

function createTestStore() {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
    },
  });
}

describe('Cross-Platform Operations Panel', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ ok: true, status: 200, json: async () => ({}) }) as Response
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a Cross-Platform Operations tab pill in the switcher bar', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    const operationsTab = screen.getByRole('tab', { name: /cross-platform operations/i });
    expect(operationsTab).toBeInTheDocument();
  });

  it('shows 4 telemetry card titles when the Operations tab is selected', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

    expect(screen.getByText('Ingestion Pipeline Velocity')).toBeInTheDocument();
    expect(screen.getByText('Buyer Comms Engagement')).toBeInTheDocument();
    expect(screen.getByText('Workflow Campaign Yield')).toBeInTheDocument();
    expect(screen.getByText('Cold Chain & Compliance')).toBeInTheDocument();
  });

  it('does not render Coming Soon badge and navigates to logistics on Cold Chain card click', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cold Chain & Compliance'));
    expect(store.getState().core.activeTab).toBe('logistics');
  });

  it('dispatches active tab change to ingestion when clicking Ingestion Pipeline Velocity card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Ingestion Pipeline Velocity'));

    expect(store.getState().core.activeTab).toBe('ingestion');
  });

  it('dispatches active tab change to inbox when clicking Buyer Comms Engagement card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Buyer Comms Engagement'));

    expect(store.getState().core.activeTab).toBe('inbox');
  });

  it('dispatches active tab change to workflows when clicking Workflow Campaign Yield card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Workflow Campaign Yield'));

    expect(store.getState().core.activeTab).toBe('workflows');
  });
});

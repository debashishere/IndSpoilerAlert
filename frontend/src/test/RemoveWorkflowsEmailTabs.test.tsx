import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import { WorkflowsView } from '../components/WorkflowsView';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
    },
  });

describe('Issue #04: Remove Email Builder and Send Broadcast sub-tabs from WorkflowsView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('should render WorkflowsView without Email Builder or Send Broadcast sub-tabs', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Remaining sub-tabs MUST be present
    expect(screen.getByRole('button', { name: /campaign builder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved campaigns/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /runs & history/i })).toBeInTheDocument();

    // Removed sub-tabs MUST NOT be present
    expect(screen.queryByRole('button', { name: /email builder/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send broadcast/i })).not.toBeInTheDocument();
  });
});

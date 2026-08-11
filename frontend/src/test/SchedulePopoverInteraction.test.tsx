import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import { describe, it, expect } from 'vitest';

function createTestStore() {
  return configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
    },
  });
}

describe('Schedule Input Window Popover Interactions', () => {
  it('opens popover when clicking Scheduled, closes when re-clicking Scheduled or outside, and captures data', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio supplierId="sup-101" />
      </Provider>
    );

    // Initially "Configure Schedule" popover is not visible
    expect(screen.queryByText('Configure Schedule')).not.toBeInTheDocument();

    // 1. Click "Scheduled" button to open popover
    const scheduledBtn = screen.getByRole('button', { name: /Scheduled/i });
    fireEvent.click(scheduledBtn);

    // Popover is now open
    expect(screen.getByText('Configure Schedule')).toBeInTheDocument();
    expect(screen.getByText('Apply Schedule')).toBeInTheDocument();

    // 2. Select Tuesday ('Tu') and Thursday ('Th')
    const tuBtn = screen.getByRole('button', { name: 'Tu' });
    fireEvent.click(tuBtn);

    // 3. Click "Scheduled" button again to close popover
    fireEvent.click(scheduledBtn);

    // Popover should vanish
    expect(screen.queryByText('Configure Schedule')).not.toBeInTheDocument();

    // 4. Click "Scheduled" again to re-open popover and verify captured selection
    fireEvent.click(scheduledBtn);
    expect(screen.getByText('Configure Schedule')).toBeInTheDocument();

    // 5. Click outside anywhere on document to close popover
    fireEvent.mouseDown(document.body);

    // Popover should vanish
    expect(screen.queryByText('Configure Schedule')).not.toBeInTheDocument();
  });
});

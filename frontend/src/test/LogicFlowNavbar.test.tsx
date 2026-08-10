import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LogicFlowNavbar, type FlowStage } from '../components/LogicFlowNavbar';

describe('LogicFlowNavbar - Slice 1 & 2: Navigation, Stage Nodes & Escalation Handler', () => {
  const sampleStages: FlowStage[] = [
    { id: '1', label: '1. Select Strategy', detail: 'Liquidation Rules' },
    { id: '2', label: '2. Matching Inventory', detail: '3 Lots Selected' },
    { id: '3', label: '3. Target Buyers', detail: '12 Target Roster' },
    { id: '4', label: '4. Email Template', detail: 'Custom Dynamic' },
  ];

  test('renders sticky container shell with position sticky and top-0 styling', () => {
    const { container } = render(
      <LogicFlowNavbar
        stages={sampleStages}
        activeStageId="1"
        onStageSelect={vi.fn()}
      />
    );

    const navbarElement = container.querySelector('[data-testid="logic-flow-navbar"]');
    expect(navbarElement).toBeInTheDocument();
    expect(navbarElement?.className).toMatch(/sticky/);
  });

  test('renders stage progression nodes and highlights active stage', () => {
    render(
      <LogicFlowNavbar
        stages={sampleStages}
        activeStageId="2"
        onStageSelect={vi.fn()}
      />
    );

    expect(screen.getByText('1. Select Strategy')).toBeInTheDocument();
    expect(screen.getByText('2. Matching Inventory')).toBeInTheDocument();
    expect(screen.getByText('3. Target Buyers')).toBeInTheDocument();
    expect(screen.getByText('4. Email Template')).toBeInTheDocument();

    const activeNode = screen.getByTestId('stage-node-2');
    expect(activeNode).toHaveAttribute('data-active', 'true');

    const inactiveNode = screen.getByTestId('stage-node-1');
    expect(inactiveNode).toHaveAttribute('data-active', 'false');
  });

  test('triggers onStageSelect callback when a stage node is clicked', () => {
    const handleStageSelect = vi.fn();
    render(
      <LogicFlowNavbar
        stages={sampleStages}
        activeStageId="1"
        onStageSelect={handleStageSelect}
      />
    );

    const stage3Node = screen.getByTestId('stage-node-3');
    fireEvent.click(stage3Node);

    expect(handleStageSelect).toHaveBeenCalledTimes(1);
    expect(handleStageSelect).toHaveBeenCalledWith('3');
  });

  test('renders + Add Escalation Stage button and invokes callback when clicked', () => {
    const handleAddEscalationStage = vi.fn();
    render(
      <LogicFlowNavbar
        stages={sampleStages}
        activeStageId="1"
        onStageSelect={vi.fn()}
        onAddEscalationStage={handleAddEscalationStage}
      />
    );

    const addBtn = screen.getByTestId('add-escalation-stage-button');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent('+ Add Escalation Stage');

    fireEvent.click(addBtn);
    expect(handleAddEscalationStage).toHaveBeenCalledTimes(1);
  });
});

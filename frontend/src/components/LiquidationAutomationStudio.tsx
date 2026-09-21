import React from 'react';
import {
  WorkflowStudioOrchestrator,
  DYNAMIC_TOKENS_LIST,
  DEFAULT_EMAIL_BODY_HTML,
  TIER_COLOR,
  formatWaitTime,
  compileFrontendCron,
  format12HourTime,
  getStageBuyerCount,
  getStageValidationErrors,
  resolveStagesWithBuyerLists,
  StageAudiencePicker
} from './domain/workflows/studio';
import type {
  BuyerMode,
  BuyerEntry,
  Stage,
  TemplateDefinition,
  EmailBlockType,
  EmailColumnConfig,
  EmailBlock,
  LiquidationAutomationStudioProps
} from './domain/workflows/studio';

// Re-export domain contracts, helpers, and types for backward compatibility (ADR 0050)
export {
  DYNAMIC_TOKENS_LIST,
  DEFAULT_EMAIL_BODY_HTML,
  TIER_COLOR,
  formatWaitTime,
  compileFrontendCron,
  format12HourTime,
  getStageBuyerCount,
  getStageValidationErrors,
  resolveStagesWithBuyerLists,
  StageAudiencePicker
};

export type {
  BuyerMode,
  BuyerEntry,
  Stage,
  TemplateDefinition,
  EmailBlockType,
  EmailColumnConfig,
  EmailBlock,
  LiquidationAutomationStudioProps
};

// ─── Main Component (Backward Compatibility Facade -> WorkflowStudioOrchestrator) ───

export const LiquidationAutomationStudio: React.FC<LiquidationAutomationStudioProps> = (props) => {
  return <WorkflowStudioOrchestrator {...props} />;
};

export default LiquidationAutomationStudio;

import { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Calculator, 
  Plus, 
  Info 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  addSemanticRule, 
  removeSemanticRule,
  addSalesSemanticRule,
  removeSalesSemanticRule,
  type SemanticRule
} from '../../../store/slices/ingestionSlice';
import { 
  computeMetricForColumn, 
  type StatisticalOperation 
} from '../../../utils/statisticalCalculations';

export interface SemanticRulesEditorProps {
  rawHeaders?: string[];
  rawGrid?: string[][];
  pipelineType?: 'inventory' | 'sales';
}

export const SemanticRulesEditor = ({
  rawHeaders = [],
  rawGrid,
  pipelineType = 'inventory',
}: SemanticRulesEditorProps) => {
  const dispatch = useAppDispatch();
  const isSales = pipelineType === 'sales';

  const semanticRules = useAppSelector((state) =>
    isSales ? state.ingestion.salesSemanticRules : state.ingestion.inventorySemanticRules
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newRuleSource, setNewRuleSource] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const [newRuleTransform, setNewRuleTransform] = useState('');

  const isCalculationTransform = [
    'percentage',
    'mean',
    'median',
    'mode',
  ].includes(newRuleTransform);

  // Live statistical metric preview for the currently selected column and transform
  const liveMetric = useMemo(() => {
    if (!rawGrid || !newRuleSource || !isCalculationTransform) return null;
    return computeMetricForColumn(
      rawGrid,
      newRuleSource,
      newRuleTransform as StatisticalOperation
    );
  }, [rawGrid, newRuleSource, newRuleTransform, isCalculationTransform]);

  const handleAddRule = () => {
    if (!newRuleSource || !newRuleTarget) return;

    const payload: SemanticRule = {
      sourceKey: newRuleSource,
      targetKey: newRuleTarget.trim(),
      transform: newRuleTransform || undefined,
    };

    if (isSales) {
      dispatch(addSalesSemanticRule(payload));
    } else {
      dispatch(addSemanticRule(payload));
    }

    setNewRuleSource('');
    setNewRuleTarget('');
    setNewRuleTransform('');
  };

  const handleRemoveRule = (idx: number) => {
    if (isSales) {
      dispatch(removeSalesSemanticRule(idx));
    } else {
      dispatch(removeSemanticRule(idx));
    }
  };

  return (
    <div className="w-full bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all mb-3">
      {/* Top Banner Header with Collapse Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                Dynamic Semantic Attribute Translation Rules
              </h4>
              <span className="text-[10px] font-semibold bg-blue-100/70 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {semanticRules.length} {semanticRules.length === 1 ? 'Rule' : 'Rules'} Active
              </span>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                {isSales ? 'Sales Pipeline' : 'Inventory Pipeline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              Map unmapped CSV columns to dynamic semantic attributes with unit conversions or statistical calculations (mean, median, mode, %).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 text-xs flex items-center gap-1 cursor-pointer transition-colors"
          title={isCollapsed ? 'Expand Rules Editor' : 'Collapse Rules Editor'}
        >
          <span className="text-[11px] font-medium">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          {/* Configured Rules Table */}
          {semanticRules.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/75 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Source Header</th>
                    <th className="p-2.5">Target Attribute Key</th>
                    <th className="p-2.5">Transformation / Calculation</th>
                    <th className="p-2.5">Computed Metric Preview</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {semanticRules.map((rule, idx) => {
                    const metric = rawGrid && rule.transform && ['percentage', 'mean', 'median', 'mode'].includes(rule.transform)
                      ? computeMetricForColumn(rawGrid, rule.sourceKey, rule.transform as StatisticalOperation)
                      : null;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                        <td className="p-2.5 font-mono text-[11px] font-bold">
                          {rule.sourceKey}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {rule.targetKey}
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {['percentage', 'mean', 'median', 'mode'].includes(rule.transform || '') && (
                              <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {rule.transform || 'None (raw)'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {metric ? (
                            <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {metric.formatted}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Inline Rule Builder Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`source-col-select-${pipelineType}`} className="sr-only">
                Source Column
              </label>
              <select
                id={`source-col-select-${pipelineType}`}
                aria-label="Source Column"
                className="w-full h-9 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                value={newRuleSource}
                onChange={(e) => setNewRuleSource(e.target.value)}
              >
                <option value="">-- Select Source Column --</option>
                {rawHeaders.map((header, colIdx) => (
                  <option key={colIdx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`target-key-input-${pipelineType}`} className="sr-only">
                Target Key
              </label>
              <input
                id={`target-key-input-${pipelineType}`}
                type="text"
                className="w-full h-9 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Target Key (e.g. minStorageTempF, avgPrice)"
                value={newRuleTarget}
                onChange={(e) => setNewRuleTarget(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label htmlFor={`transform-select-${pipelineType}`} className="sr-only">
                Transformation or Calculation
              </label>
              <select
                id={`transform-select-${pipelineType}`}
                aria-label="Transformation or Calculation"
                className="w-full h-9 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                value={newRuleTransform}
                onChange={(e) => setNewRuleTransform(e.target.value)}
              >
                <optgroup label="Standard Transformations">
                  <option value="">No Transform (raw string)</option>
                  <option value="celsiusToFahrenheit">celsiusToFahrenheit (°C to °F)</option>
                  <option value="toBoolean">toBoolean</option>
                  <option value="toNumber">toNumber</option>
                  <option value="toStringList">toStringList</option>
                </optgroup>
                <optgroup label="Statistical & Calculation Options">
                  <option value="percentage">Percentage of Total (%)</option>
                  <option value="mean">Mean / Average</option>
                  <option value="median">Median</option>
                  <option value="mode">Mode (Most Frequent)</option>
                </optgroup>
              </select>
            </div>

            <button
              type="button"
              className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                newRuleSource && newRuleTarget
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs active:scale-[0.98]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              onClick={handleAddRule}
              disabled={!newRuleSource || !newRuleTarget}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Rule</span>
            </button>
          </div>

          {/* Live Calculation Preview Banner */}
          {liveMetric && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">Live Metric Preview:</span>
                <span className="font-mono font-bold">{liveMetric.formatted}</span>
                {liveMetric.details && (
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">({liveMetric.details})</span>
                )}
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Real-time computation
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

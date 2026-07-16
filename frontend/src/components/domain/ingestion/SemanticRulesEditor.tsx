import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addSemanticRule, removeSemanticRule } from '../../../store/slices/ingestionSlice';

export interface SemanticRulesEditorProps {
  rawHeaders?: string[];
}

export const SemanticRulesEditor = ({ rawHeaders = [] }: SemanticRulesEditorProps) => {
  const dispatch = useAppDispatch();
  const semanticRules = useAppSelector((state) => state.ingestion.inventorySemanticRules);

  const [newRuleSource, setNewRuleSource] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const [newRuleTransform, setNewRuleTransform] = useState('');

  const handleAddRule = () => {
    if (!newRuleSource || !newRuleTarget) return;
    dispatch(
      addSemanticRule({
        sourceKey: newRuleSource,
        targetKey: newRuleTarget,
        transform: newRuleTransform,
      })
    );
    setNewRuleSource('');
    setNewRuleTarget('');
    setNewRuleTransform('');
  };

  return (
    <div
      style={{
        marginTop: '24px',
        padding: '16px',
        background: 'hsl(var(--card-bg))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
      }}
    >
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
        Dynamic Semantic Attribute Translation Rules
      </h4>
      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
        Map unmapped CSV columns to dynamic semantic attributes with optional type & unit conversions.
      </p>

      {semanticRules.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <table className="preview-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Source Header</th>
                <th>Target Attribute Key</th>
                <th>Transformation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {semanticRules.map((rule, idx) => (
                <tr key={idx}>
                  <td>
                    <code>{rule.sourceKey}</code>
                  </td>
                  <td>
                    <code>{rule.targetKey}</code>
                  </td>
                  <td>
                    <span className="badge badge-info">{rule.transform || 'None (raw)'}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => dispatch(removeSemanticRule(idx))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="input"
          style={{ flex: 1, minWidth: '150px' }}
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

        <input
          type="text"
          className="input"
          style={{ flex: 1, minWidth: '150px' }}
          placeholder="Target Key (e.g. minStorageTempF)"
          value={newRuleTarget}
          onChange={(e) => setNewRuleTarget(e.target.value)}
        />

        <select
          className="input"
          style={{ flex: 1, minWidth: '150px' }}
          value={newRuleTransform}
          onChange={(e) => setNewRuleTransform(e.target.value)}
        >
          <option value="">No Transform (raw string)</option>
          <option value="celsiusToFahrenheit">celsiusToFahrenheit</option>
          <option value="toBoolean">toBoolean</option>
          <option value="toNumber">toNumber</option>
          <option value="toStringList">toStringList</option>
        </select>

        <button
          className="btn btn-primary"
          type="button"
          onClick={handleAddRule}
          disabled={!newRuleSource || !newRuleTarget}
        >
          + Add Rule
        </button>
      </div>
    </div>
  );
};

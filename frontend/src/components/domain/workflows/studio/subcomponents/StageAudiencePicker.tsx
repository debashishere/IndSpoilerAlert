import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../../store/hooks';
import { selectBuyerLists, ensureDefaultBuyerLists } from '../../../../../store/slices/coreSlice';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  X,
  AlertTriangle,
  Check,
  Plus,
} from 'lucide-react';
import type { Stage, BuyerEntry } from '../types/studio.types';
import { TIER_COLOR } from '../constants/studioConstants';
import { getStageBuyerCount, genId } from '../utils/studioCalculations';

export interface StageAudiencePickerProps {
  stage: Stage;
  allBuyers: any[];
  onChange: (updates: Partial<Stage>) => void;
  onInspectSegment?: (segment: string) => void;
}

export const StageAudiencePicker: React.FC<StageAudiencePickerProps> = ({
  stage,
  allBuyers,
  onChange,
  onInspectSegment,
}) => {
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch {
    reduxBuyerLists = [];
  }
  const isListMode = stage.buyerMode === 'list' || stage.buyerMode === 'segment';

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState<BuyerEntry['tier']>('custom');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredBuyers = allBuyers.filter(b => {
    const q = search.toLowerCase();
    const name = (b.companyName || b.name || '').toLowerCase();
    const email = (b.email || '').toLowerCase();
    return !search || name.includes(q) || email.includes(q);
  });

  const addFromRegistry = (b: any) => {
    const id = b._id || b.id || b.email;
    if (stage.customBuyers.some(s => s.id === id)) return;
    onChange({
      customBuyers: [...stage.customBuyers, {
        id,
        name: b.companyName || b.name || b.email,
        email: b.email || '',
        tier: b.tier || 'tier1',
      }],
    });
  };

  const addNewBuyer = () => {
    if (!newEmail || !newName) return;
    onChange({
      customBuyers: [...stage.customBuyers, {
        id: genId(),
        name: newName,
        email: newEmail,
        tier: newTier,
        isNew: true,
      }],
    });
    setNewName(''); setNewEmail(''); setNewTier('custom'); setShowAddForm(false);
  };

  const removeBuyer = (id: string) => {
    onChange({ customBuyers: stage.customBuyers.filter(b => b.id !== id) });
  };

  const inputSt: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border-color))',
    borderRadius: '8px',
    minHeight: '40px',
    padding: '9px 14px',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '4px', background: 'hsl(var(--bg-card-hover) / 0.5)', borderRadius: '10px', padding: '4px', border: '1px solid hsl(var(--border-color))' }}>
        {(['list', 'custom'] as const).map(mode => {
          const isActive = mode === 'list' ? isListMode : stage.buyerMode === 'custom';
          return (
            <button
              key={mode}
              type="button"
              data-testid={`stage-audience-mode-${mode}`}
              onClick={() => onChange({ buyerMode: mode })}
              style={{
                flex: 1,
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive
                  ? 'hsl(var(--primary))'
                  : 'transparent',
                color: isActive ? 'white' : 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {mode === 'list'
                ? <><Users size={14} /> Buyer List</>
                : <><UserPlus size={14} /> Custom List</>
              }
            </button>
          );
        })}
      </div>

      {/* Buyer List mode */}
      {isListMode && (() => {
        const effectiveBuyerLists = ensureDefaultBuyerLists(reduxBuyerLists);
        const selectedListObj = effectiveBuyerLists.find(l => l._id === (stage.buyerListId || stage.buyerSegment) || l.type === (stage.buyerListId || stage.buyerSegment));

        const getListCount = (list: any) => {
          if (!list) return 0;
          if (Array.isArray(list.buyerIds)) return list.buyerIds.length;
          if (Array.isArray(allBuyers) && allBuyers.length > 0) {
            const isSec = list.type === 'secondary' || list._id === 'list-secondary' || (list.name || '').toLowerCase().includes('secondary');
            const isPrim = list.type === 'primary' || list._id === 'list-primary' || (list.name || '').toLowerCase().includes('primary');
            if (isSec) {
              const count = allBuyers.filter((b: any) => {
                const t = String(b.tier ?? '').toLowerCase();
                return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators' || t === '2';
              }).length;
              if (count > 0) return count;
            } else if (isPrim) {
              const count = allBuyers.filter((b: any) => {
                const t = String(b.tier ?? '').toLowerCase();
                return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers' || t === '1';
              }).length;
              if (count > 0) return count;
            }
          }
          return 0;
        };

        const listBuyerCount = selectedListObj ? getListCount(selectedListObj) : getStageBuyerCount(stage, effectiveBuyerLists, allBuyers);
        const isListConfigured = !!(stage.buyerListId || stage.buyerSegment) && listBuyerCount > 0;

        return (
          <div>
            <label style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Target Buyer List</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={stage.buyerListId || stage.buyerSegment || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    onChange({ buyerMode: 'custom' });
                  } else {
                    const selected = effectiveBuyerLists.find(l => l._id === val || l.type === val);
                    onChange({
                      buyerMode: 'list',
                      buyerListId: selected ? selected._id : val,
                      buyerListName: selected ? selected.name : (val === 'primary' ? 'Primary Buyers' : val === 'secondary' ? 'Secondary Liquidators' : val),
                      buyerSegment: val,
                    });
                  }
                }}
                style={{ ...inputSt, padding: '8px 10px', flex: 1 }}
              >
                {effectiveBuyerLists.length === 0 ? (
                  <option value="">No buyer lists found (Create lists in Buyer Registry)</option>
                ) : (
                  effectiveBuyerLists.map(list => {
                    const count = getListCount(list);
                    const isEmpty = count === 0;
                    return (
                      <option
                        key={list._id || list.type}
                        value={list._id || list.type}
                        disabled={isEmpty}
                      >
                        {list.name} — {count} buyers{isEmpty ? ' (Error: No buyers configured)' : ''}
                      </option>
                    );
                  })
                )}
                {stage.buyerListId && !effectiveBuyerLists.some(l => l._id === stage.buyerListId || l.type === stage.buyerListId) && (
                  <option value={stage.buyerListId} disabled>
                    {stage.buyerListName || 'Select a list'} — 0 buyers (Error: No buyers configured)
                  </option>
                )}
                <option value="custom">— Custom selection —</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!isListConfigured}
                onClick={() => isListConfigured && onInspectSegment && onInspectSegment(stage.buyerListId || stage.buyerSegment || '')}
                title={
                  !(stage.buyerListId || stage.buyerSegment)
                    ? 'No buyer list selected'
                    : listBuyerCount === 0
                      ? 'Selected buyer list has 0 buyers configured'
                      : 'Inspect Buyer Data (Name, Email, Reg Date)'
                }
                style={{
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '40px',
                  minWidth: '40px',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  color: 'hsl(var(--primary))',
                  cursor: isListConfigured ? 'pointer' : 'not-allowed',
                  opacity: isListConfigured ? 1 : 0.45,
                  transition: 'all 0.15s ease',
                }}
              >
                <Eye size={16} />
              </button>
            </div>

            {listBuyerCount === 0 && (
              <div
                data-testid="zero-buyer-error-banner"
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'hsl(var(--error) / 10%)',
                  border: '1px solid hsl(var(--error) / 30%)',
                  borderRadius: '6px',
                  color: 'hsl(var(--error))',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={14} />
                <span>
                  Error: No buyers configured in {selectedListObj?.name || stage.buyerListName || 'selected list'}. List is empty (0 buyers) and unselectable.
                </span>
              </div>
            )}

            <p style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '5px' }}>
              Targets buyers in this list. Click the Eye button to inspect roster data (Name, Email, Registration Date).
            </p>
          </div>
        );
      })()}

      {/* Custom List mode */}
      {stage.buyerMode === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Selected pills */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                {stage.customBuyers.length} buyer{stage.customBuyers.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: showAddForm ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                  border: `1px solid ${showAddForm ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border-color))'}`,
                  color: showAddForm ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <UserPlus size={10} /> Add New
              </button>
            </div>

            {stage.customBuyers.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', padding: '8px 10px', background: 'hsl(var(--bg-card))', borderRadius: '6px', border: '1px dashed hsl(var(--border-color))', textAlign: 'center' }}>
                No buyers selected — search below or add new
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {stage.customBuyers.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: `${TIER_COLOR[b.tier] || 'hsl(var(--primary))'}18`,
                    border: `1px solid ${TIER_COLOR[b.tier] || 'hsl(var(--primary))'}44`,
                    borderRadius: '16px', padding: '3px 8px 3px 6px',
                  }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: TIER_COLOR[b.tier] || 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: 'hsl(var(--text-primary))', flexShrink: 0 }}>
                      {b.name.charAt(0)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                      {b.name}
                      {b.isNew && <span style={{ marginLeft: '3px', fontSize: '9px', color: 'hsl(var(--success))' }}>NEW</span>}
                    </span>
                    <button type="button" onClick={() => removeBuyer(b.id)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new buyer mini-form */}
          {showAddForm && (
            <div style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><UserPlus size={11} /> New Buyer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input type="text" placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} style={inputSt} />
                <input type="email" placeholder="Email *" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputSt} />
              </div>
              <select value={newTier} onChange={e => setNewTier(e.target.value as BuyerEntry['tier'])} style={inputSt}>
                <option value="tier1">Tier 1 — Primary Retailer</option>
                <option value="tier2">Tier 2 — Regional</option>
                <option value="liquidator">Liquidator</option>
                <option value="custom">Custom</option>
              </select>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-secondary))', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={addNewBuyer} disabled={!newName || !newEmail} style={{ background: newName && newEmail ? 'hsl(var(--primary))' : 'hsl(var(--border-color))', border: 'none', color: newName && newEmail ? 'white' : 'hsl(var(--text-muted))', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: newName && newEmail ? 'pointer' : 'not-allowed' }}>
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Registry search dropdown */}
          <div ref={dropRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                placeholder={`Search ${allBuyers.length} registered buyers…`}
                value={search}
                onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                style={{ ...inputSt, paddingLeft: '28px' }}
              />
            </div>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 40,
                background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                maxHeight: '180px', overflowY: 'auto',
              }}>
                {filteredBuyers.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                    {allBuyers.length === 0 ? 'No buyers in registry' : 'No matches found'}
                  </div>
                ) : filteredBuyers.map(b => {
                  const id = b._id || b.id || b.email;
                  const alreadyAdded = stage.customBuyers.some(s => s.id === id);
                  const tier = b.tier || 'tier1';
                  return (
                    <div
                      key={id}
                      onClick={() => !alreadyAdded && addFromRegistry(b)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', cursor: alreadyAdded ? 'default' : 'pointer',
                        borderBottom: '1px solid hsl(var(--bg-card))',
                        opacity: alreadyAdded ? 0.5 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${TIER_COLOR[tier]}22`, border: `1px solid ${TIER_COLOR[tier]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: TIER_COLOR[tier] }}>
                          {(b.companyName || b.name || 'B').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{b.companyName || b.name || b.email}</div>
                          <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{b.email}</div>
                        </div>
                      </div>
                      {alreadyAdded
                        ? <Check size={13} color="hsl(var(--success))" />
                        : <Plus size={13} color="hsl(var(--primary))" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

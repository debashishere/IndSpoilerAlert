import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import {
  closeAwardModal,
  setAwardedQtyInput,
  setEmailDraftSubject,
  setEmailDraftBody,
} from '../../store/slices/inventorySlice';
import { awardBidThunk } from '../../services/inventoryService';

export const AwardModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    showAwardModal,
    selectedBidToAward,
    selectedLotForAward,
    awardedQtyInput,
    emailDraftSubject,
    emailDraftBody,
    txLoading,
  } = useSelector((state: RootState) => state.inventory.modals);

  if (!showAwardModal || !selectedBidToAward) return null;

  const maxAwardQty = Math.min(
    selectedBidToAward.quantity || 100,
    selectedLotForAward?.availableQty || selectedBidToAward.quantity || 100
  );
  const isAwardQtyInvalid = awardedQtyInput <= 0 || awardedQtyInput > maxAwardQty;

  const handleConfirmAward = () => {
    if (!selectedLotForAward?._id || !selectedBidToAward._id) return;
    dispatch(
      awardBidThunk({
        lotId: selectedLotForAward._id,
        bidId: selectedBidToAward._id,
        payload: {
          awardedQty: awardedQtyInput,
          emailSubject: emailDraftSubject,
          emailSent: emailDraftBody,
        },
      })
    );
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Confirm Award & Customize Notification</h3>
          <button className="drawer-close" onClick={() => dispatch(closeAwardModal())}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="card" style={{ padding: '12px 16px', backgroundColor: 'hsl(var(--bg-card-hover) / 40%)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>Transaction Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div>
                <strong>Buyer:</strong> {selectedBidToAward.buyerId?.companyName || 'Retail Buyer'}
              </div>
              <div>
                <strong>Bid Quantity:</strong> {selectedBidToAward.quantity} Cases
              </div>
              <div>
                <strong>Unit Price:</strong> ${(selectedBidToAward.price ?? 0).toFixed(2)}/cs
              </div>
              <div>
                <strong>Award Value:</strong> $
                {((awardedQtyInput || 0) * (selectedBidToAward.price ?? 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div className="filter-input-group" style={{ marginTop: '14px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Awarded Quantity (Cases)</label>
            <input
              type="number"
              className="filter-search"
              min="1"
              max={maxAwardQty}
              value={awardedQtyInput}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                dispatch(setAwardedQtyInput(val));

                const oldQtyStr = `- Quantity Awarded: ${selectedBidToAward.quantity} cases`;
                const newQtyStr = `- Quantity Awarded: ${val} cases`;
                const oldTotalStr = `- Total Value: $${(selectedBidToAward.quantity * (selectedBidToAward.price ?? 0)).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}`;
                const newTotalStr = `- Total Value: $${(val * (selectedBidToAward.price ?? 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}`;

                let newBody = emailDraftBody;
                if (newBody.includes(oldQtyStr)) {
                  newBody = newBody.replace(oldQtyStr, newQtyStr);
                }
                if (newBody.includes(oldTotalStr)) {
                  newBody = newBody.replace(oldTotalStr, newTotalStr);
                }
                dispatch(setEmailDraftBody(newBody));
              }}
              style={{
                border: isAwardQtyInvalid ? '1px solid hsl(var(--error))' : '1px solid hsl(var(--border-color))',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                color: isAwardQtyInvalid ? 'hsl(var(--error))' : 'hsl(var(--text-muted))',
                marginTop: '4px',
                display: 'block',
              }}
            >
              {isAwardQtyInvalid
                ? `⚠️ Quantity must be between 1 and ${maxAwardQty} (Available Lot Qty: ${selectedLotForAward?.availableQty || 0}).`
                : `Modify to award a partial quantity. Maximum awardable: ${maxAwardQty} cases.`}
            </span>
          </div>

          <div className="filter-input-group" style={{ marginTop: '14px' }}>
            <label>Email Subject</label>
            <input
              type="text"
              className="filter-search"
              value={emailDraftSubject}
              onChange={(e) => dispatch(setEmailDraftSubject(e.target.value))}
            />
          </div>

          <div className="filter-input-group" style={{ marginTop: '14px' }}>
            <label>Email Body (Edit Logistics & Dock Coordination Details)</label>
            <textarea
              className="email-textarea"
              rows={12}
              value={emailDraftBody}
              onChange={(e) => dispatch(setEmailDraftBody(e.target.value))}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => dispatch(closeAwardModal())} disabled={txLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirmAward}
            disabled={txLoading || isAwardQtyInvalid}
          >
            {txLoading ? 'Confirming...' : 'Confirm Award & Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

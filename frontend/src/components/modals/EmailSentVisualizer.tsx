import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, X } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { closeEmailSentVisualizer } from '../../store/slices/inventorySlice';

export const EmailSentVisualizer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showEmailSentVisualizer, visualizerEmailDetails } = useSelector(
    (state: RootState) => state.inventory.modals
  );

  if (!showEmailSentVisualizer || !visualizerEmailDetails) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ border: '1px solid hsl(var(--success) / 40%)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} style={{ color: 'hsl(var(--success))' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
              Transactional Email Sent Successfully!
            </h3>
          </div>
          <button className="drawer-close" onClick={() => dispatch(closeEmailSentVisualizer())}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ backgroundColor: 'hsl(var(--bg-main) / 20%)' }}>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '14px' }}>
            The closeout award transaction has been logged in MongoDB, and the following notification was sent to the retail buyer:
          </p>

          {visualizerEmailDetails.previewUrl && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'hsl(var(--primary) / 8%)',
                border: '1px solid hsl(var(--primary) / 30%)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'hsl(var(--text-primary))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <span>
                📬 <strong>Real Email Sent (Ethereal test inbox):</strong>
              </span>
              <a
                href={visualizerEmailDetails.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'underline' }}
              >
                Preview Sent Email Online
              </a>
            </div>
          )}

          <div className="email-visualizer-envelope">
            <div className="email-visualizer-header">
              <div>
                <strong>From:</strong> Spoiler Alert Platform &lt;eveline94@ethereal.email&gt;
              </div>
              <div>
                <strong>To:</strong> Logistics Operations &lt;ops@
                {(visualizerEmailDetails.to || '').toLowerCase().replace(/\s+/g, '')}.com&gt;
              </div>
              <div>
                <strong>Date:</strong> {visualizerEmailDetails.date}
              </div>
              <div>
                <strong>Subject:</strong> {visualizerEmailDetails.subject}
              </div>
            </div>
            <div className="email-visualizer-body">{visualizerEmailDetails.body}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-success" onClick={() => dispatch(closeEmailSentVisualizer())}>
            Close Outbox Preview
          </button>
        </div>
      </div>
    </div>
  );
};

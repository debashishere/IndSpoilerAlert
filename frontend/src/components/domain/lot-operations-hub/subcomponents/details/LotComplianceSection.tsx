import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';

interface LotComplianceSectionProps {
  lot: any;
  complianceFile: File | null;
  onSetComplianceFile: (file: File | null) => void;
  onUploadComplianceDoc: () => void;
  onUpdateLotCompliance: (lotId: string, updates: any) => void;
}

export const LotComplianceSection: React.FC<LotComplianceSectionProps> = ({
  lot,
  complianceFile,
  onSetComplianceFile,
  onUploadComplianceDoc,
  onUpdateLotCompliance,
}) => {
  return (
    <div className="lot-hub-card">
      <div className="lot-hub-card-header">
        <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} className="text-[hsl(var(--secondary))]" />
          <span>Regulatory Compliance & Documents</span>
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold">
          <input
            type="checkbox"
            checked={!!lot.fdaRegulated}
            onChange={(e) => onUpdateLotCompliance(lot._id, { fdaRegulated: e.target.checked })}
            className="w-4 h-4 rounded text-[hsl(var(--primary))]"
          />
          <span>FDA Regulated Lot (Requires COA / Batch Records)</span>
        </label>

        {lot.fdaRegulated && (
          <div className="grid grid-cols-2 gap-3 bg-[hsl(var(--bg-main))] p-3 rounded-lg border border-[hsl(var(--border-color))]">
            <div>
              <span className="text-xs text-[hsl(var(--text-muted))]">Min Storage Temp (°F)</span>
              <input
                type="number"
                className="form-input mt-1 px-2.5 py-1.5 text-xs w-full rounded border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-card))]"
                value={lot.temperatureMin ?? ''}
                onChange={(e) =>
                  onUpdateLotCompliance(lot._id, {
                    temperatureMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 34"
              />
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--text-muted))]">Max Storage Temp (°F)</span>
              <input
                type="number"
                className="form-input mt-1 px-2.5 py-1.5 text-xs w-full rounded border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-card))]"
                value={lot.temperatureMax ?? ''}
                onChange={(e) =>
                  onUpdateLotCompliance(lot._id, {
                    temperatureMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 40"
              />
            </div>
          </div>
        )}

        {/* Upload & List Docs */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[hsl(var(--text-secondary))]">Attached Certificates:</span>
          {lot.complianceDocs && lot.complianceDocs.length > 0 ? (
            lot.complianceDocs.map((doc: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--bg-main))] rounded-md border border-[hsl(var(--border-color))]"
              >
                <FileText size={16} className="text-[hsl(var(--primary))]" />
                <span className="flex-1 text-xs">{doc.fileName || 'COA Document.pdf'}</span>
                <span className="badge badge-outline-primary text-[10px] px-1.5 py-0.5">{doc.docType || 'COA'}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[hsl(var(--text-muted))] italic">No regulatory documentation uploaded yet.</p>
          )}

          <div className="flex gap-2 mt-1.5">
            <input
              type="file"
              id={`coa-upload-${lot._id}`}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSetComplianceFile(e.target.files[0]);
                }
              }}
            />
            <label
              htmlFor={`coa-upload-${lot._id}`}
              className="btn btn-secondary btn-sm flex-1 text-center cursor-pointer text-xs py-1.5"
            >
              {complianceFile ? `Selected: ${complianceFile.name}` : '+ Choose COA / Batch Record'}
            </label>
            {complianceFile && (
              <button className="btn btn-primary btn-sm text-xs px-3" onClick={onUploadComplianceDoc}>
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

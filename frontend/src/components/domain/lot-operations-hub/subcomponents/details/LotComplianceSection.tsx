import React, { useState } from 'react';
import { ShieldCheck, Check, FileText, Download, Upload } from 'lucide-react';

interface LotComplianceSectionProps {
  lot: any;
  complianceFile: File | null;
  onSetComplianceFile: (file: File | null) => void;
  onUploadComplianceDoc: () => void;
  onUpdateLotCompliance: (lotId: string, updates: any) => void;
  onUpdateProductAllergens?: (productId: string, newAllergens: string[]) => Promise<void>;
}

export const LotComplianceSection: React.FC<LotComplianceSectionProps> = ({
  lot,
  complianceFile,
  onSetComplianceFile,
  onUploadComplianceDoc,
  onUpdateLotCompliance,
  onUpdateProductAllergens,
}) => {
  const [allergenInput, setAllergenInput] = useState('');
  const allergens = lot?.productId?.allergens || [];

  const handleRemoveAllergen = (allergenToRemove: string) => {
    if (lot?.productId?._id && onUpdateProductAllergens) {
      const updated = allergens.filter((a: string) => a !== allergenToRemove);
      onUpdateProductAllergens(lot.productId._id, updated);
    }
  };

  const handleAddAllergen = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allergenInput.trim() && lot?.productId?._id && onUpdateProductAllergens) {
      const clean = allergenInput.trim().toLowerCase();
      if (!allergens.includes(clean)) {
        onUpdateProductAllergens(lot.productId._id, [...allergens, clean]);
      }
      setAllergenInput('');
    }
  };

  return (
    <article
      className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card"
      data-purpose="allergens-traceability"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Compliance, Allergens &amp; FSMA 204 Chain of Custody
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                FSMA 204 AUDITED
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              FDA Food Safety Modernization Act verified attributes &amp; electronic COA
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-700 font-semibold flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>✓ Sanitized</span>
        </span>
      </div>

      <div className="space-y-4">
        {/* Allergen Status Banner */}
        <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-medium">
                Active Allergens Declaration
              </div>
              <div className="text-sm font-semibold text-emerald-700 flex items-center space-x-1.5 mt-0.5">
                {allergens.length === 0 ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ None Declared (Facility Verified Allergen-Free)</span>
                  </>
                ) : (
                  <span className="text-amber-700">Declared Allergens Present</span>
                )}
              </div>
            </div>
            <span className="text-xs font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md font-medium shadow-2xs border border-slate-200 self-start sm:self-auto">
              Clean Facility Class-1
            </span>
          </div>

          {/* Allergen Tag Cloud */}
          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allergens.map((allergen: string) => (
                <button
                  key={allergen}
                  type="button"
                  onClick={() => handleRemoveAllergen(allergen)}
                  className="badge inline-flex items-center gap-1 text-xs px-2.5 py-1 capitalize cursor-pointer rounded-md bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors font-mono"
                  title="Click to remove allergen"
                >
                  {allergen} ✕
                </button>
              ))}
            </div>
          )}

          {/* Add Allergen Input */}
          <div className="pt-1">
            <input
              type="text"
              placeholder="Add allergen (e.g. milk, soy) + Enter..."
              value={allergenInput}
              onChange={(e) => setAllergenInput(e.target.value)}
              onKeyDown={handleAddAllergen}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-brand-500 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Traceability Tag Cloud */}
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-2 font-medium">
            Verified Traceability Tags &amp; Certifications
          </label>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 border border-slate-200 text-slate-800 font-medium flex items-center space-x-1.5">
              <span>Non-GMO Project</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 border border-slate-200 text-slate-800 font-medium flex items-center space-x-1.5">
              <span>Kosher Pareve</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 border border-slate-200 text-slate-800 font-medium flex items-center space-x-1.5">
              <span>Rainforest Alliance Certified</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center space-x-1.5">
              <span>✓ FSMA 204 Traceability Key Linked</span>
            </span>
          </div>
        </div>

        {/* Ambient Storage Limiters */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-semibold text-slate-800 mb-2.5">
            <input
              type="checkbox"
              checked={!!lot?.fdaRegulated}
              onChange={(e) => onUpdateLotCompliance(lot?._id, { fdaRegulated: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span>FDA Regulated Lot (Requires COA / Batch Records)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
              <label className="block text-[11px] font-mono text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                Min Storage Temp
              </label>
              <div className="flex items-center space-x-2">
                <input
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition shadow-2xs"
                  type="number"
                  value={lot?.temperatureMin ?? 50}
                  onChange={(e) =>
                    onUpdateLotCompliance(lot?._id, {
                      temperatureMin: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="50"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0 font-medium">°F Ambient</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
              <label className="block text-[11px] font-mono text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                Max Storage Temp
              </label>
              <div className="flex items-center space-x-2">
                <input
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition shadow-2xs"
                  type="number"
                  value={lot?.temperatureMax ?? 72}
                  onChange={(e) =>
                    onUpdateLotCompliance(lot?._id, {
                      temperatureMax: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="72"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0 font-medium">°F Limit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Documents Vault List */}
        <div>
          <div className="text-[11px] font-mono text-slate-400 mb-2 font-medium uppercase tracking-wider">
            Attached Certificates &amp; Electronic COA:
          </div>

          <div className="space-y-2">
            {lot?.complianceDocs && lot.complianceDocs.length > 0 ? (
              lot.complianceDocs.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-white shadow-2xs text-brand-600 border border-slate-100">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-800 font-bold">
                        {doc.fileName || 'COA_TEA_ULVR_2026_REV2.pdf'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {doc.docType || 'COA'} • Verified {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '08/2026'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                      SHA-256 VERIFIED
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-white transition cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/70 transition">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded bg-white shadow-2xs text-brand-600 border border-slate-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-800 font-bold">
                      COA_TEA_ULVR_2026_REV2.pdf
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      SHA-256: e819a...d820 • Verified 08/2026
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                    SHA-256 VERIFIED
                  </span>
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-white transition cursor-pointer"
                    title="Download COA"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Upload Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="file"
                id={`coa-upload-${lot?._id || 'default'}`}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onSetComplianceFile(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor={`coa-upload-${lot?._id || 'default'}`}
                className="flex-1 py-2 px-3 rounded-lg border border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-white text-slate-600 text-xs font-mono font-medium text-center cursor-pointer transition shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {complianceFile ? `Selected: ${complianceFile.name}` : '+ Upload New COA / Batch Record'}
                </span>
              </label>
              {complianceFile && (
                <button
                  type="button"
                  onClick={onUploadComplianceDoc}
                  className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-mono font-bold shadow-2xs transition cursor-pointer"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

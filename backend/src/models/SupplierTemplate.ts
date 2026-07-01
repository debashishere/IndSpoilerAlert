import mongoose, { Schema, Document } from 'mongoose';

export interface ISemanticRuleSchema {
  sourceKey: string;
  targetKey: string;
  transform?: string;
}

export interface ISupplierTemplate extends Document {
  supplierId: mongoose.Types.ObjectId;
  templateName: string;
  columnMappings: Map<string, string>; // dbField -> fileHeader
  headerAliases?: Map<string, string>;
  semanticRules?: ISemanticRuleSchema[];
  createdAt: Date;
}

const SupplierTemplateSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  templateName: { type: String, required: true },
  columnMappings: { type: Map, of: String, required: true, default: {} },
  headerAliases: { type: Map, of: String, required: false, default: {} },
  semanticRules: [{
    sourceKey: { type: String, required: true },
    targetKey: { type: String, required: true },
    transform: { type: String, required: false }
  }],
  createdAt: { type: Date, default: Date.now }
});


// A supplier should have unique template names or we can just have one primary template per supplier
SupplierTemplateSchema.index({ supplierId: 1, templateName: 1 }, { unique: true });

export default mongoose.model<ISupplierTemplate>('SupplierTemplate', SupplierTemplateSchema);

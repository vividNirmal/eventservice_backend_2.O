import mongoose, { Document, Schema } from "mongoose";

export interface IEBadgeTemplate extends Document {
  name: string;
  htmlContent: string;
  companyId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eBadgeTemplateSchema = new Schema<IEBadgeTemplate>(
  {
    name: { type: String, required: true, trim: true },
    htmlContent: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
  },
  { timestamps: true }
);

// Indexes
eBadgeTemplateSchema.index({ name: 1 });
eBadgeTemplateSchema.index({ companyId: 1 });
eBadgeTemplateSchema.index({ eventId: 1 });

export default mongoose.model<IEBadgeTemplate>("EBadgeTemplate", eBadgeTemplateSchema);

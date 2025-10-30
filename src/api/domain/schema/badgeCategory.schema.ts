import mongoose, { Document, Schema } from "mongoose";

export interface IBadgeCategory extends Document {
  name: string;
  code: string;
  priority: number;
  backgroundColor: string;
  textColor: string;
  description: string;
  companyId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const badgeCategorySchema = new Schema<IBadgeCategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String },
    priority: { type: Number, required: true, default: 0 },
    backgroundColor: { type: String, required: true },
    textColor: { type: String, required: true },
    description: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
  },
  { timestamps: true }
);

// Indexes
badgeCategorySchema.index({ name: 1 });
badgeCategorySchema.index({ companyId: 1 });
badgeCategorySchema.index({ eventId: 1 });

export default mongoose.model<IBadgeCategory>(
  "BadgeCategory",
  badgeCategorySchema
);

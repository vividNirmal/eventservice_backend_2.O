import mongoose, { Document, Schema } from "mongoose";

export interface ITemplateType extends Document {
  // Basic Info
  type: "email" | "sms" | "whatsapp";
  typeName: string;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const templateTypeSchema: Schema = new Schema<ITemplateType>(
  {
    //Basic Info
    type: {
      type: String,
      required: true,
      enum: ["email", "sms", "whatsapp"],
    },
    typeName: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
templateTypeSchema.index({ type: 1 });
templateTypeSchema.index({ createdAt: -1 });

export default mongoose.model<ITemplateType>(
  "TemplateType",
  templateTypeSchema
);

import mongoose, { Document, Schema } from "mongoose";

export interface ITemplateType extends Document {
  // Basic Info
  type: "email" | "sms" | "whatsapp";
  typeName: string;
  module: string;
  actionType: string;

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
    module: { 
      type: String,
      required: true,
      enum: ["ticket", "event", "user", "other"],
    },
    actionType:  { 
      type: String,
      required: true,
      enum: ["welcome", "approve", "disapprove", "suspend", "onboard", "notify", "reminder"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
templateTypeSchema.index({ type: 1, actionType: 1 }, { unique: true }); // one actionType attach to template type only once
templateTypeSchema.index({ createdAt: -1 });

export default mongoose.model<ITemplateType>(
  "TemplateType",
  templateTypeSchema
);

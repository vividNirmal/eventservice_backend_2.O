import mongoose, { Document, Schema } from "mongoose";

export interface ITemplate extends Document {
  // common
  name: string; // internal name like "Welcome Email"
  type: "email" | "sms" | "whatsapp";
  typeId: mongoose.Types.ObjectId; // reference to TemplateType
  text: string;
  
  // for email
  subject?: string; // only for email
  content: string; // html
  
  status: "active" | "inactive";

  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: "TemplateType",
      required: true,
    },
    text: { type: String, trim: true },

    subject: { type: String, trim: true }, // only for email
    content: { type: String }, // html

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes
templateSchema.index({ type: 1, status: 1 });
templateSchema.index({ typeId: 1, status: 1 });

// Optional validation: enforce required fields by type
templateSchema.pre("validate", function (next) {
  if (this.type === "email" && !this.content) {
    return next(new Error("Email templates must have content (HTML body)"));
  }
  if ((this.type === "sms" || this.type === "whatsapp") && !this.text) {
    return next(new Error(`${this.type} templates must have text`));
  }
  next();
});

export default mongoose.model<ITemplate>("Template", templateSchema);

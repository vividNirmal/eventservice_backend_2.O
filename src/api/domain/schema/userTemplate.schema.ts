import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

export interface IDefaultOption {
  used: boolean;
  cc?: string[];
  bcc?: string[];
}

export interface IUserTemplate extends Document {
  // Basic Info
  name: string;
  formName: string;
  type: "email" | "sms" | "whatsapp";
  typeId: mongoose.Types.ObjectId; // reference to TemplateType (created by admin)
  
  // Content
  text: string;
  subject?: string; // only for email
  content: string; // html
  
  // New Fields
  attachments: IAttachment[];
  defaultOption: IDefaultOption;
  
  // Status
  status: "active" | "inactive";

  // User/Organization context
  userId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const defaultOptionSchema = new Schema<IDefaultOption>(
  {
    used: { type: Boolean, default: false },
    cc: [{ type: String, trim: true }],
    bcc: [{ type: String, trim: true }]
  },
  { _id: false }
);

const userTemplateSchema = new Schema<IUserTemplate>(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    formName: { type: String, trim: true },
    type: { 
      type: String, 
      enum: ["email", "sms", "whatsapp"], 
      required: true 
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: "TemplateType",
      required: true,
    },
    
    // Content
    text: { type: String, trim: true },
    subject: { type: String, trim: true }, // only for email
    content: { type: String }, // html
    
    // New Fields
    attachments: [attachmentSchema],
    defaultOption: defaultOptionSchema,
    
    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // User/Organization context
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    companyId: { 
      type: Schema.Types.ObjectId, 
      ref: "Company" 
    },
    eventId: { 
      type: Schema.Types.ObjectId, 
      ref: "EventHost" 
    },
  },
  { 
    timestamps: true 
  }
);

// Indexes for better performance
userTemplateSchema.index({ type: 1, status: 1 });
userTemplateSchema.index({ typeId: 1, status: 1 });
userTemplateSchema.index({ companyId: 1 });
userTemplateSchema.index({ eventId: 1 });


// Optional validation: enforce required fields by type
userTemplateSchema.pre("validate", function (next) {
  if (this.type === "email" && !this.content) {
    return next(new Error("Email templates must have content (HTML body)"));
  }
  if ((this.type === "sms" || this.type === "whatsapp") && !this.text) {
    return next(new Error(`${this.type} templates must have text`));
  }
  next();
});

export default mongoose.model<IUserTemplate>("UserTemplate", userTemplateSchema);
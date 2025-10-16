import mongoose, { Document, Schema } from "mongoose";

export interface IFieldMapping {
  fieldName: string; // e.g., "First Name, Last Name", "Email", "Contact Number"
  fieldId?: string; // Reference to form field if needed
  position?: {
    left?: number;
    top?: number;
  };
  styling?: {
    fontFamily?: string;
    fontSize?: string;
    fontColor?: string;
    fontStyle?: string; // 'Normal' | 'Bold' | 'Italic'
    textFormat?: string; // Uppercase, Lowercase, etc.
  };
}

export interface IEBadgeSetting extends Document {
  name: string;
  templateId?: mongoose.Types.ObjectId; // Reference to EBadgeTemplate
  ticketIds?: mongoose.Types.ObjectId[]; // References to Ticket/UserType
  downloadOption: 'print' | 'print_and_download' | 'download' | 'none'; // From Image 2
  
//   // Field mappings from the form
//   fields: IFieldMapping[];
  
  // Additional settings
  companyId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const fieldMappingSchema = new Schema<IFieldMapping>(
  {
    fieldName: { type: String, required: true },
    fieldId: { type: String },
    position: {
      left: { type: Number },
      top: { type: Number },
    },
    styling: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: String, default: '12px' },
      fontColor: { type: String, default: '#000' },
      fontStyle: { type: String, enum: ['Normal', 'Bold', 'Italic'], default: 'Normal' },
      textFormat: { type: String },
    },
  },
  { _id: false }
);

const eBadgeSettingSchema = new Schema<IEBadgeSetting>(
  {
    name: { type: String, required: true, trim: true },
    templateId: { 
      type: Schema.Types.ObjectId, 
      ref: "EBadgeTemplate", 
    },
    ticketIds: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Ticket",
    }],
    downloadOption: { 
      type: String, 
      enum: ['print', 'print_and_download', 'download', 'none'],
      default: 'download'
    },
    // fields: [fieldMappingSchema],
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { 
      type: Schema.Types.ObjectId, 
      ref: "EventHost", 
      required: true 
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
eBadgeSettingSchema.index({ name: 1 });
eBadgeSettingSchema.index({ eventId: 1 });
eBadgeSettingSchema.index({ companyId: 1 });
eBadgeSettingSchema.index({ templateId: 1 });
eBadgeSettingSchema.index({ ticketIds: 1 });

// Compound index for event-specific queries
eBadgeSettingSchema.index({ eventId: 1, companyId: 1 });

export default mongoose.model<IEBadgeSetting>("EBadgeSetting", eBadgeSettingSchema);
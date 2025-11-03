import mongoose, { Document, Schema } from "mongoose";

export interface IEBadgeSetting extends Document {
  name: string;
  templateId?: mongoose.Types.ObjectId; // Reference to EBadgeTemplate
  ticketIds?: mongoose.Types.ObjectId[]; // References to Ticket/UserType
  downloadOption: 'print' | 'print_and_download' | 'download' | 'none';
  fixedPosition: boolean;
  
  // Additional settings
  companyId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  
  // Updated fields structure to support both single and combined fields
  fields?: Array<{
    combined_id?: any; // For combined fields like "firstName_lastName"
    id?: any; // For single fields
    field: Array<{
      id: string;
      name: string;
      type?: string;
    }>;
  }>;

  // Properties now keyed by either combinedId or single id
  fieldProperties?: Record<
    string,
    {
      position?: string;
      marginLeft?: string;
      marginTop?: string;
      fontFamily?: string;
      fontSize?: string;
      fontColor?: string;
      fontStyle?: string;
      textFormat?: string;
      height?: string;
      width?: string;
      categoryId? : string;
    }
  >;
  createdAt: Date;
  updatedAt: Date;
}

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
    fixedPosition: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { 
      type: Schema.Types.ObjectId, 
      ref: "EventHost", 
      required: true 
    },
    fields: { type: Array, default: [] }, // ✅ add this
    fieldProperties: { type: Object, default: {} }, // ✅ add this
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
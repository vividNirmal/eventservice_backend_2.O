import mongoose, { Document, Schema } from "mongoose";

export interface IPaperBadgeSetting extends Document {
  name: string;
  templateId?: mongoose.Types.ObjectId; // Reference to EBadgeTemplate
  ticketIds?: mongoose.Types.ObjectId[]; // References to Ticket/UserType
  fixedPosition: boolean;
    
  // Additional settings
  companyId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  paperSize?: "a4" | "a5" | "letter" | "legal" | "normal"; // paper size
  fields?: {
    id: string;
    name: string;
    type?: string;
  }[];

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
    }
  >;
  createdAt: Date;
  updatedAt: Date;
}

const paperBadgeSettingSchema = new Schema<IPaperBadgeSetting>(
  {
    name: { type: String, required: true, trim: true },
    templateId: { 
      type: Schema.Types.ObjectId, 
      ref: "EBadgeTemplate",
      default: null, 
    },
    ticketIds: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Ticket",
    }],
    fixedPosition: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { 
      type: Schema.Types.ObjectId, 
      ref: "EventHost", 
      required: true 
    },
    // paper size
    paperSize: { 
      type: String, 
      enum: ["a4", "a5", "letter", "legal", "normal"], 
      default: "a4" 
    },
    fields: { type: Array, default: [] }, // ✅ add this
    fieldProperties: { type: Object, default: {} }, // ✅ add this
  },
  { timestamps: true }
);

// Indexes for better query performance
paperBadgeSettingSchema.index({ name: 1 });
paperBadgeSettingSchema.index({ eventId: 1 });
paperBadgeSettingSchema.index({ companyId: 1 });
paperBadgeSettingSchema.index({ ticketIds: 1 });

// Compound index for event-specific queries
paperBadgeSettingSchema.index({ eventId: 1, companyId: 1 });

export default mongoose.model<IPaperBadgeSetting>("PaperBadgeSetting", paperBadgeSettingSchema);
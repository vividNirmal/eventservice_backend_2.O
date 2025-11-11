import mongoose, { Document, Schema } from "mongoose";

export interface IEventZone extends Document {
  // Basic Info
  name: string;
  eventId: mongoose.Types.ObjectId;
  companyId? : mongoose.Types.ObjectId;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const eventZoneSchema: Schema = new Schema<IEventZone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "EventHost",
        required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
eventZoneSchema.index({ createdAt: -1 });
eventZoneSchema.index({ name: 1, eventId: 1 }, { unique: true });

export default mongoose.model<IEventZone>("EventZone", eventZoneSchema);

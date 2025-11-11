import mongoose, { Document, Schema } from "mongoose";

// ----------------------
// INTERFACES
// ----------------------

export interface IZoneQuantity {
  zoneId: mongoose.Types.ObjectId; // references EventZone
  quantity: number; // number of items/assets for this zone
}

export interface IExhibitorFormAsset extends Document {
  zones: IZoneQuantity[];
  eventId: mongoose.Types.ObjectId;
  exhibitorFormConfigurationId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------
// SCHEMAS
// ----------------------


const zoneQuantitySchema = new Schema<IZoneQuantity>(
  {
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "EventZone",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const exhibitorFormAssetSchema = new Schema<IExhibitorFormAsset>(
  {
    zones: {
      type: [zoneQuantitySchema],
      default: [],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "EventHost",
      required: true,
    },
    exhibitorFormConfigurationId: {
      type: Schema.Types.ObjectId,
      ref: "ExhibitorFormConfiguration",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  { timestamps: true }
);

// ----------------------
// INDEXES
// ----------------------

// For efficient queries
exhibitorFormAssetSchema.index({ eventId: 1, exhibitorFormConfigurationId: 1 }, { unique: true }); // Each ExhibitorFormConfiguration should be unique per event
exhibitorFormAssetSchema.index({ companyId: 1 });
exhibitorFormAssetSchema.index({ eventId: 1 });
exhibitorFormAssetSchema.index({ createdAt: -1 });

export default mongoose.model<IExhibitorFormAsset>(
  "ExhibitorFormAsset",
  exhibitorFormAssetSchema
);

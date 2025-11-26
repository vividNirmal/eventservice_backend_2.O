import mongoose, { Document, Schema } from "mongoose";

// ----------------------
// INTERFACES
// ----------------------

export interface IDocument {
  name: string; // user-entered name
  path: string; // file path
}

export interface IExhibitorFormParticular extends Document {
  item_name: string;
  disclaimer: string;
  purachase_limit_per_order: number;
  national_price: number;
  international_price: number;
  material_number: number;
  zones: mongoose.Types.ObjectId[];
  venue?: string[];
  image: string; // image path
  documents: IDocument[]; // array of name + path objects
  companyId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  exhibitorFormId: mongoose.Types.ObjectId;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------
// SCHEMAS
// ----------------------

const documentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const exhibitorFormParticularSchema = new Schema<IExhibitorFormParticular>(
  {
    item_name: { type: String, required: true, trim: true },
    disclaimer: { type: String, trim: true },
    purachase_limit_per_order: { type: Number },
    national_price: { type: Number },
    international_price: { type: Number },
    material_number: { type: Number },
    zones: [{ type: Schema.Types.ObjectId, ref: "EventZone" }],
    venue: [{ type: String }],
    image: { type: String },
    documents: [documentSchema],
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
    exhibitorFormId: { type: Schema.Types.ObjectId, ref: "ExhibitorForm" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes for better performance
exhibitorFormParticularSchema.index({ companyId: 1, status: 1 });
exhibitorFormParticularSchema.index({ eventId: 1 });
exhibitorFormParticularSchema.index({ createdAt: -1 });

export default mongoose.model<IExhibitorFormParticular>(
  "ExhibitorFormParticular",
  exhibitorFormParticularSchema
);

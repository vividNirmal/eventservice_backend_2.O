import mongoose, { Document, Schema } from "mongoose";

export interface IExhibitorApplication extends Document {
  exhibitorFormId: mongoose.Types.ObjectId;
  formData?: any; // Store any dynamic form fields
  approved: boolean;
  eventUser: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const exhibitorApplicationSchema: Schema = new Schema<IExhibitorApplication>(
  {
    exhibitorFormId: {
      type: Schema.Types.ObjectId,
      ref: "ExhibitorForm",
      required: true,
    },
    formData: { type: Schema.Types.Mixed, required: false },
    approved: { type: Boolean, default: false },
    eventUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventUser",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields not defined in schema
  }
);

// Indexes for better performance
exhibitorApplicationSchema.index(
  { exhibitorFormId: 1, eventUser: 1 },
  { unique: true }
); // eventuser can apply to exhibitor application form only once
exhibitorApplicationSchema.index({ createdAt: -1 });

export default mongoose.model<IExhibitorApplication>("ExhibitorApplication", exhibitorApplicationSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IExhibitorFormConfiguration extends Document {
  // Basic Info
  formNo: string;
  configName: string;
  configSlug: string;
  hasParticulars: boolean;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const exhibitorFormConfigurationSchema: Schema = new Schema<IExhibitorFormConfiguration>(
  {
    //Basic Info
    formNo: { type: String, required: true, trim: true },
    configName: { type: String, required: true, trim: true },
    configSlug: { type: String, required: true, trim: true },
    hasParticulars: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
exhibitorFormConfigurationSchema.index({ formNo: 1, configName: 1 }, { unique: true });
exhibitorFormConfigurationSchema.index({ createdAt: -1 });

export default mongoose.model<IExhibitorFormConfiguration>(
  "ExhibitorFormConfiguration",
  exhibitorFormConfigurationSchema
);

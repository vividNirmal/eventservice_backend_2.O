import mongoose, { Document, Schema } from "mongoose";

export interface IUserType extends Document {
  param_name: string;
}

const fieldConstantSchema: Schema = new Schema<IUserType>(
  {
    param_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

fieldConstantSchema.index({ createdAt: -1 });
fieldConstantSchema.index({ param_name: 1 }, { unique: true });

export default mongoose.model<IUserType>("fieldConstant", fieldConstantSchema);

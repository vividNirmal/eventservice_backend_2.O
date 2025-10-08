import mongoose, { Document, Schema } from "mongoose";

export interface IUserType extends Document {
  // Basic Info
  typeName: string;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const userTypeSchema: Schema = new Schema<IUserType>(
  {
    //Basic Info
    typeName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userTypeSchema.index({ createdAt: -1 });
userTypeSchema.index({ typeName: 1 }, { unique: true });

export default mongoose.model<IUserType>("UserType", userTypeSchema);

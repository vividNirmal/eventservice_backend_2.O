import mongoose, { Document, Schema } from "mongoose";

export interface IUserType extends Document {
  typeName: string;
  order: number;
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
    order: {
      type: Number,
      required: true,
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

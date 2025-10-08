import mongoose, { Document, Schema } from "mongoose";

export interface IUserType extends Document {
  // Basic Info
  typeName: string;
  companyId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;

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
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Company",
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "EventHost",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userTypeSchema.index({ createdAt: -1 });
userTypeSchema.index({ typeName: 1, companyId: 1 }, { unique: true });

export default mongoose.model<IUserType>("UserType", userTypeSchema);

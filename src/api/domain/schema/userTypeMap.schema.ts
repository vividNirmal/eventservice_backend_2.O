import mongoose, { Document, Schema } from "mongoose";

export interface IUserTypeMap extends Document {
  // Basic Info
  shortName: string;
  userType: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const userTypeMapSchema: Schema = new Schema<IUserTypeMap>(
  {
    shortName: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "UserType",
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

// Indexes for better performance
userTypeMapSchema.index({ createdAt: -1 });
userTypeMapSchema.index({ userType: 1, companyId: 1 }, { unique: true });

export default mongoose.model<IUserTypeMap>("UserTypeMap", userTypeMapSchema);

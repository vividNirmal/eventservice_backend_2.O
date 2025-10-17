import mongoose, { Document, Schema } from "mongoose";

export interface IFormRegistration extends Document {
  email?: string; // Root-level email field for indexing and uniqueness
  ticketId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  badgeNo?: string;
  formData?: any; // Store any additional dynamic form fields
  approved: boolean;
  faceId?: string; // Added for face recognition
  faceImageUrl?: string; // Added for S3 face image storage
  qrImage?: string; // Added for QR code storage
  // token?: string; // Added for user token,
  checkin_time:Date,
  checkout_time: Date,
  status : String,
  businessData?: {
    category?: string;
    amount?: number;
  };
}

const businessData = new mongoose.Schema(
  {
    category: { type: String },
    amount: { type: Number },
  },
  { _id: false }
);

const formRegistrationSchema: Schema = new Schema<IFormRegistration>(
  {
    email: { type: String },
    ticketId: { type: mongoose.Types.ObjectId, ref: "Ticket" },
    eventId: { type: mongoose.Types.ObjectId, ref: "EventHost" },
    badgeNo: { type: String },
    formData: { type: Schema.Types.Mixed, required: false },
    approved: { type: Boolean, default: false },
    faceId: { type: String }, // Store face recognition ID
    faceImageUrl: { type: String }, // Store S3 image key
    qrImage: { type: String }, // Store QR code filename
    checkin_time: { type: Date, required: false }, // event Enter
    checkout_time: { type: Date, required: false }, // event exit 
    status: { type: String, required: false }, //// event Status
    // token: { type: String }, // Store user token for QR generation
    businessData: { type : businessData  },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields not defined in schema
  }
);

// // Create a sparse unique index on email to prevent duplicates but allow multiple null values
// formRegistrationSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model<IFormRegistration>(
  "FormRegistration",
  formRegistrationSchema
);

import mongoose, { Document, Schema } from "mongoose";

export interface IFormRegistration extends Document {
  regEmail?: string; // Root-level email field for indexing and uniqueness
  ticketId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  badgeNo?: string;
  formData?: any; // Store any additional dynamic form fields
}

const formRegistrationSchema: Schema = new Schema<IFormRegistration>(
  {
    regEmail: { type: String },
    ticketId: { type: mongoose.Types.ObjectId, ref: "Ticket" },
    eventId: { type: mongoose.Types.ObjectId, ref: "EventHost" },
    badgeNo: { type: String },
    formData: { type: Schema.Types.Mixed, required: false },
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

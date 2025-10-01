import mongoose, { Document, Schema } from "mongoose";

export interface IparticipantUsers extends Document {
    email?: string; // Root-level email field for indexing and uniqueness
    dynamic_fields?: any; // Store any additional dynamic form fields
    blockStatus?: boolean; // Block status for participant management
}


const participantUsersSchema: Schema = new Schema<IparticipantUsers>(
    {
        email: { type: String, required: false}, // Sparse index allows multiple null values
        dynamic_fields: { type: Schema.Types.Mixed, required: false } // Store dynamic form data
    },
    {
        collection: "participant_users", 
        timestamps: true,
        strict: false // Allow additional fields not defined in schema
    }
);

// Create a sparse unique index on email to prevent duplicates but allow multiple null values
participantUsersSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model<IparticipantUsers>("participantUsers", participantUsersSchema);
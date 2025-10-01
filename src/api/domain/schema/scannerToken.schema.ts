import mongoose, { Document, Schema } from "mongoose";


export interface IScannerToken extends Document {
    machine_id: string;
    token: string;
    expiresAt: Date;
}

const ScannerTokenSchema: Schema = new Schema<IScannerToken>(
    {
        machine_id: { type: String, required: true },
        token: { type: String, required: true},
        expiresAt: { type: Date, required: true},
    },
    {
        timestamps: true,        
    }
);

export default mongoose.model<IScannerToken>("ScannerToken", ScannerTokenSchema);

import { string } from "joi";
import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
    event_id: string;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}

const reasonSchema: Schema = new Schema<IEvent>({
    event_id: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEvent>("Reason", reasonSchema);

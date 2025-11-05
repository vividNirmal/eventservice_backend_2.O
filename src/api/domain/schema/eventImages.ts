import mongoose, { Document, Schema } from "mongoose";

export interface IEventImages extends Document {
    name: string;
    image: string;
    eventId?: mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


const eventImagesSchema: Schema = new Schema<IEventImages>({
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
}, {
    timestamps: true,
});

// Indexes for better performance
eventImagesSchema.index({ eventId: 1 });
eventImagesSchema.index({ createdAt: -1 });

export default mongoose.model<IEventImages>("EventImages", eventImagesSchema);

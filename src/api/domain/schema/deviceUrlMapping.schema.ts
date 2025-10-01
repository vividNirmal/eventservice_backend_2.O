import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceUrlMapping extends Document {
    shortId: string;
    eventId: string;
    eventSlug: string;
    deviceKey: string;
    createdAt: Date;
    expiresAt: Date;
}

const deviceUrlMappingSchema: Schema = new Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventId: {
        type: String,
        required: true
    },
    eventSlug: {
        type: String,
        required: true
    },
    deviceKey: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        index: { expireAfterSeconds: 0 }
    }
});

export default mongoose.model<IDeviceUrlMapping>('DeviceUrlMapping', deviceUrlMappingSchema);

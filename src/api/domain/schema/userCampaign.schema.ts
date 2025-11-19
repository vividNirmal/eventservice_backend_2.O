// domain/schema/userCampaign.schema.js
import mongoose, { Document, Schema } from "mongoose";

export interface IUserCampaign extends Document {
    name: string;
    templateId: mongoose.Types.ObjectId;
    
    excelFile: string;                     // stored file path
    totalContacts: number;
    scheduled: boolean;                    // ON/OFF toggle
    scheduledAt?: Date;
    
    // Add batch processing fields
    batchSize: number;
    batchInterval: number; // in minutes
    currentBatch: number;
    totalBatches: number;
    isProcessing: boolean;
    
    eventId?: mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId;
    status: "pending" | "processing" | "completed" | "failed" | "paused";
    sentCount?: number;
    failedCount?: number;
    errorMessage?: string;

    createdAt: Date;
    updatedAt: Date;
}

const userCampaignSchema: Schema = new Schema<IUserCampaign>({
    name: { type: String, required: true, trim: true },
    templateId: { type: Schema.Types.ObjectId, ref: "UserTemplate", required: true },
    
    excelFile: { type: String, required: true },
    totalContacts: { type: Number, default: 0 },
    
    scheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    
    // Batch processing fields
    batchSize: { type: Number, default: 100 }, // #batch
    batchInterval: { type: Number, default: 1 }, // 1 minute
    currentBatch: { type: Number, default: 0 },
    totalBatches: { type: Number, default: 0 },
    isProcessing: { type: Boolean, default: false },
    
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "paused"],
        default: "pending",
    },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    errorMessage: { type: String }

}, {
    timestamps: true,
});

userCampaignSchema.index({ scheduledAt: 1 });
userCampaignSchema.index({ eventId: 1 });
userCampaignSchema.index({ createdAt: -1 });
userCampaignSchema.index({ status: 1 });

export default mongoose.model<IUserCampaign>("UserCampaign", userCampaignSchema);
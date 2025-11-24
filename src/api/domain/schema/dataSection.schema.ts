import mongoose, { Document, Schema } from "mongoose";

export interface IBadge {
    image: string;
    value: number;
    suffix?: string; // optional suffix
    label: string;
}

export interface IDataSection extends Document {
    title: string;
    badges: IBadge[];
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>({
    image: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    suffix: { type: String, default: "", trim: true },
    label: { type: String, required: true, trim: true }
});

const dataSectionSchema: Schema = new Schema<IDataSection>(
    {
        title: { type: String, required: true, trim: true },
        badges: { type: [badgeSchema], default: [] },
        companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    },
    { timestamps: true }
);

// Optional indexes
dataSectionSchema.index({ companyId: 1 });
dataSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IDataSection>(
    "DataSection",
    dataSectionSchema
);

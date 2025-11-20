import mongoose, { Document, Schema } from "mongoose";

export interface IInfo {
    info_image: string;
    info_description: string;
}

export interface IReasonSection extends Document {
    title: string;
    description?: string;
    image: string;
    info: IInfo[];
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const infoSchema = new Schema<IInfo>({
    info_image: { type: String, required: true, trim: true },
    info_description: { type: String, required: true, trim: true }
});

const reasonSectionSchema: Schema = new Schema<IReasonSection>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        image: { type: String, required: true, trim: true },
        info: { type: [infoSchema], default: [] },
        companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    },
    { timestamps: true }
);

// Optional indexes
reasonSectionSchema.index({ companyId: 1 }, { unique: true });
reasonSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IReasonSection>(
    "ReasonSection",
    reasonSectionSchema
);

import mongoose, { Document, Schema } from "mongoose";

export interface IPartner {
    image: string;
    name: string;
}

export interface IPartnerSection extends Document {
    title: string;
    partners: IPartner[];
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const partnerSchema = new Schema<IPartner>({
    image: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
});

const partnerSectionSchema: Schema = new Schema<IPartnerSection>(
    {
        title: { type: String, required: true, trim: true },
        partners: { type: [partnerSchema], default: [] },
        companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    },
    { timestamps: true }
);

// Optional indexes
partnerSectionSchema.index({ companyId: 1 }, { unique: true });
partnerSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IPartnerSection>(
    "PartnerSection",
    partnerSectionSchema
);
